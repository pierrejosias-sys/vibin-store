import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  POD_FULFILLMENT, POD_SALES_LIVE, POD_AUTO_SUBMIT, POD_COLLECTION_PATH, POD_LINE_COPY, POD_SHIP_TIME_COPY,
  POD_SEPARATE_PACKAGE_COPY, POD_BANNED_WORDS, POD_SHIP_DAYS,
  isPodProduct, isNumberedCapItem, podLinesFromItems, checkPodCheckout, podShipTimeLine, cartSeparatePackageNote,
  podRecipientFromSession, buildPodDraftPayload, podDraftEligibility, podVariantFor,
} from '../app/lib/pod.mjs'
import { createPodDraftForOrder, printfulKeyConfigured, PRINTFUL_KEY_ENV } from '../app/lib/printful-pod-draft.mjs'
import { splitCart } from '../app/lib/printful-core.mjs'
import { shippingFor, SHIPPING_FLAT_RATE, POD_SHIPPING } from '../app/lib/shipping.js'
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
  const sql = read('supabase/migrations/20261120180000_pod_unnumbered_products.sql')
  assert.match(sql, /CHECK \(fulfillment <> 'printful_pod' OR numbered = false\)/)
  assert.doesNotMatch(sql, /(INSERT|UPDATE|DELETE)[^;]*\b(pieces|drop_styles)\b/i)
})

test('POD sales gate: POD_SALES_LIVE defaults to false and blocks checkout', () => {
  assert.equal(POD_SALES_LIVE, false)
  const pods = new Map([[501, POD]])
  const blocked = checkPodCheckout([{ id: 501, qty: 1 }], pods)
  assert.equal(blocked.status, 409)
  assert.match(blocked.error, /not available to order yet/)
  assert.deepEqual(checkPodCheckout([{ id: 501, qty: 1 }], pods, { salesLive: true }), { podCount: 1 })
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
test('ships_separately: each separately shipped unit pays the full first-item rate, not the add-on rate', () => {
  const rates = { firstItem: 8, addOn: 2.5 }
  // unchanged flat rule for every non-POD cart (and the old one-argument call)
  assert.equal(shippingFor(50), SHIPPING_FLAT_RATE)
  assert.equal(shippingFor(50, [{ id: 1, qty: 3 }], rates), SHIPPING_FLAT_RATE)
  assert.equal(shippingFor(130, [{ id: 502, qty: 2, fulfillment: POD_FULFILLMENT, shipsSeparately: true }], rates), 0)
  // two POD tees together: first + add-on
  assert.equal(shippingFor(76, [{ id: 501, qty: 2, fulfillment: POD_FULFILLMENT }], rates), 10.5)
  // tee + cap: the cap is its own package at the full first-item rate
  assert.equal(shippingFor(70, [{ id: 501, qty: 1, fulfillment: POD_FULFILLMENT }, { id: 502, qty: 1, fulfillment: POD_FULFILLMENT, shipsSeparately: true }], rates), 16)
  // two caps: two full rates
  assert.equal(shippingFor(64, [{ id: 502, qty: 2, fulfillment: POD_FULFILLMENT, ships_separately: true }], rates), 16)
  // cart display hint (pod: true) prices the same as the server stamp
  assert.equal(shippingFor(64, [{ id: 502, qty: 2, pod: true, shipsSeparately: true }], rates), 16)
  assert.equal(POD_SHIPPING.firstItem, SHIPPING_FLAT_RATE)
  const route = read('app/api/checkout/route.js')
  assert.match(route, /shippingFor\(total, items\)/)
  assert.match(route, /i\.shipsSeparately = pod\.ships_separately === true/)
})
