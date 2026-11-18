'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '../../lib/cart-context'
import { FREE_SHIPPING_LABEL } from '../../lib/shipping'
import { productImage, galleryImages, canOptimizeImage } from '../../lib/product-image'
import { colorwaysFor, defaultColor } from '../../lib/colors.mjs'
import { productSubtitle } from '../../lib/shop-filters.mjs'
import { dropPhase, formatET } from '../../lib/drop-window.mjs'
import BackInStockSignup from '../../components/BackInStockSignup'

const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

// One line about the pre-order window, for products sold as part of a drop.
function dropLine(drop, phase) {
  if (phase === 'open') return `${drop.shortName} pre-order is open${drop.closesAt ? ` · closes ${formatET(drop.closesAt)}` : ''}${drop.shipsBy ? ` · Ships by ${drop.shipsBy}` : ''}`
  if (phase === 'closed') return `${drop.shortName} pre-order is closed`
  return `${drop.shortName} pre-order · opens ${formatET(drop.opensAt)}${drop.shipsBy ? ` · Ships by ${drop.shipsBy}` : ''}`
}

/**
 * sizes: the size run for drop-catalog items (same list checkout enforces), null for everything else.
 * drop: pre-order window for drop-catalog items, null otherwise. serverNow keeps the first render
 * identical on server and client; the real clock takes over after mount.
 */
export default function ProductClient({ product, sizes: runSizes = null, drop = null, serverNow }) {
  const { updateCart } = useCart()
  const colorways = colorwaysFor(product)
  const sizes = runSizes && runSizes.length ? runSizes : DEFAULT_SIZES
  const photos = galleryImages(product)
  const hasHero = Array.isArray(product.images) && product.images.some(i => i && i.kind === 'hero' && i.url)
  const soldOut = product.in_stock === false

  const [color, setColor] = useState(defaultColor(colorways))
  const [size, setSize] = useState(sizes.includes('M') ? 'M' : sizes[0])
  const [qty, setQty] = useState(1)
  const [photo, setPhoto] = useState(0)
  const [added, setAdded] = useState(false)
  const [now, setNow] = useState(serverNow)

  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])

  function addToCart() {
    let cart = []
    try {
      const saved = JSON.parse(localStorage.getItem('vibin_cart') || '[]')
      if (Array.isArray(saved)) cart = saved
    } catch {}
    const existing = cart.find(i => i && i.id === product.id && i.color === color && i.size === size)
    if (existing) {
      existing.qty = Math.min(20, (Number(existing.qty) || 0) + qty)
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        color,
        size,
        qty,
        slug: product.slug,
        image_url: productImage(product) || null,
        ...(drop ? { preorder: drop.id } : {}),
      })
    }
    try {
      localStorage.setItem('vibin_cart', JSON.stringify(cart))
    } catch {
      return
    }
    // Same-tab signal: the header's bag count updates right away.
    window.dispatchEvent(new Event('vibin-cart'))
    updateCart()
    setAdded(true)
    setTimeout(() => setAdded(false), 2400)
  }

  const price = Number(product.price)
  const onSale = Number(product.compare_price) > price
  const isNew = Array.isArray(product.tags) && product.tags.includes('new')
  const mainPhoto = photos[photo] || null

  return (
    <>
      <div className="breadcrumb">
        <Link href="/">Home</Link> / <Link href="/shop">Shop</Link> / <span className="current">{product.name}</span>
      </div>

      <div className="pdp">
        <div className="pdp-gal">
          <div className="pdp-main" style={{ aspectRatio: hasHero ? '3 / 4' : '1 / 1' }}>
            {mainPhoto ? (
              <Image
                src={mainPhoto}
                alt={product.name}
                fill
                priority
                quality={75}
                sizes="(max-width: 1000px) 100vw, 640px"
                unoptimized={!canOptimizeImage(mainPhoto)}
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <div className="pdp-fallback">
                <div className="pdp-fallback-brand">Vibin Apparel</div>
                <div className="pdp-fallback-name">{product.name}</div>
                {color ? <div className="pdp-fallback-color">{color}</div> : null}
              </div>
            )}
            {isNew && <div className="pdp-badge">New</div>}
          </div>

          {photos.length > 1 && (
            <div className="pdp-thumbs">
              {photos.map((src, i) => (
                <button key={src} type="button" className={`pdp-thumb${photo === i ? ' on' : ''}`} aria-label={`Photo ${i + 1}`} aria-pressed={photo === i} onClick={() => setPhoto(i)}>
                  <Image src={src} alt="" fill sizes="64px" quality={60} unoptimized={!canOptimizeImage(src)} style={{ objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="details">
          <div className="details-eye">★ Vibin Apparel · {productSubtitle(product)}</div>
          <h1 className="details-title">
            {product.name}
            {color ? <><br /><em>{color}.</em></> : null}
          </h1>

          {drop && <p className="pdp-drop">{dropLine(drop, dropPhase(drop.opensAt, drop.closesAt, now))}</p>}

          <div className="price-row">
            <span className="current">${price.toFixed(2)}</span>
            {onSale && (
              <>
                <span className="original">${Number(product.compare_price).toFixed(2)}</span>
                <span className="save">{Math.round((1 - price / Number(product.compare_price)) * 100)}% off</span>
              </>
            )}
          </div>

          {product.description ? <p className="details-desc">{product.description}</p> : null}

          {colorways.length > 0 && (
            <div className="option-section">
              <div className="option-label">
                <span>Color · <span className="selected">{color}</span></span>
              </div>
              <div className="color-row">
                {colorways.map(cw => (
                  <button
                    key={cw.color}
                    type="button"
                    className={`color${color === cw.color ? ' on' : ''}`}
                    style={{ background: cw.hex }}
                    title={cw.color}
                    aria-label={cw.color}
                    aria-pressed={color === cw.color}
                    onClick={() => setColor(cw.color)}
                  />
                ))}
              </div>
            </div>
          )}

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
            <button type="button" className="btn-atc" onClick={addToCart} disabled={soldOut}>
              {soldOut ? 'Sold out' : added ? '✓ Added to Bag' : `Add to Bag · $${(price * qty).toFixed(2)}`}
            </button>
          </div>
          {added && <Link href="/cart" className="pdp-viewbag">View bag →</Link>}
          <BackInStockSignup product={product} size={size} color={color} />

          <div className="perks-strip">
            <div className="perk">
              <div className="perk-icon">🚚</div>
              <div className="perk-name">Free Shipping</div>
              <div className="perk-desc">Orders {FREE_SHIPPING_LABEL}+</div>
            </div>
            <div className="perk">
              <div className="perk-icon">↻</div>
              <div className="perk-name">Easy Returns</div>
              <div className="perk-desc">30-day window</div>
            </div>
            <div className="perk">
              <div className="perk-icon">✦</div>
              <div className="perk-name">Quality Promise</div>
              <div className="perk-desc">Built to last</div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
