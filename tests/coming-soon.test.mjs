import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { comingSoonTiles, comingSoonSections, hiddenComingSoon, colorSummary } from '../app/lib/coming-soon.mjs'

const dir = new URL('../public/designs/', import.meta.url)
const specs = readdirSync(dir).filter(f => f.startsWith('kita-')).map(f => JSON.parse(readFileSync(new URL(f, dir), 'utf8')))
const withPhoto = (s, file = 'kita-01.webp') => ({ ...s, images: [file] })

test('a piece with no photo stays off the shop, so no tile is blank', () => {
  assert.equal(comingSoonTiles([{ status: 'coming_soon', buyable: false, slug: 'x', product: 'X', images: [] }]).length, 0)
  assert.equal(comingSoonTiles([{ status: 'coming_soon', buyable: false, slug: 'x', product: 'X' }]).length, 0)
  const tiles = comingSoonTiles(specs)
  for (const t of tiles) assert.ok(t.image, t.slug)
  assert.equal(tiles.length + hiddenComingSoon(specs).length, specs.length)
})

test('every Kita piece, once it has a photo, becomes a tile with no price', () => {
  const tiles = comingSoonTiles(specs.map(s => withPhoto(s)))
  assert.equal(tiles.length, specs.length)
  for (const t of tiles) {
    assert.equal(t.priceLabel, 'Price coming soon')
    assert.equal(t.imageLabel, 'Mockup')
    assert.ok(!('price' in t))
    assert.ok(!/TBD|curv|\$\d/i.test(JSON.stringify(t)), t.slug)
  }
})

test('Kita\'s line splits into Totes, Keychains, Charms and Lanyards, in that order', () => {
  const sections = comingSoonSections(comingSoonTiles(specs.map(s => withPhoto(s))))
  assert.deepEqual(sections.map(s => s.title), ['Totes', 'Keychains', 'Charms', 'Lanyards'])
  assert.ok(sections.every(s => s.eyebrow === 'Coming Jan 14'))
})

test('buyable or non coming-soon specs are left out', () => {
  assert.equal(comingSoonTiles([{ status: 'coming_soon', buyable: true, images: ['a.webp'] }, { status: 'live', buyable: false, images: ['a.webp'] }]).length, 0)
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
