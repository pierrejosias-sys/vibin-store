import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { existsSync } from 'node:fs'
import { DROP_CATALOG } from '../app/lib/drop-catalog.mjs'

const dir = new URL('../public/designs/', import.meta.url)
const files = readdirSync(dir).filter(f => f.startsWith('kita-') && f.endsWith('.json'))
const specs = files.map(f => ({ f, raw: readFileSync(new URL(f, dir), 'utf8') }))

test('Kita line has a spec file for each of her 23 picks, plus the 3 earlier pieces', () => {
  assert.equal(files.length, 23)
  const nums = specs.flatMap(({ raw }) => JSON.parse(raw).kita_numbers)
  assert.deepEqual(nums.sort(), Array.from({ length: 23 }, (_, i) => String(i + 1).padStart(2, '0')))
  // Tote Chain, Star Keychain and Magnetic Charms are not in her 23: kept, hidden until they have a photo
  const earlier = specs.map(({ raw }) => JSON.parse(raw)).filter(s => s.kita_numbers.length === 0).map(s => s.slug).sort()
  assert.deepEqual(earlier, ['vibin-magnetic-charms', 'vibin-star-keychain', 'vibin-tote-chain'])
})

test('every Kita spec file is wired into the shop list', () => {
  const src = readFileSync(new URL('../app/lib/coming-soon-specs.js', import.meta.url), 'utf8')
  const imported = [...src.matchAll(/import (\w+) from '\.\.\/\.\.\/public\/designs\/(kita-[\w-]+\.json)'/g)]
  assert.deepEqual(imported.map(m => m[2]).sort(), [...files].sort())
  const list = src.match(/KITA_SPECS = \[([^\]]*)\]/)[1].split(',').map(x => x.trim())
  assert.deepEqual([...list].sort(), imported.map(m => m[1]).sort())
})

test('each photo slot is named after Kita\'s number, and every listed photo file exists', () => {
  for (const { f, raw } of specs) {
    const s = JSON.parse(raw)
    assert.deepEqual(s.photo_slots, s.kita_numbers.map(n => `kita-${n}.webp`), f)
    for (const img of s.images) assert.ok(existsSync(new URL(`../public/products/${s.slug}/${img}`, import.meta.url)), `${f} ${img}`)
  }
})

test('every Kita piece is coming soon and not buyable', () => {
  const catalogSlugs = Object.values(DROP_CATALOG).flat().map(e => e.slug)
  for (const { f, raw } of specs) {
    const s = JSON.parse(raw)
    assert.equal(s.status, 'coming_soon', f)
    assert.equal(s.buyable, false, f)
    assert.ok(!catalogSlugs.includes(s.slug), `${f} must not be in the drop catalog`)
  }
})

test('unconfirmed facts stay TBD, with no ship date', () => {
  for (const { f, raw } of specs) {
    const s = JSON.parse(raw)
    for (const k of ['price', 'material', 'dimensions', 'weight', 'care', 'vendor', 'moq', 'lead_time', 'ship_date']) {
      assert.equal(s[k], 'TBD', `${f} ${k}`)
    }
  }
})

test('no Curv mention anywhere in the line', () => {
  for (const { f, raw } of specs) assert.ok(!/curv/i.test(raw), f)
  assert.ok(!/curv/i.test(readFileSync(new URL('README.md', dir), 'utf8').split("Kita's line")[1].replace(/no Curv name, logo or photos anywhere/, '')))
})

test('variant SKUs follow the prefix and are unique', () => {
  const all = []
  for (const { f, raw } of specs) {
    const s = JSON.parse(raw)
    assert.match(s.sku_prefix, /^VB-[A-Z]+-[A-Z]+$/, f)
    assert.ok(s.variants.length > 0, f)
    for (const v of s.variants) {
      assert.ok(v.sku.startsWith(`${s.sku_prefix}-`), `${f} ${v.sku}`)
      all.push(v.sku)
    }
  }
  assert.equal(new Set(all).size, all.length)
})

test('plush keychain lists all 12 colors and leather keychain has no EST text', () => {
  const plush = JSON.parse(specs.find(s => s.f === 'kita-plush-bubble-keychain.json').raw)
  assert.deepEqual(plush.variants.map(v => v.name), ['Black', 'White', 'Brown', 'Pink', 'Leopard Print', 'Lime Green', 'Zebra Print', 'Red', 'Yellow', 'Purple', 'Gold', 'Silver'])
  const leather = JSON.parse(specs.find(s => s.f === 'kita-leather-bubble-keychain.json').raw)
  assert.deepEqual(leather.variants.map(v => v.name), ['Chocolate', 'Tan', 'Black'])
  assert.match(leather.lettering, /no EST text/)
})
