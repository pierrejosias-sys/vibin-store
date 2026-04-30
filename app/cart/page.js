'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCart } from '../lib/cart-context'
import styles from '../styles.css'

export default function CartPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const { cartCount, updateCart } = useCart()

  useEffect(() => {
    const saved = localStorage.getItem('vibin_cart')
    if (saved) {
      setItems(JSON.parse(saved))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    localStorage.setItem('vibin_cart', JSON.stringify(items))
    updateCart()
  }, [items, updateCart])

  function updateQty(id, change) {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, qty: Math.max(1, item.qty + change) }
      }
      return item
    }))
  }

  function removeItem(id) {
    setItems(items.filter(item => item.id !== id))
  }

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0)
  const shipping = subtotal >= 75 ? 0 : 10
  const total = subtotal + shipping

  if (loading) {
    return <div className="cart-page"><div className="cart-empty">Loading...</div></div>
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />

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
        <h1 className="cart-title">Your Bag</h1>

        {items.length === 0 ? (
          <div className="cart-empty">
              <p>Your bag is empty.</p>
              <Link href="/shop" style={{ color: 'var(--coral)', marginTop: '20px', display: 'inline-block' }}>Continue Shopping →</Link>
            </div>
        ) : (
          <>
              <div className="cart-items">
                {items.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-img">{item.name.substring(0, 2).toUpperCase()}</div>
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.name}</div>
                      <div className="cart-item-variant">{item.color} · {item.size}</div>
                    </div>
                    <div className="cart-item-qty">
                      <button onClick={() => updateQty(item.id, -1)}>−</button>
                      <span>{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)}>+</button>
                    </div>
                    <div className="cart-item-price">${item.price * item.qty}</div>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <div className="cart-row">
                  <span>Subtotal</span>
                  <span>${subtotal}</span>
                </div>
                <div className="cart-row">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : `$${shipping}`}</span>
                </div>
                <div className="cart-row cart-total">
                  <span>Total</span>
                  <span>${total}</span>
                </div>
                <Link href="/checkout" className="btn-checkout">Checkout →</Link>
              </div>
            </>
        )}
      </div>

      <footer>
        <div className="foot-top">Vibin <em>Different.</em></div>
        <div className="foot-cols">
          <div className="foot-brand">
            <div className="foot-logo">VIBIN</div>
            <div className="foot-tagline">A lifestyle streetwear brand from Miami, FL. Now based in Jacksonville. A subsidiary of HVD Holdings.</div>
          </div>
          <div className="foot-col">
            <h4>Help</h4>
            <ul>
              <li><a href="/shipping">Shipping</a></li>
              <li><a href="/returns">Returns</a></li>
              <li><a href="/qa">FAQ</a></li>
              <li><a href="/contact">Contact</a></li>
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