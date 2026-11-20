import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import ShopClient from './ShopClient'
import { getProducts, getPodFields } from '../lib/catalog'
import { normalizeFilter } from '../lib/shop-filters.mjs'
import { orderForDisplay } from '../lib/home-helpers.mjs'
import { FREE_SHIPPING_LABEL } from '../lib/shipping'
import { comingSoonTiles } from '../lib/coming-soon.mjs'
import { COMING_SOON_SPECS } from '../lib/coming-soon-specs'

export const metadata = {
  title: 'Shop',
  description: `Shop the Vibin Apparel SS26 collection. Tees, hoodies, accessories and more. Free shipping on orders over ${FREE_SHIPPING_LABEL}.`,
  alternates: { canonical: '/shop' },
}

// Products are read on the server, so the grid, the category chips and the piece count are all in
// the first HTML (no "Loading..." or "0 pieces" flash). Reading ?cat= (or ?category=) makes this render per request.
export default async function ShopPage({ searchParams }) {
  const params = await searchParams
  let products = []
  let loadError = false
  try {
    const [all, pod] = await Promise.all([getProducts(), getPodFields()])
    // Made-to-order pieces are listed at /shop/made-to-order only.
    products = all.filter(p => !pod.has(Number(p.id)))
  } catch (err) {
    console.error('shop: could not load products:', err.message)
    loadError = true
  }
  return (
    <>
      <SiteHeader dark />
      <ShopClient products={orderForDisplay(products)} initialFilter={normalizeFilter(params?.cat ?? params?.category)} loadError={loadError} comingSoon={comingSoonTiles(COMING_SOON_SPECS)} />
      <SiteFooter />
    </>
  )
}
