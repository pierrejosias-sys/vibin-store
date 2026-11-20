import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { isAllowlistedEmail, adminEmailsFromEnv } from '../app/lib/admin-allowlist.mjs'
import {
  presentOrderForCs, assertCsPayload, CS_EXCLUDED_FIELDS, refundStatusFor,
  dollarsFromCents, formatEt, draftRefundAlertEmail, REFUND_EMAIL_ALERT, REFUND_SUPPORT_TICKET,
} from '../app/lib/order-cs.mjs'
import { handleChargeRefunded, findOrderForCharge } from '../app/lib/order-refunds.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = rel => readFileSync(join(root, rel), 'utf8')

function decideAccess({ user, isAdmin, email, env }) {
  if (!user) return 'denied'
  if (!isAdmin) return 'denied'
  if (!isAllowlistedEmail(email, env)) return 'denied'
  return 'ok'
}

test('ADMIN_EMAILS allowlist: empty allows (is_admin still required); set list is strict', () => {
  assert.deepEqual(adminEmailsFromEnv({}), [])
  assert.equal(isAllowlistedEmail('cs@vibinapparel.com', {}), true)
  const env = { ADMIN_EMAILS: 'cs@vibinapparel.com, ops@vibinapparel.com' }
  assert.equal(isAllowlistedEmail('cs@vibinapparel.com', env), true)
  assert.equal(isAllowlistedEmail('CS@vibinapparel.com', env), true)
  assert.equal(isAllowlistedEmail('other@vibinapparel.com', env), false)
  assert.equal(isAllowlistedEmail('', env), false)
  assert.equal(isAllowlistedEmail(null, env), false)
})

test('unauthenticated and non-allowlisted requests are denied; allowlisted admin is ok', () => {
  const env = { ADMIN_EMAILS: 'cs@vibinapparel.com' }
  assert.equal(decideAccess({ user: null, isAdmin: false, email: null, env }), 'denied')
  assert.equal(decideAccess({ user: true, isAdmin: false, email: 'cs@vibinapparel.com', env }), 'denied')
  assert.equal(decideAccess({ user: true, isAdmin: true, email: 'other@example.com', env }), 'denied')
  assert.equal(decideAccess({ user: true, isAdmin: true, email: 'cs@vibinapparel.com', env }), 'ok')
})

test('requireAdmin and the login route enforce the same three checks', () => {
  const auth = src('app/lib/admin-auth.js')
  assert.match(auth, /profile\?\.is_admin/)
  assert.match(auth, /isAllowlistedEmail\(user\.email\)/)
  assert.match(auth, /supabase\.auth\.getUser\(\)/)
  assert.doesNotMatch(auth, /getSession\(\)/)
  const login = src('app/api/admin/login/route.js')
  assert.match(login, /createRateLimiter/)
  assert.match(login, /signInWithPassword/)
  assert.match(login, /isAllowlistedEmail/)
  assert.match(login, /profile\?\.is_admin/)
  assert.match(login, /signOut\(\)/)
})

test('allowlisted payload contains only CS fields — no card, stripe ids, or notes', () => {
  const order = {
    id: 42,
    order_number: 'ORD-9',
    created_at: '2026-11-18T20:00:00.000Z',
    customer_email: 'buyer@example.com',
    total: 150,
    status: 'paid',
    tracking_number: '1Z999',
    items: [{ name: 'Tee', qty: 1, price: 85 }],
    shipping_address: { line1: '1285 W 26th St', city: 'Jacksonville', state: 'FL', postal_code: '32209' },
    ambassador_code: 'ASH',
    stripe_session_id: 'cs_test_secretish',
    stripe_payment_intent_id: 'pi_test_secretish',
    notes: 'internal',
    commission_amount: 10,
    card_last4: '4242',
  }
  const refunds = [{ amount_cents: 8500, status: 'partial', stripe_event_at: '2026-11-19T15:00:00.000Z', stripe_charge_id: 'ch_x' }]
  const payload = presentOrderForCs(order, refunds)
  assert.equal(assertCsPayload(payload), true)
  for (const k of CS_EXCLUDED_FIELDS) assert.equal(k in payload, false, k)
  assert.equal(payload.id, 42)
  assert.equal(payload.customer_email, 'buyer@example.com')
  assert.equal(payload.total, 150)
  assert.equal(payload.refund_amount, 85)
  assert.equal(payload.refund_status, 'partial')
  assert.equal(payload.refunds.length, 1)
  assert.deepEqual(Object.keys(payload.refunds[0]).sort(), ['amount', 'status', 'stripe_event_at'])
  assert.equal('stripe_charge_id' in payload.refunds[0], false)
  // shipping is allowed for fulfillment
  assert.equal(payload.shipping_address.city, 'Jacksonville')
})

