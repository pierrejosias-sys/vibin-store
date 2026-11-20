/**
 * Made-to-order (print-on-demand) line. Pure helpers: no I/O, no secrets, unit-tested in tests/pod-unnumbered.test.mjs.
 *
 * A POD product is a regular `products` row with fulfillment = 'printful_pod' AND numbered = false
 * (columns from supabase/migrations/20261120200000_pod_unnumbered_products.sql, NOT applied yet).
 * POD products:
 *  - are never numbered: they never go through claim_pieces / the pieces ledger and never count toward the
 *    50-per-style Drop 01 cap (see isNumberedCapItem below and DROP_CATALOG in drop-catalog.mjs);
 *  - live at their own collection URL (/shop/made-to-order), never under /drop;
 *  - are handed to Printful by an admin only, as a DRAFT order (Printful charges on confirm; we never confirm);
 *  - can't be checked out while POD_SALES_LIVE is false (Florida sales tax registration first; Legal, Nov 20).
 */

export const POD_FULFILLMENT = 'printful_pod'

/** Checkout gate. Flip to true (one line, needs Josias's yes) only after Florida DR-1 registration clears. */
export const POD_SALES_LIVE = false

/** Printful auto-submit for the POD line stays OFF. The admin button is the only path, and it creates drafts only. */
export const POD_AUTO_SUBMIT = false

export const POD_COLLECTION_PATH = '/shop/made-to-order'
export const POD_COLLECTION_TITLE = 'Made to Order'

/** Legal-approved line (Nov 20). The only place POD copy may mention the numbered line. */
export const POD_LINE_COPY = 'Made to order. Not part of the numbered Drop 01.'

/**
 * Ship time (Legal-approved copy, Nov 20, 12:18 PM ET; use EXACTLY). Business days to hand-off to the carrier,
 * including Printful production and our manual hand-off (16 CFR 435). A product row may override the number
 * with ship_days (NULL = this default); the sentence structure never changes.
 */
export const POD_SHIP_DAYS = 7
export const POD_SHIP_TIME_COPY = 'Made to order. Ships within 7 business days of your order. US delivery usually takes another 3–4 business days after it ships.'

/** Caps (ships_separately = true): product page, and the cart when a cap is in it with anything else. */
export const POD_SEPARATE_PACKAGE_COPY = 'Hats ship in a separate package.'

/**
 * Made-to-order return terms. VERBATIM from /workspace/legal/pod-return-terms-nov20.md (§A, §B, §D), Nov 20, 12:24 PM ET.
 * PENDING JOSIAS. Section C (size-exchange variant) is intentionally not used.
 */
export const POD_RETURN_TERMS_TITLE = 'Made-to-order return terms'
export const POD_RETURN_TERMS = [
  "Every made-to-order piece is printed just for you, so it's final sale: we can't accept returns or exchanges for size, fit, or change of mind. Please check the size guide before you order.",
  "If your item arrives damaged, misprinted, or defective, or it isn't what you ordered, email returns@vibinapparel.com within 30 days of delivery with your order number and a photo. We'll send a free replacement or give you a full refund, your choice, at no cost to you.",
  'Want to cancel? Email us right away. We can cancel for a full refund until your item goes into production. Once it\'s in production, these return terms apply.',
  "These terms don't limit any rights you have under law, including your right to cancel for a full refund if we can't ship by the date we promised.",
]
/** Anchor of the terms block on each POD product page (cart/checkout link target, Fla. Stat. 501.142 notice). */
export const POD_RETURN_TERMS_ANCHOR = 'return-terms'
/** Cart and checkout line next to each made-to-order item (§B); "Return terms" links to the product page block. */
export const POD_CART_TERMS_LINE = 'Made-to-order · Final sale except damaged, misprinted, defective, or wrong items.'
export const POD_CART_TERMS_LINK_TEXT = 'Return terms'
export function podReturnTermsHref(item) {
  return `${POD_COLLECTION_PATH}/${encodeURIComponent(String(item?.slug || ''))}#${POD_RETURN_TERMS_ANCHOR}`
}

