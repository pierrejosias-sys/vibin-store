'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { useCart } from '../lib/cart-context'
import styles from '../styles.css'

const FALLBACK_PRODUCTS = [
  { id: '1', name: 'Foundation Tee', price: 48, cat: 'Tee' },
  { id: '2', name: 'Move Different Tee', price: 48, cat: 'Tee' },
  { id: '3', name: 'Vol 01 Hoodie', price: 98, cat: 'Hoodie' },
  { id: '4', name: 'VIBIN Cap', price: 32, cat: 'Accessories' },
  { id: '5', name: 'Cargo Pant', price: 88, cat: 'Pants' },
]

export default function ShopPage() {
  const [products, setProducts] = useState(FALLBACK_PRODUCTS)
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  // FIX #3: Read category filter from URL query param (?cat=Tee) so nav links actually filter
  const urlCat = searchParams.get('cat') || 'all'
  const [filter, setFilter] = useState(urlCat)
  const { cartCount, updateCart } = useCart()

  // Sync filter with URL when it changes (e.g. user clicks footer category links)
  useEffect(() => {
    setFilter(searchParams.get('cat') || 'all')
  }, [searchParams])

  function addToCart(product) {
    const cart = JSON.parse(localStorage.getItem('vibin_cart') || '[]')
    const existing = cart.find(item => item.id === product.id)
    if (existing) {
      existing.qty += 1
    } else {
      cart.push({ ...product, size: 'M', qty: 1 })
    }
    localStorage.setItem('vibin_cart', JSON.stringify(cart))
    updateCart()
  }

  const filters = ['all', 'Tee', 'Hoodie', 'Pants', 'Accessories']
  const filteredProducts = filter === 'all' ? products : products.filter(p => p.cat === filter)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div className="promo">
        <div className="promo-track">
          <span>Free shipping over $75</span><span>SS26 Drop is live</span><span>15% off your first order</span>
          <span>Free shipping over $75</span><span>SS26 Drop is live</span><span>15% off your first order</span>
        </div>
      </div>

      {/* FIX #3: All nav links now point to real pages */}
      <nav>
        <Link href="/" className="logo">VIBIN</Link>
        <div className="nav-links">
          <Link href="/shop">Shop</Link>
          <Link href="/drop-01" style={{color:'var(--coral)'}}>Drop 01 ★</Link>
          <Link href="/lookbook">Lookbook</Link>
          <Link href="/about">About</Link>
        </div>
        <div className="nav-actions">
          <Link href="/qa" className="nav-icon" style={{textDecoration:'none',color:'inherit'}}>🔍</Link>
          <Link href="/login" className="nav-icon" style={{textDecoration:'none',color:'inherit'}}>👤</Link>
          <Link href="/cart" className="nav-icon" style={{textDecoration:'none',color:'inherit'}}>
            🛒{cartCount > 0 && <span className="cart-dot">{cartCount}</span>}
          </Link>
        </div>
      </nav>

      <div className="shop-hero">
        <div className="shop-hero-content">
          <div className="shop-eye">SS26 Collection</div>
          <h1 className="shop-title">Move <em>different.</em></h1>
          <p className="shop-desc">The foundation of everything we build on. Premium materials, intentional design, and pieces that actually last.</p>
        </div>
      </div>

      <div className="shop-filters">
        {filters.map(f => (
          <Link
            key={f}
            href={f === 'all' ? '/shop' : `/shop?cat=${f}`}
            className={`filter-btn ${filter === f ? 'on' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f}
          </Link>
        ))}
      </div>

      <div className="shop-grid">
        {loading ? (
          <div className="shop-loading">Loading...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="shop-empty">No products found in this category.</div>
        ) : (
          filteredProducts.map(product => (
            <Link key={product.id} href={`/product/${product.id}`} className="shop-card" style={{textDecoration:'none',color:'inherit'}}>
              <div className="shop-img">
                {product.name.split(' ').slice(0, 3).map((w, i) => (
                  <span key={i}>{w}{i < Math.min(product.name.split(' ').length, 3) - 1 && <br/>}</span>
                ))}
              </div>
              <div className="shop-info">
                <div className="shop-name">{product.name}</div>
                <div className="shop-meta">
                  <span className="shop-cat">In Stock</span>
                  <span className="shop-price">${product.price}</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <footer style={{background:'#0a0a0a',borderTop:'1px solid #1e1e1e',padding:'40px',textAlign:'center'}}>
        <div style={{maxWidth:'1200px',margin:'0 auto'}}>
          <div style={{marginBottom:'20px'}}>
            <Link href="/legal/privacy" style={{color:'#888',textDecoration:'none',fontSize:'13px',marginRight:'20px',fontFamily:'JetBrains Mono, monospace'}}>Privacy Policy</Link>
            <Link href="/legal/terms" style={{color:'#888',textDecoration:'none',fontSize:'13px',marginRight:'20px',fontFamily:'JetBrains Mono, monospace'}}>Terms of Service</Link>
            <Link href="/returns" style={{color:'#888',textDecoration:'none',fontSize:'13px',fontFamily:'JetBrains Mono, monospace'}}>Returns</Link>
          </div>
          <p style={{fontSize:'11px',color:'#555',fontFamily:'JetBrains Mono, monospace',letterSpacing:'.15em',textTransform:'uppercase'}}>
            Vibin Apparel, LLC · A Subsidiary of HVD Holdings, LLC · Florida
          </p>
        </div>
      </footer>
    </>
  )
}
