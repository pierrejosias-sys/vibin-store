/**
 * Vibin Apparel — shipping config (single source of truth).
 * $8 flat, free on orders of $125+ (subtotal, before shipping).
 */
export const SHIPPING_FLAT_RATE = 8
export const FREE_SHIPPING_THRESHOLD = 125
export const FREE_SHIPPING_LABEL = `$${FREE_SHIPPING_THRESHOLD}`

export function shippingFor(subtotal) {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE
}