/**
 * Free-shipping exclusion. MUST match the code in lib/shipping.js (made-to-order lines never count toward, and are
 * never covered by, free shipping at FREE_SHIPPING_THRESHOLD+). PENDING JOSIAS (free-shipping policy decision).
 */
export const POD_FREE_SHIPPING_EXCLUSION_COPY = "Made-to-order pieces don't count toward free shipping on orders over $125. Their shipping is added at checkout."

/** Words POD copy must never use (Legal, Nov 20). Checked by tests against the POD templates. */
export const POD_BANNED_WORDS = ['numbered', 'limited', 'exclusive', 'drop', 'sold out', 'only x left', 'left in stock', 'selling fast', 'restock', 'countdown', 'christmas', 'holiday', 'arrives by']

export function isPodProduct(product) {
  return !!product && product.fulfillment === POD_FULFILLMENT && product.numbered === false
}

/** Shown to shoppers only when published (draft rows are hidden by RLS too, once the migration runs). */
export function isPublishedPod(product) {
  return isPodProduct(product) && product.published !== false
}

/** Size run for made-to-order pieces (Finance/Product, Nov 20: S–2XL; 3XL–5XL left out entirely). */
export const POD_SIZES = ['S', 'M', 'L', 'XL', '2XL']

/** Price for a size: products.size_prices overrides (e.g. hoodie {"2XL": 75}), else products.price. null = size not sold. */
export function podPriceFor(product, size) {
  const s = String(size ?? '').trim().toUpperCase()
  if (!POD_SIZES.includes(s)) return null
  const map = product?.size_prices && typeof product.size_prices === 'object' ? product.size_prices : {}
  const v = map[s]
  const n = v != null && v !== '' && Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : Number(product?.price)
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Business days to ship for a product: row override first, then POD_SHIP_DAYS. null when invalid. */
export function podShipDays(product, fallback = POD_SHIP_DAYS) {
  const n = v => (v != null && v !== '' && Number.isInteger(Number(v)) && Number(v) > 0 ? Number(v) : null)
  return n(product?.ship_days) ?? n(fallback)
}

/** The ship-time line for a POD product page. Exactly POD_SHIP_TIME_COPY at the default. */
export function podShipTimeLine(product, fallback = POD_SHIP_DAYS) {
  const d = podShipDays(product, fallback)
  if (!d) return null
  return POD_SHIP_TIME_COPY.replace('within 7 business days', `within ${d} business days`)
}

export function shipsSeparately(item) {
  return !!item && (item.ships_separately === true || item.shipsSeparately === true)
}

/** Cart note: a separately shipped (cap) unit sits alongside at least one other unit. */
export function cartSeparatePackageNote(items) {
  const list = (Array.isArray(items) ? items : []).filter(Boolean)
  const units = list.reduce((n, i) => n + Math.max(1, Math.floor(Number(i.qty) || 1)), 0)
  return list.some(shipsSeparately) && units > 1 ? POD_SEPARATE_PACKAGE_COPY : null
}

/**
 * Is this cart/order line subject to the numbered cap and pieces ledger? POD lines never are, even if a
 * client sends drop/style fields (sanitizeItem keeps drop/style, so this guard is explicit).
 */
export function isNumberedCapItem(item) {
  if (!item || item.fulfillment === POD_FULFILLMENT) return false
  return !!(item.drop && item.style)
}

/** POD lines on a stored order (orders.items). Checkout stamps fulfillment server-side, so clients can't spoof it. */
export function podLinesFromItems(items) {
  return (Array.isArray(items) ? items : []).filter(i => i && i.fulfillment === POD_FULFILLMENT)
}

/**
 * Checkout gate for POD lines. Returns { error, status } or {}.
 * podProducts: Map(productId -> product row with fulfillment/numbered/ship_days/ships_separately).
 */
export function checkPodCheckout(items, podProducts, { salesLive = POD_SALES_LIVE, shipDays = POD_SHIP_DAYS } = {}) {
  const pods = (items || []).filter(i => podProducts.has(Number(i.id)))
  if (!pods.length) return { podCount: 0 }
  if (!salesLive) return { error: 'Made-to-order pieces are not available to order yet.', status: 409 }
  for (const i of pods) {
    const p = podProducts.get(Number(i.id))
    if (!isPodProduct(p) || p.published === false) return { error: 'This item is not available to order.', status: 409 }
    if (!podShipDays(p, shipDays)) return { error: `${p.name} is not available to order yet.`, status: 409 }
    if (podPriceFor(p, i.size) == null) return { error: `${p.name} isn't available in size ${String(i.size || '').slice(0, 8)}.`, status: 409 }
  }
  return { podCount: pods.length }
}

/** Printful variant for a POD line: products.printful_variants is { "<size>": <sync_variant_id> | {variant_id, files} }. */
export function podVariantFor(product, size) {
  const map = product?.printful_variants
  if (!map || typeof map !== 'object') return null
  const s = String(size ?? '').trim().toUpperCase()
  const v = map[s] ?? map[String(size ?? '')] ?? map.OS ?? null
  if (v == null || v === 0 || v === '') return null
  if (typeof v === 'number' || /^\d+$/.test(String(v))) return { sync_variant_id: Number(v) }
  if (v.sync_variant_id) return { sync_variant_id: Number(v.sync_variant_id) }
  if (v.variant_id) return { variant_id: Number(v.variant_id), files: Array.isArray(v.files) ? v.files : [] }
  return null
}

/**
 * Printful v1 recipient from a Stripe Checkout Session. Phone is sent ONLY when the customer provided one
 * (Privacy Section 3 must then say "phone number (if provided)"; see REPORT.md).
 */
export function podRecipientFromSession(session) {
  const ship = session?.collected_information?.shipping_details || session?.shipping_details || null
  const addr = ship?.address
  if (!addr?.line1) return null
  const email = session?.customer_details?.email || session?.customer_email || null
  const phone = session?.customer_details?.phone || null
  return {
    name: ship.name || session?.customer_details?.name || '',
    address1: addr.line1,
    ...(addr.line2 ? { address2: addr.line2 } : {}),
    city: addr.city || '',
    state_code: addr.state || '',
    country_code: addr.country || 'US',
    zip: addr.postal_code || '',
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
  }
}

export function podExternalId(orderId) {
  return `vibin-pod-${orderId}`
}

/** Printful v1 POST /orders body. Never includes confirm; the request URL never has ?confirm=true either. */
export function buildPodDraftPayload({ orderId, recipient, lines }) {
  return {
    external_id: podExternalId(orderId),
    shipping: 'STANDARD',
    recipient,
    items: lines.map(({ item, variant }, i) => ({
      external_id: `${podExternalId(orderId)}-${i + 1}`,
      quantity: Number(item.qty) || 1,
      ...(variant.sync_variant_id ? { sync_variant_id: variant.sync_variant_id } : { variant_id: variant.variant_id, files: variant.files }),
      ...(item.price != null ? { retail_price: Number(item.price).toFixed(2) } : {}),
      ...(item.name ? { name: item.name } : {}),
    })),
  }
}

/** Can the admin create a Printful draft for this order? */
export function podDraftEligibility(order) {
  if (!order) return { ok: false, reason: 'Order not found.' }
  if (order.status !== 'paid') return { ok: false, reason: 'Only paid orders can be sent to Printful.' }
  if (!podLinesFromItems(order.items).length) return { ok: false, reason: 'No made-to-order items on this order.' }
  if (order.printful_order_id) return { ok: false, reason: `Already has Printful draft ${order.printful_order_id}.` }
  if (order.fulfillment_status === 'printful_submitting') return { ok: false, reason: 'A draft is already being created.' }
  return { ok: true }
}
