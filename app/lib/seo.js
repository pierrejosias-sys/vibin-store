import { FREE_SHIPPING_LABEL } from './shipping'
/**
 * Vibin Apparel — Shared SEO utility
 * Usage: import { buildMeta } from '../lib/seo'
 * export const metadata = buildMeta({ title, description, path, image })
 */

const BASE_URL = 'https://vibinapparel.com'
const DEFAULT_IMAGE = '/og-default.jpg'

// The root layout's title template appends " — Vibin Apparel" to every page <title>, so a page title must
// not carry the brand itself (it showed twice). Social previews (og/twitter) are not templated, so they keep it.
const stripBrand = t => String(t || '').replace(/\s*(?:—|\||-)\s*Vibin Apparel\s*$/i, '').trim()

export function buildMeta({ title, description, path = '/', image = DEFAULT_IMAGE, type = 'website', noIndex = false } = {}) {
  const url = `${BASE_URL}${path}`
  const plain = stripBrand(title)
  const branded = plain ? `${plain} — Vibin Apparel` : 'Vibin Apparel'
  return {
    title: plain || undefined,
    description,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
    openGraph: {
      type,
      url,
      siteName: 'Vibin Apparel',
      title: branded,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: branded }]
    },
    twitter: {
      card: 'summary_large_image',
      site: '@vibinapparel',
      title: branded,
      description,
      images: [image]
    }
  }
}

export function buildProductMeta({ name, description, color, category, image, slug }) {
  const title = `${name} — Vibin Apparel`
  const desc = description ||
    `Shop the ${name} from Vibin Apparel's SS26 Drop 01. ${color ? color + ' colorway. ' : ''}${category ? category + '. ' : ''}Heavyweight cotton. USA streetwear. Free shipping ${FREE_SHIPPING_LABEL}+.`
  return buildMeta({
    title,
    description: desc.slice(0, 160),
    path: `/product/${slug}`,
    image: image || '/og-default.jpg',
    type: 'product'
  })
}
