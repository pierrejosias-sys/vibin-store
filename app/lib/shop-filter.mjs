/**
 * Shop category filter, shared by /shop and the homepage category counts, so the two always agree.
 * The DB uses broad categories ('tops', 'bottoms', 'accessories'), so tees vs hoodies come from name/slug.
 */
const hay = p => `${p?.category || ''} ${p?.name || ''} ${p?.slug || ''}`.toLowerCase()

const RULES = {
  tees: h => /\btees?\b|-tee\b|t-shirt/.test(h),
  hoodies: h => /hoodie|crew|sweatshirt/.test(h),
  crewnecks: h => /crew|sweatshirt/.test(h),
  bottoms: h => /bottom|pant|short|cargo|jogger/.test(h),
  pants: h => /pant|jogger/.test(h),
  cargo: h => /cargo/.test(h),
  accessories: h => /accessor|headwear|cap\b|snapback|beanie|lanyard|tote|bag/.test(h),
}

export const SHOP_CATEGORIES = ['tees', 'hoodies', 'bottoms', 'accessories']

export function matchesFilter(product, filter) {
  if (!filter || filter === 'all') return true
  const rule = RULES[filter]
  return rule ? rule(hay(product)) : hay(product).includes(String(filter).toLowerCase())
}

export function categoryCounts(products) {
  return Object.fromEntries(SHOP_CATEGORIES.map(c => [c, (products || []).filter(p => matchesFilter(p, c)).length]))
}

export const piecesLabel = n => `${n} ${n === 1 ? 'Piece' : 'Pieces'}`
