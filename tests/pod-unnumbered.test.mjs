import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  POD_FULFILLMENT, POD_SALES_LIVE, POD_AUTO_SUBMIT, POD_COLLECTION_PATH, POD_LINE_COPY, POD_SHIP_TIME_COPY,
  POD_SEPARATE_PACKAGE_COPY, POD_BANNED_WORDS, POD_SHIP_DAYS,
  POD_RETURN_TERMS_TITLE, POD_RETURN_TERMS, POD_RETURN_TERMS_ANCHOR, POD_CART_TERMS_LINE, POD_CART_TERMS_LINK_TEXT, podReturnTermsHref,
  POD_FREE_SHIPPING_EXCLUSION_COPY, podPriceFor, POD_SIZES, isPodProduct, isPublishedPod, isNumberedCapItem, podLinesFromItems, checkPodCheckout, podShipTimeLine, cartSeparatePackageNote,
  podRecipientFromSession, buildPodDraftPayload, podDraftEligibility, podVariantFor,
} from '../app/lib/pod.mjs'
import { createPodDraftForOrder, printfulKeyConfigured, PRINTFUL_KEY_ENV } from '../app/lib/printful-pod-draft.mjs'
import { splitCart } from '../app/lib/printful-core.mjs'
import { shippingFor, podShippingFor, freeShippingSubtotal, SHIPPING_FLAT_RATE, FREE_SHIPPING_THRESHOLD, POD_DEFAULT_RATES, POD_HOLIDAY_SURCHARGE } from '../app/lib/shipping.js'
import { isDrop01NumberedLine, DROP_CATALOG } from '../app/lib/drop-catalog.mjs'
import { presentOrderForCs } from '../app/lib/order-cs.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = p => readFileSync(join(root, p), 'utf8')

const POD = { id: 501, name: 'Core Tee', slug: 'core-tee', price: 38, fulfillment: POD_FULFILLMENT, numbered: false, ship_days: null, ships_separately: false }
const CAP = { id: 502, name: 'Core Dad Hat', slug: 'core-dad-hat', price: 32, fulfillment: POD_FULFILLMENT, numbered: false, ships_separately: true }

// ── Cap exclusion ────────────────────────────────────────────────────────────────────────────────
test('POD product type: printful_pod + numbered=false only', () => {
  assert.equal(isPodProduct(POD), true)
  assert.equal(isPodProduct({ ...POD, numbered: true }), false)
  assert.equal(isPodProduct({ ...POD, numbered: null }), false)
  assert.equal(isPodProduct({ id: 1, fulfillment: 'standard' }), false)
})

test('POD lines never count toward the 50-per-style numbered cap or the pieces ledger', () => {
  const podLine = { id: 501, qty: 3, size: 'M', fulfillment: POD_FULFILLMENT }
  assert.equal(isNumberedCapItem(podLine), false)
  // even if a client smuggles drop/style onto a POD line
  assert.equal(isNumberedCapItem({ ...podLine, drop: 'd01', style: 'te' }), false)
  assert.equal(isNumberedCapItem({ id: 1, drop: 'd01', style: 'te' }), true)
  assert.equal(isDrop01NumberedLine({ id: 501 }), false)
  // POD product ids are not Drop 01 catalog ids
  assert.ok(!DROP_CATALOG.d01.some(c => c.productId === POD.id))
  // checkout: pieces are only claimed for drop items; POD is stamped server-side and rejected if it collides with a drop id
  const route = read('app/api/checkout/route.js')
  assert.match(route, /podProducts\.has\(Number\(i\.id\)\) && DROP_CATALOG\.d01\.some/)
  assert.match(route, /i\.fulfillment = POD_FULFILLMENT/)
  assert.ok(route.indexOf('checkPodCheckout(items, podProducts)') < route.indexOf('claimDropPieces('))
  // migration: POD rows can never be numbered, and nothing touches pieces/drop_styles
  const sql = read('supabase/migrations/20261120200000_pod_unnumbered_products.sql')
  assert.match(sql, /CHECK \(fulfillment <> 'printful_pod' OR numbered = false\)/)
  assert.doesNotMatch(sql, /(INSERT|UPDATE|DELETE)[^;]*\b(pieces|drop_styles)\b/i)
})

