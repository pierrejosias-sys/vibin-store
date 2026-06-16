'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function ProductPage() {
  const params = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedColor, setSelectedColor] = useState('Black')
  const [selectedSize, setSelectedSize] = useState('M')
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    fetchProduct()
  }, [params.slug])

  async function fetchProduct() {
    // Try slug first, then fall back to numeric id for legacy links
    const isNumeric = /^\d+$/.test(params.slug)
    const query = supabase.from('products').select('*')
    const { data } = isNumeric
      ? await query.eq('id', params.slug).single()
      : await query.eq('slug', params.slug).single()

    if (data) {
      setProduct(data)
      // images is JSONB array: [{color, url, is_default}] or legacy string
      const defaultColor = Array.isArray(data.images) && data.images[0]?.color
        ? data.images[0].color
        : data.color || 'Black'
      setSelectedColor(defaultColor)
    }
    setLoading(false)
  }

  function addToCart() {
    const cart = JSON.parse(localStorage.getItem('vibin_cart') || '[]')
    const existing = cart.find(
      item => item.id === product.id && item.color === selectedColor && item.size === selectedSize
    )
    if (existing) {
      existing.qty += qty
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        color: selectedColor,
        size: selectedSize,
        qty,
        slug: product.slug,
        image_url: product.image_url || null
      })
    }
    localStorage.setItem('vibin_cart', JSON.stringify(cart))
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  // Parse colorways from JSONB images field or fallback to legacy color string
  function getColorways() {
    if (Array.isArray(product?.images) && product.images.length > 0 && product.images[0]?.color) {
      return product.images
    }
    if (product?.color) {
      return [{ color: product.color, hex: '#111111', is_default: true }]
    }
    return [{ color: 'Black', hex: '#111111', is_default: true }]
  }

  // Sizes — stored in tags as 'size:S' etc, or use defaults
  function getSizes() {
    const sizeTags = product?.tags?.filter(t => ['XS','S','M','L','XL','XXL'].includes(t))
    return sizeTags?.length > 0 ? sizeTags : ['XS','S','M','L','XL','XXL']
  }

  const SIZES = ['XS','S','M','L','XL','XXL']

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'sans-serif'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'0.9rem',letterSpacing:'0.1em',color:'#888'}}>LOADING...</div>
      </div>
    </div>
  )

  if (!product) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'sans-serif'}}>
      <div style={{textAlign:'center'}}>
        <h2>Product not found</h2>
        <Link href="/shop" style={{color:'#01696f'}}>Back to Shop</Link>
      </div>
    </div>
  )

  const colorways = getColorways()
  const sizes = SIZES

  return (
    <>
      {/* PROMO BAR */}
      <div className="promo">
        <div className="promo-track">
          <span>Free shipping over $75</span><span>★ New Drop Live</span><span>15% off your first order</span>
          <span>Free shipping over $75</span><span>★ New Drop Live</span><span>15% off your first order</span>
        </div>
      </div>

      {/* NAV */}
      <nav>
        <Link href="/" className="logo">VIBIN</Link>
        <div className="nav-links">
          <Link href="/shop">Shop</Link>
          <Link href="/drop-01">New Drop</Link>
          <Link href="/lookbook">Lookbook</Link>
        </div>
        <div className="nav-actions">
          <Link href="/login" className="nav-icon" style={{textDecoration:'none',color:'inherit'}}>👤</Link>
          <Link href="/cart" className="nav-icon">🛒<span className="cart-dot">0</span></Link>
        </div>
      </nav>

      {/* BREADCRUMB */}
      <div className="breadcrumb">
        <Link href="/">Home</Link> / <Link href="/shop">Shop</Link> / <span className="current">{product.name}</span>
      </div>

      {/* PDP LAYOUT */}
      <div className="pdp">

        {/* GALLERY */}
        <div className="gallery">
          {/* Main image */}
          <div className="main-img" style={{background:'#111',borderRadius:'16px',overflow:'hidden',aspectRatio:'1/1',display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                style={{width:'100%',height:'100%',objectFit:'cover'}}
              />
            ) : (
              <div style={{color:'#fff',textAlign:'center',padding:'2rem'}}>
                <div style={{fontSize:'0.7rem',letterSpacing:'0.15em',color:'#666',marginBottom:'1rem'}}>VIBIN APPAREL</div>
                <div style={{fontSize:'2rem',fontWeight:'700'}}>{product.name}</div>
                <div style={{fontSize:'0.8rem',color:'#01696f',marginTop:'0.5rem'}}>{selectedColor}</div>
              </div>
            )}
            {product.tags?.includes('new') && (
              <div style={{position:'absolute',top:'1rem',left:'1rem',background:'#01696f',color:'#fff',fontSize:'0.7rem',fontWeight:'700',letterSpacing:'0.1em',padding:'4px 10px',borderRadius:'20px'}}>NEW</div>
            )}
          </div>

          {/* Color thumbs */}
          <div style={{display:'flex',gap:'0.6rem',marginTop:'0.75rem'}}>
            {colorways.map((cw, i) => (
              <div
                key={cw.color}
                onClick={() => { setSelectedColor(cw.color); setActiveImage(i) }}
                style={{
                  width:'56px',height:'56px',borderRadius:'8px',
                  background: cw.hex || '#111',
                  border: selectedColor === cw.color ? '2px solid #01696f' : '2px solid transparent',
                  cursor:'pointer',flexShrink:0,
                  outline: selectedColor === cw.color ? '2px solid #01696f' : 'none',
                  outlineOffset:'2px'
                }}
                title={cw.color}
              />
            ))}
          </div>
        </div>

        {/* PRODUCT DETAILS */}
        <div className="details">
          <div className="details-eye">★ Vibin Apparel · {product.category || 'Apparel'}</div>
          <h1 className="details-title">
            {product.name}<br/>
            <em>{selectedColor}.</em>
          </h1>

          {/* PRICE */}
          <div className="price-row">
            <span className="current">${Number(product.price).toFixed(2)}</span>
            {product.compare_price && (
              <>
                <span className="original">${Number(product.compare_price).toFixed(2)}</span>
                <span className="save">
                  {Math.round((1 - product.price / product.compare_price) * 100)}% off
                </span>
              </>
            )}
          </div>

          {/* DESCRIPTION */}
          <p className="details-desc">{product.description}</p>

          {/* COLOR SELECTOR */}
          <div className="option-section">
            <div className="option-label">
              <span>Color · <span className="selected">{selectedColor}</span></span>
            </div>
            <div className="color-row">
              {colorways.map(cw => (
                <div
                  key={cw.color}
                  className={`color ${selectedColor === cw.color ? 'on' : ''}`}
                  style={{ background: cw.hex || '#111' }}
                  onClick={() => setSelectedColor(cw.color)}
                  title={cw.color}
                />
              ))}
            </div>
          </div>

          {/* SIZE SELECTOR */}
          <div className="option-section">
            <div className="option-label">
              <span>Size · <span className="selected">{selectedSize}</span></span>
            </div>
            <div className="size-row">
              {sizes.map(size => (
                <div
                  key={size}
                  className={`size ${selectedSize === size ? 'on' : ''} ${size === 'XS' && product.stock_qty < 5 ? 'out' : ''}`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </div>
              ))}
            </div>
          </div>

          {/* QTY + ADD TO CART */}
          <div className="atc-row">
            <div className="qty">
              <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <input type="text" value={qty} readOnly />
              <button onClick={() => setQty(Math.min(10, qty + 1))}>+</button>
            </div>
            <button className="btn-atc" onClick={addToCart}>
              {added ? '✓ Added to Bag' : `Add to Bag · $${(product.price * qty).toFixed(2)}`}
            </button>
          </div>

          <button className="btn-bnp">Buy Now Pay Later →</button>

          {/* PERKS */}
          <div className="perks-strip">
            <div className="perk">
              <div className="perk-icon">🚚</div>
              <div className="perk-name">Free Shipping</div>
              <div className="perk-desc">Orders $75+</div>
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

      <footer>
        <div className="foot-logo">VIBIN</div>
        <div className="foot-tag">Apparel for those who move different · Jacksonville, FL</div>
      </footer>
    </>
  )
}
