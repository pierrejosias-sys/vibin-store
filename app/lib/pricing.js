/**
 * Server-side pricing for regular (non-drop) catalog items.
 * Client-sent price/name are ignored; everything comes from the products table.
 */
import { isDropItem } from './pieces'

// Cart ids used by standalone pages that predate the products table.
const LEGACY_ID_TO_SLUG = {
  'snapback-001': 'vibin-snapback',
  'lanyard-001': 'lanyard',
}

export async function resolveCatalogItems(supabase, items) {
  const catalogItems = items.filter(i => !isDropItem(i))
  if (!catalogItems.length) return { catalogItems }

  const ids = []
  const slugs = []
  for (const item of catalogItems) {
    const qty = Number(item.qty)
    if (!Number.isInteger(qty) || qty < 1 || qty > 20) return { error: 'Invalid quantity.' }
    item.qty = qty
    const numericId = /^\d+$/.test(String(item.id)) ? Number(item.id) : null
    if (numericId) ids.push(numericId)
    else {
      const slug = LEGACY_ID_TO_SLUG[item.id] || item.slug
      if (!slug) return { error: `Unknown product: ${String(item.name || item.id).slice(0, 60)}` }
      slugs.push(slug)
    }
  }

  const found = []
  if (ids.length) {
    const { data, error } = await supabase.from('products').select('id, slug, name, price, in_stock').in('id', ids)
    if (error) throw new Error(error.message)
    found.push(...data)
  }
  if (slugs.length) {
    const { data, error } = await supabase.from('products').select('id, slug, name, price, in_stock').in('slug', slugs)
    if (error) throw new Error(error.message)
    found.push(...data)
  }

  for (const item of catalogItems) {
    const numericId = /^\d+$/.test(String(item.id)) ? Number(item.id) : null
    const slug = LEGACY_ID_TO_SLUG[item.id] || item.slug
    const product = numericId
      ? found.find(p => Number(p.id) === numericId)
      : found.find(p => p.slug === slug)
    if (!product) return { error: `Unknown product: ${String(item.name || item.id).slice(0, 60)}` }
    if (product.in_stock === false) return { error: `${product.name} is out of stock.`, status: 409 }
    item.id = product.id
    item.name = product.name
    item.price = Number(product.price)
  }
  return { catalogItems }
}

/** Keeps only the fields checkout uses, so arbitrary client fields never reach the DB/Stripe. */
export function sanitizeItem(i) {
  const s = v => (v == null ? null : String(v).slice(0, 40))
  const out = { id: i.id, name: s(i.name), qty: i.qty, color: s(i.color), size: s(i.size), slug: s(i.slug), image_url: i.image_url ? String(i.image_url).slice(0, 500) : null }
  if (isDropItem(i)) { out.drop = s(i.drop); out.style = s(i.style) }
  return out
}
