import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  offersBackInStock, parseSignup, saveSignup, summarizeSignups, backInStockEmail,
  getBackInStockSender, notifyBackInStock,
} from '../app/lib/back-in-stock.mjs'

/** Tiny in-memory Supabase stand-in: products + back_in_stock_signups, with the unique index. */
function fakeDb({ products = [], signups = [] } = {}) {
  const tables = { products, back_in_stock_signups: signups }
  let nextId = signups.length + 1
  const parseOr = expr => expr.split(',').map(c => {
    const [col, op, ...rest] = c.split('.'); const val = rest.join('.')
    if (op === 'is') return r => (r[col] ?? null) === null
    if (op === 'lt') return r => r[col] != null && new Date(r[col]).getTime() < new Date(val).getTime()
    throw new Error(op)
  })
  return {
    tables,
    from(name) {
      const rows = tables[name]
      let patch = null, insert = null, single = false
      const f = []
      const run = () => {
        if (insert) {
          const dup = rows.some(r => r.email.toLowerCase() === insert.email.toLowerCase() && r.product_id === insert.product_id && r.size === insert.size && r.color === insert.color)
          if (dup) return Promise.resolve({ data: null, error: { code: '23505', message: 'duplicate' } })
          const row = { id: nextId++, created_at: new Date().toISOString(), notified_at: null, notify_claimed_at: null, ...insert }
          rows.push(row)
          return Promise.resolve({ data: row, error: null })
        }
        const hit = rows.filter(r => f.every(fn => fn(r)))
        if (patch) hit.forEach(r => Object.assign(r, patch))
        return Promise.resolve({ data: single ? (hit[0] || null) : hit.map(r => ({ ...r })), error: null })
      }
      const q = {
        select() { return q },
        insert(v) { insert = v; return q },
        update(p) { patch = p; return q },
        eq(k, v) { f.push(r => r[k] === v); return q },
        is(k, v) { f.push(r => (r[k] ?? null) === v); return q },
        or(expr) { const ors = parseOr(expr); f.push(r => ors.some(fn => fn(r))); return q },
        maybeSingle() { single = true; return run() },
        then(res, rej) { return run().then(res, rej) },
      }
      return q
    },
  }
}

const TEE = { id: 7, name: 'Foundation Tee', slug: 'foundation-tee', in_stock: false, tags: [] }

test('offersBackInStock: sold out or coming-soon only', () => {
  assert.equal(offersBackInStock({ in_stock: false }), true)
  assert.equal(offersBackInStock({ in_stock: true, tags: ['coming-soon'] }), true)
  assert.equal(offersBackInStock({ in_stock: true, tags: ['new'] }), false)
  assert.equal(offersBackInStock({}), false) // in_stock unset = in stock
  assert.equal(offersBackInStock(null), false)
})

test('parseSignup: normalises email and size, rejects junk', () => {
  assert.deepEqual(parseSignup({ email: ' A@B.co ', productId: '7', size: 'xl', color: 'Black' }).value,
    { email: 'a@b.co', productId: 7, size: 'XL', color: 'Black' })
  assert.equal(parseSignup({ email: 'nope', productId: 7 }).error, 'Enter a valid email.')
  assert.equal(parseSignup({ email: 'a@b.co', productId: 'x' }).error, 'Unknown product.')
  assert.equal(parseSignup({ email: 'a@b.co', productId: 7, size: '<script>' }).error, 'Pick a size.')
  assert.equal(parseSignup({ email: 'a@b.co', productId: 7 }).value.size, '')
})

test('saveSignup: stores per product and size; a repeat is a no-op', async () => {
  const db = fakeDb({ products: [TEE] })
  assert.deepEqual(await saveSignup(db, { email: 'a@b.co', productId: 7, size: 'M', color: '' }), { ok: true, already: false })
  assert.deepEqual(await saveSignup(db, { email: 'a@b.co', productId: 7, size: 'M', color: '' }), { ok: true, already: true })
  assert.deepEqual(await saveSignup(db, { email: 'a@b.co', productId: 7, size: 'L', color: '' }), { ok: true, already: false })
  assert.equal(db.tables.back_in_stock_signups.length, 2)
})

test('saveSignup: refuses unknown and in-stock products', async () => {
  const db = fakeDb({ products: [{ ...TEE, id: 8, in_stock: true }] })
  assert.equal((await saveSignup(db, { email: 'a@b.co', productId: 99, size: '', color: '' })).status, 404)
  assert.equal((await saveSignup(db, { email: 'a@b.co', productId: 8, size: '', color: '' })).status, 409)
  assert.equal(db.tables.back_in_stock_signups.length, 0)
})

