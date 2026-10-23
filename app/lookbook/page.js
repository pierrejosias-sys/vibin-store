'use client'

import { useCart } from '../lib/cart-context'
import styles from '../styles.css'
import { FREE_SHIPPING_LABEL } from '../lib/shipping'

export default function LookbookPage() {
  const { cartCount } = useCart()

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div className="promo">
        <div className="promo-track">
          <span>Free shipping on orders over {FREE_SHIPPING_LABEL}</span>
          <span>New SS26 Drop is live</span>
          <span>Sign up for 15% off your first order</span>
          <span>Free shipping on orders over {FREE_SHIPPING_LABEL}</span>
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
          <div className="lb-img lb-img--dark" role="img" aria-label="The Foundation Tee" style={{ backgroundImage: "linear-gradient(180deg, rgba(0,0,0,.1) 0%, rgba(0,0,0,.4) 100%), url('/drop01/tee-shgdd-front.webp')" }}>
            <div className="lb-img-label">Look 01</div>
          </div>
          <div className="lb-caption">
            <div className="lb-cap-title">The Foundation Tee</div>
            <div className="lb-cap-sub">Heavyweight cotton · Drop 01 · $85</div>
          </div>
        </div>
        <div className="lb-item">
          <div className="lb-img lb-img--cream" role="img" aria-label="VOL 01 Hoodie" style={{ backgroundImage: "linear-gradient(180deg, rgba(0,0,0,.1) 0%, rgba(0,0,0,.4) 100%), url('/drop01/hoodie-ls17001-cream-front.webp')" }}>
            <div className="lb-img-label">Look 02</div>
          </div>
          <div className="lb-caption">
            <div className="lb-cap-title">VOL 01 Hoodie</div>
            <div className="lb-cap-sub">Lane Seven LS17001 · Cream · $195</div>
          </div>
        </div>
        <div className="lb-item">
          <div className="lb-img lb-img--coral" role="img" aria-label="The Snapback" style={{ backgroundImage: "linear-gradient(180deg, rgba(0,0,0,.1) 0%, rgba(0,0,0,.4) 100%), url('/drop01/snapback-6089m-hero.webp')" }}>
            <div className="lb-img-label">Look 03</div>
          </div>
          <div className="lb-caption">
            <div className="lb-cap-title">The Snapback</div>
            <div className="lb-cap-sub">Richardson 6089M · One size · $65</div>
          </div>
        </div>
      </section>

      <footer>
        <div className="foot-bottom">© 2026 Vibin Apparel · HVD Holdings, LLC · Jacksonville, FL</div>
      </footer>
    </>
  )
}
