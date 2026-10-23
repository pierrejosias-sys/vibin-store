import test from 'node:test'
import assert from 'node:assert/strict'
import { liftFor, HELP_AVOID } from '../app/lib/help-fab.mjs'

const VH = 844
// closed mobile button: 44x44, 12px from right/bottom of a 390x844 viewport
const fab = { left: 334, right: 378, top: 788, bottom: 832 }
const r = (top, h, left = 20, right = 370) => ({ top, bottom: top + h, left, right, width: right - left, height: h })

test('no overlap -> stays put', () => {
  assert.equal(liftFor(fab, [r(200, 52)], VH), 0)
  assert.equal(liftFor(fab, [], VH), 0)
})

test('full-width Add to Bag under the button -> lifted above it with a gap', () => {
  const atc = r(770, 52)
  const lift = liftFor(fab, [atc], VH)
  assert.equal(lift, fab.bottom - atc.top + 8)
  assert.ok(fab.bottom - lift <= atc.top - 8)
})

test('stacked CTAs (pay button + total above it) -> clears both', () => {
  const pay = r(780, 52), total = r(730, 40)
  const lift = liftFor(fab, [pay, total], VH)
  assert.ok(lift > 0)
  const moved = { top: fab.top - lift, bottom: fab.bottom - lift }
  for (const x of [pay, total]) assert.ok(moved.bottom + 8 <= x.top || moved.top - 8 >= x.bottom)
})

test('no room (tall CTA block) -> hide instead of covering', () => {
  assert.equal(liftFor(fab, [r(400, 440)], VH), null)
})

test('hidden (zero-width) elements are ignored', () => {
  assert.equal(liftFor(fab, [{ top: 790, bottom: 840, left: 0, right: 0, width: 0 }], VH), 0)
})

test('avoid list covers Add to Bag, checkout and totals', () => {
  for (const sel of ['.btn-atc', '.btn-checkout', '.cart-total', '.checkout-total', '[data-help-avoid]']) assert.ok(HELP_AVOID.includes(sel), sel)
})
