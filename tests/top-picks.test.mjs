// Josias' Top picks (Nov 18, 2026): coming soon, not buyable, mockups labeled, no invented price.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { comingSoonTiles, comingSoonSections } from '../app/lib/coming-soon.mjs'
import { PRODUCT_EXTRAS } from '../app/lib/product-extras.mjs'
import { DROP_01 } from '../app/lib/drop-public.mjs'

const dir = new URL('../public/designs/', import.meta.url)
const top = readdirSync(dir).filter(f => f.startsWith('top-')).map(f => JSON.parse(readFileSync(new URL(f, dir), 'utf8')))

test('four Top picks, none buyable, no price anywhere', () => {
  assert.deepEqual(top.map(s => s.slug).sort(), ['first-layer-kit', 'move-different-tee', 'vibin-hoodie-gasoline', 'vibin-windbreaker'])
  for (const s of top) {
    assert.equal(s.status, 'coming_soon')
    assert.equal(s.buyable, false)
    assert.equal(s.price, 'TBD')
    assert.equal(s.group, 'top-picks')
  }
  for (const t of comingSoonTiles(top)) {
    assert.equal(t.priceLabel, 'Price coming soon')
    assert.ok(!/\$\d|TBD/.test(JSON.stringify(t)), t.slug)
    // Every listed image exists and is labeled as a mockup
    if (t.image) {
      assert.equal(t.imageLabel, 'Mockup')
      assert.ok(existsSync(new URL(`../public${t.image}`, import.meta.url)), t.image)
    }
  }
})

test('the shop shows Top Picks before Totes & Keychains', () => {
  const tiles = comingSoonTiles([...top, { status: 'coming_soon', buyable: false, slug: 'k', product: 'K' }])
  const sections = comingSoonSections(tiles)
  assert.deepEqual(sections.map(s => s.title), ['Top Picks', 'Totes & Keychains'])
  assert.equal(sections[0].items.length, 4)
  assert.deepEqual(comingSoonSections([]), [])
})

test('the flatlay and the favicon are not products; tags stay off the list', () => {
  const names = top.map(s => s.product.toLowerCase()).join(' ')
  assert.ok(!/flatlay|favicon|tag|qr/.test(names))
})

test('Tech Short back is the clean back only, and the flatlay hero waits for its file', () => {
  const slot = PRODUCT_EXTRAS['tech-short'].gallery[0]
  assert.equal(slot.file, 'tech-short-back-clean.webp')
  assert.ok(!/v1|flap/i.test(slot.file))
  if (slot.ready) assert.ok(existsSync(new URL('../public/products/tech-short/tech-short-back-clean.webp', import.meta.url)))
  if (DROP_01.hero.ready) assert.ok(existsSync(new URL(`../public${DROP_01.hero.src}`, import.meta.url)))
})
