'use client'

import Link from 'next/link'
import styles from '../styles.css'

export default function ReturnsPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      
      <nav>
        <Link href="/" className="logo">VIBIN</Link>
        <div className="nav-links">
          <Link href="/shop">Shop</Link>
          <Link href="/">Lookbook</Link>
          <Link href="/">About</Link>
        </div>
        <div className="nav-actions">
          <div className="nav-icon">🔍</div>
          <Link href="/login" className="nav-icon">👤</Link>
          <Link href="/cart" className="nav-icon">🛒</Link>
        </div>
      </nav>

      <div style={{ maxWidth: '800px', margin: '60px auto', padding: '0 32px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-1px', marginBottom: '32px' }}>
          Return <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--coral)' }}>Policy</em>
        </h1>

        <div style={{ lineHeight: 1.7, color: 'var(--muted)', fontSize: '14px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink)', margin: '24px 0 12px' }}>30-Day Returns</h2>
          <p>We want you to love your VIBIN pieces. If something isn't right, you have 30 days from delivery to initiate a return.</p>

          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink)', margin: '24px 0 12px' }}>Conditions</h2>
          <ul style={{ paddingLeft: '20px' }}>
            <li>Items must be unworn, unwashed, and in original packaging</li>
            <li>Tags must be attached</li>
            <li>Final sale items cannot be returned</li>
          </ul>

          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink)', margin: '24px 0 12px' }}>How to Return</h2>
          <ol style={{ paddingLeft: '20px' }}>
            <li>Email us at returns@vibinapparel.com with your order number</li>
            <li>We'll send you a return label within 24 hours</li>
            <li>Drop off at any authorized shipping location</li>
            <li>Refund processes within 5-7 business days of receipt</li>
          </ol>

          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink)', margin: '24px 0 12px' }}>Exchanges</h2>
          <p>Want a different size or color? Exchanges are free. Follow the same process and note "EXCHANGE" in your email.</p>

          <div style={{ marginTop: '40px', padding: '24px', background: 'var(--ink)', color: 'var(--cream)', fontSize: '13px' }}>
            Questions? Email us at <strong>returns@vibinapparel.com</strong> or use our <Link href="/" style={{ color: 'var(--coral)' }}>contact form</Link>.
          </div>
        </div>
      </div>

      <footer style={{ background: 'var(--ink)', color: 'var(--cream)', padding: '60px 32px 32px', marginTop: '60px' }}>
        <div className="foot-logo" style={{ fontSize: '24px', fontWeight: 900, marginBottom: '12px' }}>VIBIN</div>
        <div className="foot-tagline" style={{ fontSize: '13px', lineHeight: 1.6, opacity: 0.7 }}>
          A lifestyle streetwear brand from Miami, FL. Now based in Jacksonville. A subsidiary of HVD Holdings.
        </div>
      </footer>
    </>
  )
}
