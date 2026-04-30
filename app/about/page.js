
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
          <a href="/contact">Stockists</a>
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

      {/* MIAMI ROOTS */}
      <section className="about-miami">
        <div className="about-miami-inner">
          <div className="sec-eye" style={{color:'var(--coral)', textAlign:'center'}}>Built in Miami · Living in Jacksonville</div>
          <h2 className="sec-title" style={{textAlign:'center'}}>Same <em>Vibe,</em> New City</h2>
          <p className="about-body" style={{textAlign:'center', maxWidth:'700px', margin:'0 auto'}}>
            Miami gave us the boldness. Jacksonville gave us the grit. Together, they shape everything we create — pieces that carry that 305 energy with 904 discipline.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta">
        <div className="about-cta-inner">
          <div className="sec-eye" style={{color:'var(--coral)', textAlign:'center'}}>Join The Movement</div>
          <h2 className="nl-title" style={{textAlign:'center'}}>Ready to <em>vibe different?</em></h2>
          <p className="nl-body" style={{textAlign:'center'}}>
            Be the first to know when drops go live. Early access, exclusive pieces, and 15% off your first order.
          </p>
          <form className="nl-form" style={{marginTop:'30px'}} onSubmit={async (e) => {
            e.preventDefault();
            const form = e.target;
            const btn = form.querySelector('.nl-btn');
            btn.textContent = 'Sending...';
            btn.disabled = true;
            try {
              // REPLACE THIS URL WITH YOUR MAILCHIMP FORM ACTION URL FROM YOUR AUDIENCE DASHBOARD
              const MAILCHIMP_URL = 'YOUR_MAILCHIMP_FORM_ACTION_URL';
              await fetch(MAILCHIMP_URL, {
                method: 'POST',
                body: new FormData(form),
                mode: 'no-cors'
              });
              btn.textContent = '✓ Subscribed';
              form.insertAdjacentHTML('afterend', '<div style="background:#0a0a0a;color:#f6f1e7;padding:16px;margin-top:16px;text-align:center;">You\'re on the list. Check your email for your 15% off code. ✦</div>');
            } catch (err) {
              btn.textContent = 'Subscribe';
              btn.disabled = false;
              form.insertAdjacentHTML('afterend', '<div style="background:#ff4a3d;color:#fff;padding:16px;margin-top:16px;text-align:center;">Something went wrong. Try again or contact us at hello@vibinapparel.com</div>');
            }
          }}>
            <input type="email" className="nl-input" placeholder="your@email.com" required />
            <button type="submit" className="nl-btn">Subscribe</button>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="foot-top">
          Vibin <em>Different.</em>
        </div>
        <div className="foot-cols">
          <div className="foot-brand">
            <div className="foot-logo">VIBIN</div>
            <div className="foot-tagline">
              A lifestyle streetwear brand from Miami, FL. Now based in Jacksonville. A subsidiary of HVD Holdings. Apparel for those who move different.
            </div>
          </div>
          <div className="foot-col">
            <h4>Shop</h4>
            <ul>
              <li><a href="/shop">All Products</a></li>
              <li><a href="/shop?cat=tees">Tees</a></li>
              <li><a href="/shop?cat=hoodies">Hoodies</a></li>
              <li><a href="/shop?cat=accessories">Accessories</a></li>
              <li><a href="/lookbook">Lookbook</a></li>
              <li><a href="/print">Print</a></li>
            </ul>
          </div>
          <div className="foot-col">
            <h4>Help</h4>
            <ul>
              <li><a href="/shipping">Shipping</a></li>
              <li><a href="/returns">Returns</a></li>
              <li><a href="/qa">FAQ</a></li>
              <li><a href="/contact">Contact</a></li>
              <li><a href="/login">Account</a></li>
              <li><a href="/ambassador">Ambassador</a></li>
            </ul>
          </div>
          <div className="foot-col">
            <h4>Connect</h4>
            <ul>
              <li><a href="https://instagram.com/vibinapparel" target="_blank" rel="noopener">Instagram</a></li>
              <li><a href="https://tiktok.com/@vibinapparel" target="_blank" rel="noopener">TikTok</a></li>
              <li><a href="https://twitter.com/vibinapparel" target="_blank" rel="noopener">Twitter / X</a></li>
              <li><a href="/lookbook">Lookbook</a></li>
              <li><a href="/contact">Stockists</a></li>
              <li><a href="/contact">Wholesale</a></li>
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <div>© 2026 Vibin Apparel · A subsidiary of HVD Holdings, LLC · Jacksonville, FL</div>
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
        .about-hero { position: relative; height: 70vh; min-height: 500px; background: var(--ink); overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .about-hero-bg { position: absolute; inset: 0; background-image: linear-gradient(180deg, rgba(0,0,0,.3) 0%, rgba(0,0,0,.7) 100%), url('https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&q=80'); background-size: cover; background-position: center 30%; filter: contrast(1.05) saturate(.95); }
        .about-hero-content { position: relative; z-index: 2; text-align: center; color: var(--cream); padding: 0 60px; max-width: 800px; }
        .about-eye { font-family: JetBrains Mono, monospace; font-size: 11px; letter-spacing: .2em; text-transform: uppercase; color: var(--coral); margin-bottom: 16px; }
        .about-title { font-family: Anton, sans-serif; font-size: clamp(60px, 8vw, 120px); line-height: .85; letter-spacing: -.005em; text-transform: uppercase; margin-bottom: 20px; }
        .about-title em { font-style: italic; color: var(--coral); text-shadow: 0 0 40px rgba(255,74,61,.4); }
        .about-subtitle { font-family: Manrope, sans-serif; font-size: 16px; line-height: 1.7; color: rgba(246,241,231,.8); }
        .about-manifesto { background: var(--coral); color: var(--cream); padding: 80px 60px; text-align: center; position: relative; overflow: hidden; }
        .about-manifesto-inner { max-width: 1100px; margin: 0 auto; }
        .about-story { padding: 100px 60px; background: var(--cream); }
        .about-story-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; max-width: 1200px; margin: 0 auto; }
        @media (max-width: 900px) { .about-story-grid { grid-template-columns: 1fr; } }
        .about-body { font-family: Manrope, sans-serif; font-size: 15px; line-height: 1.7; color: var(--muted); margin-bottom: 20px; }
        .about-story-img { }
        .about-img-placeholder { aspect-ratio: 4/5; background: var(--ink); display: flex; align-items: center; justify-content: center; color: var(--cream); font-family: Anton, sans-serif; font-size: 64px; text-align: center; line-height: .85; letter-spacing: -.01em; text-transform: uppercase; border: 1px solid var(--line); }
        .about-img-placeholder em { font-style: italic; font-size: 36px; color: var(--coral); display: block; margin-top: 8px; }
        .about-values { padding: 100px 60px; background: var(--cream2); }
        .values-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; max-width: 1200px; margin: 0 auto; }
        @media (max-width: 900px) { .values-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 600px) { .values-grid { grid-template-columns: 1fr; } }
        .value-card { background: var(--cream); border: 1px solid var(--line); padding: 30px; transition: border-color .2s; }
        .value-card:hover { border-color: var(--ink); }
        .value-icon { font-size: 32px; margin-bottom: 16px; }
        .value-title { font-family: Anton, sans-serif; font-size: 24px; text-transform: uppercase; letter-spacing: -.005em; margin-bottom: 12px; }
        .value-desc { font-family: Manrope, sans-serif; font-size: 13px; line-height: 1.7; color: var(--muted); }
        .about-founder { padding: 100px 60px; background: var(--cream); }
        .about-founder-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; max-width: 1200px; margin: 0 auto; }
        @media (max-width: 900px) { .about-founder-grid { grid-template-columns: 1fr; } }
        .founder-img-placeholder { aspect-ratio: 1; background: var(--ink); display: flex; align-items: center; justify-content: center; color: var(--cream); font-family: Anton, sans-serif; font-size: 64px; text-align: center; line-height: .85; letter-spacing: -.01em; text-transform: uppercase; border: 1px solid var(--line); }
        .founder-img-placeholder em { font-style: italic; font-size: 28px; color: var(--coral); display: block; margin-top: 6px; }
        .about-cta { padding: 100px 60px; background: var(--cream2); text-align: center; }
        .about-cta-inner { max-width: 600px; margin: 0 auto; }
        @media (max-width: 768px) {
          .about-hero-content, .about-story, .about-values, .about-founder, .about-cta { padding-left: 24px; padding-right: 24px; }
          .sec-hdr { flex-direction: column; align-items: flex-start; gap: 16px; }
        }
      `}} />
    </>
  )
}

