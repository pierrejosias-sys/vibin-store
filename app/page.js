'use client'

import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import styles from './styles.css'

export default function ProductPage() {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedColor, setSelectedColor] = useState('Black')
  const [selectedSize, setSelectedSize] = useState('M')
  const [qty, setQty] = useState(1)
  const [cartCount, setCartCount] = useState(0)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    fetchProduct()
  }, [])

  async function fetchProduct() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('name', 'Foundation Tee')
      .single()
    
    if (data) {
      setProduct(data)
    } else {
setProduct({
        name: 'Foundation Tee',
        description: 'The piece that started it all. 100% heavyweight cotton, pre-shrunk, with our signature embroidered ✦ at the chest and bold "VIBIN different." graphic across the back.',
        price: 48,
        originalPrice: 58,
        colors: ['Black', 'Cream', 'Coral', 'Violet', 'Acid'],
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        sizesOut: ['XL', 'XXL']
      })
    }
    setLoading(false)
  }

  function handleAddToCart() {
    setCartCount(cartCount + qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  function changeColor(color) {
    setSelectedColor(color)
  }

  function changeSize(size) {
    if (product?.sizesOut?.includes(size)) return
    setSelectedSize(size)
  }

  const colorMap = {
    'Black': '',
    'Cream': 'cream',
    'Coral': 'coral',
    'Violet': 'violet',
    'Acid': 'acid'
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      
      {/* PROMO */}
      <div className="promo">
        <div className="promo-track">
          <span>Free shipping over $75</span><span>SS26 Drop is live</span><span>15% off your first order</span>
          <span>Free shipping over $75</span><span>SS26 Drop is live</span><span>15% off your first order</span>
        </div>
      </div>

      {/* NAV */}
      <nav>
        <a href="/" className="logo">VIBIN</a>
        <div className="nav-links">
          <a href="/">Shop</a>
          <a href="/">New Drop</a>
          <a href="/">Lookbook</a>
          <a href="/">About</a>
        </div>
        <div className="nav-actions">
          <div className="nav-icon">🔍</div>
          <a href="/login" className="nav-icon" style={{textDecoration:'none',color:'inherit'}}>👤</a>
          <div className="nav-icon">🛒{cartCount > 0 && <span className="cart-dot">{cartCount}</span>}</div>
        </div>
      </nav>

      {/* BREADCRUMB */}
      <div className="breadcrumb">
        <a href="/">Home</a> / <a href="/">Shop</a> / <a href="#">Tees</a> / <span className="current">{product?.name} — {selectedColor}</span>
      </div>

      {/* PDP */}
      <div className="pdp">
        {/* GALLERY */}
        <div className="gallery">
          <div className="thumbs">
            <div className="thumb on">VIBIN<br/>diff.</div>
            <div className="thumb cream">MOVE<br/>diff.</div>
            <div className="thumb coral">SS26</div>
            <div className="thumb detail">↻</div>
          </div>
          <div className="main-img">
            <span className="main-img-tag">Drop 01</span>
            <div className="main-img-graphic">VIBIN<em>different.</em></div>
            <div className="main-img-zoom">⊕</div>
          </div>
        </div>

        {/* DETAILS */}
        <div className="details">
          <div className="details-eye">SS26 · The Foundation</div>
          <h1 className="details-title">{product?.name}<br/><em>{selectedColor}.</em></h1>

          <div className="price-row">
            <span className="current">${product?.price}</span>
            {product?.originalPrice && <span className="original">${product?.originalPrice}</span>}
            {product?.originalPrice && <span className="save">17% off</span>}
          </div>

          <p className="details-desc">{product?.description}</p>

          {/* COLOR */}
          <div className="option-section">
            <div className="option-label">
              <span>Color · <span className="selected">{selectedColor}</span></span>
              <a href="#">Size Guide ↗</a>
            </div>
            <div className="color-row">
              {product?.colors?.map(color => (
                <div 
                  key={color}
                  className={`color ${colorMap[color]} ${selectedColor === color ? 'on' : ''}`}
                  onClick={() => changeColor(color)}
                />
              ))}
            </div>
          </div>

          {/* SIZE */}
          <div className="option-section">
            <div className="option-label">
              <span>Size · <span className="selected">{selectedSize}</span></span>
              <a href="#">In Stock</a>
            </div>
            <div className="size-row">
              {product?.sizes?.map(size => (
                <div 
                  key={size}
                  className={`size ${selectedSize === size ? 'on' : ''} ${product?.sizesOut?.includes(size) ? 'out' : ''}`}
                  onClick={() => changeSize(size)}
                >
                  {size}
                </div>
              ))}
            </div>
          </div>

          {/* ATC */}
          <div className="atc-row">
            <div className="qty">
              <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <input type="text" value={qty} readOnly />
              <button onClick={() => setQty(Math.min(10, qty + 1))}>+</button>
            </div>
            <button className="btn-atc" onClick={handleAddToCart}>
              {added ? '✓ Added to Bag' : `Add to Bag · $${product?.price * qty}`}
            </button>
          </div>

          <button className="btn-bnp">Buy Now Pay Later · $12 / 4 weeks ↗</button>

          {/* PERKS STRIP */}
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

          {/* ACCORDIONS */}
          <div className="accordion">
            <div className="acc-item open">
              <button className="acc-toggle">
                <span>Details & Materials</span>
                <span className="arrow">+</span>
              </button>
              <div className="acc-content">
                <ul>
                  <li>100% heavyweight cotton (240 GSM)</li>
                  <li>Pre-shrunk · True to size</li>
                  <li>Embroidered ✦ logo at chest</li>
                  <li>Screen-printed graphic at back</li>
                  <li>Reinforced collar + double-stitched hem</li>
                  <li>Designed in Jacksonville, FL · Made in Portugal</li>
                </ul>
              </div>
            </div>
            <div className="acc-item">
              <button className="acc-toggle">
                <span>Size & Fit</span>
                <span className="arrow">+</span>
              </button>
              <div className="acc-content">
                Cut for an oversized, relaxed fit. If you&apos;re between sizes, size down for a more fitted look or true-to-size for a relaxed drop. Model is 6&apos;1&quot; wearing a size M.
              </div>
            </div>
            <div className="acc-item">
              <button className="acc-toggle">
                <span>Care Instructions</span>
                <span className="arrow">+</span>
              </button>
              <div className="acc-content">
                Machine wash cold with like colors. Tumble dry low. Iron inside-out on low heat. Do not dry clean. Avoid bleach.
              </div>
            </div>
            <div className="acc-item">
              <button className="acc-toggle">
                <span>Shipping & Returns</span>
                <span className="arrow">+</span>
              </button>
              <div className="acc-content">
                Free shipping on orders $75+. Standard delivery 3–5 business days. 30-day return window.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* REVIEWS */}
      <section className="reviews">
        <div className="reviews-hdr">
          <div>
            <div className="related-eye" style={{color:'var(--coral)'}}>Real People · Real Pieces</div>
            <h2 className="reviews-title">Reviews <em>4.8</em></h2>
          </div>
          <div className="reviews-stat">
            <div className="stars">★★★★★</div>
            <div className="review-count">Based on 142 verified reviews</div>
          </div>
        </div>
        <div className="reviews-grid">
          <div className="rev">
            <div className="rev-stars">★★★★★</div>
            <div className="rev-title">Heaviest tee I own.</div>
            <div className="rev-body">&quot;This is the kind of weight you can actually feel. Doesn&apos;t get thinner after washing.&quot;</div>
            <div className="rev-foot"><span>Marcus T. · Size M</span><span className="rev-verified">✓ Verified</span></div>
          </div>
          <div className="rev">
            <div className="rev-stars">★★★★★</div>
            <div className="rev-title">Fit is perfect.</div>
            <div className="rev-body">&quot;6&apos;0&quot;, 175lbs, ordered medium. Drape is exactly the relaxed-but-not-baggy I wanted.&quot;</div>
            <div className="rev-foot"><span>Devon R. · Size M</span><span className="rev-verified">✓ Verified</span></div>
          </div>
          <div className="rev">
            <div className="rev-stars">★★★★☆</div>
            <div className="rev-title">Quality &gt; Hype.</div>
            <div className="rev-body">&quot;Honestly skeptical of new brands but this changed my mind. Cotton feels like Carhartt-tier quality.&quot;</div>
            <div className="rev-foot"><span>Tony R. · Size XL</span><span className="rev-verified">✓ Verified</span></div>
          </div>
        </div>
      </section>

      {/* RELATED */}
      <section className="related">
        <div className="related-hdr">
          <div>
            <div className="related-eye">You Might Also</div>
            <h2 className="related-title">Move <em>different.</em></h2>
          </div>
          <a href="/" className="related-link">Shop All →</a>
        </div>
        <div className="related-grid">
          <div className="rp">
            <div className="rp-img cream">MOVE<em>different.</em></div>
            <div className="rp-name">Move Different Tee — Cream</div>
            <div className="rp-meta"><span className="rp-cat">Tee</span><span className="rp-price">$48</span></div>
          </div>
          <div className="rp">
            <div className="rp-img coral">VOL<em>01.</em></div>
            <div className="rp-name">Vol 01 Hoodie — Coral</div>
            <div className="rp-meta"><span className="rp-cat">Hoodie</span><span className="rp-price">$98</span></div>
          </div>
          <div className="rp">
            <div className="rp-img">✦<em>vibin.</em></div>
            <div className="rp-name">Mark Hoodie — Onyx</div>
            <div className="rp-meta"><span className="rp-cat">Hoodie</span><span className="rp-price">$98</span></div>
          </div>
          <div className="rp">
            <div className="rp-img violet">DIFF<em>erent.</em></div>
            <div className="rp-name">Different Crew — Violet</div>
            <div className="rp-meta"><span className="rp-cat">Crewneck</span><span className="rp-price">$78</span></div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="foot-logo">VIBIN</div>
        <div className="foot-tag">Apparel for those who move different · Jacksonville, FL · A subsidiary of HVD Holdings</div>
      </footer>
    </>
  )
}