/**
 * Pure (no I/O) Printful helpers: variant mapping, recipient building, payload
 * building and the idempotency decision. Unit-tested in tests/printful.test.mjs.
 *
 * Variant mapping comes from PRINTFUL_VARIANT_MAP (JSON). Keys are
 * "<product id or slug>:<size>", values are either a number (a Printful
 * *sync variant id* from the store's synced product) or an object:
 *   { "sync_variant_id": 123 }                       – preferred (design lives in Printful)
 *   { "variant_id": 4016, "files": [{ "url": "…" }] } – catalog variant + print file(s)
 * Only PRINTFUL_PRODUCTS (the hoodie, 'hd') are honoured. Example:
 *   {"hd:S":{"variant_id":48514,"files":[{"type":"front_dtf","url":"https://…png"}]}, …}
 * If PRINTFUL_VARIANT_MAP is unset, defaultVariantMap() is used.
 * A value of 0 / null means "known POD item, id not configured yet" — the order
 * is flagged printful_needs_mapping instead of being sent.
 */

/**
 * Only these products are ever routed to Printful. The Foundation Tee and the
 * Snapback are fulfilled in-house, so keys for them in PRINTFUL_VARIANT_MAP are ignored.
 * 'hd' = Drop 01 VOL 01 Hoodie (cart lines carry { drop: 'd01', style: 'hd' }).
 */
export const PRINTFUL_PRODUCTS = ['hd']

/**
 * Lane Seven LS17001 "Unisex Super Heavyweight Hoodie" — Printful catalog product 1540
 * (techniques: DTF film / embroidery; double-layer hood without drawstrings).
 * Black catalog variant ids from GET https://api.printful.com/products/1540 (Oct 23, 2026).
 */
export const LS17001_PRODUCT_ID = 1540
export const LS17001_BLACK_VARIANTS = { S: 48514, M: 48520, L: 48526, XL: 48532, '2X': 48538, '3X': 48544 }
export const HOODIE_PRINT_PLACEMENT = 'front_dtf'
export const DEFAULT_HOODIE_FILE_URL = 'https://vibinapparel.com/print/d01-hd-front-01-columns-chest-4in.png'

/** Default map when PRINTFUL_VARIANT_MAP is unset: hoodie -> LS17001 Black catalog variants + front DTF file. */
export function defaultVariantMap(env = {}) {
  const url = env.PRINTFUL_HOODIE_FILE_URL || DEFAULT_HOODIE_FILE_URL
  let position
  if (env.PRINTFUL_HOODIE_FILE_POSITION) {
    try { position = JSON.parse(env.PRINTFUL_HOODIE_FILE_POSITION) } catch { throw new Error('PRINTFUL_HOODIE_FILE_POSITION is not valid JSON') }
  }
  const file = { type: HOODIE_PRINT_PLACEMENT, url, ...(position ? { position } : {}) }
  const out = {}
  for (const [size, id] of Object.entries(LS17001_BLACK_VARIANTS)) out[`hd:${size}`] = { variant_id: id, files: [file] }
  return out
}

export const SIZE_ALIASES = { XXL: '2X', '2XL': '2X', XXXL: '3X', '3XL': '3X' }

export function normalizeSize(size) {
  const s = String(size ?? '').trim().toUpperCase()
  return SIZE_ALIASES[s] || s
}

