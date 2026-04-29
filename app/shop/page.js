'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import styles from '../styles.css'

export default function ShopPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [user, setUser] = useState(null)

  useEffect(() => {
    fetchProducts()
    checkUser()
  }, [])

  async function fetchProducts() {
    let query = supabase.from('products').select('*')
    
    const { data, error } = await query
    
    if (data) {
      setProducts(data.length > 0 ? data : [
        { id: 1, name: 'Foundation Tee', price: 48, original_price: 58, category: 'Tee', colors: ['Black', 'Cream', 'Coral'] },
        { id: 2, name: 'Move Different Tee', price: 48, category: 'Tee', colors: ['Cream'] },
        { id: 3, name: 'Vol 01 Hoodie', price: 98, category: 'Hoodie', colors: ['Coral'] },
        { id: 4, name: 'Mark Hoodie', price: 98, category: 'Hoodie', colors: ['Black'] },
        { id: 5, name: 'Different Crew', price: 78, category: 'Crewneck', colors: ['Violet'] },
        { id: 6, name: 'Cargo Pant', price: 88, category: 'Pants', colors: ['Black', 'Olive'] },
        { id: 7, name: 'VIBIN Cap', price: 32, category: 'Accessories', colors: ['Black'] },
        { id: 8, name: 'Tote Bag', price: 28, category: 'Accessories', colors: ['Cream'] },
      ])
    }
    setLoading(false)
  }

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const filters = ['all', 'Tee', 'Hoodie', 'Crewneck', 'Pants', 'Accessories']
  const filteredProducts = filter === 'all' ? products : products.filter(p => p.category === filter)

  const colorMap = { 'Black': '', 'Cream': ' cream', 'Coral': ' coral', 'Violet': ' violet', 'Olive': ' olive' }

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
          <div className="shop-loading">Loading...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="shop-empty">No products found</div>
        ) : (
          filteredProducts.map(product => (
            <Link key={product.id} href={`/product/${product.id}`} className="shop-card">
              <div className={`shop-img${colorMap[product.colors?.[0]] || ''}`}>
                {product.name.split(' ').map((w, i) => (
                  <span key={i}>{w}{i < product.name.split(' ').length - 1 && <br/>}</span>
                ))}
              </div>
              <div className="shop-info">
                <div className="shop-name">{product.name}</div>
                <div className="shop-meta">
                  <span className="shop-cat">{product.category || 'Apparel'}</span>
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