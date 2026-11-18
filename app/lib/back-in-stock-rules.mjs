/** Pure rules for back-in-stock (safe to import in the browser). */

/** True when the product page should offer the sign-up: sold out, or tagged coming-soon. */
export function offersBackInStock(product) {
  if (!product) return false
  const tags = Array.isArray(product.tags) ? product.tags : []
  return product.in_stock === false || tags.includes('coming-soon')
}
