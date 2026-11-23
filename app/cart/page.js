import { buildMeta } from '../lib/seo'

export const metadata = buildMeta({
  title: 'Your Cart — Vibin Apparel',
  description: 'Review your Vibin Apparel SS26 order. Foundation Tee and Snapback pre-orders from Vibin Apparel Drop 01: The Foundation, plus the rest of the shop.',
  path: '/cart',
  noIndex: true
})

export { default } from './CartClient'
