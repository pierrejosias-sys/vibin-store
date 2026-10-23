// End-to-end idempotency test of fulfillWithPrintful with a fake Supabase + fake fetch.
import test from 'node:test'
import assert from 'node:assert/strict'
import { fulfillWithPrintful } from '../app/lib/printful.js'

function fakeSupabase(row) {
  const db = { row }
  const from = () => {
    let op = 'select', patch = null; const filters = []
    const q = {
      select() { return q }, update(p) { op = 'update'; patch = p; return q },
      eq(k, v) { filters.push(r => String(r[k]) === String(v)); return q },
      is(k, v) { filters.push(r => (r[k] ?? null) === v); return q },
      maybeSingle() { return Promise.resolve({ data: filters.every(f => f(db.row)) ? { ...db.row } : null, error: null }) },
      then(res, rej) {
        const match = filters.every(f => f(db.row))
        if (op === 'update' && match) Object.assign(db.row, patch)
        return Promise.resolve({ data: match ? [{ id: db.row.id }] : [], error: null }).then(res, rej)
      },
    }
    return q
  }
  return { db, client: { from } }
}

const session = {
  id: 'cs_1', payment_status: 'paid', metadata: { orderId: '42' },
  collected_information: { shipping_details: { name: 'J P', address: { line1: '1 Main', city: 'Jax', state: 'FL', postal_code: '32202', country: 'US' } } },
}

function setup(row) {
  process.env.PRINTFUL_API_TOKEN = 'test'
  process.env.PRINTFUL_VARIANT_MAP = JSON.stringify({ 'hd:M': 102 })
  delete process.env.PRINTFUL_CONFIRM
  const calls = []
  let existing = null
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url, method: init.method || 'GET', body: init.body && JSON.parse(init.body) })
    if ((init.method || 'GET') === 'GET') {
      return existing ? new Response(JSON.stringify({ result: existing })) : new Response('{}', { status: 404 })
    }
    existing = { id: 9001, status: 'draft' }
    return new Response(JSON.stringify({ result: existing }))
  }
  return { calls, ...fakeSupabase(row) }
}

test('creates one draft Printful order with only POD lines; retries do not duplicate', async () => {
  const { calls, db, client } = setup({ id: 42, items: [{ id: 'd01-hd', drop: 'd01', style: 'hd', size: 'M', qty: 1, price: 195 }, { id: 1, size: 'M', qty: 1, price: 85 }], printful_order_id: null, fulfillment_status: null, printful_claimed_at: null })
  const r1 = await fulfillWithPrintful(client, session)
  assert.equal(r1.printfulOrderId, 9001)
  assert.equal(db.row.printful_order_id, 9001)
  assert.equal(db.row.fulfillment_status, 'printful_draft')
  assert.match(db.row.printful_error, /Manual fulfillment needed/)
  const posts = calls.filter(c => c.method === 'POST')
  assert.equal(posts.length, 1)
  assert.ok(!posts[0].url.includes('confirm'))
  assert.equal(posts[0].body.items.length, 1)

  const r2 = await fulfillWithPrintful(client, session) // Stripe retry
  assert.ok(r2.skipped)
  assert.equal(calls.filter(c => c.method === 'POST').length, 1)
})

test('recovers existing Printful order instead of re-creating after a failed save', async () => {
  const { calls, db, client } = setup({ id: 42, items: [{ id: 'd01-hd', drop: 'd01', style: 'hd', size: 'M', qty: 1 }], printful_order_id: null, fulfillment_status: 'printful_failed', printful_claimed_at: null })
  await fulfillWithPrintful(client, session) // creates
  db.row.printful_order_id = null; db.row.fulfillment_status = 'printful_failed' // simulate lost write
  await fulfillWithPrintful(client, session)
  assert.equal(calls.filter(c => c.method === 'POST').length, 1)
  assert.equal(db.row.printful_order_id, 9001)
})

test('PRINTFUL_CONFIRM=true auto-confirms; unpaid sessions are ignored', async () => {
  const { calls, client } = setup({ id: 42, items: [{ id: 'd01-hd', drop: 'd01', style: 'hd', size: 'M', qty: 1 }], printful_order_id: null, fulfillment_status: null, printful_claimed_at: null })
  assert.ok((await fulfillWithPrintful(client, { ...session, payment_status: 'unpaid' })).skipped)
  process.env.PRINTFUL_CONFIRM = 'true'
  await fulfillWithPrintful(client, session)
  assert.ok(calls.find(c => c.method === 'POST').url.endsWith('?confirm=true'))
})

test('unmapped size flags needs_mapping and sends nothing', async () => {
  const { calls, db, client } = setup({ id: 42, items: [{ id: 'd01-hd', drop: 'd01', style: 'hd', size: 'S', qty: 1 }], printful_order_id: null, fulfillment_status: null, printful_claimed_at: null })
  process.env.PRINTFUL_VARIANT_MAP = JSON.stringify({ 'hd:S': 0 })
  await fulfillWithPrintful(client, session)
  assert.equal(db.row.fulfillment_status, 'printful_needs_mapping')
  assert.equal(calls.length, 0)
})

test('no PRINTFUL_API_TOKEN: nothing is sent and the row is untouched', async () => {
  const { calls, db, client } = setup({ id: 42, items: [{ id: 'd01-hd', drop: 'd01', style: 'hd', size: 'M', qty: 1 }], printful_order_id: null, fulfillment_status: null, printful_claimed_at: null })
  delete process.env.PRINTFUL_API_TOKEN
  const r = await fulfillWithPrintful(client, session)
  assert.equal(r.skipped, 'not configured')
  assert.equal(calls.length, 0)
  assert.equal(db.row.fulfillment_status, null)
})

test('default map (no PRINTFUL_VARIANT_MAP) sends LS17001 catalog variant + front_dtf file', async () => {
  const { calls, client } = setup({ id: 42, items: [{ id: 'd01-hd', drop: 'd01', style: 'hd', size: '2X', qty: 1, price: 195 }], printful_order_id: null, fulfillment_status: null, printful_claimed_at: null })
  delete process.env.PRINTFUL_VARIANT_MAP
  await fulfillWithPrintful(client, session)
  const item = calls.find(c => c.method === 'POST').body.items[0]
  assert.equal(item.variant_id, 48538)
  assert.equal(item.files[0].type, 'front_dtf')
})
