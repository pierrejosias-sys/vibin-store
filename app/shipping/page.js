import { buildMeta } from '../lib/seo'
import { FREE_SHIPPING_LABEL } from '../lib/shipping'

export const metadata = buildMeta({
  title: 'Shipping Info — Vibin Apparel',
  description: `Vibin Apparel ships to the US only. Each product page shows when that item ships. Free shipping on orders over ${FREE_SHIPPING_LABEL}.`,
  path: '/shipping'
})

export { default } from './ShippingClient'
