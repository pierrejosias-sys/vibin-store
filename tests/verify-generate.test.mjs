// POST /api/verify/generate: codes are registered in one insert before any CSV exists.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { handleGenerate, randomCode, parseGenerateInput, toCsv, CODE_ALPHABET, batchId } from '../app/lib/verify-generate.mjs'

function fakeSupabase({ registered = [], insertError = null, selectError = null } = {}) {
  const db = new Set(registered)
  const calls = { inserts: 0, rows: [] }
  return {
    calls, db,
    from(table) {
      assert.equal(table, 'verify_codes')
      return {
        select() { return { in: async (_col, list) => selectError ? { data: null, error: selectError } : { data: list.filter(c => db.has(c)).map(code => ({ code })), error: null } } },
        async insert(rows) {
          calls.inserts++
          if (insertError) return { error: insertError }
          if (rows.some(r => db.has(r.code))) return { error: { code: '23505', message: 'duplicate' } }
          rows.forEach(r => db.add(r.code)); calls.rows.push(...rows)
          return { error: null }
        },
      }
    },
  }
}
const now = new Date('2026-11-19T01:00:00Z')

test('codes match the database format and never use 0, 1, I, L or O', () => {
  for (let i = 0; i < 500; i++) {
    const c = randomCode()
    assert.match(c, /^VBN-[A-Z0-9]{4}-[A-Z0-9]{4}$/)
    assert.doesNotMatch(c.slice(4), /[01ILO]/)
  }
  assert.equal(CODE_ALPHABET.length, 31)
  // Same alphabet as the SQL verify_random_code()
  assert.match(readFileSync(new URL('../supabase/migrations/20261118000001_vibin_verify.sql', import.meta.url), 'utf8'), new RegExp(`'${CODE_ALPHABET}'`))
})

test('a batch registers every code in ONE insert and returns the list plus a printer CSV', async () => {
  const sb = fakeSupabase()
  const r = await handleGenerate(sb, { product: 'Move Different Tee', colorway: 'Deep Green', size: 'L', quantity: 25, points: 150 }, { now })
  assert.equal(r.status, 201)
  assert.equal(sb.calls.inserts, 1)
  assert.equal(r.body.count, 25)
  assert.equal(new Set(r.body.codes.map(c => c.code)).size, 25)
  assert.match(r.body.batch_id, /^B-20261119-[A-Z0-9]{4}$/)
  for (const row of sb.calls.rows) {
    assert.equal(row.points_value, 150); assert.equal(row.drop_name, 'Drop 01 SS26'); assert.notEqual(row.batch_id, 'demo')
  }
  const lines = r.body.csv.trim().split('\r\n')
  assert.equal(lines[0], 'code,product,drop,colorway,size,points,batch_id,date,qr_url')
  assert.equal(lines.length, 26)
  assert.match(lines[1], /^VBN-[A-Z0-9]{4}-[A-Z0-9]{4},Move Different Tee,Drop 01 SS26,Deep Green,L,150,B-20261119-[A-Z0-9]{4},2026-11-19,https:\/\/vibinapparel\.com\/verify\?c=VBN-/)
})

test('codes already registered (any batch, demo included) are redrawn, never reused', async () => {
  // A random source that first produces a demo code's characters, then anything else
  const demo = 'VBN-TCH5-2601'
  const seq = [...'TCH52601'].map(ch => CODE_ALPHABET.indexOf(ch))
  let i = 0
  const rnd = n => (i < seq.length ? seq[i++] : Math.floor(Math.random() * n))
  const sb = fakeSupabase({ registered: [demo] })
  const r = await handleGenerate(sb, { product: 'Tech Shorts', quantity: 3 }, { now, randomInt: rnd })
  assert.equal(r.status, 201)
  assert.ok(!r.body.codes.some(c => c.code === demo))
  assert.equal(r.body.count, 3)
})

test('if registration fails, nothing comes back: no codes, no CSV', async () => {
  const r1 = await handleGenerate(fakeSupabase({ insertError: { code: 'XX000', message: 'boom' } }), { product: 'Hoodie', quantity: 5 }, { now })
  assert.equal(r1.status, 500)
  assert.ok(!('csv' in r1.body) && !('codes' in r1.body))
  // A race on the primary key: still nothing returned
  const raced = fakeSupabase()
  const origFrom = raced.from.bind(raced)
  raced.from = t => ({ ...origFrom(t), insert: async () => ({ error: { code: '23505', message: 'duplicate' } }) })
  const r2 = await handleGenerate(raced, { product: 'Hoodie', quantity: 2 }, { now })
  assert.equal(r2.status, 409)
  assert.ok(!('csv' in r2.body))
  // The duplicate lookup failing is thrown, and the route turns it into a 500 with no CSV
  await assert.rejects(handleGenerate(fakeSupabase({ selectError: { message: 'down' } }), { product: 'Hoodie', quantity: 1 }, { now }))
})

test('input rules: product required, 1 to 500 codes, points 100 or 150, on-demand is one code', () => {
  assert.ok(parseGenerateInput({ quantity: 1 }).error)
  assert.ok(parseGenerateInput({ product: 'Tee', quantity: 0 }).error)
  assert.ok(parseGenerateInput({ product: 'Tee', quantity: 501 }).error)
  assert.ok(parseGenerateInput({ product: 'Tee', quantity: 2.5 }).error)
  assert.ok(parseGenerateInput({ product: 'Tee', quantity: 1, points: 200 }).error)
  const od = parseGenerateInput({ product: 'Tee', mode: 'on-demand', quantity: 40 }, now).value
  assert.equal(od.quantity, 1)
  assert.match(batchId(od.mode, od.day), /^ON-DEMAND-20261119-[A-Z0-9]{4}$/)
})

test('CSV escapes commas and quotes', () => {
  const csv = toCsv([{ code: 'VBN-AAAA-BBBB', product: 'Tee, "Move"', drop_name: 'D', colorway: null, size: null, points_value: 100, batch_id: 'B', date: '2026-11-19' }])
  assert.match(csv, /VBN-AAAA-BBBB,"Tee, ""Move""",D,,,100,B,2026-11-19,/)
})

test('the route is admin-only and the browser never writes to Supabase', () => {
  const src = readFileSync(new URL('../app/api/verify/generate/route.js', import.meta.url), 'utf8')
  assert.match(src, /const admin = await requireAdmin\(\)/)
  assert.match(src, /if \(!admin\) return forbidden\(\)/)
  assert.ok(src.indexOf('forbidden()') < src.indexOf('serviceClient()'))
  assert.doesNotMatch(src, /NEXT_PUBLIC_SUPABASE_ANON_KEY|createClient/)
})
