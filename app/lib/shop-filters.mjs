// Shop categories, derived from the real catalog (pure helpers, unit-tested in
// tests/catalog-helpers.test.mjs). The products table only has a coarse `category`
// (tops / bottoms / accessories), so tees, hoodies and crewnecks are told apart by tags and name.

export const FILTERS = [
  { key: 'tees', label: 'Tees' },
  { key: 'hoodies', label: 'Hoodies' },
  { key: 'crewnecks', label: 'Crewnecks' },
  { key: 'bottoms', label: 'Bottoms' },
  { key: 'accessories', label: 'Accessories' },
]

const KEYS = new Set(FILTERS.map(f => f.key))
// Old links use singular or alternative spellings (/shop?cat=tee, ?cat=hoodie, ...).
const ALIASES = { tee: 'tees', hoodie: 'hoodies', crewneck: 'crewnecks', crew: 'crewnecks', sweatshirt: 'crewnecks', bottom: 'bottoms', pants: 'bottoms', accessory: 'accessories' }

/** Turns whatever ended up in ?cat= into a known filter key, or 'all'. */
export function normalizeFilter(value) {
  const v = String(value ?? '').trim().toLowerCase()
  if (KEYS.has(v)) return v
  return ALIASES[v] || 'all'
}

function words(product) {
  const tags = Array.isArray(product?.tags) ? product.tags.map(t => String(t).toLowerCase()) : []
  const name = String(product?.name || '').toLowerCase()
  const category = String(product?.category || '').toLowerCase()
  return { tags, name, category }
}

/** Which shop filter a product belongs to ('tees' | 'hoodies' | 'crewnecks' | 'bottoms' | 'accessories' | null). */
export function productKind(product) {
  const { tags, name, category } = words(product)
  const has = re => tags.some(t => re.test(t)) || re.test(name)
  if (has(/hoodie/)) return 'hoodies'
  if (has(/crew|sweatshirt/)) return 'crewnecks'
  if (has(/(^|\b)(tee|t-shirt|tshirt)s?\b/)) return 'tees'
  if (/bottom|pant|short|jogger|cargo/.test(category) || has(/short|jogger|cargo|pant/)) return 'bottoms'
  if (/accessor|headwear|hat|cap/.test(category) || has(/hat|cap|beanie|bag|tote|lanyard/)) return 'accessories'
  return null
}

/** { all: n, tees: n, ... } counted from the real product list. */
export function countByKind(products) {
  const counts = { all: 0 }
  for (const f of FILTERS) counts[f.key] = 0
  for (const p of products || []) {
    counts.all += 1
    const k = productKind(p)
    if (k) counts[k] += 1
  }
  return counts
}

export function filterProducts(products, key) {
  if (!key || key === 'all') return products || []
  return (products || []).filter(p => productKind(p) === key)
}

/** Chips to show: "All" plus every category that has at least one product. */
export function visibleFilters(products) {
  const counts = countByKind(products)
  return [{ key: 'all', label: 'All', count: counts.all }, ...FILTERS.filter(f => counts[f.key] > 0).map(f => ({ ...f, count: counts[f.key] }))]
}

const SUBTITLE = [
  [/zip/, 'Zip-up hoodie'], [/hoodie/, 'Hoodie'], [/crew|sweatshirt/, 'Crewneck'], [/tee|t-shirt|tshirt/, 'Tee'],
  [/short/, 'Shorts'], [/jogger/, 'Joggers'], [/cargo/, 'Cargo'], [/hat|snapback|cap/, 'Hat'], [/tote|bag/, 'Bag'], [/lanyard/, 'Lanyard'],
]

/** Short descriptor under the product name on a tile ("Hoodie", "Shorts", "Hat", ...). */
export function productSubtitle(product) {
  const { tags, name, category } = words(product)
  for (const [re, label] of SUBTITLE) {
    if (tags.some(t => re.test(t))) return label
  }
  for (const [re, label] of SUBTITLE) {
    if (re.test(name)) return label
  }
  const c = category.replace(/s$/, '')
  return c ? c.charAt(0).toUpperCase() + c.slice(1) : 'Apparel'
}

/** "$85" for whole dollars, "$64.99" otherwise. */
export function formatPrice(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return ''
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`
}
