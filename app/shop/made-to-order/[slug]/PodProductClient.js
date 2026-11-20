'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '../../../lib/cart-context'
import { productImage } from '../../../lib/product-image'
import {
  podPriceFor, POD_COLLECTION_PATH, POD_COLLECTION_TITLE, POD_LINE_COPY, POD_SEPARATE_PACKAGE_COPY,
  POD_RETURN_TERMS_TITLE, POD_RETURN_TERMS, POD_RETURN_TERMS_ANCHOR, POD_FREE_SHIPPING_EXCLUSION_COPY,
} from '../../../lib/pod.mjs'

// Made-to-order product page. Copy rules (Legal, Nov 20): no scarcity, urgency or stock wording, no timers.
// tests/pod-unnumbered.test.mjs scans this file for the banned words.
export default function PodProductClient({ product, sizes, shipLine, orderable }) {
  const { updateCart } = useCart()
  const [size, setSize] = useState(sizes.includes('M') ? 'M' : sizes[0])
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const price = podPriceFor(product, size) ?? Number(product.price)
  const img = productImage(product)

  function addToCart() {
    if (!orderable) return
    let cart = []
    try {
      const saved = JSON.parse(localStorage.getItem('vibin_cart') || '[]')
      if (Array.isArray(saved)) cart = saved
    } catch {}
    const existing = cart.find(i => i && i.id === product.id && i.size === size)
    if (existing) existing.qty = Math.min(20, (Number(existing.qty) || 0) + qty)
    else cart.push({ id: product.id, name: product.name, price, color: product.color || null, size, qty, slug: product.slug, image_url: img || null, pod: true, shipsSeparately: product.ships_separately === true, shipFirst: product.ship_first_rate ?? null, shipAddon: product.ship_addon_rate ?? null })
    try { localStorage.setItem('vibin_cart', JSON.stringify(cart)) } catch { return }
    window.dispatchEvent(new Event('vibin-cart'))
    updateCart()
    setAdded(true)
    setTimeout(() => setAdded(false), 2400)
  }

  return (
    <>
      <div className="breadcrumb">
        <Link href="/">Home</Link> / <Link href={POD_COLLECTION_PATH}>{POD_COLLECTION_TITLE}</Link> / <span className="current">{product.name}</span>
      </div>
      <div className="pdp">
        <div className="pdp-gal">
          <div className="pdp-main" style={{ aspectRatio: '1 / 1' }}>
            {img ? (
              <img src={img} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div className="pdp-fallback">
                <div className="pdp-fallback-brand">Vibin Apparel</div>
                <div className="pdp-fallback-name">{product.name}</div>
              </div>
            )}
          </div>
        </div>
        <div className="details">
          <div className="details-eye">★ Vibin Apparel · {POD_COLLECTION_TITLE}</div>
          <h1 className="details-title">{product.name}</h1>
          <p className="pdp-pod-line">{POD_LINE_COPY}</p>
          {shipLine ? <p className="pdp-pod-ship">{shipLine}</p> : null}
          {product.ships_separately === true ? <p className="pdp-pod-package">{POD_SEPARATE_PACKAGE_COPY}</p> : null}
          <p className="pdp-pod-freeship">{POD_FREE_SHIPPING_EXCLUSION_COPY}</p>
          <div className="price-row"><span className="current">${price.toFixed(2)}</span></div>
          {product.description ? <p className="details-desc">{product.description}</p> : null}

          <div className="option-section">
            <div className="option-label">
              <span>Size · <span className="selected">{size}</span></span>
            </div>
            <div className="size-row">
              {sizes.map(s => (
                <button key={s} type="button" className={`size${size === s ? ' on' : ''}`} aria-pressed={size === s} onClick={() => setSize(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="atc-row">
            <div className="qty">
              <button type="button" aria-label="Decrease quantity" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <input type="text" value={qty} readOnly aria-label="Quantity" />
              <button type="button" aria-label="Increase quantity" onClick={() => setQty(q => Math.min(10, q + 1))}>+</button>
            </div>
            <button type="button" className="btn-atc" onClick={addToCart} disabled={!orderable}>
              {!orderable ? 'Not available to order yet' : added ? '✓ Added to Bag' : `Add to Bag · $${(price * qty).toFixed(2)}`}
            </button>
          </div>
          {added && <Link href="/cart" className="pdp-viewbag">View bag →</Link>}

          {/* Shown before purchase, next to Add to Bag (Legal: FTC Act §5, FDUTPA 501.204, Fla. Stat. 501.142). */}
          <section id={POD_RETURN_TERMS_ANCHOR} className="pdp-pod-returns" style={{ marginTop: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{POD_RETURN_TERMS_TITLE}</h2>
            {POD_RETURN_TERMS.map((p, i) => <p key={i} style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 8 }}>{p}</p>)}
          </section>
        </div>
      </div>
    </>
  )
}
