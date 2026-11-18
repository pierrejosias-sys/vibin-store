'use client'

import { useState } from 'react'
import Link from 'next/link'
import ProductThumb from '../components/ProductThumb'
import { productImage } from '../lib/product-image'
import { coverImage } from '../lib/product-extras.mjs'
import ComingSoonSignup from '../components/ComingSoonSignup'
import { colorSummary } from '../lib/coming-soon.mjs'
import { filterProducts, visibleFilters, productSubtitle, formatPrice } from '../lib/shop-filters.mjs'

/**
 * Shop grid + category chips. The products arrive already loaded from the server, so there is no
 * loading state: the tiles, the chip counts and the "N pieces" label are in the first paint.
 */
export default function ShopClient({ products, initialFilter = 'all', loadError = false, comingSoon = [] }) {
  const [active, setActive] = useState(initialFilter)
  const chips = visibleFilters(products)
  const shown = filterProducts(products, active)

  function choose(key) {
    setActive(key)
    // Keep the address in step with the chip so a refresh or a shared link lands on the same view.
    try { window.history.replaceState(null, '', key === 'all' ? '/shop' : `/shop?cat=${key}`) } catch {}
  }

  return (
    <main className="sp">
      <div className="sp-head">
        <div className="sp-eye">SS26 · Drop 01</div>
        <h1 className="sp-title">The Foundation</h1>
      </div>

      {!loadError && products.length > 0 && (
        <div className="sp-bar">
          <div className="sp-chips" role="group" aria-label="Filter by category">
            {chips.map(c => (
              <button key={c.key} type="button" className={`sp-chip${active === c.key ? ' on' : ''}`} aria-pressed={active === c.key} onClick={() => choose(c.key)}>
                {c.label}<span>{c.count}</span>
              </button>
            ))}
          </div>
          <div className="sp-count" aria-live="polite">{shown.length} {shown.length === 1 ? 'piece' : 'pieces'}</div>
        </div>
      )}

      <div className="sp-grid">
        {loadError ? (
          <div className="sp-empty">
            <p>We couldn&apos;t load the shop just now.</p>
            <p><Link href="/shop" className="sp-link">Try again</Link></p>
          </div>
        ) : products.length === 0 ? (
          <div className="sp-empty">
            <p>New pieces are on the way.</p>
            <p><Link href="/drop/01" className="sp-link">See Drop 01</Link></p>
          </div>
        ) : shown.length === 0 ? (
          <div className="sp-empty">
            <p>No pieces in this category yet.</p>
            <p><button type="button" className="sp-link" onClick={() => choose('all')}>View all pieces</button></p>
          </div>
        ) : (
          shown.map((p, i) => {
            const soldOut = p.in_stock === false
            const isNew = Array.isArray(p.tags) && p.tags.includes('new')
            const onSale = Number(p.compare_price) > Number(p.price)
            // No photo in the table: use the product's own gallery image (e.g. the lanyard mockup).
            const stored = productImage(p)
            const cover = stored ? null : coverImage(p)
            return (
              <Link key={p.id} href={`/product/${p.slug || p.id}`} prefetch={false} className={`sp-card${soldOut ? ' is-sold' : ''}`}>
                <div className="pt sp-photo">
                  <ProductThumb src={stored || cover?.src || null} fit={cover?.fit} background={cover?.background} name={p.name} alt="" sizes="(max-width: 700px) 50vw, (max-width: 1100px) 33vw, 25vw" priority={i < 2} />
                  {soldOut ? <span className="sp-tag sp-tag--out">Sold out</span> : isNew ? <span className="sp-tag">New</span> : null}
                </div>
                <div className="sp-meta">
                  <div className="sp-name">{p.name}</div>
                  <div className="sp-price">{onSale && <s>{formatPrice(p.compare_price)}</s>}{formatPrice(p.price)}</div>
                  <div className="sp-sub">{productSubtitle(p)}</div>
                </div>
              </Link>
            )
          })
        )}
      </div>

      {comingSoon.length > 0 && (
        <section className="sp-soon" aria-labelledby="sp-soon-title">
          <div className="sp-head">
            <div className="sp-eye">Coming soon</div>
            <h2 id="sp-soon-title" className="sp-title">Totes &amp; Keychains</h2>
          </div>
          <div className="sp-grid">
            {comingSoon.map(p => (
              <div key={p.slug} className="sp-card sp-card--soon">
                <div className="pt sp-photo">
                  <ProductThumb src={null} name={p.name} />
                  <span className="sp-tag">Coming soon</span>
                </div>
                <div className="sp-meta">
                  <div className="sp-name">{p.name}</div>
                  <div className="sp-price">{p.priceLabel}</div>
                  {colorSummary(p.colors) ? <div className="sp-sub">{colorSummary(p.colors)}</div> : null}
                  <p className="sp-desc">{p.description}</p>
                </div>
                <ComingSoonSignup slug={p.slug} name={p.name} />
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
