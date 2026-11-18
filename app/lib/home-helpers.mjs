/**
 * Home page and shop ordering, and the "Shop by category" tiles, built from the real product list.
 * Pure (no DB/env), unit-tested in tests/home-helpers.test.mjs.
 */
import { dropCatalogEntry } from './drop-catalog.mjs'
import { productKind, countByKind } from './shop-filters.mjs'
import { productImage } from './product-image.mjs'

/**
 * Display order: the pieces of the current drop first (they are what the page is promoting), then pieces
 * that have a photo, then pieces still waiting for a photo (a name-only tile reads as unfinished at the
 * top of the page), sold-out pieces last. Within each group the order given is kept (newest first from
 * the database).
 */
export function orderForDisplay(products) {
  const list = Array.isArray(products) ? products : []
  const rank = p => {
    if (p && p.in_stock === false) return 3
    if (dropCatalogEntry({ id: p?.id, slug: p?.slug })) return 0
    return productImage(p, 'square') ? 1 : 2
  }
  return list.map((p, i) => ({ p, i })).sort((a, b) => rank(a.p) - rank(b.p) || a.i - b.i).map(x => x.p)
}

/** The first `limit` pieces for the home page grid. */
export function featuredForHome(products, limit = 8) {
  return orderForDisplay(products).slice(0, limit)
}

// Tile order, label and which piece's photo fronts each tile (first slug found wins; otherwise the first
// piece of that kind that has a photo). `cover` is a fixed editorial photo that overrides product photos.
const CATEGORY_TILES = [
  { key: 'tees', label: 'Tees', covers: ['vibin-classic-tee'] },
  { key: 'hoodies', label: 'Hoodies', cover: '/brand/cat-hoodie-black-model.jpg', covers: ['vibin-oversized-hoodie'] },
  { key: 'crewnecks', label: 'Crewnecks', covers: [] },
  { key: 'bottoms', label: 'Bottoms', covers: ['tech-short', 'vibin-cargo-shorts'] },
  { key: 'accessories', label: 'Accessories', covers: ['vibin-snapback'] },
]

/** "Shop by category" tiles: only categories that have pieces, with real counts and a real photo. */
export function homeCategories(products) {
  const list = Array.isArray(products) ? products : []
  const counts = countByKind(list)
  return CATEGORY_TILES.filter(c => counts[c.key] > 0).map(c => {
    const inKind = list.filter(p => productKind(p) === c.key)
    const pick = c.covers.map(slug => inKind.find(p => p.slug === slug && productImage(p, 'hero'))).find(Boolean)
      || inKind.find(p => productImage(p, 'hero'))
    return {
      key: c.key,
      label: c.label,
      count: counts[c.key],
      href: `/shop?cat=${c.key}`,
      image: c.cover || (pick ? productImage(pick, 'hero') : null),
    }
  })
}
