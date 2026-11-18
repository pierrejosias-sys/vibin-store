import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import ShopClient from './ShopClient'
import { getProducts } from '../lib/catalog'
import { normalizeFilter } from '../lib/shop-filters.mjs'
import { FREE_SHIPPING_LABEL } from '../lib/shipping'

export const metadata = {
  title: 'Shop',
  description: `Shop the Vibin Apparel SS26 collection. Tees, hoodies, accessories and more. Free shipping on orders over ${FREE_SHIPPING_LABEL}.`,
  alternates: { canonical: '/shop' },
}

// Products are read on the server, so the grid, the category chips and the piece count are all in
// the first HTML (no "Loading..." or "0 pieces" flash). Reading ?cat= makes this render per request.
export default async function ShopPage({ searchParams }) {
  const params = await searchParams
  let products = []
  let loadError = false
  try {
    products = await getProducts()
  } catch (err) {
    console.error('shop: could not load products:', err.message)
    loadError = true
  }
  return (
    <>
      <SiteHeader dark />
      <ShopClient products={products} initialFilter={normalizeFilter(params?.cat)} loadError={loadError} />
      <SiteFooter />
    </>
  )
}