test('POD sales gate: POD_SALES_LIVE defaults to false and blocks checkout', () => {
  assert.equal(POD_SALES_LIVE, false)
  const pods = new Map([[501, POD]])
  const blocked = checkPodCheckout([{ id: 501, qty: 1 }], pods)
  assert.equal(blocked.status, 409)
  assert.match(blocked.error, /not available to order yet/)
  assert.deepEqual(checkPodCheckout([{ id: 501, qty: 1, size: 'M' }], pods, { salesLive: true }), { podCount: 1 })
  assert.deepEqual(checkPodCheckout([{ id: 7, qty: 1 }], pods), { podCount: 0 })
  assert.equal(checkPodCheckout([{ id: 501 }], new Map([[501, { ...POD, numbered: true }]]), { salesLive: true }).status, 409)
})

// ── Printful hand-off (manual, draft only) ───────────────────────────────────────────────────────
test('hand-off with PRINTFUL_API_KEY missing: 503 not_configured, no DB, Stripe or network calls', async () => {
  assert.equal(PRINTFUL_KEY_ENV, 'PRINTFUL_API_KEY')
  assert.equal(printfulKeyConfigured({}), false)
  assert.equal(printfulKeyConfigured({ PRINTFUL_API_KEY: '   ' }), false)
  const boom = () => { throw new Error('must not be called') }
  const supabase = { from: boom }
  const stripe = { checkout: { sessions: { retrieve: boom } } }
  const r = await createPodDraftForOrder(42, { supabase, stripe, fetch: boom, env: {} })
  assert.equal(r.ok, false)
  assert.equal(r.status, 503)
  assert.equal(r.error, 'not_configured')
  assert.match(r.message, /PRINTFUL_API_KEY is not set/)
  const route = read('app/api/admin/printful-draft/route.js')
  assert.match(route, /requireAdmin\(\)/)
  assert.match(route, /printfulKeyConfigured\(\)/)
})

function fakeDb(tables) {
  const calls = []
  return {
    calls,
    from(name) {
      const q = { name, op: 'select', filters: [], payload: null }
      const run = async () => {
        calls.push({ ...q })
        let rows = tables[name] || []
        for (const f of q.filters) rows = rows.filter(r => f.t === 'eq' ? String(r[f.k]) === String(f.v) : f.t === 'in' ? f.v.map(String).includes(String(r[f.k])) : f.t === 'is' ? (r[f.k] ?? null) === f.v : true)
        if (q.op === 'update') { rows.forEach(r => Object.assign(r, q.payload)); return { data: rows.map(r => ({ id: r.id })), error: null } }
        return { data: q.single ? rows[0] || null : rows, error: null }
      }
      const c = {
        select() { return c }, eq(k, v) { q.filters.push({ t: 'eq', k, v }); return c }, in(k, v) { q.filters.push({ t: 'in', k, v }); return c },
        is(k, v) { q.filters.push({ t: 'is', k, v }); return c }, update(p) { q.op = 'update'; q.payload = p; return c },
        maybeSingle() { q.single = true; return run() }, then(a, b) { return run().then(a, b) },
      }
      return c
    },
  }
}

