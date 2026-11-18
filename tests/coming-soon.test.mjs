import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { comingSoonTiles, colorSummary } from '../app/lib/coming-soon.mjs'

const dir = new URL('../public/designs/', import.meta.url)
const specs = readdirSync(dir).filter(f => f.startsWith('kita-')).map(f => JSON.parse(readFileSync(new URL(f, dir), 'utf8')))

test('all seven pieces become coming-soon tiles with no price', () => {
  const tiles = comingSoonTiles(specs)
  assert.equal(tiles.length, 7)
  for (const t of tiles) {
    assert.equal(t.priceLabel, 'Price coming soon')
    assert.ok(!('price' in t))
    assert.ok(!/TBD|curv/i.test(JSON.stringify(t)), t.slug)
  }
})

test('buyable or non coming-soon specs are left out', () => {
  assert.equal(comingSoonTiles([{ status: 'coming_soon', buyable: true }, { status: 'live', buyable: false }]).length, 0)
})

test('the shop section has no Add to Bag and no product link', () => {
  const src = readFileSync(new URL('../app/shop/ShopClient.js', import.meta.url), 'utf8')
  const section = src.slice(src.indexOf('sp-soon'))
  assert.ok(!/add to bag|addToCart|<Link/i.test(section))
})

test('color summary', () => {
  assert.equal(colorSummary(['Cream']), '')
  assert.equal(colorSummary(['Gold', 'Silver', 'Diamond']), 'Gold, Silver, Diamond')
  assert.equal(colorSummary(new Array(12).fill('x')), '12 colors')
})
