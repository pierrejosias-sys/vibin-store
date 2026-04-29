'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import styles from '../styles.css'

export default function ShopPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      if (data && data.length > 0) {
        setProducts(data)
      }
    } catch (err) {
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }

  const filters = ['all', 'Tee', 'Hoodie', 'Pants', 'Accessories']
  const filteredProducts = filter === 'all' 
    ? products 
    : products.filter(p => p.category?.toLowerCase() === filter.toLowerCase())

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
          <Link href="/">Lookbook</Link>
          <Link href="/">About</Link>
        </div>
        <div className="nav-actions">
          <div className="nav-icon">🔍</div>
          <Link href="/login" className="nav-icon" style={{textDecoration:'none',color:'inherit'}}>👤</Link>
          <Link href="/cart" className="nav-icon">🛒<span className="cart-dot" id="nav-cart">0</span></Link>
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
          <button key={f} className={`filter-btn ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      <div className="shop-grid">
        {loading ? (
          <div className="shop-loading">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="shop-empty">No products found</div>
        ) : (
          filteredProducts.map(product => (
            <Link key={product.id} href={`/product/${product.id}`} className="shop-card">
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

      <footer>
        <div className="foot-logo">VIBIN</div>
        <div className="foot-tag">Apparel for those who move different · Miami, FL · Now based in Jacksonville · A subsidiary of HVD Holdings</div>
      </footer>
    </>
  )
}