test('refundStatusFor and dollarsFromCents', () => {
  assert.equal(dollarsFromCents(6500), 65)
  assert.equal(refundStatusFor(65, 0), 'none')
  assert.equal(refundStatusFor(65, 2000), 'partial')
  assert.equal(refundStatusFor(65, 6500), 'refunded')
  assert.equal(refundStatusFor(65, 7000), 'refunded')
})

test('formatEt labels America/New_York', () => {
  const s = formatEt('2026-11-20T15:00:00.000Z')
  assert.match(s, /2026/)
  assert.match(s, /EST|EDT|GMT-5|GMT-4/)
})

test('email alert is drafted but off; support ticket flag is on (option A)', () => {
  assert.equal(REFUND_EMAIL_ALERT, false)
  assert.equal(REFUND_SUPPORT_TICKET, true)
  const draft = draftRefundAlertEmail({
    order: { id: 7, customer_email: 'buyer@example.com', total: 65 },
    refund: { amount: 65, status: 'refunded', stripe_event_at: '2026-11-20T15:00:00.000Z' },
  })
  assert.match(draft.subject, /7/)
  assert.match(draft.text, /buyer@example.com/)
  assert.match(draft.text, /\$65/)
})

function fakeDb({ orders = [], refunds = [], chats = [], messages = [] }) {
  const tables = { orders: [...orders], order_refunds: [...refunds], support_chats: [...chats], support_messages: [...messages] }
  const api = {
    from(name) {
      const q = { filters: [], op: 'select', payload: null, onConflict: null }
      const run = async () => {
        let rows = tables[name] || []
        for (const f of q.filters) {
          if (f.type === 'eq') rows = rows.filter(r => String(r[f.k]) === String(f.v))
        }
        if (q.op === 'select') return { data: q.single ? (rows[0] || null) : rows, error: null }
        if (q.op === 'insert') {
          const row = { id: 100 + (tables[name].length), chat_id: q.payload.chat_id, ...q.payload }
          tables[name].push(row)
          return { data: q.single ? row : [row], error: null }
        }
        if (q.op === 'upsert') {
          const existing = tables[name].find(r => r.stripe_event_id === q.payload.stripe_event_id)
          if (existing) return { data: null, error: null } // ignoreDuplicates
          const row = { id: 200 + tables[name].length, ...q.payload }
          tables[name].push(row)
          return { data: q.single ? row : [row], error: null }
        }
        if (q.op === 'delete') {
          tables[name] = tables[name].filter(r => q.filters.every(f => String(r[f.k]) !== String(f.v)))
          return { data: null, error: null }
        }
        return { data: null, error: { message: 'unknown op' } }
      }
      const chain = {
        select() { q.op = q.op === 'upsert' || q.op === 'insert' ? q.op : 'select'; return chain },
        eq(k, v) { q.filters.push({ type: 'eq', k, v }); return chain },
        maybeSingle() { q.single = true; return run() },
        single() { q.single = true; return run() },
        insert(payload) { q.op = 'insert'; q.payload = payload; return chain },
        upsert(payload, opts) { q.op = 'upsert'; q.payload = payload; q.onConflict = opts?.onConflict; return chain },
        delete() { q.op = 'delete'; return chain },
        then(resolve, reject) { return run().then(resolve, reject) },
      }
      return chain
    },
    _tables: tables,
  }
  return api
}

