import { buildMeta } from '../lib/seo'

export const metadata = buildMeta({
  title: 'Checkout — Vibin Apparel',
  description: 'Complete your Vibin Apparel SS26 order securely. Free shipping on orders over $75.',
  path: '/checkout',
  noIndex: true
})

export { default } from './CheckoutClient'
