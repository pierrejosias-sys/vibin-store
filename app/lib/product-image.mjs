// One place that decides which photo represents a product (pure helpers, unit-tested in
// tests/catalog-helpers.test.mjs).
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

// Photos for the product page gallery. A 'hero' and a 'square' entry are two crops of the same shot,
// so only the primary one is listed; entries without a kind are separate photos.
export function galleryImages(product) {
  const list = Array.isArray(product?.images) ? product.images : []
  const out = []
  const primary = productImage(product, 'hero')
  if (primary) out.push(primary)
  for (const i of list) {
    if (!i || typeof i.url !== 'string' || !i.url) continue
    if (i.kind === 'hero' || i.kind === 'square') continue
    if (!out.includes(i.url)) out.push(i.url)
  }
  return out
}

// next/image only optimizes local files and the hosts allowed in next.config.js. Anything else
// (an admin can paste any URL, and carts live in the shopper's browser) must be shown as-is,
// because next/image throws on an unknown host and would take the whole page down.
const OPTIMIZABLE_HOSTS = [/^user-gen-media-assets\.s3\.amazonaws\.com$/, /\.supabase\.co$/, /\.supabase\.in$/]
export function canOptimizeImage(src) {
  if (typeof src !== 'string' || !src) return false
  if (src.startsWith('/')) return !src.startsWith('//')
  try {
    const u = new URL(src)
    return u.protocol === 'https:' && OPTIMIZABLE_HOSTS.some(re => re.test(u.hostname))
  } catch {
    return false
  }
}
