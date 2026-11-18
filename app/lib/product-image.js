// One place that decides which photo represents a product.
//   kind 'square' (default): shop grid, search, cart  -> products.image_url
//   kind 'hero':             product page             -> images[{kind:'hero'}] (3:4), else the square
export function productImage(product, kind = 'square') {
  if (!product) return null
  const list = Array.isArray(product.images) ? product.images : []
  const hero = list.find(i => i && i.kind === 'hero' && typeof i.url === 'string' && i.url)?.url || null
  const first = list.find(i => i && typeof i.url === 'string' && i.url)?.url || null
  const square = typeof product.image_url === 'string' && product.image_url ? product.image_url : null
  return kind === 'hero' ? (hero || square || first) : (square || first || hero)
}
