import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { DROP_CATALOG, DROP_STYLE_IMAGES, shipsInTwoPackages, TWO_PACKAGES_NOTE } from '../app/lib/drop-catalog.mjs'
import { STYLE_SIZES } from '../app/lib/drops.js'

const hoodie = { id: 'd01-hd', drop: 'd01', style: 'hd', size: 'M', qty: 1 }
const tee = { id: 1, slug: 'vibin-classic-tee', size: 'L', qty: 1 }
const snap = { id: 'snapback-001', slug: 'vibin-snapback', size: 'OS', qty: 1 }

test('hoodie offers only S-3X (no 4X)', () => {
  assert.deepEqual(STYLE_SIZES.hd, ['S', 'M', 'L', 'XL', '2X', '3X'])
  assert.ok(!STYLE_SIZES.hd.includes('4X'))
})

test('drop 01 images exist in public/', () => {
  const snapEntry = DROP_CATALOG.d01.find(e => e.productId === 10)
  assert.equal(snapEntry.images.length, 2)
  for (const src of [...snapEntry.images, ...DROP_STYLE_IMAGES.d01.hd]) assert.ok(existsSync(new URL('../public' + src, import.meta.url)), src)
  assert.match(DROP_STYLE_IMAGES.d01.hd[0], /ls17001/)
})

test('two packages only when the hoodie is mixed with tee or snapback', () => {
  assert.equal(shipsInTwoPackages([hoodie, tee]), true)
  assert.equal(shipsInTwoPackages([hoodie, snap]), true)
  assert.equal(shipsInTwoPackages([hoodie]), false)
  assert.equal(shipsInTwoPackages([tee, snap]), false)
  assert.equal(shipsInTwoPackages([]), false)
  assert.match(TWO_PACKAGES_NOTE, /two packages/)
  assert.ok(TWO_PACKAGES_NOTE.length < 1200) // Stripe custom_text limit
})
