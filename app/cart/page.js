import { buildMeta } from '../lib/seo'

export const metadata = buildMeta({
  title: 'Your Cart — Vibin Apparel',
  description: 'Review your Vibin Apparel SS26 order. Heavyweight cotton tees, hoodies, and accessories from Jacksonville streetwear Drop 01: The Foundation.',
  path: '/cart',
  noIndex: true
})

export { default } from './CartClient'
