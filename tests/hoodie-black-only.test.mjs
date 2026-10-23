import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { DROP_STYLE_COLORS, DROP_STYLE_IMAGES, activeStyleColors, allowedStyleColor } from '../app/lib/drop-catalog.mjs'
import { splitCart, defaultVariantMap } from '../app/lib/printful-core.mjs'

test('Drop 01 hoodie offers and shows Black only', () => {
  assert.deepEqual(activeStyleColors('d01', 'hd').map(c => c.name), ['Black'])
  assert.deepEqual(DROP_STYLE_IMAGES.d01.hd, ['/drop01/hoodie-ls17001-black-front.webp'])
  for (const src of DROP_STYLE_IMAGES.d01.hd) {
    assert.ok(existsSync(new URL('../public' + src, import.meta.url)), src)
    assert.doesNotMatch(src, /cream/i)
  }
})

test('Cream is kept as an inactive (reversible) row, not deleted', () => {
  const cream = DROP_STYLE_COLORS.d01.hd.find(c => c.name === 'Cream')
  assert.ok(cream)
  assert.equal(cream.active, false)
  assert.ok(existsSync(new URL('../public' + cream.images[0], import.meta.url)))
})

test('checkout color gate: only Black accepted for the hoodie', () => {
  assert.equal(allowedStyleColor('d01', 'hd', 'Black'), 'Black')
  assert.equal(allowedStyleColor('d01', 'hd', ' black '), 'Black')
  for (const c of ['Cream', 'cream', 'White', '', null, undefined]) assert.equal(allowedStyleColor('d01', 'hd', c), null, String(c))
  // styles without a color config are unaffected
  assert.equal(allowedStyleColor('d01', 'cj', 'Olive'), 'Olive')
})

test('resolveDropItems rejects non-black hoodie lines', () => {
  const src = readFileSync('app/lib/pieces.js', 'utf8')
  assert.match(src, /allowedStyleColor\(item\.drop, item\.style, item\.color\)/)
  assert.match(src, /Black only/)
})

test('Printful routing: black hoodie routes, cream hoodie never auto-routes', () => {
  const map = defaultVariantMap({})
  const black = { drop: 'd01', style: 'hd', size: 'M', color: 'Black', qty: 1 }
  const cream = { drop: 'd01', style: 'hd', size: 'M', color: 'Cream', qty: 1 }
  const tee = { id: 1, slug: 'vibin-classic-tee', size: 'M', color: 'Black', qty: 1 }
  const r = splitCart([black, cream, tee], map)
  assert.deepEqual(r.podLines.map(l => l.item), [black])
  assert.deepEqual(r.unmapped, [cream])
  assert.deepEqual(r.manualLines, [tee])
})
