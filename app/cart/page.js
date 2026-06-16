'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCart } from '../lib/cart-context'

export default function CartPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const { cartCount, updateCart } = useCart()

  useEffect(() => {
    const saved = localStorage.getItem('vibin_cart')
    if (saved) setItems(JSON.parse(saved))
    setLoading(false)
  }, [])

  useEffect(() => {
    localStorage.setItem('vibin_cart', JSON.stringify(items))
    updateCart()
  }, [items, updateCart])

  function updateQty(id, color, size, change) {
    setItems(items.map(item =>
      item.id === id && item.color === color && item.size === size
        ? { ...item, qty: Math.max(1, item.qty + change) }
        : item
    ))
  }

  function removeItem(id, color, size) {
    setItems(items.filter(item => !(item.id === id && item.color === color && item.size === size)))
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0)
  const shipping = subtotal >= 75 ? 0 : 10
  const total = subtotal + shipping

  if (loading) return (
    <div className="cart-page">
      <div className="cart-empty">Loading...</div>
    </div>
  )

  return (
    <>
      <div className="promo">
        <div className="promo-track">
          <span>Free shipping over $75</span><span>SS26 Drop is live</span><span>15% off your first order</span>
          <span>Free shipping over $75</span><span>SS26 Drop is live</span><span>15% off your first order</span>
        </div>
      </div>

      <nav>
        <Link href="/" className="logo">VIBIN</Link>
        <div className="nav-links">
          <Link href="/shop">Shop</Link>
          <Link href="/shop">New Drop</Link>
          <Link href="/lookbook">Lookbook</Link>
          <Link href="/about">About</Link>
        </div>
        <div className="nav-actions">
          <Link href="/login" className="nav-icon" style={{textDecoration:'none',color:'inherit'}}>👤</Link>
          <Link href="/cart" className="nav-icon" style={{textDecoration:'none',color:'inherit'}}>
            🛒{cartCount > 0 && <span className="cart-dot">{cartCount}</span>}
          </Link>
        </div>
      </nav>

      <div className="cart-page">
        <h1 className="cart-title">Your Bag
          {items.length > 0 && <span style={{fontSize:'1rem',fontWeight:'400',color:'#888',marginLeft:'0.75rem'}}>({items.length} {items.length === 1 ? 'item' : 'items'})</span>}
        </h1>

        {items.length === 0 ? (
          <div className="cart-empty">
            <div style={{fontSize:'2.5rem',marginBottom:'1rem'}}>🛒</div>
            <p>Your bag is empty.</p>
            <Link href="/shop" style={{color:'var(--coral)',marginTop:'1rem',display:'inline-block',fontWeight:'600'}}>Continue Shopping →</Link>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map(item => (
                <div key={`${item.id}-${item.color}-${item.size}`} className="cart-item">

                  {/* IMAGE OR INITIALS */}
                  <div className="cart-item-img" style={{overflow:'hidden',borderRadius:'8px',background:'#111'}}>
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        loading="lazy"
                        style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}
                      />
                    ) : (
                      <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:'700',fontSize:'0.9rem',letterSpacing:'0.05em'}}>
                        {item.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* INFO */}
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.name}</div>
                    <div className="cart-item-variant">{item.color} · {item.size}</div>
                    {/* Remove link */}
                    <button
                      onClick={() => removeItem(item.id, item.color, item.size)}
                      style={{background:'none',border:'none',color:'#888',fontSize:'0.72rem',padding:'0',marginTop:'6px',cursor:'pointer',textDecoration:'underline',fontFamily:'inherit'}}
                    >
                      Remove
                    </button>
                  </div>

                  {/* QTY */}
                  <div className="cart-item-qty">
                    <button onClick={() => updateQty(item.id, item.color, item.size, -1)}>−</button>
                    <span>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.color, item.size, 1)}>+</button>
                  </div>

                  {/* PRICE */}
                  <div className="cart-item-price">${(item.price * item.qty).toFixed(2)}</div>

                </div>
              ))}
            </div>

            <div className="cart-summary">
              {subtotal < 75 && (
                <div style={{background:'#f5f0eb',borderRadius:'8px',padding:'10px 14px',marginBottom:'16px',fontSize:'0.78rem',color:'#555',textAlign:'center'}}>
                  Add <strong>${(75 - subtotal).toFixed(2)}</strong> more for free shipping 🚚
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
              <div className="cart-row cart-total">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <Link href="/checkout" className="btn-checkout">Checkout →</Link>
              <Link href="/shop" style={{display:'block',textAlign:'center',marginTop:'12px',fontSize:'0.8rem',color:'#888',textDecoration:'none'}}>← Continue Shopping</Link>
            </div>
          </>
        )}
      </div>

      <footer>
        <div className="foot-top">Vibin <em>Different.</em></div>
        <div className="foot-cols">
          <div className="foot-brand">
            <div className="foot-logo">VIBIN</div>
            <div className="foot-tagline">A lifestyle streetwear brand from Jacksonville, FL. A subsidiary of HVD Holdings.</div>
          </div>
          <div className="foot-col">
            <h4>Help</h4>
            <ul>
              <li><a href="/shipping">Shipping</a></li>
              <li><a href="/returns">Returns</a></li>
              <li><a href="/qa">FAQ</a></li>
              <li><a href="/returns">Contact</a></li>
            </ul>
          </div>
          <div className="foot-col">
            <h4>Connect</h4>
            <ul>
              <li><a href="https://instagram.com/vibinapparel" target="_blank" rel="noopener">Instagram</a></li>
              <li><a href="https://tiktok.com/@vibinapparel" target="_blank" rel="noopener">TikTok</a></li>
              <li><a href="https://twitter.com/vibinapparel" target="_blank" rel="noopener">Twitter / X</a></li>
              <li><a href="/lookbook">Lookbook</a></li>
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <div>© 2026 Vibin Apparel · A subsidiary of HVD Holdings, LLC · Jacksonville, FL</div>
        </div>
      </footer>
    </>
  )
}
