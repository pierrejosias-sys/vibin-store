import test from 'node:test'
import assert from 'node:assert/strict'
import {
  parseVariantMap, defaultVariantMap, LS17001_BLACK_VARIANTS, splitCart, normalizeSize, recipientFromSession, buildOrderPayload,
  decideFulfillment, isConfirmEnabled, CLAIM_STALE_MS, safeEqual,
} from '../app/lib/printful-core.mjs'

const MAP = { 'hd:S': 101, 'hd:M': 102, 'hd:L': 103, 'hd:XL': 104, 'hd:2XL': 105, 'hd:3X': 0 }
const HD = { drop: 'd01', style: 'hd', name: 'VOL 01 Hoodie' }

test('normalizeSize aliases', () => {
  assert.equal(normalizeSize('xxl'), '2X')
  assert.equal(normalizeSize('3XL'), '3X')
  assert.equal(normalizeSize(' m '), 'M')
})

test('parseVariantMap: numbers, objects, placeholders, errors', () => {
  const m = parseVariantMap(JSON.stringify({ ...MAP, 'HD:M': { variant_id: 48520, files: [{ type: 'front_dtf', url: 'https://x/y.png' }] } }))
  assert.deepEqual(m['hd:S'], { sync_variant_id: 101 })
  assert.deepEqual(m['hd:2X'], { sync_variant_id: 105 })
  assert.equal(m['hd:3X'], null)
  assert.equal(m['hd:M'].variant_id, 48520)
  assert.deepEqual(parseVariantMap(''), {})
  assert.throws(() => parseVariantMap('{bad'), /valid JSON/)
  assert.throws(() => parseVariantMap('{"nosize":1}'), /<product>:<size>/)
  assert.throws(() => parseVariantMap('{"1:S":"abc"}'), /must be a number/)
})

test('tee and snapback keys are ignored: only the hoodie is ever routed', () => {
  const m = parseVariantMap({ '1:S': 5, 'vibin-classic-tee:M': 6, '10:OS': 7, 'hd:S': 8 })
  assert.deepEqual(Object.keys(m), ['hd:S'])
  const { podLines, manualLines } = splitCart([{ id: 1, size: 'S', qty: 1 }, { id: 10, size: 'OS', qty: 1 }], m)
  assert.equal(podLines.length, 0)
  assert.equal(manualLines.length, 2)
})

test('defaultVariantMap: LS17001 Black catalog variants with front DTF file, all sizes', () => {
  const m = defaultVariantMap({ PRINTFUL_HOODIE_FILE_URL: 'https://cdn/x.png' })
  assert.deepEqual(Object.keys(m), ['hd:S', 'hd:M', 'hd:L', 'hd:XL', 'hd:2X', 'hd:3X'])
  assert.equal(m['hd:M'].variant_id, 48520)
  assert.equal(m['hd:3X'].variant_id, LS17001_BLACK_VARIANTS['3X'])
  assert.deepEqual(m['hd:S'].files, [{ type: 'front_dtf', url: 'https://cdn/x.png' }])
  assert.match(defaultVariantMap({})['hd:L'].files[0].url, /\/print\/.+\.png$/)
  assert.deepEqual(defaultVariantMap({ PRINTFUL_HOODIE_FILE_POSITION: '{"top":0}' })['hd:L'].files[0].position, { top: 0 })
})

test('splitCart: hoodie all sizes, mixed cart, unmapped placeholder', () => {
  const map = parseVariantMap(MAP)
  const items = [
    { ...HD, id: 'd01-hd', size: 'S', qty: 1, price: 195 },
    { ...HD, id: 'd01-hd', size: 'XXL', qty: 2, price: 195 },
    { id: 10, name: 'Snapback', size: 'OS', qty: 1, price: 65 },
    { id: 'd01-cj', drop: 'd01', style: 'cj', size: 'M', qty: 1 },
    { ...HD, id: 'd01-hd', size: '3X', qty: 1, price: 195 },
    { id: 1, name: 'Foundation Tee', size: 'M', qty: 1, price: 85 },
  ]
  const { podLines, manualLines, unmapped } = splitCart(items, map)
  assert.deepEqual(podLines.map(l => l.variant.sync_variant_id), [101, 105])
  assert.equal(manualLines.length, 3)
  assert.equal(unmapped.length, 1)
  assert.equal(unmapped[0].size, '3X')
})

test('splitCart matches drop lines by style code, case-insensitive', () => {
  const map = parseVariantMap({ 'hd:L': 9 })
  const { podLines } = splitCart([{ id: 'd01-hd', drop: 'd01', style: 'HD', size: 'l', qty: 1 }], map)
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
  const { podLines } = splitCart([{ ...HD, id: 'd01-hd', size: 'M', qty: 2, price: 195, name: 'Hoodie' }], map)
  const p = buildOrderPayload({ orderId: 42, recipient: { name: 'x' }, podLines })
  assert.equal(p.external_id, 'vibin-42')
  assert.deepEqual(p.items[0], { external_id: 'vibin-42-1', quantity: 2, sync_variant_id: 102, retail_price: '195.00', name: 'Hoodie' })
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

test('hoodie Printful payload carries no insert / packing-slip / QR data', () => {
  const map = defaultVariantMap({})
  const { podLines } = splitCart([{ drop: 'd01', style: 'hd', id: 'd01-hd', size: 'M', qty: 1, price: 195 }], map)
  const p = buildOrderPayload({ orderId: 7, recipient: { name: 'x' }, podLines })
  assert.deepEqual(Object.keys(p).sort(), ['external_id', 'items', 'recipient', 'shipping'])
  assert.doesNotMatch(JSON.stringify(p), /packing|gift|insert|qr|certificate/i)
  assert.deepEqual(p.items[0].files.map(f => f.type), ['front_dtf'])
})
