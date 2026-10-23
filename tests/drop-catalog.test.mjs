import test from 'node:test'
import assert from 'node:assert/strict'
import { enforceDropCatalog, dropCatalogEntry } from '../app/lib/drop-catalog.mjs'
import { splitCart } from '../app/lib/printful-core.mjs'

const drops = [{ id: 'd01', name: 'Drop 01', release_at: '2026-11-13T00:00:00Z', closes_at: '2026-11-16T04:59:59Z' }]
const OPEN = Date.parse('2026-11-14T00:00:00Z')
const tee = size => ({ id: 1, slug: 'vibin-classic-tee', size, qty: 1, price: 85 })
const snap = () => ({ id: 10, slug: 'vibin-snapback', size: 'OS', qty: 1, price: 65 })

test('tee + snapback belong to Drop 01; others do not', () => {
  assert.equal(dropCatalogEntry({ id: 1 }).dropId, 'd01')
  assert.equal(dropCatalogEntry({ id: 10 }).entry.name, 'Snapback')
  assert.equal(dropCatalogEntry({ id: 4, slug: 'vibin-oversized-hoodie' }), null)
})

test('window enforced for drop catalog items', () => {
  assert.equal(enforceDropCatalog([tee('M')], drops, { now: Date.parse('2026-11-12T23:59:59Z') }).status, 409)
  assert.equal(enforceDropCatalog([snap()], drops, { now: Date.parse('2026-11-16T05:00:00Z') }).status, 409)
  const items = [tee('3X'), snap(), { id: 4, slug: 'x', size: 'M' }]
  const r = enforceDropCatalog(items, drops, { now: OPEN, shipsBy: { d01: 'Dec 11–17' } })
  assert.equal(r.error, undefined)
  assert.equal(r.preorderItems.length, 2)
  assert.equal(items[0].preorder, true); assert.equal(items[0].shipsBy, 'Dec 11–17')
  assert.equal(items[2].preorder, undefined)
})

test('sizes: tee S–3X, snapback one size', () => {
  for (const s of ['S', 'M', 'L', 'XL', '2X', '3X']) assert.equal(enforceDropCatalog([tee(s)], drops, { now: OPEN }).error, undefined)
  assert.equal(enforceDropCatalog([tee('XXL')], drops, { now: OPEN }).status, 400)
  assert.equal(enforceDropCatalog([{ ...snap(), size: 'M' }], drops, { now: OPEN }).status, 400)
})

test('numbered drop lines are left to resolveDropItems', () => {
  const r = enforceDropCatalog([{ drop: 'd01', style: 'hd', size: 'M' }], drops, { now: 0 })
  assert.deepEqual(r.preorderItems, [])
})

test('tee and snapback are manual fulfillment, not Printful', () => {
  const map = { 'hd:M': 123, 'hd:3X': 456 }
  const { podLines, manualLines } = splitCart([tee('3X'), snap(), { drop: 'd01', style: 'hd', size: 'M' }], map)
  assert.equal(podLines.length, 1)
  assert.deepEqual(manualLines.map(i => i.id), [1, 10])
})