test('summarizeSignups: counts per product and per size, waiting vs notified', () => {
  const rows = [
    { id: 1, product_id: 7, email: 'a@b.co', size: 'M', color: '', created_at: '2026-11-18T10:00:00Z', notified_at: null },
    { id: 2, product_id: 7, email: 'c@d.co', size: 'M', color: '', created_at: '2026-11-18T11:00:00Z', notified_at: null },
    { id: 3, product_id: 7, email: 'e@f.co', size: 'L', color: '', created_at: '2026-11-18T12:00:00Z', notified_at: '2026-11-19T00:00:00Z' },
    { id: 4, product_id: 9, email: 'g@h.co', size: '', color: '', created_at: '2026-11-18T12:00:00Z', notified_at: null },
  ]
  const [tee, other] = summarizeSignups(rows, [TEE])
  assert.equal(tee.name, 'Foundation Tee')
  assert.equal(tee.waiting, 2); assert.equal(tee.notified, 1)
  assert.deepEqual(tee.variants.map(v => [v.size, v.waiting, v.notified]), [['M', 2, 0], ['L', 0, 1]])
  assert.equal(tee.signups[0].id, 3) // newest first
  assert.equal(other.name, 'Product #9'); assert.equal(other.inStock, null)
})

test('backInStockEmail: one recipient, product link, no ship date', () => {
  const m = backInStockEmail({ email: 'a@b.co', productName: 'Foundation Tee', slug: 'foundation-tee', size: 'M', color: 'Black' })
  assert.equal(m.to, 'a@b.co')
  assert.match(m.text, /https:\/\/vibinapparel\.com\/product\/foundation-tee/)
  assert.match(m.text, /Black, size M/)
  assert.doesNotMatch(m.html + m.text, /ship/i)
})

test('sending is off by default: nothing is claimed or marked', async () => {
  assert.equal(getBackInStockSender({ RESEND_API_KEY: 'x', BREVO_API_KEY: 'y' }), null)
  const db = fakeDb({ signups: [{ id: 1, product_id: 7, email: 'a@b.co', size: 'M', color: '', notified_at: null, notify_claimed_at: null }] })
  const res = await notifyBackInStock(db, TEE)
  assert.equal(res.skipped, 'sending not switched on')
  assert.equal(db.tables.back_in_stock_signups[0].notify_claimed_at, null)
  assert.equal(db.tables.back_in_stock_signups[0].notified_at, null)
})

test('notifyBackInStock: one email per sign-up, only the asked size, never twice', async () => {
  const db = fakeDb({ signups: [
    { id: 1, product_id: 7, email: 'a@b.co', size: 'M', color: '', notified_at: null, notify_claimed_at: null },
    { id: 2, product_id: 7, email: 'c@d.co', size: 'L', color: '', notified_at: null, notify_claimed_at: null },
    { id: 3, product_id: 7, email: 'e@f.co', size: 'M', color: '', notified_at: '2026-11-01T00:00:00Z', notify_claimed_at: null },
  ] })
  const sent = []
  const send = async m => { sent.push(m.to); return { ok: true } }
  assert.deepEqual(await notifyBackInStock(db, TEE, { size: 'M', send }), { sent: 1, failed: 0 })
  assert.deepEqual(sent, ['a@b.co']) // L was not asked about; e@f.co was already notified
  assert.deepEqual(await notifyBackInStock(db, TEE, { size: 'M', send }), { sent: 0, failed: 0 })
  assert.deepEqual(sent, ['a@b.co'])
})

test('notifyBackInStock: a failed send gives the claim back so it can retry', async () => {
  const db = fakeDb({ signups: [{ id: 1, product_id: 7, email: 'a@b.co', size: 'M', color: '', notified_at: null, notify_claimed_at: null }] })
  const res = await notifyBackInStock(db, TEE, { send: async () => ({ ok: false, error: 'provider 500' }) })
  assert.deepEqual(res, { sent: 0, failed: 1 })
  const row = db.tables.back_in_stock_signups[0]
  assert.equal(row.notified_at, null); assert.equal(row.notify_claimed_at, null); assert.equal(row.notify_error, 'provider 500')
})

test('migration: RLS on, no grants, separate from the waitlist', () => {
  const sql = readFileSync(new URL('../supabase/migrations/20261118000003_back_in_stock_signups.sql', import.meta.url), 'utf8')
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.back_in_stock_signups/)
  assert.match(sql, /ENABLE ROW LEVEL SECURITY/)
  assert.match(sql, /REVOKE ALL ON public\.back_in_stock_signups FROM anon, authenticated/)
  assert.doesNotMatch(sql, /CREATE POLICY/)
  assert.doesNotMatch(sql, /REFERENCES public\.waitlist_signups|INSERT INTO|ALTER TABLE public\.waitlist_signups/)
})

test('routes never log customer emails', () => {
  for (const f of ['../app/api/back-in-stock/route.js', '../app/api/admin/back-in-stock/route.js', '../app/lib/back-in-stock.mjs']) {
    const src = readFileSync(new URL(f, import.meta.url), 'utf8')
    for (const line of src.split('\n').filter(l => /console\.(log|error|warn|info)/.test(l))) {
      assert.doesNotMatch(line.replace(/\/\/.*$/, ''), /email/i, `${f}: ${line.trim()}`)
    }
  }
})
