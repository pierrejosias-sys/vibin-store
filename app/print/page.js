'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from '../styles.css'

export default function PrintPage() {
  const [product, setProduct] = useState({
    type: 'tee',
    color: 'black',
    size: 'M',
    text: '',
    font: 'anton',
    quantity: 1
  })

  const [preview, setPreview] = useState('YOUR TEXT')
  const [added, setAdded] = useState(false)

  const products = [
    { id: 'tee', name: 'T-Shirt', price: 28 },
    { id: 'hoodie', name: 'Hoodie', price: 48 },
    { id: 'cap', name: 'Cap', price: 22 },
    { id: 'tote', name: 'Tote Bag', price: 18 },
  ]

  const colors = [
    { id: 'black', hex: '#0a0a0a', name: 'Black' },
    { id: 'white', hex: '#ffffff', name: 'White' },
    { id: 'cream', hex: '#f6f1e7', name: 'Cream' },
    { id: 'coral', hex: '#ff4a3d', name: 'Coral' },
  ]

  const fonts = [
    { id: 'anton', name: 'Anton (Bold)' },
    { id: 'manrope', name: 'Manrope (Clean)' },
    { id: 'mono', name: 'JetBrains Mono' },
  ]

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

  const currentProduct = products.find(p => p.id === product.type)
  const basePrice = currentProduct?.price || 28
  const printPrice = 8
  const total = (basePrice + printPrice) * product.quantity

  function addToCart() {
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      
      <div className="promo">
        <div className="promo-track">
          <span>Free shipping over $75</span><span>SS26 Drop is live</span><span>Custom prints available</span>
          <span>Free shipping over $75</span><span>SS26 Drop is live</span><span>Custom prints available</span>
        </div>
      </div>

      <nav>
        <Link href="/" className="logo">VIBIN</Link>
        <div className="nav-links">
          <Link href="/shop">Shop</Link>
          <Link href="/print">Custom Print</Link>
          <Link href="/ambassador">Ambassador</Link>
        </div>
        <div className="nav-actions">
          <Link href="/login" className="nav-icon">👤</Link>
          <Link href="/cart" className="nav-icon">🛒</Link>
        </div>
      </nav>

      <div className="print-page">
        <div className="print-header">
          <h1>Make it <em>yours.</em></h1>
          <p>Custom prints on premium VIBIN apparel. Design it your way.</p>
        </div>

        <div className="print-grid">
          <div className="print-preview">
            <div className="preview-label">Preview</div>
            <div className="preview-product" style={{ backgroundColor: product.color === 'white' ? '#f0f0f0' : product.color }}>
              <div className="preview-text" style={{ 
                fontFamily: product.font === 'anton' ? 'Anton, sans-serif' : product.font === 'mono' ? 'JetBrains Mono, monospace' : 'Manrope, sans-serif',
                color: product.color === 'white' || product.color === 'cream' || product.color === '#f6f1e7' ? '#0a0a0a' : '#ffffff'
              }}>
                {preview}
              </div>
            </div>
            <div className="preview-tip">This is how your custom print will look</div>
          </div>

          <div className="print-options">
            <div className="option-group">
              <label>Product Type</label>
              <div className="product-options">
                {products.map(p => (
                  <button key={p.id} className={`product-btn ${product.type === p.id ? 'on' : ''}`} onClick={() => setProduct({...product, type: p.id})}>
                    <span className="p-name">{p.name}</span>
                    <span className="p-price">${p.price}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="option-group">
              <label>Color</label>
              <div className="color-options">
                {colors.map(c => (
                  <button key={c.id} className={`color-btn ${product.color === c.id ? 'on' : ''}`} style={{ backgroundColor: c.hex }} onClick={() => setProduct({...product, color: c.id})} />
                ))}
              </div>
            </div>

            <div className="option-group">
              <label>Size</label>
              <div className="size-options">
                {sizes.map(s => (
                  <button key={s} className={`size-btn ${product.size === s ? 'on' : ''}`} onClick={() => setProduct({...product, size: s})}>{s}</button>
                ))}
              </div>
            </div>

            <div className="option-group">
              <label>Your Text (max 20 chars)</label>
              <input type="text" maxLength={20} placeholder="YOUR TEXT" value={product.text} onChange={(e) => { setProduct({...product, text: e.target.value}); setPreview(e.target.value || 'YOUR TEXT') }} />
            </div>

            <div className="option-group">
              <label>Font Style</label>
              <div className="font-options">
                {fonts.map(f => (
                  <button key={f.id} className={`font-btn ${product.font === f.id ? 'on' : ''}`} style={{ fontFamily: f.id === 'anton' ? 'Anton' : f.id === 'mono' ? 'JetBrains Mono' : 'Manrope' }} onClick={() => setProduct({...product, font: f.id})}>{f.name}</button>
                ))}
              </div>
            </div>

            <div className="option-group">
              <label>Quantity</label>
              <div className="qty-row">
                <button onClick={() => setProduct({...product, quantity: Math.max(1, product.quantity - 1)})}>−</button>
                <span>{product.quantity}</span>
                <button onClick={() => setProduct({...product, quantity: product.quantity + 1})}>+</button>
              </div>
            </div>

            <div className="print-total">
              <div className="pt-row"><span>Base {currentProduct?.name}</span><span>${basePrice}</span></div>
              <div className="pt-row"><span>Custom Print</span><span>${printPrice}</span></div>
              <div className="pt-total"><span>Total</span><span>${total}</span></div>
            </div>

            <button className="btn-atc" onClick={addToCart}>
              {added ? '✓ Added to Bag' : `Add to Bag · $${total}`}
            </button>
          </div>
        </div>
      </div>

      <footer>
        <div className="foot-logo">VIBIN</div>
        <div className="foot-tag">Custom prints · Made to order · Jacksonville, FL</div>
      </footer>
    </>
  )
}