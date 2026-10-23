import test from 'node:test'
import assert from 'node:assert/strict'
import {
  parseVariantMap, splitCart, normalizeSize, recipientFromSession, buildOrderPayload,
  decideFulfillment, isConfirmEnabled, CLAIM_STALE_MS, safeEqual,
} from '../app/lib/printful-core.mjs'

const MAP = { '1:S': 101, '1:M': 102, '1:L': 103, '1:XL': 104, '1:2XL': 105, '1:3X': 0 }

test('normalizeSize aliases', () => {
  assert.equal(normalizeSize('xxl'), '2X')
  assert.equal(normalizeSize('3XL'), '3X')
  assert.equal(normalizeSize(' m '), 'M')
})

test('parseVariantMap: numbers, objects, placeholders, errors', () => {
  const m = parseVariantMap(JSON.stringify({ ...MAP, 'foundation-tee:M': { variant_id: 4012, files: [{ url: 'https://x/y.png' }] } }))
  assert.deepEqual(m['1:S'], { sync_variant_id: 101 })
  assert.deepEqual(m['1:2X'], { sync_variant_id: 105 })
  assert.equal(m['1:3X'], null)
  assert.equal(m['foundation-tee:M'].variant_id, 4012)
  assert.deepEqual(parseVariantMap(''), {})
  assert.throws(() => parseVariantMap('{bad'), /valid JSON/)
  assert.throws(() => parseVariantMap('{"nosize":1}'), /<product>:<size>/)
  assert.throws(() => parseVariantMap('{"1:S":"abc"}'), /must be a number/)
})

test('splitCart: Foundation Tee all sizes, mixed cart, unmapped placeholder', () => {
  const map = parseVariantMap(MAP)
  const items = [
    { id: 1, name: 'Foundation Tee — Black', size: 'S', qty: 1, price: 48 },
    { id: 1, name: 'Foundation Tee — Black', size: 'XXL', qty: 2, price: 48 },
    { id: 'snapback-001', name: 'Snapback', size: 'OS', qty: 1, price: 30 },
    { id: 7, drop: 'drop-01', style: 'cj', size: 'M', qty: 1 },
    { id: 1, name: 'Foundation Tee — Black', size: '3X', qty: 1, price: 48 },
  ]
  const { podLines, manualLines, unmapped } = splitCart(items, map)
  assert.deepEqual(podLines.map(l => l.variant.sync_variant_id), [101, 105])
  assert.equal(manualLines.length, 2)
  assert.equal(unmapped.length, 1)
  assert.equal(unmapped[0].size, '3X')
})

test('splitCart matches by slug too', () => {
  const map = parseVariantMap({ 'foundation-tee:L': 9 })
  const { podLines } = splitCart([{ id: 1, slug: 'Foundation-Tee', size: 'l', qty: 1 }], map)
  assert.equal(podLines[0].variant.sync_variant_id, 9)
})

test('recipientFromSession handles new and legacy Stripe shapes', () => {
  const addr = { line1: '1 Main St', line2: 'Apt 2', city: 'Jacksonville', state: 'FL', postal_code: '32202', country: 'US' }
  const r = recipientFromSession({ collected_information: { shipping_details: { name: 'J P', address: addr } }, customer_details: { email: 'a@b.co' } })
  assert.deepEqual(r, { name: 'J P', address1: '1 Main St', address2: 'Apt 2', city: 'Jacksonville', state_code: 'FL', country_code: 'US', zip: '32202', email: 'a@b.co' })
  assert.equal(recipientFromSession({ shipping_details: { name: 'X', address: addr } }).city, 'Jacksonville')
  assert.equal(recipientFromSession({}), null)
})

test('buildOrderPayload uses stable external ids', () => {
  const map = parseVariantMap(MAP)
  const { podLines } = splitCart([{ id: 1, size: 'M', qty: 2, price: 48, name: 'Tee' }], map)
  const p = buildOrderPayload({ orderId: 42, recipient: { name: 'x' }, podLines })
  assert.equal(p.external_id, 'vibin-42')
  assert.deepEqual(p.items[0], { external_id: 'vibin-42-1', quantity: 2, sync_variant_id: 102, retail_price: '48.00', name: 'Tee' })
})

test('decideFulfillment idempotency rules', () => {
  const now = Date.now()
  assert.equal(decideFulfillment({ printful_order_id: 5 }).action, 'skip')
  assert.equal(decideFulfillment({ fulfillment_status: null }).action, 'create')
  assert.equal(decideFulfillment({ fulfillment_status: 'printful_failed' }).action, 'create')
  assert.equal(decideFulfillment({ fulfillment_status: 'printful_draft' }).action, 'skip')
  assert.equal(decideFulfillment({ fulfillment_status: 'shipped' }).action, 'skip')
  assert.equal(decideFulfillment({ fulfillment_status: 'printful_needs_mapping' }).action, 'skip')
  assert.equal(decideFulfillment({ fulfillment_status: 'printful_submitting', printful_claimed_at: new Date(now - 1000).toISOString() }, now).action, 'skip')
  assert.equal(decideFulfillment({ fulfillment_status: 'printful_submitting', printful_claimed_at: new Date(now - CLAIM_STALE_MS - 1).toISOString() }, now).action, 'create')
  assert.equal(decideFulfillment(null).action, 'skip')
})

test('isConfirmEnabled defaults to draft', () => {
  assert.equal(isConfirmEnabled(undefined), false)
  assert.equal(isConfirmEnabled('1'), false)
  assert.equal(isConfirmEnabled('TRUE'), true)
})

test('safeEqual', () => {
  assert.equal(safeEqual('abc', 'abc'), true)
  assert.equal(safeEqual('abc', 'abd'), false)
  assert.equal(safeEqual('', ''), false)
  assert.equal(safeEqual(null, 'x'), false)
})
