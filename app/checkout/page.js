import { buildMeta } from '../lib/seo'
import { FREE_SHIPPING_LABEL } from '../lib/shipping'

export const metadata = buildMeta({
  title: 'Checkout — Vibin Apparel',
  description: `Complete your Vibin Apparel SS26 order securely. Free shipping on orders over ${FREE_SHIPPING_LABEL}.`,
  path: '/checkout',
  noIndex: true
})

export { default } from './CheckoutClient'
