'use client'

import { useCart } from '../lib/cart-context'
import styles from '../styles.css'

export default function LookbookPage() {
  const { cartCount } = useCart()

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div className="promo">
        <div className="promo-track">
          <span>Free shipping on orders over $75</span>
          <span>New SS26 Drop is live</span>
          <span>Sign up for 15% off your first order</span>
          <span>Free shipping on orders over $75</span>
          <span>New SS26 Drop is live</span>
          <span>Sign up for 15% off your first order</span>
        </div>
      </div>

      <nav>
        <a href="/" className="logo">VIBIN</a>
        <div className="nav-links">
          <a href="/shop">Shop</a>
          <a href="/shop" className="new">New Drop</a>
          <a href="/lookbook">Lookbook</a>
          <a href="/about">About</a>
        </div>
        <div className="nav-actions">
          <a href="/login" className="nav-icon" style={{textDecoration:'none',color:'inherit'}}>👤</a>
          <a href="/cart" className="nav-icon" style={{textDecoration:'none',color:'inherit'}}>
            🛒{cartCount > 0 && <span className="cart-dot">{cartCount}</span>}
          </a>
        </div>
      </nav>

      <section className="lookbook-hero">
        <div className="lb-eye">Editorial Nº 01</div>
        <h1 className="lb-title">The <em>Foundation</em></h1>
        <p className="lb-sub">SS26 · Drop 01 · Jacksonville</p>
      </section>

      <section className="lb-grid">
        <div className="lb-item lb-item--large">
          <div className="lb-img lb-img--dark">
            <div className="lb-img-label">Look 01</div>
          </div>
          <div className="lb-caption">
            <div className="lb-cap-title">The Heavyweight Tee</div>
            <div className="lb-cap-sub">240 GSM · Oversized · Black</div>
          </div>
        </div>
        <div className="lb-item">
          <div className="lb-img lb-img--cream">
            <div className="lb-img-label">Look 02</div>
          </div>
          <div className="lb-caption">
            <div className="lb-cap-title">The Foundation Hoodie</div>
            <div className="lb-cap-sub">400 GSM · Relaxed · Cream</div>
          </div>
        </div>
        <div className="lb-item">
          <div className="lb-img lb-img--coral">
            <div className="lb-img-label">Look 03</div>
          </div>
          <div className="lb-caption">
            <div className="lb-cap-title">Statement Tee</div>
            <div className="lb-cap-sub">Graphic · Oversized · Coral</div>
          </div>
        </div>
      </section>

      <footer>
        <div className="foot-bottom">© 2026 Vibin Apparel · HVD Holdings, LLC · Jacksonville, FL</div>
      </footer>
    </>
  )
}
