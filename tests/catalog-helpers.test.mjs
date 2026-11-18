import test from 'node:test'
import assert from 'node:assert/strict'
import { productImage, galleryImages, canOptimizeImage } from '../app/lib/product-image.mjs'
import { normalizeFilter, productKind, countByKind, filterProducts, visibleFilters, productSubtitle, formatPrice } from '../app/lib/shop-filters.mjs'
import { colorwaysFor, defaultColor, swatchHex } from '../app/lib/colors.mjs'

// The real catalog (Nov 18, 2026): categories are tops / bottoms / accessories only.
const P = (slug, name, category, tags, extra = {}) => ({ id: slug, slug, name, category, tags, color: null, ...extra })
const CATALOG = [
  P('lanyard', 'Vibin Lanyard', 'accessories', ['new']),
  P('tech-short', 'Tech Short', 'bottoms', ['new', 'bottoms', 'shorts', 'tech']),
  P('vibin-cargo-shorts', 'Vibin Cargo Shorts', 'bottoms', ['bottoms', 'shorts', 'cargo']),
  P('vibin-tote-bag', 'Vibin Tote Bag', 'accessories', ['accessories', 'bag']),
  P('vibin-oversized-hoodie', 'Vibin Oversized Hoodie', 'tops', ['tops', 'hoodie', 'bestseller']),
  P('vibin-zip-up-hoodie', 'Vibin Zip-Up Hoodie', 'tops', ['tops', 'hoodie', 'zip-up']),
  P('vibin-joggers', 'Vibin Joggers', 'bottoms', ['bottoms', 'joggers']),
  P('vibin-snapback', 'Snapback', 'accessories', ['accessories', 'hat']),
  P('vibin-classic-tee', 'Foundation Tee', 'tops', ['new', 'tops', 'essential']),
]

test('every real product lands in the right shop category', () => {
  const kinds = Object.fromEntries(CATALOG.map(p => [p.slug, productKind(p)]))
  assert.deepEqual(kinds, {
    lanyard: 'accessories', 'tech-short': 'bottoms', 'vibin-cargo-shorts': 'bottoms', 'vibin-tote-bag': 'accessories',
    'vibin-oversized-hoodie': 'hoodies', 'vibin-zip-up-hoodie': 'hoodies', 'vibin-joggers': 'bottoms', 'vibin-snapback': 'accessories',
    'vibin-classic-tee': 'tees',
  })
})

test('counts come from the real list and empty categories are hidden', () => {
  assert.deepEqual(countByKind(CATALOG), { all: 9, tees: 1, hoodies: 2, crewnecks: 0, bottoms: 3, accessories: 3 })
  const chips = visibleFilters(CATALOG)
  assert.deepEqual(chips.map(c => `${c.key}:${c.count}`), ['all:9', 'tees:1', 'hoodies:2', 'bottoms:3', 'accessories:3'])
  assert.equal(filterProducts(CATALOG, 'hoodies').length, 2)
  assert.equal(filterProducts(CATALOG, 'crewnecks').length, 0)
  assert.equal(filterProducts(CATALOG, 'all').length, 9)
  assert.deepEqual(countByKind([]), { all: 0, tees: 0, hoodies: 0, crewnecks: 0, bottoms: 0, accessories: 0 })
})

test('?cat= values from old links are understood, junk falls back to all', () => {
  for (const [input, want] of [['tees', 'tees'], ['tee', 'tees'], ['Hoodies', 'hoodies'], ['hoodie', 'hoodies'], ['bottoms', 'bottoms'], ['accessories', 'accessories'], ['accessory', 'accessories'], ['crewnecks', 'crewnecks'], ['nope', 'all'], ['', 'all'], [undefined, 'all'], [['a', 'b'], 'all']]) {
    assert.equal(normalizeFilter(input), want, String(input))
  }
})

