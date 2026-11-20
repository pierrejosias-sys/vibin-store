/**
 * Vibin Apparel — shipping config (single source of truth).
 * $8 flat, free on orders of $125+ (subtotal, before shipping).
 */
export const SHIPPING_FLAT_RATE = 8
export const FREE_SHIPPING_THRESHOLD = 125
export const FREE_SHIPPING_LABEL = `$${FREE_SHIPPING_THRESHOLD}`

/**
 * Made-to-order (Printful) packages. firstItem = the full rate for a package's first unit; addOn = each extra
 * unit in the same package. A product with ships_separately = true (e.g. caps: Printful ships them as their
 * own package) pays the full firstItem rate for EVERY unit, never the add-on rate.
 * PLACEHOLDERS until Finance sets them from Printful's US rate sheet: firstItem = the flat rate, addOn = 0.
 */
export const POD_SHIPPING = { firstItem: SHIPPING_FLAT_RATE, addOn: 0 }

/**
 * shippingFor(subtotal) -> the flat rule (unchanged for every non-POD cart).
 * shippingFor(subtotal, items) also prices made-to-order lines. A line is POD when it has
 * fulfillment === 'printful_pod' (stamped server-side in /api/checkout; the cart may pass pod: true as a
 * display hint) and ships separately when shipsSeparately / ships_separately is true.
 *   in-house items (any)   -> one flat-rate package
 *   POD, shipped together  -> firstItem + addOn x (units - 1)
 *   POD, ships_separately  -> firstItem x units
 * Free shipping at FREE_SHIPPING_THRESHOLD+ still covers the whole order.
 */
export function shippingFor(subtotal, items = null, rates = POD_SHIPPING) {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0
  if (!Array.isArray(items) || !items.length) return SHIPPING_FLAT_RATE
  const isPod = i => i && (i.fulfillment === 'printful_pod' || i.pod === true)
  const units = i => Math.max(1, Math.floor(Number(i.qty) || 1))
  const separate = i => i.shipsSeparately === true || i.ships_separately === true
  const inHouse = items.some(i => i && !isPod(i))
  const together = items.filter(i => isPod(i) && !separate(i)).reduce((n, i) => n + units(i), 0)
  const alone = items.filter(i => isPod(i) && separate(i)).reduce((n, i) => n + units(i), 0)
  let total = inHouse ? SHIPPING_FLAT_RATE : 0
  if (together > 0) total += rates.firstItem + rates.addOn * (together - 1)
  total += rates.firstItem * alone
  return Math.round(total * 100) / 100
}
