/**
 * Vibin Apparel — shipping config (single source of truth).
 * $8 flat, free on orders of $125+ (subtotal, before shipping).
 */
export const SHIPPING_FLAT_RATE = 8
export const FREE_SHIPPING_THRESHOLD = 125
export const FREE_SHIPPING_LABEL = `$${FREE_SHIPPING_THRESHOLD}`

/**
 * Made-to-order (Printful POD) shipping: PER PRODUCT, customer-paid, and NEVER covered by free shipping at
 * FREE_SHIPPING_THRESHOLD+ (pending Josias/Finance; the stated copy is POD_FREE_SHIPPING_EXCLUSION_COPY in pod.mjs
 * and must stay in sync with this code).
 * Rates come from products.ship_first_rate / ship_addon_rate (stamped server-side as shipFirst / shipAddon).
 * Finance §8 (/workspace/finance/pod-margin-check-nov20.md, Nov 20, 2026): tee $5.35 first / $2.20 add-on,
 * hoodie $9.19 / $2.50, which include Printful's $0.40 holiday surcharge through Jan 17, 2027. Rows store the base
 * rates (tee $4.95, hoodie $8.79) and the surcharge is added once per order by POD_HOLIDAY_SURCHARGE, so it drops
 * off automatically after Jan 17, 2027 ET. A mixed cart pays the highest first-item rate plus add-ons for the rest.
 * The $8 / free-at-$125 rule stays for the non-made-to-order items (numbered Drop 01 and the regular shop).
 * Fallback for a row with no rates: the hoodie base rate (the highest). PENDING FINANCE.
 */
export const POD_DEFAULT_RATES = { first: 8.79, addOn: 2.5 } // PENDING FINANCE
/** Printful's $0.40 US holiday surcharge, once per order with POD lines, through Jan 17, 2027 ET (ends 2027-01-18 00:00 ET). */
export const POD_HOLIDAY_SURCHARGE = { amount: 0.4, until: '2027-01-18T05:00:00Z' }

const money = n => Math.round(n * 100) / 100
const units = i => Math.max(1, Math.floor(Number(i?.qty) || 1))
const rate = (v, d) => (v != null && v !== '' && Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : d)

export function isPodLine(i) {
  return !!i && (i.fulfillment === 'printful_pod' || i.pod === true)
}

/** Subtotal that counts toward free shipping: made-to-order lines never do. */
export function freeShippingSubtotal(items) {
  return (Array.isArray(items) ? items : []).filter(i => i && !isPodLine(i)).reduce((s, i) => s + Number(i.price || 0) * units(i), 0)
}

/**
 * Made-to-order shipping for the POD lines of a cart (0 when there are none).
 *  - shipped together: the highest first-item rate once, every other unit at its own add-on rate
 *  - ships_separately (caps): EVERY unit pays its full first-item rate, never the add-on rate
 *  - plus the holiday surcharge once per order while it applies
 */
export function podShippingFor(items, { now = Date.now() } = {}) {
  const pods = (Array.isArray(items) ? items : []).filter(isPodLine)
  if (!pods.length) return 0
  const first = i => rate(i.shipFirst ?? i.ship_first_rate, POD_DEFAULT_RATES.first)
  const addOn = i => rate(i.shipAddon ?? i.ship_addon_rate, POD_DEFAULT_RATES.addOn)
  const separate = i => i.shipsSeparately === true || i.ships_separately === true
  let total = 0
  const together = pods.filter(i => !separate(i))
  if (together.length) {
    const lead = together.reduce((a, i) => (first(i) > first(a) ? i : a), together[0])
    total += first(lead) + addOn(lead) * (units(lead) - 1)
    for (const i of together) if (i !== lead) total += addOn(i) * units(i)
  }
  for (const i of pods.filter(separate)) total += first(i) * units(i)
  if (new Date(now).getTime() < new Date(POD_HOLIDAY_SURCHARGE.until).getTime()) total += POD_HOLIDAY_SURCHARGE.amount
  return money(total)
}

/**
 * shippingFor(subtotal)        -> the flat rule, unchanged for every existing caller and cart.
 * shippingFor(subtotal, items) -> in-house items: one flat-rate package, free when the NON-made-to-order
 *                                 subtotal reaches FREE_SHIPPING_THRESHOLD; plus podShippingFor(items).
 */
export function shippingFor(subtotal, items = null, opts = {}) {
  if (!Array.isArray(items) || !items.some(isPodLine)) {
    return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE
  }
  const inHouse = items.some(i => i && !isPodLine(i))
  const flat = inHouse && freeShippingSubtotal(items) < FREE_SHIPPING_THRESHOLD ? SHIPPING_FLAT_RATE : 0
  return money(flat + podShippingFor(items, opts))
}
