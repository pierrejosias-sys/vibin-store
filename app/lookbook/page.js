'use client'

import styles from '../styles.css'

export default function LookbookPage() {
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
          <a href="#">Stockists</a>
        </div>
        <div className="nav-actions">
          <div className="nav-icon">🔍</div>
          <a href="/login" className="nav-icon" style={{textDecoration:'none',color:'inherit'}}>👤</a>
          <a href="/cart" className="nav-icon" style={{textDecoration:'none',color:'inherit'}}>🛒</a>
        </div>
      </nav>

      <section className="lookbook-hero">
        <div className="lookbook-hero-bg"></div>
        <div className="lookbook-hero-content">
          <div className="lb-eye">Editorial · SS26</div>
          <h1 className="lb-title">The <em>Foundation.</em></h1>
          <p className="lb-subtitle">Vol. 01 — Built for the quiet ones who move loudest.</p>
        </div>
      </section>

      <section className="editorial-grid">
        <div className="editorial-item large">
          <div className="editorial-img" style={{backgroundImage:"linear-gradient(180deg, rgba(0,0,0,.1) 0%, rgba(0,0,0,.5) 100%), url('https://images.unsplash.com/photo-1517353299321-dc2902f6f31f?w=1200&q=80')"}}>
            <div className="editorial-caption">
              <div className="editorial-num">01</div>
              <div className="editorial-title">Morning Routine</div>
              <div className="editorial-desc">Jacksonville · 6:42 AM</div>
            </div>
          </div>
        </div>
        <div className="editorial-item">
          <div className="editorial-img" style={{backgroundImage:"linear-gradient(180deg, rgba(0,0,0,.1) 0%, rgba(0,0,0,.5) 100%), url('https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80')"}}>
            <div className="editorial-caption">
              <div className="editorial-num">02</div>
              <div className="editorial-title">City Movement</div>
            </div>
          </div>
        </div>
        <div className="editorial-item">
          <div className="editorial-img" style={{backgroundImage:"linear-gradient(180deg, rgba(0,0,0,.1) 0%, rgba(0,0,0,.5) 100%), url('https://images.unsplash.com/photo-1556905055-8f358a47b2?w=800&q=80')"}}>
            <div className="editorial-caption">
              <div className="editorial-num">03</div>
              <div className="editorial-title">Heavyweight</div>
            </div>
          </div>
        </div>
        <div className="editorial-item wide">
          <div className="editorial-img" style={{backgroundImage:"linear-gradient(180deg, rgba(0,0,0,.1) 0%, rgba(0,0,0,.5) 100%), url('https://images.unsplash.com/photo-1542272604-787c3835535d?w=1200&q=80')"}}>
            <div className="editorial-caption">
              <div className="editorial-num">04</div>
              <div className="editorial-title">The Details</div>
              <div className="editorial-desc">Miami roots, Jacksonville grit</div>
            </div>
          </div>
        </div>
        <div className="editorial-item">
          <div className="editorial-img" style={{backgroundImage:"linear-gradient(180deg, rgba(0,0,0,.1) 0%, rgba(0,0,0,.5) 100%), url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80')"}}>
            <div className="editorial-caption">
              <div className="editorial-num">05</div>
              <div className="editorial-title">Vibe Different</div>
            </div>
          </div>
        </div>
        <div className="editorial-item">
          <div className="editorial-img" style={{backgroundImage:"linear-gradient(180deg, rgba(0,0,0,.1) 0%, rgba(0,0,0,.5) 100%), url('https://images.unsplash.com/photo-1507680434567-5739c80be1ac?w=800&q=80')"}}>
            <div className="editorial-caption">
              <div className="editorial-num">06</div>
              <div className="editorial-title">904 State of Mind</div>
            </div>
          </div>
        </div>
      </section>

      <section className="editorial-quote">
        <div className="man-text">
          Vibin <em>different</em> isn't a tagline. It's a posture. <em>Confident.</em> Calm. Community.
        </div>
        <div className="man-credit">— The Vibin Manifesto · Vol. 01</div>
      </section>

      <footer>
        <div className="foot-top">Vibin <em>Different.</em></div>
        <div className="foot-cols">
          <div className="foot-brand">
            <div className="foot-logo">VIBIN</div>
            <div className="foot-tagline">A lifestyle streetwear brand from Miami, FL. Now based in Jacksonville. A subsidiary of HVD Holdings. Apparel for those who move different.</div>
          </div>
          <div className="foot-col">
            <h4>Shop</h4>
            <ul>
              <li><a href="/shop">New Drop</a></li>
              <li><a href="/shop">Tees</a></li>
              <li><a href="/shop">Hoodies</a></li>
              <li><a href="/shop">Headwear</a></li>
              <li><a href="/shop">All Pieces</a></li>
              <li><a href="/shop">Sale</a></li>
            </ul>
          </div>
          <div className="foot-col">
            <h4>Help</h4>
            <ul>
              <li>Shipping</li>
              <li>Returns</li>
              <li>Size Guide</li>
              <li>Track Order</li>
              <li>Contact</li>
              <li>FAQ</li>
            </ul>
          </div>
          <div className="foot-col">
            <h4>Connect</h4>
            <ul>
              <li>Instagram</li>
              <li>TikTok</li>
              <li>Twitter / X</li>
              <li><a href="/lookbook">Lookbook</a></li>
              <li>Stockists</li>
              <li>Wholesale</li>
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <div>© 2026 Vibin Apparel · A subsidiary of HVD Holdings, LLC · Miami, FL</div>
          <div className="foot-payments">
            <span>VISA</span>
            <span>AMEX</span>
            <span>PAYPAL</span>
            <span>SHOP PAY</span>
            <span>APPLE</span>
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        .lookbook-hero { position: relative; height: 70vh; min-height: 500px; background: var(--ink); overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .lookbook-hero-bg { position: absolute; inset: 0; background-image: linear-gradient(180deg, rgba(0,0,0,.3) 0%, rgba(0,0,0,.7) 100%), url('https://images.unsplash.com/photo-1517353299321-dc2902f6f31f?w=1600&q=80'); background-size: cover; background-position: center; filter: contrast(1.05) saturate(.95); }
        .lookbook-hero-content { position: relative; z-index: 2; text-align: center; color: var(--cream); padding: 0 60px; }
        .lb-eye { font-family: JetBrains Mono, monospace; font-size: 11px; letter-spacing: .2em; text-transform: uppercase; color: var(--coral); margin-bottom: 16px; }
        .lb-title { font-family: Anton, sans-serif; font-size: clamp(60px, 8vw, 120px); line-height: .85; letter-spacing: -.005em; text-transform: uppercase; margin-bottom: 20px; }
        .lb-title em { font-style: italic; color: var(--coral); text-shadow: 0 0 40px rgba(255,74,61,.4); }
        .lb-subtitle { font-family: Manrope, sans-serif; font-size: 16px; line-height: 1.7; color: rgba(246,241,231,.8); }
        .editorial-grid { padding: 100px 60px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 1400px; margin: 0 auto; }
        @media (max-width: 900px) { .editorial-grid { grid-template-columns: 1fr 1fr; padding: 60px 24px; } }
        @media (max-width: 600px) { .editorial-grid { grid-template-columns: 1fr; } }
        .editorial-item { }
        .editorial-item.large { grid-column: span 2; }
        .editorial-item.wide { grid-column: span 2; }
        .editorial-img { aspect-ratio: 3/4; background-size: cover; background-position: center; position: relative; display: flex; align-items: flex-end; transition: filter .3s; cursor: pointer; }
        .editorial-item.large .editorial-img, .editorial-item.wide .editorial-img { aspect-ratio: 16/9; }
        .editorial-img:hover { filter: contrast(1.1); }
        .editorial-caption { padding: 24px; width: 100%; background: linear-gradient(transparent, rgba(0,0,0,.8)); }
        .editorial-num { font-family: JetBrains Mono, monospace; font-size: 10px; letter-spacing: .15em; text-transform: uppercase; color: var(--coral); margin-bottom: 8px; }
        .editorial-title { font-family: Anton, sans-serif; font-size: 32px; text-transform: uppercase; letter-spacing: -.005em; margin-bottom: 4px; }
        .editorial-desc { font-family: Manrope, sans-serif; font-size: 13px; color: rgba(246,241,231,.7); }
        .editorial-quote { background: var(--coral); color: var(--cream); padding: 80px 60px; text-align: center; position: relative; overflow: hidden; }
        .editorial-quote::before { content: '✦ ✦ ✦'; position: absolute; top: 30px; left: 50%; transform: translateX(-50%); font-size: 14px; letter-spacing: 1em; opacity: .5; }
        .foot-col li { margin-bottom: 8px; font-family: 'Manrope', sans-serif; font-size: 13px; color: rgba(246,241,231,.7); cursor: pointer; transition: color .2s; list-style: none; }
        .foot-col li a { color: rgba(246,241,231,.7); text-decoration: none; }
        .foot-col li:hover, .foot-col li a:hover { color: var(--cream); }
      ` }} />
    </>
  )
}
