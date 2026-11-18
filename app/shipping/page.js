import { buildMeta } from '../lib/seo'
import { FREE_SHIPPING_LABEL } from '../lib/shipping'

export const metadata = buildMeta({
  title: 'Shipping Info — Vibin Apparel',
  description: `Vibin Apparel ships to the US only. Orders process in 1–2 business days and standard delivery takes 5–8 business days. Free shipping on orders over ${FREE_SHIPPING_LABEL}.`,
  path: '/shipping'
})

export { default } from './ShippingClient'
