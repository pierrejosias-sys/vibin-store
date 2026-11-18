import { notFound, redirect } from 'next/navigation'
import SiteHeader from '../../components/SiteHeader'
import SiteFooter from '../../components/SiteFooter'
import ProductClient from './ProductClient'
import { getProduct, getDropWindow } from '../../lib/catalog'
import { dropCatalogEntry } from '../../lib/drop-catalog.mjs'
import { serverNow } from '../../lib/drop-window.mjs'
import { productImage } from '../../lib/product-image'
import { productKind } from '../../lib/shop-filters.mjs'
import { withExtras } from '../../lib/product-extras.mjs'

// Product pages are cached for a minute at the edge and rebuilt in the background, so a shopper gets
// the page immediately (no "Loading..." step) and an admin edit shows up within about a minute.
export const revalidate = 60

// No pages are built ahead of time; each one is generated on its first visit and then cached.
export function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const stored = await getProduct(slug)
  const product = stored ? withExtras(stored) : null
  if (!product) return { title: 'Product not found', robots: { index: false, follow: false } }
  const path = `/product/${product.slug || product.id}`
  const description = (product.description || `${product.name} from Vibin Apparel, Jacksonville streetwear. Free shipping on orders over $125.`).slice(0, 160)
  const image = productImage(product, 'hero') || '/og-default.jpg'
  return {
    title: product.name,
    description,
    alternates: { canonical: path },
    openGraph: { type: 'website', url: path, siteName: 'Vibin Apparel', title: product.name, description, images: [{ url: image, alt: product.name }] },
    twitter: { card: 'summary_large_image', title: product.name, description, images: [image] },
  }
}

export default async function ProductPage({ params }) {
  const { slug } = await params
  const stored = await getProduct(slug)
  if (!stored) notFound()
  const product = withExtras(stored)
  // Old links and the sitemap used the numeric id; send them to the slug address.
  if (/^\d+$/.test(slug) && product.slug) redirect(`/product/${product.slug}`)

  // Drop 01 pieces (Foundation Tee, Snapback) use the size run and pre-order flag that checkout enforces.
  const hit = dropCatalogEntry({ id: product.id, slug: product.slug })
  const windowInfo = hit ? await getDropWindow(hit.dropId) : null
  const drop = windowInfo ? { ...windowInfo, shortName: windowInfo.name.split(':')[0] } : null
  // Everything else is locked until the store opens with Drop 01's public open.
  const storeWindow = hit ? null : await getDropWindow('d01')
  const opensAt = storeWindow?.opensAt || null
  // Hats, bags and lanyards are one size; everything else uses the standard run.
  const sizes = hit ? hit.entry.sizes : productKind(product) === 'accessories' ? ['OS'] : null

  return (
    <>
      <SiteHeader />
      <ProductClient product={product} sizes={sizes} drop={drop} storeOpensAt={opensAt} serverNow={serverNow()} />
      <SiteFooter />
    </>
  )
}
