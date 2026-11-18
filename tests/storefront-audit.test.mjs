import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { preorderBuyOpen } from '../app/lib/drop-window.mjs'
import { DROP_01 } from '../app/lib/drop-public.mjs'
import { formatPrice } from '../app/lib/shop-filters.mjs'

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
const at = iso => Date.parse(iso)

test('Drop 01 buy window: closed before 6 PM ET Jan 14, open from early access to close', () => {
  assert.equal(preorderBuyOpen(DROP_01, at('2026-11-18T20:00:00Z')), false) // audit day
  assert.equal(preorderBuyOpen(DROP_01, at('2027-01-14T22:59:59Z')), false) // 5:59 PM ET
  assert.equal(preorderBuyOpen(DROP_01, at('2027-01-14T23:00:00Z')), true)  // 6:00 PM ET early hour
  assert.equal(preorderBuyOpen(DROP_01, at('2027-01-15T00:00:00Z')), true)  // 7:00 PM ET public
  assert.equal(preorderBuyOpen(DROP_01, at('2027-01-18T05:00:00Z')), false) // after close
  assert.equal(preorderBuyOpen(null), true) // regular products are never gated
  assert.equal(preorderBuyOpen({ opensAt: '2027-01-15T00:00:00Z', closesAt: null }, at('2027-01-14T23:30:00Z')), false)
})

test('product page disables Add to Bag outside the window', () => {
  const src = read('app/product/[slug]/ProductClient.js')
  assert.match(src, /disabled=\{soldOut \|\| !buyOpen\}/)
  assert.match(src, /if \(!buyOpen\) return/)
  assert.match(read('app/lib/catalog.js'), /earlyAccessAt: base\.earlyAccessAt/)
})

test('checkout shows the order summary on the address step and gates Drop 01 items', () => {
  const src = read('app/checkout/CheckoutClient.js')
  assert.equal((src.match(/<OrderSummary /g) || []).length, 2)
  assert.match(src, /preorderBuyOpen\(DROP_01, now\)/)
  assert.match(src, /onClick=\{\(\) => setStep\(2\)\} disabled=\{preorderLocked\}/)
  assert.doesNotMatch(src, /Pay \$\$\{total\}/)
})

test('search: exact prices, hidden drop styles left out, shop products counted alone', () => {
  assert.equal(formatPrice(64.99), '$64.99')
  assert.equal(formatPrice('54.99'), '$54.99')
  assert.equal(formatPrice(85), '$85')
  const src = read('app/search/page.js')
  assert.doesNotMatch(src, /toFixed\(0\)/)
  assert.match(src, /availability !== 'hidden'/)
  assert.equal(DROP_01.availability.ns, 'hidden')
  assert.equal(DROP_01.availability.hd, 'available')
})

test('/faq redirects to /qa', async () => {
  const cfg = (await import('../next.config.js')).default
  const r = await cfg.redirects()
  assert.ok(r.some(x => x.source === '/faq' && x.destination === '/qa'))
})
