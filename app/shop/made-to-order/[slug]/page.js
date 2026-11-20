import { notFound } from 'next/navigation'
import SiteHeader from '../../../components/SiteHeader'
import SiteFooter from '../../../components/SiteFooter'
import PodProductClient from './PodProductClient'
import { getProduct, getPodFields } from '../../../lib/catalog'
import { withExtras } from '../../../lib/product-extras.mjs'
import { productKind } from '../../../lib/shop-filters.mjs'
import { isPodProduct, podShipTimeLine, POD_COLLECTION_PATH, POD_LINE_COPY, POD_SALES_LIVE } from '../../../lib/pod.mjs'

// One made-to-order product. Only POD rows render here; everything else is a 404.
export const revalidate = 60

export function generateStaticParams() {
  return []
}

async function load(slug) {
  const stored = await getProduct(slug)
  if (!stored) return null
  const pod = (await getPodFields()).get(Number(stored.id))
  const product = withExtras({ ...stored, ...(pod || {}) })
  return isPodProduct(product) ? product : null
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const product = await load(slug)
  if (!product) return { title: 'Product not found', robots: { index: false, follow: false } }
  return {
    title: product.name,
    description: `${product.name}. ${POD_LINE_COPY}`.slice(0, 160),
    alternates: { canonical: `${POD_COLLECTION_PATH}/${product.slug}` },
  }
}

export default async function PodProductPage({ params }) {
  const { slug } = await params
  const product = await load(slug)
  if (!product) notFound()
  const sizes = productKind(product) === 'accessories' ? ['OS'] : ['S', 'M', 'L', 'XL', '2X', '3X']
  const shipLine = podShipTimeLine(product)
  // Orderable only when POD sales are switched on AND the page states a ship time (16 CFR 435).
  const orderable = POD_SALES_LIVE && !!shipLine
  return (
    <>
      <SiteHeader />
      <PodProductClient product={product} sizes={sizes} shipLine={shipLine} orderable={orderable} />
      <SiteFooter />
    </>
  )
}
