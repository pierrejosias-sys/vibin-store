
'use client'

import { useCart } from '../lib/cart-context'
import styles from '../styles.css'

export default function AboutPage() {
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

      {/* NAV */}
      <nav>
        <a href="/" className="logo">VIBIN</a>
        <div className="nav-links">
          <a href="/shop">Shop</a>
          <a href="/shop" className="new">New Drop</a>
<a href="/lookbook">Lookbook</a>
          <a href="/about">About</a>
          <a href="/returns">Stockists</a>
        </div>
        <div className="nav-actions">
          <a href="/qa" className="nav-icon" style={{textDecoration:'none',color:'inherit'}}>🔍</a>
          <a href="/login" className="nav-icon" style={{textDecoration:'none',color:'inherit'}}>👤</a>
          <a href="/cart" className="nav-icon" style={{textDecoration:'none',color:'inherit'}}>
            🛒{cartCount > 0 && <span className="cart-dot">{cartCount}</span>}
          </a>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="about-hero">
        <div className="about-hero-bg"></div>
        <div className="about-hero-content">
          <div className="about-eye">About · The Brand</div>
          <h1 className="about-title">Vibin <em>Different.</em></h1>
          <p className="about-subtitle">Apparel for those who move with purpose, dress with intention, and vibe louder than the noise.</p>
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="about-manifesto">
        <div className="about-manifesto-inner">
          <div className="man-text">
            Vibin <em>different</em> isn't a tagline. It's a posture. <em>Confident.</em> Calm. Community.
          </div>
          <div className="man-credit">— The Vibin Manifesto · Vol. 01</div>
        </div>
      </section>

      {/* STORY */}
      <section className="about-story">
        <div className="about-story-grid">
          <div className="about-story-text">
            <div className="sec-eye">Our Story</div>
            <h2 className="sec-title">Built in <em>Jacksonville.</em></h2>
            <p className="about-body">
              Vibin was born in the heart of Miami, FL — a city that moves to its own rhythm. Now based in Jacksonville, the brand carries that Miami energy into every piece: bold, intentional, and unapologetically different.
            </p>
            <p className="about-body">
              Vibin isn't about following trends or chasing hype. It's about creating quality pieces that speak to the people who don't need to announce who they are — they show it. Every piece is designed with intention. Heavyweight cotton that lasts. Cuts that fit right. Graphics that mean something.
            </p>
            <p className="about-body">
              A subsidiary of HVD Holdings, LLC, Vibin represents a new wave of lifestyle streetwear that prioritizes substance over spectacle. Built in Miami. Living in Jacksonville. Shipping everywhere.
            </p>
          </div>
          <div className="about-story-img">
            <div className="about-img-placeholder">
              <div className="about-img-text">JAX<br/><em>904.</em></div>
            </div>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="about-values">
        <div className="sec-hdr">
          <div>
            <div className="sec-eye">What We Stand For</div>
            <h2 className="sec-title">Our <em>Values</em></h2>
          </div>
        </div>
        <div className="values-grid">
          <div className="value-card">
            <div className="value-icon">✦</div>
            <h3 className="value-title">Quality First</h3>
            <p className="value-desc">240 GSM heavyweight cotton. Pre-shrunk. Double-stitched. Built to last past the season, not fall apart after two washes.</p>
          </div>
          <div className="value-card">
            <div className="value-icon">🧵</div>
            <h3 className="value-title">Intentional Design</h3>
            <p className="value-desc">Every graphic, every cut, every stitch has a reason. We don't add anything that doesn't serve the vision.</p>
          </div>
          <div className="value-card">
            <div className="value-icon">🌍</div>
            <h3 className="value-title">Community Driven</h3>
            <p className="value-desc">Vibin isn't just a brand — it's a community of people who move different. We grow together, we win together.</p>
          </div>
          <div className="value-card">
            <div className="value-icon">📦</div>
            <h3 className="value-title">Hype-Free Drops</h3>
            <p className="value-desc">No artificial scarcity. No gimmicks. Just quality pieces released when they're ready, not when the calendar says so.</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="foot-top">Vibin <em>Different.</em></div>
        <div className="foot-cols">
          <div className="foot-brand">
            <div className="foot-logo">VIBIN</div>
            <div className="foot-tagline">A lifestyle streetwear brand from Miami, FL. Now based in Jacksonville. A subsidiary of HVD Holdings.</div>
          </div>
          <div className="foot-col">
            <h4>Shop</h4>
            <ul>
              <li><a href="/shop">All Products</a></li>
              <li><a href="/shop?cat=tees">Tees</a></li>
              <li><a href="/shop?cat=hoodies">Hoodies</a></li>
              <li><a href="/lookbook">Lookbook</a></li>
            </ul>
          </div>
          <div className="foot-col">
            <h4>Info</h4>
            <ul>
              <li><a href="/about">About</a></li>
              <li><a href="/shipping">Shipping</a></li>
              <li><a href="/returns">Returns</a></li>
              <li><a href="/qa">FAQ</a></li>
            </ul>
          </div>
        </div>
        <div className="foot-bottom">© 2026 Vibin Apparel · HVD Holdings, LLC · Jacksonville, FL</div>
      </footer>
    </>
  )
}