test('tile subtitle and price formatting', () => {
  const sub = Object.fromEntries(CATALOG.map(p => [p.slug, productSubtitle(p)]))
  assert.deepEqual(sub, {
    lanyard: 'Lanyard', 'tech-short': 'Shorts', 'vibin-cargo-shorts': 'Shorts', 'vibin-tote-bag': 'Bag',
    'vibin-oversized-hoodie': 'Hoodie', 'vibin-zip-up-hoodie': 'Zip-up hoodie', 'vibin-joggers': 'Joggers', 'vibin-snapback': 'Hat',
    'vibin-classic-tee': 'Tee',
  })
  assert.equal(formatPrice(85), '$85')
  assert.equal(formatPrice('64.99'), '$64.99')
  assert.equal(formatPrice(98.0), '$98')
  assert.equal(formatPrice(null), '$0')
  assert.equal(formatPrice('x'), '')
})

test('product photo choice: square for tiles and cart, hero for the product page', () => {
  const tee = { image_url: '/drop01/tee-front-square.webp', images: [{ url: '/drop01/tee-front.webp', kind: 'hero' }, { url: '/drop01/tee-front-square.webp', kind: 'square' }] }
  assert.equal(productImage(tee), '/drop01/tee-front-square.webp')
  assert.equal(productImage(tee, 'hero'), '/drop01/tee-front.webp')
  assert.equal(productImage({ image_url: '', images: [] }), null)
  assert.equal(productImage({ image_url: null, images: [{ hex: '#111', color: 'Black' }] }), null)
  assert.equal(productImage(null), null)
})

test('gallery lists distinct photos only: hero and square are the same shot', () => {
  const tee = { image_url: '/a-square.webp', images: [{ url: '/a.webp', kind: 'hero' }, { url: '/a-square.webp', kind: 'square' }] }
  assert.deepEqual(galleryImages(tee), ['/a.webp'])
  const snap = { image_url: '/s.webp', images: [{ url: '/s.webp', is_default: true }, { url: '/s-flat.webp' }] }
  assert.deepEqual(galleryImages(snap), ['/s.webp', '/s-flat.webp'])
  assert.deepEqual(galleryImages({ image_url: 'https://x/y.png', images: [] }), ['https://x/y.png'])
  assert.deepEqual(galleryImages({ image_url: null, images: [] }), [])
  assert.deepEqual(galleryImages({ image_url: 'https://x/y.png', images: [{ hex: '#111', color: 'Black' }] }), ['https://x/y.png'])
})

test('next/image only touches hosts it is configured for', () => {
  assert.equal(canOptimizeImage('/drop01/tee.webp'), true)
  assert.equal(canOptimizeImage('https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/a.png'), true)
  assert.equal(canOptimizeImage('https://abcd.supabase.co/storage/v1/object/public/x.png'), true)
  assert.equal(canOptimizeImage('https://example.com/a.png'), false)
  assert.equal(canOptimizeImage('//evil.example/a.png'), false)
  assert.equal(canOptimizeImage('http://user-gen-media-assets.s3.amazonaws.com/a.png'), false)
  assert.equal(canOptimizeImage('javascript:alert(1)'), false)
  assert.equal(canOptimizeImage({ src: '/x' }), false)
  assert.equal(canOptimizeImage(''), false)
  assert.equal(canOptimizeImage(undefined), false)
})

test('colorways: honest swatches, no invented Black', () => {
  assert.deepEqual(colorwaysFor({ color: 'Olive', images: [] }), [{ color: 'Olive', hex: '#4a4e3a', isDefault: true }])
  assert.deepEqual(colorwaysFor({ color: null, images: [] }), [])
  assert.deepEqual(colorwaysFor({ color: '  ', images: null }), [])
  const multi = colorwaysFor({ color: 'Black', images: [{ hex: '#111111', color: 'Black', is_default: true }, { hex: '#3a3a3a', color: 'Charcoal' }, { color: 'Navy' }] })
  assert.deepEqual(multi.map(c => c.color), ['Black', 'Charcoal', 'Navy'])
  assert.equal(multi[2].hex, '#1b2a4a')
  assert.equal(defaultColor(multi), 'Black')
  assert.equal(defaultColor([{ color: 'A', isDefault: false }, { color: 'B', isDefault: true }]), 'B')
  assert.equal(defaultColor([]), null)
  assert.equal(swatchHex('Mystery'), '#9a9a9a')
  // photo entries without a color never become swatches
  assert.deepEqual(colorwaysFor({ color: 'Black', images: [{ url: '/a.webp', kind: 'hero' }] }), [{ color: 'Black', hex: '#111111', isDefault: true }])
})