export function parseVariantMap(raw) {
  if (!raw) return {}
  let obj
  try { obj = typeof raw === 'string' ? JSON.parse(raw) : raw } catch {
    throw new Error('PRINTFUL_VARIANT_MAP is not valid JSON')
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error('PRINTFUL_VARIANT_MAP must be a JSON object')
  const out = {}
  for (const [key, val] of Object.entries(obj)) {
    const idx = key.lastIndexOf(':')
    if (idx <= 0) throw new Error(`PRINTFUL_VARIANT_MAP key "${key}" must look like "<product>:<size>"`)
    const product = key.slice(0, idx).trim().toLowerCase()
    const size = normalizeSize(key.slice(idx + 1))
    let entry
    if (val == null || val === 0 || val === '') entry = null // placeholder
    else if (typeof val === 'number' || /^\d+$/.test(String(val))) entry = { sync_variant_id: Number(val) }
    else if (typeof val === 'object' && (val.sync_variant_id || val.variant_id)) {
      entry = val.sync_variant_id
        ? { sync_variant_id: Number(val.sync_variant_id) }
        : { variant_id: Number(val.variant_id), files: Array.isArray(val.files) ? val.files : [] }
    } else throw new Error(`PRINTFUL_VARIANT_MAP["${key}"] must be a number or {sync_variant_id} / {variant_id, files}`)
    if (!PRINTFUL_PRODUCTS.includes(product)) continue // in-house products are never auto-routed
    out[`${product}:${size}`] = entry
  }
  return out
}

function productKeys(item) {
  if (item?.style) return [String(item.style).trim().toLowerCase()] // drop line: key is the style code
  return [item?.id, item?.slug].filter(v => v != null && v !== '').map(v => String(v).trim().toLowerCase())
}

/**
 * Splits cart lines into Printful lines and manual-fulfillment lines.
 * Returns { podLines, manualLines, unmapped } where unmapped are POD products
 * whose size has no (or a placeholder) variant id.
 */
export function splitCart(items, variantMap) {
  const podLines = [], manualLines = [], unmapped = []
  const podProducts = new Set(Object.keys(variantMap).map(k => k.slice(0, k.lastIndexOf(':'))))
  for (const item of items || []) {
    const keys = productKeys(item)
    const isPod = keys.some(k => podProducts.has(k))
    if (!isPod) { manualLines.push(item); continue }
    const size = normalizeSize(item.size)
    const key = keys.map(k => `${k}:${size}`).find(k => variantMap[k])
    if (!key) { unmapped.push(item); continue }
    podLines.push({ item, variant: variantMap[key] })
  }
  return { podLines, manualLines, unmapped }
}

/** Stripe Checkout Session -> Printful recipient. Handles both API shapes. */
export function recipientFromSession(session) {
  const ship = session?.collected_information?.shipping_details || session?.shipping_details || null
  const addr = ship?.address
  if (!addr?.line1) return null
  return {
    name: ship.name || session?.customer_details?.name || '',
    address1: addr.line1,
    ...(addr.line2 ? { address2: addr.line2 } : {}),
    city: addr.city || '',
    state_code: addr.state || '',
    country_code: addr.country || 'US',
    zip: addr.postal_code || '',
    ...(session?.customer_details?.email || session?.customer_email ? { email: session.customer_details?.email || session.customer_email } : {}),
    ...(session?.customer_details?.phone ? { phone: session.customer_details.phone } : {}),
  }
}

export function externalIdFor(orderId) {
  return `vibin-${orderId}`
}

/**
 * Printful v1 POST /orders body. Deliberately sends no packing_slip, gift message,
 * insert or QR: the hoodie ships with no certificate/QR insert (Printful default slip only).
 */
export function buildOrderPayload({ orderId, recipient, podLines }) {
  return {
    external_id: externalIdFor(orderId),
    shipping: 'STANDARD',
    recipient,
    items: podLines.map(({ item, variant }, i) => ({
      external_id: `${externalIdFor(orderId)}-${i + 1}`,
      quantity: Number(item.qty) || 1,
      ...(variant.sync_variant_id
        ? { sync_variant_id: variant.sync_variant_id }
        : { variant_id: variant.variant_id, files: variant.files }),
      ...(item.price != null ? { retail_price: Number(item.price).toFixed(2) } : {}),
      name: item.name || undefined,
    })),
  }
}

export const CLAIM_STALE_MS = 10 * 60 * 1000
export const RETRYABLE_STATUSES = [null, 'printful_failed']

/**
 * Should this webhook delivery try to create a Printful order for this row?
 * Returns { action: 'create' | 'skip', reason }.
 */
export function decideFulfillment(order, now = Date.now()) {
  if (!order) return { action: 'skip', reason: 'order not found' }
  if (order.printful_order_id) return { action: 'skip', reason: `already has Printful order ${order.printful_order_id}` }
  const st = order.fulfillment_status ?? null
  if (st === 'printful_submitting') {
    const claimed = order.printful_claimed_at ? new Date(order.printful_claimed_at).getTime() : 0
    if (now - claimed < CLAIM_STALE_MS) return { action: 'skip', reason: 'another delivery is submitting' }
    return { action: 'create', reason: 'stale claim' }
  }
  if (RETRYABLE_STATUSES.includes(st)) return { action: 'create', reason: st ? 'retry after failure' : 'new' }
  return { action: 'skip', reason: `fulfillment_status=${st}` }
}

export function isConfirmEnabled(v) {
  return String(v ?? '').trim().toLowerCase() === 'true'
}

/** Printful v1 order.status -> our fulfillment_status */
export function fulfillmentStatusFromPrintful(pfStatus, confirmed) {
  const s = String(pfStatus || '').toLowerCase()
  if (s === 'draft') return 'printful_draft'
  if (s === 'fulfilled') return 'shipped'
  if (s === 'failed') return 'printful_failed'
  if (s === 'canceled') return 'printful_canceled'
  return confirmed ? 'printful_confirmed' : 'printful_draft'
}

/** Constant-time string compare (for the webhook secret). */
export function safeEqual(a, b) {
  const x = String(a ?? ''), y = String(b ?? '')
  let diff = x.length ^ y.length
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x.charCodeAt(i) || 0) ^ (y.charCodeAt(i) || 0)
  return diff === 0 && x.length > 0
}
