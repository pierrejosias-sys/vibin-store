'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '../lib/cart-context'
import { shippingFor, FREE_SHIPPING_THRESHOLD, freeShippingSubtotal, isPodLine } from '../lib/shipping'
import { cartSeparatePackageNote, podReturnTermsHref, POD_CART_TERMS_LINE, POD_CART_TERMS_LINK_TEXT, POD_FREE_SHIPPING_EXCLUSION_COPY } from '../lib/pod.mjs'
import { canOptimizeImage } from '../lib/product-image'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import { isDrop01NumberedLine } from '../lib/drop-catalog.mjs'
import { drop01CartNote } from '../lib/drop-public.mjs'

// Cart photo with a fallback tile. Carts live in the shopper's browser, so the image address could be
// anything: only a real string is rendered, and a photo that fails to load falls back to the initials.
function CartThumb({ src, name }) {
  const [failed, setFailed] = useState(false)
  const initials = String(name || 'V').substring(0, 2).toUpperCase()
  if (typeof src !== 'string' || !src || failed) return <div className="cart-item-initials">{initials}</div>
  return <Image src={src} alt={name || ''} fill sizes="100px" quality={60} unoptimized={!canOptimizeImage(src)} onError={() => setFailed(true)} style={{ objectFit: 'cover' }} />
}

export default function CartPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [ambassadorCode, setAmbassadorCode] = useState(null)
  const { updateCart } = useCart()
  const initialized = useRef(false)

  useEffect(() => {
    // Read ambassador code from URL ?ref= param and persist it
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) {
      localStorage.setItem('vibin_ref', ref)
      setAmbassadorCode(ref)
    } else {
      const saved = localStorage.getItem('vibin_ref')
      if (saved) setAmbassadorCode(saved)
    }

    try {
      const saved = localStorage.getItem('vibin_cart')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (
          Array.isArray(parsed) &&
          parsed.every(
            (item) =>
              item &&
              typeof item === 'object' &&
              typeof item.id !== 'undefined' &&
              typeof item.name === 'string' &&
              typeof item.price === 'number' &&
              typeof item.qty === 'number' &&
              item.qty > 0
          )
        ) {
          setItems(parsed)
        } else {
          localStorage.removeItem('vibin_cart')
        }
      }
    } catch {
      localStorage.removeItem('vibin_cart')
    }
    setLoading(false)
    setTimeout(() => { initialized.current = true }, 0)
  }, [])

  useEffect(() => {
    if (!initialized.current) return
    localStorage.setItem('vibin_cart', JSON.stringify(items))
    updateCart()
  }, [items])

  function updateQty(id, color, size, change) {
    setItems(prev => {
      return prev.reduce((acc, item) => {
        if (item.id === id && item.color === color && item.size === size) {
          const newQty = item.qty + change
          if (newQty <= 0) return acc
          return [...acc, { ...item, qty: newQty }]
        }
        return [...acc, item]
      }, [])
    })
  }

  function removeItem(id, color, size) {
    setItems(prev => prev.filter(item =>
      !(item.id === id && item.color === color && item.size === size)
    ))
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0)
  const shipping = shippingFor(subtotal, items)
  const total = subtotal + shipping
  const separatePackageNote = cartSeparatePackageNote(items)
  // Made-to-order lines never count toward free shipping (same rule as shippingFor in lib/shipping.js).
  const freeShipBase = freeShippingSubtotal(items)
  const hasInHouse = items.some(i => !isPodLine(i))

  return (
    <>
      <SiteHeader />

      <div className="cart-page">
        <h1 className="cart-title">Your Bag
          {items.length > 0 && (
            <span style={{fontSize:'1rem',fontWeight:'400',color:'#888',marginLeft:'0.75rem'}}>
              ({items.length} {items.length === 1 ? 'item' : 'items'})
            </span>
          )}
        </h1>

        {ambassadorCode && (
          <div style={{background:'#f0faf9',border:'1px solid #01696f',borderRadius:'8px',padding:'10px 14px',marginBottom:'16px',fontSize:'0.78rem',color:'#01696f',textAlign:'center'}}>
            🎉 Ambassador code <strong>{ambassadorCode}</strong> applied!
          </div>
        )}

        {loading ? (
          // The page frame is already on screen; this only holds the space until the bag is read.
          <div className="cart-skel" aria-hidden="true" />
        ) : items.length === 0 ? (
          <div className="cart-empty">
            <div style={{fontSize:'2.5rem',marginBottom:'1rem'}}>🛒</div>
            <p>Your bag is empty.</p>
            <Link href="/shop" style={{color:'var(--coral)',marginTop:'1rem',display:'inline-block',fontWeight:'600'}}>
              Continue Shopping →
            </Link>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map(item => (
                <div key={`${item.id}-${item.color}-${item.size}`} className="cart-item">

                  <div className="cart-item-img">
                    <CartThumb src={item.image_url} name={item.name} />
                  </div>

                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.name}</div>
                    <div className="cart-item-variant">{[item.color, item.size].filter(Boolean).join(' · ')}</div>
                    {isDrop01NumberedLine(item) && <div className="cart-item-variant" style={{ marginTop: 4 }}>{drop01CartNote()}</div>}
                    {isPodLine(item) && <div className="cart-item-variant cart-pod-terms" style={{ marginTop: 4 }}>{POD_CART_TERMS_LINE} <Link href={podReturnTermsHref(item)}>{POD_CART_TERMS_LINK_TEXT}</Link></div>}
                    <button
                      onClick={() => removeItem(item.id, item.color, item.size)}
                      style={{background:'none',border:'none',color:'#888',fontSize:'0.72rem',padding:'0',marginTop:'6px',cursor:'pointer',textDecoration:'underline',fontFamily:'inherit'}}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="cart-item-qty">
                    <button onClick={() => updateQty(item.id, item.color, item.size, -1)}>−</button>
                    <span>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.color, item.size, 1)}>+</button>
                  </div>

                  <div className="cart-item-price">${(item.price * item.qty).toFixed(2)}</div>

                </div>
              ))}
            </div>

            <div className="cart-summary">
              {hasInHouse && freeShipBase < FREE_SHIPPING_THRESHOLD && (
                <div style={{background:'#f5f0eb',borderRadius:'8px',padding:'10px 14px',marginBottom:'16px',fontSize:'0.78rem',color:'#555',textAlign:'center'}}>
                  Add <strong>${(FREE_SHIPPING_THRESHOLD - freeShipBase).toFixed(2)}</strong> more for free shipping 🚚
                </div>
              )}
              <div className="cart-row">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="cart-row">
                <span>Shipping</span>
                <span style={shipping === 0 ? {color:'#01696f',fontWeight:'600'} : {}}>
                  {shipping === 0 ? 'FREE ✓' : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              {items.some(isPodLine) && (
                <div className="cart-note-pod-freeship" style={{fontSize:'0.78rem',color:'#555',margin:'4px 0 8px'}}>{POD_FREE_SHIPPING_EXCLUSION_COPY}</div>
              )}
              {separatePackageNote && (
                <div className="cart-note-separate" style={{fontSize:'0.78rem',color:'#555',margin:'4px 0 8px'}}>{separatePackageNote}</div>
              )}
              <div className="cart-row cart-total">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <Link href="/checkout" className="btn-checkout">Checkout →</Link>
              <Link href="/shop" style={{display:'block',textAlign:'center',marginTop:'12px',fontSize:'0.8rem',color:'#888',textDecoration:'none'}}>
                ← Continue Shopping
              </Link>
            </div>
          </>
        )}
      </div>

      <SiteFooter />
    </>
  )
}
