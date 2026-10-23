import { buildMeta } from '../lib/seo'
import { FREE_SHIPPING_LABEL } from '../lib/shipping'

export const metadata = buildMeta({
  title: 'Shipping Info — Vibin Apparel',
  description: `Vibin Apparel ships all SS26 orders within 1–3 business days. Free shipping on orders over ${FREE_SHIPPING_LABEL}. Standard US shipping. Jacksonville streetwear worldwide.`,
  path: '/shipping'
})

export { default } from './ShippingClient'
