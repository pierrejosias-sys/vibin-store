import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import {
  PRODUCT_EXTRAS, SPEC_PENDING_LABEL, extrasFor, slotPath, galleryItems, specRows, featureList,
} from '../app/lib/product-extras.mjs'

const tote = { id: 11, slug: 'vibin-tote-bag', name: 'Vibin Tote Bag' }
const tee = { id: 1, slug: 'vibin-classic-tee', name: 'Foundation Tee' }

test('only the tote has extras', () => {
  assert.ok(extrasFor(tote))
  assert.equal(extrasFor(tee), null)
  assert.equal(extrasFor(null), null)
  assert.equal(extrasFor({ name: 'no slug' }), null)
})

test('tote gallery has the four slots in order', () => {
  const labels = PRODUCT_EXTRAS['vibin-tote-bag'].gallery.map(s => s.label)
  assert.deepEqual(labels, ['Back view', 'Inside view', 'Magnetic snap closure', 'What fits'])
  for (const s of PRODUCT_EXTRAS['vibin-tote-bag'].gallery) {
    assert.match(s.file, /^tote-0[1-4]-[a-z-]+\.webp$/)
    assert.ok(s.alt.length > 20, 'every slot describes its view')
  }
})

test('a slot is marked ready only when its file is in public/', () => {
  for (const [slug, extras] of Object.entries(PRODUCT_EXTRAS)) {
    for (const s of extras.gallery) {
      if (s.ready) assert.ok(existsSync(new URL(`../public${slotPath(slug, s.file)}`, import.meta.url)), `${s.file} is missing`)
    }
  }
})

test('galleryItems keeps product photos first and adds placeholder slots', () => {
  const items = galleryItems(tote, ['https://example.com/a.png'])
  assert.equal(items.length, 5)
  assert.deepEqual(items[0], { src: 'https://example.com/a.png', alt: 'Vibin Tote Bag', label: null, placeholder: false })
  assert.ok(items.slice(1).every(i => i.placeholder && i.src === null && i.label && i.alt))
})

test('galleryItems leaves other products alone', () => {
  assert.deepEqual(galleryItems(tee, ['/x.webp']).map(i => i.src), ['/x.webp'])
  assert.deepEqual(galleryItems(tee, []), [])
})

test('a ready slot uses its public path', () => {
  const slot = PRODUCT_EXTRAS['vibin-tote-bag'].gallery[0]
  const was = slot.ready
  slot.ready = true
  try {
    const items = galleryItems(tote, [])
    assert.equal(items[0].src, '/products/vibin-tote-bag/tote-01-back.webp')
    assert.equal(items[0].placeholder, false)
  } finally { slot.ready = was }
})

test('spec values are never invented: all tote specs show Coming soon', () => {
  const rows = specRows(tote)
  assert.deepEqual(rows.map(r => r.label), ['Material', 'Dimensions', 'Weight', 'Capacity', 'Pockets', 'Care'])
  assert.ok(rows.every(r => r.value === SPEC_PENDING_LABEL && r.pending))
  for (const s of PRODUCT_EXTRAS['vibin-tote-bag'].specs) assert.equal(s.value, null)
  assert.deepEqual(specRows(tee), [])
})

test('magnetic closure is listed as a feature', () => {
  assert.deepEqual(featureList(tote), ['Magnetic snap closure'])
  assert.deepEqual(featureList(tee), [])
})