test('hand-off creates a Printful DRAFT only (never confirm), phone only if provided', async () => {
  const order = { id: 77, status: 'paid', stripe_session_id: 'cs_test_1', printful_order_id: null, fulfillment_status: null,
    items: [{ id: 501, name: 'Core Tee', size: 'M', qty: 2, price: 38, fulfillment: POD_FULFILLMENT }, { id: 9, name: 'Lanyard', size: 'OS', qty: 1 }] }
  const db = fakeDb({ orders: [order], order_refunds: [], products: [{ ...POD, printful_variants: { M: 9001 } }] })
  const session = { shipping_details: { name: 'A B', address: { line1: '1 Main', city: 'Jax', state: 'FL', postal_code: '32202', country: 'US' } }, customer_details: { email: 'a@b.c' } }
  const stripe = { checkout: { sessions: { retrieve: async id => { assert.equal(id, 'cs_test_1'); return session } } } }
  const urls = []
  const fetchImpl = async (url, init = {}) => {
    urls.push({ url, method: init.method || 'GET', body: init.body })
    if ((init.method || 'GET') === 'GET') return { ok: false, status: 404, json: async () => ({}) }
    return { ok: true, status: 200, json: async () => ({ result: { id: 123456, status: 'draft' } }) }
  }
  const r = await createPodDraftForOrder(77, { supabase: db, stripe, fetch: fetchImpl, env: { PRINTFUL_API_KEY: 'test-placeholder' } })
  assert.equal(r.ok, true)
  assert.equal(r.printfulOrderId, 123456)
  assert.equal(r.phoneSent, false)
  assert.ok(urls.every(u => !/confirm/i.test(u.url)), 'never calls confirm')
  const post = urls.find(u => u.method === 'POST')
  assert.equal(post.url, 'https://api.printful.com/orders')
  const body = JSON.parse(post.body)
  assert.equal(body.items.length, 1) // only the POD line
  assert.deepEqual(body.items[0].sync_variant_id, 9001)
  assert.equal('phone' in body.recipient, false)
  assert.equal('confirm' in body, false)
  assert.equal(order.fulfillment_status, 'printful_draft')
  // second click: already has a draft
  const again = await createPodDraftForOrder(77, { supabase: db, stripe, fetch: fetchImpl, env: { PRINTFUL_API_KEY: 'x' } })
  assert.equal(again.status, 409)
  // phone is included only when the customer gave one
  assert.equal(podRecipientFromSession({ ...session, customer_details: { email: 'a@b.c', phone: '+19045550100' } }).phone, '+19045550100')
  assert.equal('phone' in podRecipientFromSession(session), false)
})

