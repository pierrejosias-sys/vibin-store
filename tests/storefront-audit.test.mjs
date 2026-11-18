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

test('audit 2: ?category= works like ?cat=, FAQ says US only, About is consistent, lanyard slot pending', async () => {
  const { normalizeFilter } = await import('../app/lib/shop-filters.mjs')
  assert.equal(normalizeFilter('accessories'), 'accessories')
  assert.match(read('app/shop/page.js'), /normalizeFilter\(params\?\.cat \?\? params\?\.category\)/)
  const faq = read('app/qa/QAClient.js')
  assert.doesNotMatch(faq, /worldwide/i)
  assert.match(faq, /US addresses only/)
  const about = read('app/about/page.js')
  assert.match(about, /Born in Miami\. Built in <em>Jacksonville\.<\/em>/)
  assert.doesNotMatch(about, /Shipping everywhere/)
  const { PRODUCT_EXTRAS } = await import('../app/lib/product-extras.mjs')
  assert.ok(PRODUCT_EXTRAS.lanyard.specs.every(s => s.value === null))
})

test('lanyard: mockup image on the page and the shop card, short description, specs still Coming soon', async () => {
  const { existsSync } = await import('node:fs')
  const { PRODUCT_EXTRAS, galleryItems, coverImage, withExtras, specRows } = await import('../app/lib/product-extras.mjs')
  const lanyard = { slug: 'lanyard', name: 'Vibin Lanyard', description: null }
  const items = galleryItems(lanyard, [])
  assert.equal(items.length, 1)
  assert.equal(items[0].src, '/products/lanyard/lanyard-01.webp')
  assert.equal(items[0].label, 'Mockup')
  assert.equal(items[0].fit, 'contain')
  assert.ok(existsSync(new URL('../public/products/lanyard/lanyard-01.webp', import.meta.url)))
  assert.deepEqual(coverImage(lanyard), { src: '/products/lanyard/lanyard-01.webp', fit: 'contain', background: '#f3efec' })
  assert.equal(withExtras(lanyard).description, 'The Vibin Lanyard. One size. Image shown is a mockup.')
  // A real description in the table wins over the fallback
  assert.equal(withExtras({ ...lanyard, description: 'From the table' }).description, 'From the table')
  assert.ok(specRows(lanyard).every(r => r.pending))
  // The tote still hides its stale stored copy
  assert.equal(withExtras({ slug: 'vibin-tote-bag', description: 'old', color: 'Natural' }).description, null)
  assert.equal(coverImage({ slug: 'nope' }), null)
  assert.match(read('app/shop/ShopClient.js'), /coverImage\(p\)/)
  assert.equal(PRODUCT_EXTRAS.lanyard.gallery[0].ready, true)
})

test('store lock: regular products open with the Drop 01 public open (7 PM ET Jan 14)', async () => {
  const { storeOpen } = await import('../app/lib/drop-window.mjs')
  assert.equal(storeOpen(DROP_01.opensAt, at('2026-11-18T22:00:00Z')), false)
  assert.equal(storeOpen(DROP_01.opensAt, at('2027-01-14T23:30:00Z')), false) // waitlist hour: drop pieces only
  assert.equal(storeOpen(DROP_01.opensAt, at('2027-01-15T00:00:00Z')), true)
  assert.equal(storeOpen(DROP_01.opensAt, at('2027-02-01T00:00:00Z')), true) // stays open after the drop closes
  assert.equal(storeOpen(null), true)
  const pdp = read('app/product/[slug]/ProductClient.js')
  assert.match(pdp, /!storeOpensAt \|\| now >= new Date\(storeOpensAt\)\.getTime\(\)/)
  assert.match(read('app/product/[slug]/page.js'), /storeOpensAt=\{opensAt\}/)
  const api = read('app/api/checkout/route.js')
  assert.match(api, /if \(hasRegular && !storeOpen\(storeOpensAt, now\)\)/)
  assert.match(read('app/checkout/CheckoutClient.js'), /storeOpen\(DROP_01\.opensAt, now\)/)
})
