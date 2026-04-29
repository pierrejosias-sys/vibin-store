'use client'

import { useCart } from '../lib/cart-context'
import styles from '../styles.css'

export default function ReturnsPage() {
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
          <a href="#">Stockists</a>
        </div>
        <div className="nav-actions">
          <div className="nav-icon">🔍</div>
          <a href="/login" className="nav-icon" style={{textDecoration:'none',color:'inherit'}}>👤</a>
          <a href="/cart" className="nav-icon" style={{textDecoration:'none',color:'inherit'}}>
            🛒{cartCount > 0 && <span className="cart-dot">{cartCount}</span>}
          </a>
        </div>
      </nav>

      <section className="returns-hero">
        <div className="returns-hero-content">
          <div className="sec-eye">Customer Care</div>
          <h1 className="returns-title">Returns<br/>& <em>Exchanges.</em></h1>
          <p className="returns-subtitle">30-day window. No hassle. Just vibes.</p>
        </div>
      </section>

      <section className="returns-content">
        <div className="returns-grid">
          <div className="returns-policy">
            <div className="policy-card">
              <div className="policy-icon">↻</div>
              <h3 className="policy-title">30-Day Returns</h3>
              <p className="policy-desc">
                Not feeling it? Return any unused item within 30 days of delivery for a full refund or exchange.
              </p>
            </div>

            <div className="policy-card">
              <div className="policy-icon">📦</div>
              <h3 className="policy-title">Condition Matters</h3>
              <p className="policy-desc">
                Items must be unworn, unwashed, and in original packaging with tags attached. We inspect every return.
              </p>
            </div>

            <div className="policy-card">
              <div className="policy-icon">💰</div>
              <h3 className="policy-title">Refund Timeline</h3>
              <p className="policy-desc">
                Once we receive and inspect your return, refunds process within 5-7 business days back to your original payment method.
              </p>
            </div>

            <div className="policy-card">
              <div className="policy-icon">🚚</div>
              <h3 className="policy-title">Return Shipping</h3>
              <p className="policy-desc">
                Customer is responsible for return shipping costs unless the item is defective or we sent the wrong item.
              </p>
            </div>
          </div>

          <div className="returns-steps">
            <div className="sec-eye">How It Works</div>
            <h2 className="sec-title">Return <em>Process.</em></h2>

            <div className="step">
              <div className="step-num">01</div>
              <div className="step-content">
                <h4>Email Us</h4>
                <p>Send an email to <strong>returns@vibinstore.com</strong> with your order number and reason for return.</p>
              </div>
            </div>

            <div className="step">
              <div className="step-num">02</div>
              <div className="step-content">
                <h4>Get RMA Number</h4>
                <p>We'll reply within 24 hours with a Return Merchandise Authorization (RMA) number and instructions.</p>
              </div>
            </div>

            <div className="step">
              <div className="step-num">03</div>
              <div className="step-content">
                <h4>Ship It Back</h4>
                <p>Pack the item securely with the RMA number clearly written on the package. Ship to the address we provide.</p>
              </div>
            </div>

            <div className="step">
              <div className="step-num">04</div>
              <div className="step-content">
                <h4>Get Refunded</h4>
                <p>Once received and inspected, your refund processes within 5-7 business days.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="returns-nonreturnable">
          <div className="sec-eye" style={{textAlign:'center'}}>Not Eligible</div>
          <h2 className="sec-title" style={{textAlign:'center'}}>Non-Returnable <em>Items.</em></h2>
          <div className="nonreturn-grid">
            <div className="nonreturn-item">Final sale items (marked as such)</div>
            <div className="nonreturn-item">Gift cards</div>
            <div className="nonreturn-item">Worn, washed, or damaged items</div>
            <div className="nonreturn-item">Items without original tags/packaging</div>
          </div>
        </div>

        <div className="returns-contact">
          <div className="sec-eye" style={{textAlign:'center', color:'var(--coral)'}}>Need Help?</div>
          <h2 className="sec-title" style={{textAlign:'center'}}>We're <em>Here.</em></h2>
          <p className="returns-contact-desc" style={{textAlign:'center'}}>
            Questions about returns or exchanges? We're here to help.
          </p>
          <div className="returns-contact-methods">
            <a href="mailto:returns@vibinstore.com" className="contact-method">
              <div className="contact-icon">📧</div>
              <div className="contact-label">returns@vibinstore.com</div>
              <div className="contact-sub">Email us anytime</div>
            </a>
            <a href="/contact" className="contact-method">
              <div className="contact-icon">💬</div>
              <div className="contact-label">Contact Form</div>
              <div className="contact-sub">Fill out our form</div>
            </a>
          </div>
        </div>
      </section>

      <footer>
        <div className="foot-top">Vibin <em>Different.</em></div>
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
              <li><a href="/shop">New Drop</a></li>
              <li><a href="/shop">Tees</a></li>
              <li><a href="/shop">Hoodies</a></li>
              <li><a href="/shop">Headwear</a></li>
            </ul>
          </div>
          <div className="foot-col">
            <h4>Help</h4>
            <ul>
              <li><a href="/shipping">Shipping</a></li>
              <li><a href="/returns">Returns</a></li>
              <li><a href="/size-guide">Size Guide</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </div>
          <div className="foot-col">
            <h4>Connect</h4>
            <ul>
              <li>Instagram</li>
              <li>TikTok</li>
              <li>Twitter / X</li>
              <li><a href="/lookbook">Lookbook</a></li>
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
        .returns-hero { position: relative; background: var(--ink); color: var(--cream); padding: 100px 60px; text-align: center; }
        .returns-hero-content { max-width: 700px; margin: 0 auto; }
        .returns-title { font-family: Anton, sans-serif; font-size: clamp(60px, 8vw, 100px); line-height: .85; letter-spacing: -.005em; text-transform: uppercase; margin-bottom: 16px; }
        .returns-title em { font-style: italic; color: var(--coral); text-shadow: 0 0 40px rgba(255,74,61,.4); }
        .returns-subtitle { font-family: Manrope, sans-serif; font-size: 16px; line-height: 1.7; color: rgba(246,241,231,.8); }
        .returns-content { padding: 100px 60px; }
        .returns-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; max-width: 1400px; margin: 0 auto 80px; }
        @media (max-width: 900px) { .returns-grid { grid-template-columns: 1fr; } }
        .policy-card { background: var(--cream2); border: 1px solid var(--line); padding: 30px; margin-bottom: 24px; transition: border-color .2s; }
        .policy-card:hover { border-color: var(--ink); }
        .policy-icon { font-size: 32px; margin-bottom: 16px; }
        .policy-title { font-family: Anton, sans-serif; font-size: 24px; text-transform: uppercase; letter-spacing: -.005em; margin-bottom: 12px; }
        .policy-desc { font-family: Manrope, sans-serif; font-size: 14px; line-height: 1.7; color: var(--muted); }
        .sec-eye { font-family: JetBrains Mono, monospace; font-size: 11px; letter-spacing: .2em; text-transform: uppercase; color: var(--coral); margin-bottom: 12px; }
        .sec-title { font-family: Anton, sans-serif; font-size: clamp(48px, 7vw, 96px); letter-spacing: -.005em; line-height: .9; text-transform: uppercase; color: var(--ink); margin-bottom: 32px; }
        .sec-title em { font-style: italic; color: var(--coral); }
        .step { display: flex; gap: 24px; margin-bottom: 32px; }
        .step-num { font-family: JetBrains Mono, monospace; font-size: 11px; letter-spacing: .15em; text-transform: uppercase; color: var(--coral); padding-top: 4px; flex-shrink: 0; }
        .step-content h4 { font-family: Manrope, sans-serif; font-size: 16px; font-weight: 700; margin-bottom: 8px; text-transform: uppercase; letter-spacing: .05em; }
        .step-content p { font-family: Manrope, sans-serif; font-size: 14px; line-height: 1.7; color: var(--muted); }
        .step-content strong { color: var(--ink); }
        .returns-nonreturnable { max-width: 800px; margin: 0 auto 80px; }
        .nonreturn-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 32px; }
        @media (max-width: 600px) { .nonreturn-grid { grid-template-columns: 1fr; } }
        .nonreturn-item { background: var(--cream2); border: 1px solid var(--line); padding: 20px; font-family: Manrope, sans-serif; font-size: 14px; color: var(--muted); text-align: center; }
        .returns-contact { max-width: 800px; margin: 0 auto; }
        .returns-contact-desc { font-family: Manrope, sans-serif; font-size: 15px; line-height: 1.7; color: var(--muted); max-width: 600px; margin: 0 auto 32px; }
        .returns-contact-methods { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        @media (max-width: 600px) { .returns-contact-methods { grid-template-columns: 1fr; } }
        .contact-method { background: var(--cream2); border: 1px solid var(--line); padding: 30px; text-align: center; text-decoration: none; color: inherit; transition: border-color .2s; }
        .contact-method:hover { border-color: var(--ink); }
        .contact-icon { font-size: 32px; margin-bottom: 12px; }
        .contact-label { font-family: Manrope, sans-serif; font-size: 14px; font-weight: 700; margin-bottom: 6px; }
        .contact-sub { font-family: JetBrains Mono, monospace; font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); }
        .foot-col li { margin-bottom: 8px; font-family: 'Manrope', sans-serif; font-size: 13px; color: rgba(246,241,231,.7); cursor: pointer; transition: color .2s; list-style: none; }
        .foot-col li a { color: rgba(246,241,231,.7); text-decoration: none; }
        .foot-col li:hover, .foot-col li a:hover { color: var(--cream); }
        @media (max-width: 768px) {
          .returns-hero, .returns-content { padding-left: 24px; padding-right: 24px; }
        }
      ` }} />
    </>
  )
}
