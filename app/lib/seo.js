/**
 * Vibin Apparel — Shared SEO utility
 * Usage: import { buildMeta } from '../lib/seo'
 * export const metadata = buildMeta({ title, description, path, image })
 */

const BASE_URL = 'https://vibinapparel.com'
const DEFAULT_IMAGE = '/og-default.jpg'

export function buildMeta({ title, description, path = '/', image = DEFAULT_IMAGE, type = 'website', noIndex = false } = {}) {
  const url = `${BASE_URL}${path}`
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
    openGraph: {
      type,
      url,
      siteName: 'Vibin Apparel',
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: title }]
    },
    twitter: {
      card: 'summary_large_image',
      site: '@vibinapparel',
      title,
      description,
      images: [image]
    }
  }
}

export function buildProductMeta({ name, description, color, category, image, slug }) {
  const title = `${name} — Vibin Apparel`
  const desc = description ||
    `Shop the ${name} from Vibin Apparel's SS26 Drop 01. ${color ? color + ' colorway. ' : ''}${category ? category + '. ' : ''}Heavyweight cotton. Jacksonville streetwear. Free shipping $75+.`
  return buildMeta({
    title,
    description: desc.slice(0, 160),
    path: `/product/${slug}`,
    image: image || '/og-default.jpg',
    type: 'product'
  })
}
