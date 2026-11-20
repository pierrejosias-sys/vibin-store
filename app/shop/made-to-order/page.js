import Link from 'next/link'
import SiteHeader from '../../components/SiteHeader'
import SiteFooter from '../../components/SiteFooter'
import { getProducts, getPodFields, withPodFields } from '../../lib/catalog'
import { productImage } from '../../lib/product-image'
import { isPublishedPod, podShipTimeLine, POD_COLLECTION_PATH, POD_COLLECTION_TITLE, POD_LINE_COPY } from '../../lib/pod.mjs'

// Made-to-order collection (Printful print-on-demand). Its own URL, separate from the drop pages.
// Copy rules (Legal, Nov 20): no scarcity or urgency words here; tests/pod-unnumbered.test.mjs scans this file.
export const revalidate = 60

export const metadata = {
  title: POD_COLLECTION_TITLE,
  description: `${POD_LINE_COPY} Printed for you when you order.`,
  alternates: { canonical: POD_COLLECTION_PATH },
}

export default async function MadeToOrderPage() {
  let items = []
  let loadError = false
  try {
    const [all, pod] = await Promise.all([getProducts(), getPodFields()])
    items = withPodFields(all, pod).filter(isPublishedPod)
  } catch (err) {
    console.error('made-to-order: could not load products:', err.message)
    loadError = true
  }
  return (
    <>
      <SiteHeader dark />
      <main className="shop-wrap" style={{ padding: '48px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div className="breadcrumb">
          <Link href="/">Home</Link> / <Link href="/shop">Shop</Link> / <span className="current">{POD_COLLECTION_TITLE}</span>
        </div>
        <h1 className="details-title">{POD_COLLECTION_TITLE}</h1>
        <p className="details-desc">{POD_LINE_COPY}</p>
        {loadError ? (
          <p className="details-desc">We couldn&apos;t load this collection. Please try again in a minute.</p>
        ) : items.length === 0 ? (
          <p className="details-desc">New made-to-order pieces are on the way.</p>
        ) : (
          <div className="pod-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24, marginTop: 24 }}>
            {items.map(p => {
              const img = productImage(p)
              const ship = podShipTimeLine(p)
              return (
                <Link key={p.id} href={`${POD_COLLECTION_PATH}/${p.slug}`} className="pod-card" style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}>
                  <div style={{ aspectRatio: '1 / 1', background: '#111', overflow: 'hidden' }}>
                    {img ? <img src={img} alt={p.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                  </div>
                  <div style={{ marginTop: 10, fontWeight: 600 }}>{p.name}</div>
                  <div>${Number(p.price).toFixed(2)}</div>
                  {ship ? <div style={{ fontSize: 13, opacity: 0.75 }}>{ship}</div> : null}
                </Link>
              )
            })}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  )
}
