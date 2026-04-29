'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import styles from '../../styles.css'

export default function ProductPage() {
  const params = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedColor, setSelectedColor] = useState('Black')
  const [selectedSize, setSelectedSize] = useState('M')
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    fetchProduct()
  }, [params.id])

  async function fetchProduct() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (data) {
      setProduct(data)
      setSelectedColor(data.colors?.[0] || 'Black')
      setSelectedSize(data.sizes?.[0] || 'M')
    } else {
      setProduct({
        name: 'Foundation Tee',
        description: 'The piece that started it all. 100% heavyweight cotton, pre-shrunk, with our signature embroidered ✦ at the chest.',
        price: 48,
        original_price: 58,
        colors: ['Black', 'Cream', 'Coral', 'Violet'],
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        sizesOut: ['XXL']
      })
    }
    setLoading(false)
  }

  function addToCart() {
    const cart = JSON.parse(localStorage.getItem('vibin_cart') || "[]")
    const existing = cart.find(item => item.id === product.id && item.color === selectedColor && item.size === selectedSize)
    
    if (existing) {
      existing.qty += qty
    } else {
      cart.push({
        id: product.id || 1,
        name: product.name,
        price: product.price,
        color: selectedColor,
        size: selectedSize,
        qty: qty
      })
    }
    
    localStorage.setItem('vibin_cart', JSON.stringify(cart))
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const colorMap = { 'Black': '', 'Cream': ' cream', 'Coral': ' coral', 'Violet': ' violet', 'Acid': ' acid' }

  if (loading) return <div className="cart-page"><div className="cart-empty">Loading...</div></div>

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
        </div>
        <div className="nav-actions">
          <Link href="/login" className="nav-icon" style={{textDecoration:'none',color:'inherit'}}>👤</Link>
          <Link href="/cart" className="nav-icon">🛒<span className="cart-dot">0</span></Link>
        </div>
      </nav>

      <div className="breadcrumb">
        <Link href="/">Home</Link> / <Link href="/shop">Shop</Link> / <span className="current">{product?.name}</span>
      </div>

      <div className="pdp">
        <div className="gallery">
          <div className="thumbs">
            <div className="thumb on">VIBIN<br/>diff.</div>
            <div className="thumb cream">MOVE<br/>diff.</div>
            <div className="thumb coral">SS26</div>
          </div>
          <div className={`main-img${colorMap[selectedColor]}`}>
            <span className="main-img-tag">Drop 01</span>
            <div className="main-img-graphic">{product?.name?.split(' ').map((w, i) => <em key={i}>{w}</em>)}</div>
          </div>
        </div>

        <div className="details">
          <div className="details-eye">SS26 · The Foundation</div>
          <h1 className="details-title">{product?.name}<br/><em>{selectedColor}.</em></h1>

          <div className="price-row">
            <span className="current">${product?.price}</span>
            {product?.original_price && <span className="original">${product?.original_price}</span>}
            {product?.original_price && <span className="save">17% off</span>}
          </div>

          <p className="details-desc">{product?.description}</p>

          <div className="option-section">
            <div className="option-label">
              <span>Color · <span className="selected">{selectedColor}</span></span>
            </div>
            <div className="color-row">
              {product?.colors?.map(color => (
                <div key={color} className={`color ${colorMap[color]} ${selectedColor === color ? 'on' : ''}`} onClick={() => setSelectedColor(color)} />
              ))}
            </div>
          </div>

          <div className="option-section">
            <div className="option-label">
              <span>Size · <span className="selected">{selectedSize}</span></span>
            </div>
            <div className="size-row">
              {product?.sizes?.map(size => (
                <div key={size} className={`size ${selectedSize === size ? 'on' : ''} ${product?.sizesOut?.includes(size) ? 'out' : ''}`} onClick={() => !product?.sizesOut?.includes(size) && setSelectedSize(size)}>
                  {size}
                </div>
              ))}
            </div>
          </div>

          <div className="atc-row">
            <div className="qty">
              <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <input type="text" value={qty} readOnly />
              <button onClick={() => setQty(Math.min(10, qty + 1))}>+</button>
            </div>
            <button className="btn-atc" onClick={addToCart}>
              {added ? '✓ Added to Bag' : `Add to Bag · $${product?.price * qty}`}
            </button>
          </div>

          <button className="btn-bnp">Buy Now Pay Later →</button>

          <div className="perks-strip">
            <div className="perk"><div className="perk-icon">🚚</div><div className="perk-name">Free Shipping</div><div className="perk-desc">Orders $75+</div></div>
            <div className="perk"><div className="perk-icon">↻</div><div className="perk-name">Easy Returns</div><div className="perk-desc">30-day window</div></div>
            <div className="perk"><div className="perk-icon">✦</div><div className="perk-name">Quality Promise</div><div className="perk-desc">Built to last</div></div>
          </div>
        </div>
      </div>

      <footer>
        <div className="foot-logo">VIBIN</div>
        <div className="foot-tag">Apparel for those who move different · Jacksonville, FL</div>
      </footer>
    </>
  )
}