test('hand-off eligibility, variants and no auto-submit path', () => {
  assert.equal(POD_AUTO_SUBMIT, false)
  assert.equal(podDraftEligibility({ status: 'pending', items: [{ fulfillment: POD_FULFILLMENT }] }).ok, false)
  assert.equal(podDraftEligibility({ status: 'paid', items: [{ id: 1 }] }).ok, false)
  assert.equal(podDraftEligibility({ status: 'paid', items: [{ fulfillment: POD_FULFILLMENT }] }).ok, true)
  assert.deepEqual(podVariantFor({ printful_variants: { M: 5 } }, 'm'), { sync_variant_id: 5 })
  assert.equal(podVariantFor({ printful_variants: { M: 0 } }, 'M'), null)
  assert.equal(buildPodDraftPayload({ orderId: 1, recipient: {}, lines: [] }).external_id, 'vibin-pod-1')
  // the Stripe webhook's automatic Printful path never routes POD lines
  const { podLines, manualLines } = splitCart([{ id: 501, slug: 'hd', size: 'M', fulfillment: POD_FULFILLMENT }], { 'hd:M': { sync_variant_id: 1 } })
  assert.equal(podLines.length, 0)
  assert.equal(manualLines.length, 1)
  const hook = read('app/api/webhook/route.js')
  assert.doesNotMatch(hook, /createPodDraftForOrder|printful-draft/)
  const lib = read('app/lib/printful-pod-draft.mjs').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
  assert.doesNotMatch(lib, /\?confirm=true|\/confirm['`]/)
  // admin UI: manual button, CS payload flags POD orders
  const admin = read('app/admin/orders/page.js')
  assert.match(admin, />\s*\{saving\[`pf_\$\{order\.id\}`\] \? '\.\.\.' : 'Create Printful draft'\}/)
  assert.equal(presentOrderForCs({ id: 1, total: 1, items: [{ fulfillment: POD_FULFILLMENT }] }).has_pod, true)
  assert.equal(presentOrderForCs({ id: 1, total: 1, items: [{ id: 2 }] }).has_pod, false)
})

// ── Copy ─────────────────────────────────────────────────────────────────────────────────────────
test('POD copy: exact Legal-approved strings', () => {
  assert.equal(POD_LINE_COPY, 'Made to order. Not part of the numbered Drop 01.')
  assert.equal(POD_SHIP_TIME_COPY, 'Made to order. Ships within 7 business days of your order. US delivery usually takes another 3–4 business days after it ships.')
  assert.equal(POD_SEPARATE_PACKAGE_COPY, 'Hats ship in a separate package.')
  assert.equal(POD_SHIP_DAYS, 7)
  assert.equal(podShipTimeLine(POD), POD_SHIP_TIME_COPY)
  assert.equal(POD_COLLECTION_PATH, '/shop/made-to-order')
  const client = read('app/shop/made-to-order/[slug]/PodProductClient.js')
  assert.match(client, /\{POD_LINE_COPY\}/)
  assert.match(client, /product\.ships_separately === true \? <p className="pdp-pod-package">\{POD_SEPARATE_PACKAGE_COPY\}<\/p>/)
  assert.match(read('app/shop/made-to-order/[slug]/page.js'), /podShipTimeLine\(product\)/)
})

test('cart: "Hats ship in a separate package." only when a cap sits alongside other items', () => {
  assert.equal(cartSeparatePackageNote([{ id: 502, qty: 1, shipsSeparately: true }]), null)
  assert.equal(cartSeparatePackageNote([{ id: 502, qty: 1, shipsSeparately: true }, { id: 501, qty: 1 }]), 'Hats ship in a separate package.')
  assert.equal(cartSeparatePackageNote([{ id: 502, qty: 2, ships_separately: true }]), 'Hats ship in a separate package.')
  assert.equal(cartSeparatePackageNote([{ id: 501, qty: 3 }]), null)
  assert.match(read('app/cart/CartClient.js'), /cartSeparatePackageNote\(items\)/)
})

test('POD templates never use banned scarcity / urgency / holiday words', () => {
  const files = ['app/shop/made-to-order/page.js', 'app/shop/made-to-order/[slug]/page.js', 'app/shop/made-to-order/[slug]/PodProductClient.js']
  const copy = [POD_SHIP_TIME_COPY, POD_SEPARATE_PACKAGE_COPY, 'Made to Order', 'Not available to order yet', 'New made-to-order pieces are on the way.']
  const strip = src => src
    .replace(/^\s*import .*$/gm, '')       // module paths
    .replace(/\/\/.*$/gm, '')               // comments
    .replace(/POD_LINE_COPY/g, '')          // the one approved line that names the numbered line
  for (const f of files) {
    const text = strip(read(f)).toLowerCase()
    for (const w of POD_BANNED_WORDS) assert.ok(!new RegExp(`\\b${w.replace(/ /g, '\\s+')}\\b`).test(text), `${f} uses banned word "${w}"`)
    assert.doesNotMatch(text, /countdown|setinterval|days\s*left|hours?\s*left/, `${f} has a timer`)
  }
  for (const c of copy) for (const w of POD_BANNED_WORDS) assert.ok(!c.toLowerCase().includes(w), `"${c}" uses "${w}"`)
  // POD never lives under /drop
  assert.doesNotMatch(POD_COLLECTION_PATH, /drop/)
  assert.match(read('app/product/[slug]/page.js'), /redirect\(`\$\{POD_COLLECTION_PATH\}\/\$\{product\.slug\}`\)/)
})

// ── Shipping ─────────────────────────────────────────────────────────────────────────────────────
test('POD shipping is per product (first + add-on), caps pay full first-item rate each, never free at $125+', () => {
  const after = { now: Date.parse('2027-02-01T12:00:00Z') }   // after the holiday surcharge window
  const during = { now: Date.parse('2026-12-01T12:00:00Z') }
  const tee = { id: 601, qty: 1, price: 48, fulfillment: POD_FULFILLMENT, shipFirst: 4.95, shipAddon: 2.2 }   // seed base rates
  const hoodie = { id: 602, qty: 1, price: 72, fulfillment: POD_FULFILLMENT, shipFirst: 8.79, shipAddon: 2.5 }
  // Finance §8 checks (surcharge included, through Jan 17, 2027 ET)
  assert.equal(shippingFor(120, [tee, hoodie], during), 11.39)
  assert.equal(shippingFor(96, [{ ...tee, qty: 2 }], during), 7.55)
  assert.equal(shippingFor(144, [{ ...hoodie, qty: 2 }], during), 11.69)
  assert.equal(shippingFor(48, [tee], during), 5.35)
  assert.equal(shippingFor(72, [hoodie], during), 9.19)
  // both sides of the surcharge date: last minute of Jan 17 ET vs first minute of Jan 18 ET
  assert.equal(shippingFor(48, [tee], { now: Date.parse('2027-01-18T04:59:00Z') }), 5.35)
  assert.equal(shippingFor(48, [tee], { now: Date.parse('2027-01-18T05:00:00Z') }), 4.95)
  const cap = { id: 603, qty: 1, price: 32, fulfillment: POD_FULFILLMENT, shipFirst: 4.69, shipAddon: 2, shipsSeparately: true }
  // unchanged flat rule for every non-POD cart (and the old one-argument call)
  assert.equal(shippingFor(50), SHIPPING_FLAT_RATE)
  assert.equal(shippingFor(130), 0)
  assert.equal(shippingFor(50, [{ id: 1, qty: 3, price: 10 }]), SHIPPING_FLAT_RATE)
  assert.equal(podShippingFor([{ id: 1, qty: 1 }]), 0)
  // per product: first + add-on, no $0 add-on
  assert.equal(shippingFor(96, [{ ...tee, qty: 2 }], after), 7.15)
  // tee + hoodie together: highest first-item rate leads, the other unit pays its add-on
  assert.equal(shippingFor(120, [tee, hoodie], after), 10.99)
  // a cap is its own package at the full first-item rate, even next to other items, and per unit
  assert.equal(shippingFor(80, [tee, cap], after), 9.64)
  assert.equal(shippingFor(64, [{ ...cap, qty: 2 }], after), 9.38)
  // holiday surcharge once per order while it applies (PENDING FINANCE)
  assert.equal(shippingFor(48, [tee], during), 5.35)
  assert.equal(POD_HOLIDAY_SURCHARGE.amount, 0.4)
  // free shipping at $125+ never covers made-to-order lines
  assert.equal(shippingFor(144, [{ ...hoodie, qty: 2 }], after), 11.29)
  // in-house items: free only when the NON-made-to-order subtotal reaches $125
  const inHouse = { id: 7, qty: 1, price: 100 }
  assert.equal(shippingFor(148, [inHouse, tee], after), SHIPPING_FLAT_RATE + 4.95)
  assert.equal(shippingFor(178, [{ ...inHouse, price: 130 }, tee], after), 4.95)
  assert.equal(freeShippingSubtotal([inHouse, tee]), 100)
  // a row with no rates falls back to the highest (hoodie) rate, PENDING FINANCE
  assert.deepEqual(POD_DEFAULT_RATES, { first: 8.79, addOn: 2.5 })
  assert.equal(shippingFor(48, [{ id: 9, qty: 1, price: 48, pod: true }], after), 8.79)
  const route = read('app/api/checkout/route.js')
  assert.match(route, /shippingFor\(total, items\)/)
  assert.match(route, /i\.shipFirst = pod\.ship_first_rate \?\? null; i\.shipAddon = pod\.ship_addon_rate \?\? null/)
  assert.match(read('app/cart/CartClient.js'), /freeShippingSubtotal\(items\)/)
})

test('POD migration: rates, published flag + RLS, printful_variants locked from public reads; seed is unpublished', () => {
  const sql = read('supabase/migrations/20261120200000_pod_unnumbered_products.sql')
  assert.match(sql, /ship_first_rate\s+NUMERIC/)
  assert.match(sql, /ship_addon_rate\s+NUMERIC/)
  assert.match(sql, /FOR SELECT USING \(published OR public\.is_admin\(\)\)/)
  assert.match(sql, /REVOKE SELECT ON public\.products FROM anon, authenticated;/)
  const grant = sql.match(/GRANT SELECT \(([\s\S]*?)\)\s+ON public\.products TO anon, authenticated;/)
  assert.ok(grant, 'column grant present')
  assert.doesNotMatch(grant[1], /printful_variants/)
  for (const col of ['id', 'name', 'slug', 'price', 'images', 'image_url', 'in_stock', 'fulfillment', 'published']) assert.match(grant[1], new RegExp(`\\b${col}\\b`))
  // admin pages no longer select('*') (which would fail on the locked column)
  for (const f of ['app/admin/products/page.js', 'app/admin/products/[id]/edit/page.js']) assert.doesNotMatch(read(f), /\.select\('\*'\)/)
  const seed = read('supabase/migrations/20261120200100_pod_core_draft_products_SEED.sql')
  assert.match(seed, /'Vibin Core Tee', 'vibin-core-tee', 48\.00/)
  assert.match(seed, /'Vibin Core Hoodie', 'vibin-core-hoodie', 72\.00/)
  assert.equal((seed.match(/'printful_pod', false, false,/g) || []).length, 2) // POD, unnumbered, unpublished
  assert.doesNotMatch((seed.replace(/--.*$/gm, '').match(/'[^']*'/g) || []).join(' '), /\b(numbered|limited|exclusive|drop|sold out)\b/i)
  assert.equal(isPublishedPod({ ...POD, published: false }), false)
  assert.equal(checkPodCheckout([{ id: 501 }], new Map([[501, { ...POD, published: false }]]), { salesLive: true }).status, 409)
})

test('POD pricing: tee S–2XL $48; hoodie S–XL $72, 2XL $75; 3XL–5XL not sold', () => {
  const teeRow = { price: 48, size_prices: null }
  const hoodieRow = { price: 72, size_prices: { '2XL': 75 } }
  assert.deepEqual(POD_SIZES, ['S', 'M', 'L', 'XL', '2XL'])
  for (const sz of ['S', 'M', 'L', 'XL', '2XL']) assert.equal(podPriceFor(teeRow, sz), 48)
  for (const sz of ['S', 'M', 'L', 'XL']) assert.equal(podPriceFor(hoodieRow, sz), 72)
  assert.equal(podPriceFor(hoodieRow, '2xl'), 75)
  for (const sz of ['3XL', '4XL', '5XL', 'XS']) { assert.equal(podPriceFor(teeRow, sz), null); assert.equal(podPriceFor(hoodieRow, sz), null) }
  const pods = new Map([[602, { ...POD, id: 602, ...hoodieRow }]])
  assert.equal(checkPodCheckout([{ id: 602, size: '3XL' }], pods, { salesLive: true }).status, 409)
  assert.deepEqual(checkPodCheckout([{ id: 602, size: '2XL' }], pods, { salesLive: true }), { podCount: 1 })
  assert.match(read('app/api/checkout/route.js'), /i\.price = podPriceFor\(pod, i\.size\)/)
  const seed = read('supabase/migrations/20261120200100_pod_core_draft_products_SEED.sql')
  assert.match(seed, /'printful_pod', false, false, '\{"2XL": 75\}'::jsonb, NULL, false, 8\.79, 2\.50, NULL\)/)
  assert.match(seed, /'printful_pod', false, false, NULL, NULL, false, 4\.95, 2\.20, NULL\)/)
})

// ── PENDING JOSIAS: Legal's made-to-order return terms + free-shipping exclusion copy ────────────────
test('POD return terms are Legal\'s text verbatim (§A, §B, §D), skipping §C', () => {
  assert.equal(POD_RETURN_TERMS_TITLE, 'Made-to-order return terms')
  assert.deepEqual(POD_RETURN_TERMS, [
    "Every made-to-order piece is printed just for you, so it's final sale: we can't accept returns or exchanges for size, fit, or change of mind. Please check the size guide before you order.",
    "If your item arrives damaged, misprinted, or defective, or it isn't what you ordered, email returns@vibinapparel.com within 30 days of delivery with your order number and a photo. We'll send a free replacement or give you a full refund, your choice, at no cost to you.",
    "Want to cancel? Email us right away. We can cancel for a full refund until your item goes into production. Once it's in production, these return terms apply.",
    "These terms don't limit any rights you have under law, including your right to cancel for a full refund if we can't ship by the date we promised.",
  ])
  // every paragraph appears verbatim in Legal's file; section C's text is not used anywhere
  // (cross-checked against Legal's source file when it's on this machine; CI doesn't have it)
  const legalPath = '/workspace/legal/pod-return-terms-nov20.md'
  if (existsSync(legalPath)) {
    const legal = readFileSync(legalPath, 'utf8')
    for (const para of POD_RETURN_TERMS) assert.ok(legal.includes(para), para)
    assert.ok(legal.includes(POD_CART_TERMS_LINE))
  }
  const lib = read('app/lib/pod.mjs')
  assert.doesNotMatch(lib, /remake fee|Wrong size\?/)
  // product page: block next to Add to Bag, with the anchor the cart/checkout link to
  const pdp = read('app/shop/made-to-order/[slug]/PodProductClient.js')
  assert.match(pdp, /<section id=\{POD_RETURN_TERMS_ANCHOR\}/)
  assert.match(pdp, /POD_RETURN_TERMS\.map/)
  assert.ok(pdp.indexOf('className="btn-atc"') < pdp.indexOf('POD_RETURN_TERMS.map'))
  // cart + checkout line with link (Fla. Stat. 501.142 point-of-sale notice)
  assert.equal(POD_CART_TERMS_LINE, 'Made-to-order · Final sale except damaged, misprinted, defective, or wrong items.')
  assert.equal(POD_CART_TERMS_LINK_TEXT, 'Return terms')
  assert.equal(podReturnTermsHref({ slug: 'vibin-core-tee' }), `/shop/made-to-order/vibin-core-tee#${POD_RETURN_TERMS_ANCHOR}`)
  assert.match(read('app/cart/CartClient.js'), /\{POD_CART_TERMS_LINE\} <Link href=\{podReturnTermsHref\(item\)\}>\{POD_CART_TERMS_LINK_TEXT\}<\/Link>/)
  assert.match(read('app/checkout/CheckoutClient.js'), /\{POD_CART_TERMS_LINE\} <a href=\{podReturnTermsHref\(item\)\}>\{POD_CART_TERMS_LINK_TEXT\}<\/a>/)
  // general pages (§D)
  const returns = read('app/returns/ReturnsClient.js')
  assert.match(returns, /Made-to-order pieces follow the return terms shown on their product page\./)
  assert.match(returns, /<div className="nonreturn-item">Made-to-order pieces, except damaged, misprinted, defective, or wrong items \(see the product page\)<\/div>/)
  assert.match(read('app/legal/terms/page.js'), /Made-to-order pieces are final sale except as stated in the return terms on their product page\./)
})

test('free-shipping exclusion: stated on POD pages and cart, and in sync with the code', () => {
  assert.equal(POD_FREE_SHIPPING_EXCLUSION_COPY, "Made-to-order pieces don't count toward free shipping on orders over $125. Their shipping is added at checkout.")
  assert.match(POD_FREE_SHIPPING_EXCLUSION_COPY, new RegExp(`\\$${FREE_SHIPPING_THRESHOLD}\\b`))
  assert.match(read('app/shop/made-to-order/[slug]/PodProductClient.js'), /<p className="pdp-pod-freeship">\{POD_FREE_SHIPPING_EXCLUSION_COPY\}<\/p>/)
  assert.match(read('app/cart/CartClient.js'), /items\.some\(isPodLine\) && \([\s\S]*?\{POD_FREE_SHIPPING_EXCLUSION_COPY\}/)
  // the code matches the statement: a made-to-order-only cart over the threshold still pays shipping,
  // and POD lines don't push in-house items over the threshold
  const after = { now: Date.parse('2027-02-01T12:00:00Z') }
  const hoodie = { id: 602, qty: 2, price: 72, fulfillment: POD_FULFILLMENT, shipFirst: 8.79, shipAddon: 2.5 }
  assert.ok(FREE_SHIPPING_THRESHOLD <= 144 && shippingFor(144, [hoodie], after) > 0)
  assert.equal(freeShippingSubtotal([hoodie, { id: 1, qty: 1, price: 60 }]), 60)
  assert.equal(shippingFor(204, [hoodie, { id: 1, qty: 1, price: 60 }], after), SHIPPING_FLAT_RATE + 11.29)
  for (const w of POD_BANNED_WORDS) {
    assert.ok(!POD_FREE_SHIPPING_EXCLUSION_COPY.toLowerCase().includes(w))
    for (const para of [...POD_RETURN_TERMS, POD_CART_TERMS_LINE]) assert.ok(!new RegExp(`\\b${w}\\b`, 'i').test(para), `${w} in ${para}`)
  }
})
