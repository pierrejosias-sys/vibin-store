// Server-side product reads for /shop and /product/[slug].
// Uses the public anon key (products are public; RLS still applies) and only asks for the columns
// the pages need, so the HTML stays small.
import { cache } from 'react'
import { createClient } from '@supabase/supabase-js'
import { DROPS } from './drops'

const TILE_COLUMNS = 'id,name,slug,price,compare_price,category,color,tags,image_url,images,in_stock'
const PAGE_COLUMNS = `${TILE_COLUMNS},description,stock_qty`

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Missing Supabase environment variables')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

/** All products, newest first. Throws if the database cannot be reached. */
export async function getProducts() {
  const { data, error } = await client().from('products').select(TILE_COLUMNS).order('created_at', { ascending: false })
  if (error) throw new Error(`products: ${error.message}`)
  return data || []
}

/**
 * One product by slug, or by numeric id for old links. Returns null when there is no such product,
 * and throws when the database cannot be reached (so a hiccup is never shown as "not found").
 * Wrapped in cache() so generateMetadata and the page share one query per request.
 */
export const getProduct = cache(async (key) => {
  const isId = /^\d+$/.test(String(key))
  const query = client().from('products').select(PAGE_COLUMNS)
  const { data, error } = await (isId ? query.eq('id', Number(key)) : query.eq('slug', String(key))).maybeSingle()
  if (error) throw new Error(`product: ${error.message}`)
  return data || null
})

/**
 * Pre-order window for a drop: the drops table is the source of truth, the config in drops.js is the
 * fallback (same rule as getDropState). Never throws, so a product page still renders if this fails.
 */
export async function getDropWindow(dropId) {
  const base = DROPS[dropId]
  if (!base) return null
  const out = { id: dropId, name: base.name, opensAt: base.releaseAt, closesAt: base.closesAt, earlyAccessAt: base.earlyAccessAt || null, shipsBy: base.shipsBy }
  try {
    const { data } = await client().from('drops').select('name,release_at,closes_at').eq('id', dropId).maybeSingle()
    if (data) {
      out.name = data.name || out.name
      out.opensAt = data.release_at || out.opensAt
      out.closesAt = data.closes_at ?? out.closesAt
    }
  } catch {}
  return out
}

// Made-to-order (POD) columns live in a separate, fail-soft query: until migration
// 20261120200000_pod_unnumbered_products.sql is applied the columns don't exist, and /shop and product
// pages must keep working (every product is then treated as a regular, non-POD product).
const POD_COLUMNS = 'id,fulfillment,numbered,published,size_prices,ship_days,ships_separately,ship_first_rate,ship_addon_rate'

/** Map(productId -> { fulfillment, numbered, published, ship_days, ships_separately, ship_*_rate }) for POD rows; empty on any error. */
export async function getPodFields() {
  try {
    const { data, error } = await client().from('products').select(POD_COLUMNS).eq('fulfillment', 'printful_pod')
    if (error) return new Map()
    return new Map((data || []).map(r => [Number(r.id), r]))
  } catch {
    return new Map()
  }
}

/** Products with their POD fields merged in (non-POD rows are unchanged). */
export function withPodFields(products, podFields) {
  return (products || []).map(p => (podFields.has(Number(p.id)) ? { ...p, ...podFields.get(Number(p.id)) } : p))
}