test('findOrderForCharge matches metadata, then payment intent', async () => {
  const db = fakeDb({ orders: [{ id: 9, stripe_payment_intent_id: 'pi_abc', customer_email: 'a@b.c', total: 65 }] })
  const byMeta = await findOrderForCharge(db, { metadata: { orderId: 9 }, payment_intent: 'pi_other' })
  assert.equal(byMeta.id, 9)
  const byPi = await findOrderForCharge(fakeDb({ orders: [{ id: 9, stripe_payment_intent_id: 'pi_abc', customer_email: 'a@b.c', total: 65 }] }), { metadata: {}, payment_intent: 'pi_abc' })
  assert.equal(byPi.id, 9)
  const missed = await findOrderForCharge(db, { metadata: {}, payment_intent: 'pi_nope' })
  assert.equal(missed, null)
})

test('handleChargeRefunded records a refund, is idempotent, and can open a ticket', async () => {
  const db = fakeDb({ orders: [{ id: 11, order_number: 'ORD-11', customer_email: 'buyer@example.com', total: 65, stripe_payment_intent_id: 'pi_1' }] })
  const event = {
    id: 'evt_1',
    created: 1732122000,
    data: { object: { id: 'ch_1', refunded: true, amount_refunded: 6500, currency: 'usd', payment_intent: 'pi_1', metadata: {} } },
  }
  const first = await handleChargeRefunded(db, event, { ticket: true, emailAlert: false })
  assert.equal(first.ok, true)
  assert.equal(first.orderId, 11)
  assert.equal(first.refund.amount, 65)
  assert.equal(first.refund.status, 'refunded')
  assert.equal(first.emailSent, false)
  assert.ok(first.ticket)
  assert.equal(db._tables.order_refunds.length, 1)
  assert.equal(db._tables.support_chats.length, 1)
  assert.equal(db._tables.support_messages[0].sender, 'system')

  const second = await handleChargeRefunded(db, event, { ticket: true, emailAlert: false })
  assert.equal(second.skipped, 'duplicate')
  assert.equal(db._tables.order_refunds.length, 1)
  assert.equal(db._tables.support_chats.length, 1)
})

test('unauthenticated /api/admin/orders and /api/admin/login stay behind requireAdmin or the limiter; no service role in clients', () => {
  const orders = src('app/api/admin/orders/route.js')
  assert.match(orders, /if \(!\(await requireAdmin\(\)\)\) return forbidden\(\)/)
  assert.match(orders, /presentOrderForCs/)
  assert.match(orders, /CS_ORDER_FIELDS/)
  assert.doesNotMatch(orders, /select\('\*'\)/)
  const dash = src('app/admin/page.js')
  assert.match(dash, /fetch\('\/api\/admin\/orders'/)
  assert.doesNotMatch(dash, /from\('orders'\)/)

  const layout = src('app/admin/layout.js')
  assert.match(layout, /requireAdmin/)
  assert.match(layout, /robots: \{ index: false, follow: false \}/)
  assert.match(layout, /dynamic = 'force-dynamic'/)

  const mw = src('middleware.js')
  assert.match(mw, /X-Robots-Tag/)
  assert.match(mw, /no-store/)
  assert.match(mw, /pathname === '\/admin\/login'/)
  assert.match(mw, /\/support-agent/)
  assert.match(mw, /isAllowlistedEmail/)

  const webhook = src('app/api/webhook/route.js')
  assert.match(webhook, /charge\.refunded/)
  assert.match(webhook, /handleChargeRefunded/)

  // Service-role key never imported from a use-client file
  const walk = (dir, acc = []) => {
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      if (ent.name === 'node_modules' || ent.name === '.next' || ent.name === '.git') continue
      const p = join(dir, ent.name)
      if (ent.isDirectory()) walk(p, acc)
      else if (/\.(js|mjs|jsx)$/.test(ent.name)) acc.push(p)
    }
    return acc
  }
  const clientFiles = walk(join(root, 'app')).concat(walk(join(root, 'components'))).filter(p => {
    const t = readFileSync(p, 'utf8')
    return /^['"]use client['"]/m.test(t)
  })
  for (const p of clientFiles) {
    const t = readFileSync(p, 'utf8')
    assert.doesNotMatch(t, /SUPABASE_SERVICE_ROLE_KEY/, p)
  }

  const sitemap = src('app/sitemap.js')
  assert.doesNotMatch(sitemap, /\/admin/)

  const sa = src('app/support-agent/layout.js')
  assert.match(sa, /requireAdmin/)
  assert.match(sa, /robots: \{ index: false, follow: false \}/)
  assert.match(sa, /dynamic = 'force-dynamic'/)
})
