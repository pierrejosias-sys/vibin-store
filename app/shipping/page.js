
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCart } from '../lib/cart-context'
import styles from '../styles.css'

export default function ShippingPage() {
  const { cart } = useCart()
  const cartCount = cart?.length || 0

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      
      <nav>
        <Link href="/" className="logo">VIBIN</Link>
        <div className="nav-links">
          <Link href="/shop">Shop</Link>
          <Link href="/shop">New Drop</Link>
          <Link href="/lookbook">Lookbook</Link>
          <Link href="/about">About</Link>
          <Link href="/returns">Stockists</Link>
        </div>
        <div className="nav-actions">
          <Link href="/qa" className="nav-icon" style={{textDecoration:'none',color:'inherit'}}>🔍</Link>
          <Link href="/login" className="nav-icon" style={{textDecoration:'none',color:'inherit'}}>👤</Link>
          <Link href="/cart" className="nav-icon" style={{textDecoration:'none',color:'inherit'}}>
            🛒{cartCount > 0 && <span className="cart-dot">{cartCount}</span>}
          </Link>
        </div>
      </nav>

      <div className="breadcrumb">
        <Link href="/">Home</Link> / <span className="current">Shipping</span>
      </div>

      <section style={{maxWidth:'800px',margin:'0 auto',padding:'60px 20px'}}>
        <h1 style={{fontFamily:'Anton, sans-serif',fontSize:'56px',textTransform:'uppercase',marginBottom:'40px'}}>Shipping</h1>
        
        <div style={{marginBottom:'40px'}}>
          <h3 style={{fontFamily:'Anton, sans-serif',fontSize:'24px',textTransform:'uppercase',marginBottom:'16px',color:'var(--coral)'}}>Delivery Times</h3>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{borderBottom:'2px solid var(--ink)'}}>
                <th style={{textAlign:'left',padding:'12px 0',fontFamily:'JetBrains Mono, monospace',fontSize:'11px',textTransform:'uppercase',letterSpacing:'.1em'}}>Method</th>
                <th style={{textAlign:'left',padding:'12px 0',fontFamily:'JetBrains Mono, monospace',fontSize:'11px',textTransform:'uppercase',letterSpacing:'.1em'}}>Time</th>
                <th style={{textAlign:'right',padding:'12px 0',fontFamily:'JetBrains Mono, monospace',fontSize:'11px',textTransform:'uppercase',letterSpacing:'.1em'}}>Price</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{borderBottom:'1px solid var(--line)'}}>
                <td style={{padding:'16px 0',fontWeight:'600'}}>Standard Shipping</td>
                <td style={{padding:'16px 0'}}>5–8 business days</td>
                <td style={{padding:'16px 0',textAlign:'right'}}>Free on orders over $75</td>
              </tr>
              <tr style={{borderBottom:'1px solid var(--line)'}}>
                <td style={{padding:'16px 0',fontWeight:'600'}}>Priority Shipping</td>
                <td style={{padding:'16px 0'}}>2–3 business days</td>
                <td style={{padding:'16px 0',textAlign:'right'}}>$12.99</td>
              </tr>
              <tr style={{borderBottom:'1px solid var(--line)'}}>
                <td style={{padding:'16px 0',fontWeight:'600'}}>Express Shipping</td>
                <td style={{padding:'16px 0'}}>1–2 business days</td>
                <td style={{padding:'16px 0',textAlign:'right'}}>$24.99</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{marginBottom:'40px',padding:'20px',background:'var(--cream2)',borderRadius:'8px'}}>
          <h3 style={{fontFamily:'Anton, sans-serif',fontSize:'24px',textTransform:'uppercase',marginBottom:'16px'}}>International</h3>
          <p>Currently shipping to US only. International drops coming SS27.</p>
        </div>

        <div style={{marginBottom:'40px'}}>
          <h3 style={{fontFamily:'Anton, sans-serif',fontSize:'24px',textTransform:'uppercase',marginBottom:'16px'}}>Processing</h3>
          <p>Orders are processed within 1–2 business days. You will receive a tracking number via email once your order ships.</p>
        </div>

        <div style={{padding:'20px',border:'2px solid var(--coral)',borderRadius:'8px'}}>
          <p>Looking for return info? <Link href="/returns" style={{color:'var(--coral)',fontWeight:'bold'}}>View our Returns Policy →</Link></p>
        </div>
      </section>

      <footer>
        <div className="foot-top">Vibin <em>Different.</em></div>
        <div className="foot-cols">
          <div className="foot-brand">
            <div className="foot-logo">VIBIN</div>
            <div className="foot-tagline">A lifestyle streetwear brand based in Jacksonville, FL. A subsidiary of HVD Holdings.</div>
          </div>
          <div className="foot-col">
            <h4>Shop</h4>
            <ul>
              <li><a href="/shop">All Products</a></li>
              <li><a href="/lookbook">Lookbook</a></li>
              <li><a href="/ambassador">Ambassador</a></li>
            </ul>
          </div>
          <div className="foot-col">
            <h4>Help</h4>
            <ul>
              <li><a href="/shipping">Shipping</a></li>
              <li><a href="/returns">Returns</a></li>
              <li><a href="/qa">FAQ</a></li>
              <li><a href="/returns">Contact</a></li>
            </ul>
          </div>
          <div className="foot-col">
            <h4>Connect</h4>
            <ul>
              <li><a href="https://instagram.com/vibinapparel" target="_blank" rel="noopener">Instagram</a></li>
              <li><a href="https://tiktok.com/@vibinapparel" target="_blank" rel="noopener">TikTok</a></li>
              <li><a href="/lookbook">Lookbook</a></li>
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <div>© 2026 Vibin Apparel · A subsidiary of HVD Holdings, LLC · Jacksonville, FL</div>
        </div>
      </footer>
    </>
  )
}

