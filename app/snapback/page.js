'use client'

import { useState } from 'react'
import Link from 'next/link'

const COLORWAYS = [
  { name: 'Black / Teal', bg: '#0d0d0d', accent: '#01696f', brim: '#01696f', hex: '#0d0d0d' },
  { name: 'All Black', bg: '#0d0d0d', accent: '#ffffff', brim: '#0d0d0d', hex: '#111111' },
  { name: 'Forest / Cream', bg: '#1a2e1a', accent: '#f5f0e8', brim: '#1a2e1a', hex: '#1a2e1a' },
  { name: 'Sand / Black', bg: '#c8b89a', accent: '#0d0d0d', brim: '#0d0d0d', hex: '#c8b89a' },
]

export default function SnapbackPage() {
  const [color, setColor] = useState(0)
  const [added, setAdded] = useState(false)
  const [qty, setQty] = useState(1)
  const cw = COLORWAYS[color]

  function addToCart() {
    try {
      const cart = JSON.parse(localStorage.getItem('vibin_cart') || '[]')
      const existing = cart.find(i => i.id === 'snapback-001' && i.color === cw.name)
      if (existing) { existing.qty += qty } else {
        cart.push({ id: 'snapback-001', name: 'Vibin Snapback', price: 38, color: cw.name, size: 'OS', qty, slug: 'snapback' })
      }
      localStorage.setItem('vibin_cart', JSON.stringify(cart))
    } catch(e) {}
    setAdded(true)
    setTimeout(() => setAdded(false), 2200)
  }

  return (
    <>
      <style>{`
        @import url('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&f[]=cabinet-grotesk@800,900&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { -webkit-font-smoothing: antialiased; scroll-behavior: smooth; }
        body { font-family: 'Satoshi', sans-serif; background: #0a0a0a; color: #e8e6e0; min-height: 100dvh; }
        a { color: inherit; text-decoration: none; }
        button { cursor: pointer; border: none; background: none; font: inherit; color: inherit; }

        /* PROMO */
        .promo {
          background: #01696f;
          color: #fff;
          text-align: center;
          padding: 8px 1rem;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        /* NAV */
        nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
          height: 60px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          background: #0a0a0a;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .logo {
          font-family: 'Cabinet Grotesk', sans-serif;
          font-weight: 900;
          font-size: 1.4rem;
          letter-spacing: 0.08em;
          color: #e8e6e0;
        }
        .nav-links { display: flex; gap: 1.8rem; font-size: 0.85rem; font-weight: 500; letter-spacing: 0.04em; color: #aaa; }
        .nav-links a:hover { color: #e8e6e0; }
        .nav-actions { display: flex; gap: 1rem; align-items: center; font-size: 0.9rem; }
        .nav-icon { position: relative; }

        /* BREADCRUMB */
        .breadcrumb {
          padding: 1rem 2rem;
          font-size: 0.78rem;
          color: #666;
          letter-spacing: 0.04em;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .breadcrumb a:hover { color: #01696f; }
        .breadcrumb .cur { color: #e8e6e0; }

        /* PDP LAYOUT */
        .pdp {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          max-width: 1100px;
          margin: 0 auto;
          padding: 3rem 2rem 5rem;
        }
        @media (max-width: 768px) {
          .pdp { grid-template-columns: 1fr; gap: 2.5rem; padding: 2rem 1.25rem 4rem; }
          nav { padding: 0 1.25rem; }
          .nav-links { display: none; }
        }

        /* GALLERY */
        .gallery {}
        .hat-canvas {
          width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 20px;
          overflow: hidden;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.4s ease;
        }
        .hat-bg {
          position: absolute;
          inset: 0;
          opacity: 0.08;
          background: radial-gradient(circle at 40% 35%, currentColor 0%, transparent 70%);
        }

        /* SVG Hat Drawing */
        .hat-svg { width: 72%; max-width: 380px; filter: drop-shadow(0 20px 60px rgba(0,0,0,0.6)); }

        /* Color thumbs */
        .thumbs {
          display: flex;
          gap: 0.6rem;
          margin-top: 1rem;
        }
        .thumb {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          cursor: pointer;
          border: 2px solid transparent;
          transition: border-color 0.2s;
          flex-shrink: 0;
        }
        .thumb.on { border-color: #01696f; outline: 2px solid #01696f; outline-offset: 2px; }

        /* DETAILS */
        .details {}
        .eye {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #01696f;
          margin-bottom: 0.75rem;
        }
        .title {
          font-family: 'Cabinet Grotesk', sans-serif;
          font-weight: 900;
          font-size: clamp(2rem, 4vw, 2.8rem);
          line-height: 1.05;
          color: #f0eeea;
          margin-bottom: 0.3rem;
        }
        .title em { font-style: italic; color: #01696f; }
        .colorway-name {
          font-size: 0.85rem;
          color: #777;
          margin-bottom: 1.5rem;
          letter-spacing: 0.04em;
        }

        /* PRICE */
        .price {
          font-size: 1.6rem;
          font-weight: 700;
          color: #f0eeea;
          margin-bottom: 1.5rem;
        }
        .price .tag {
          font-size: 0.72rem;
          font-weight: 600;
          background: #01696f;
          color: #fff;
          padding: 3px 8px;
          border-radius: 20px;
          letter-spacing: 0.06em;
          margin-left: 0.5rem;
          vertical-align: middle;
        }

        /* DESC */
        .desc {
          font-size: 0.95rem;
          line-height: 1.7;
          color: #9a9893;
          margin-bottom: 2rem;
          max-width: 44ch;
        }

        /* COLOR OPTION */
        .opt-label {
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #777;
          margin-bottom: 0.6rem;
        }
        .opt-label .sel { color: #e8e6e0; }
        .color-row { display: flex; gap: 0.6rem; margin-bottom: 1.5rem; }
        .color-swatch {
          width: 36px; height: 36px;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid transparent;
          transition: border-color 0.2s, transform 0.15s;
        }
        .color-swatch:hover { transform: scale(1.08); }
        .color-swatch.on { border-color: #01696f; outline: 2px solid #01696f; outline-offset: 2px; }

        /* QTY */
        .qty-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
        .qty-ctrl {
          display: flex;
          align-items: center;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          overflow: hidden;
        }
        .qty-ctrl button {
          width: 40px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          color: #aaa;
          transition: background 0.15s, color 0.15s;
        }
        .qty-ctrl button:hover { background: rgba(255,255,255,0.06); color: #fff; }
        .qty-ctrl input {
          width: 44px;
          height: 44px;
          text-align: center;
          background: transparent;
          border: none;
          border-left: 1px solid rgba(255,255,255,0.08);
          border-right: 1px solid rgba(255,255,255,0.08);
          color: #e8e6e0;
          font-size: 0.95rem;
          font-weight: 600;
        }
        .qty-ctrl input:focus { outline: none; }

        /* ATC */
        .btn-atc {
          flex: 1;
          height: 52px;
          background: #01696f;
          color: #fff;
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          border-radius: 10px;
          transition: background 0.2s, transform 0.15s;
          text-transform: uppercase;
        }
        .btn-atc:hover { background: #0c4e54; }
        .btn-atc:active { transform: scale(0.98); }
        .btn-atc.done { background: #1a6e3a; }

        /* FEATURES */
        .features {
          margin-top: 2rem;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        .feat {
          display: flex;
          align-items: flex-start;
          gap: 0.6rem;
          padding: 0.85rem;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px;
          background: rgba(255,255,255,0.02);
        }
        .feat-icon { font-size: 1rem; flex-shrink: 0; margin-top: 1px; }
        .feat-name { font-size: 0.82rem; font-weight: 600; color: #d0cec9; margin-bottom: 2px; }
        .feat-desc { font-size: 0.75rem; color: #666; line-height: 1.4; }

        /* SPECS */
        .specs {
          margin-top: 2rem;
          border-top: 1px solid rgba(255,255,255,0.07);
          padding-top: 1.5rem;
        }
        .spec-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          font-size: 0.85rem;
        }
        .spec-k { color: #666; }
        .spec-v { color: #c8c6c0; font-weight: 500; }

        /* FOOTER */
        footer {
          border-top: 1px solid rgba(255,255,255,0.07);
          padding: 2.5rem 2rem;
          text-align: center;
        }
        .foot-logo {
          font-family: 'Cabinet Grotesk', sans-serif;
          font-weight: 900;
          font-size: 1.4rem;
          letter-spacing: 0.1em;
          color: #e8e6e0;
          margin-bottom: 0.5rem;
        }
        .foot-tag { font-size: 0.78rem; color: #555; letter-spacing: 0.04em; }
      `}</style>

      {/* PROMO BAR */}
      <div className="promo">✦ Drop 01 — Snapback Now Live · Free Shipping on Orders $75+ ✦</div>

      {/* NAV */}
      <nav>
        <Link href="/" className="logo">VIBIN</Link>
        <div className="nav-links">
          <Link href="/shop">Shop</Link>
          <Link href="/drop-01">New Drop</Link>
          <Link href="/lookbook">Lookbook</Link>
        </div>
        <div className="nav-actions">
          <Link href="/login" className="nav-icon" style={{fontSize:'1.1rem'}}>👤</Link>
          <Link href="/cart" className="nav-icon" style={{fontSize:'1.1rem'}}>🛒</Link>
        </div>
      </nav>

      {/* BREADCRUMB */}
      <div className="breadcrumb">
        <Link href="/">Home</Link> / <Link href="/shop">Shop</Link> / <span className="cur">Vibin Snapback</span>
      </div>

      {/* PDP */}
      <div className="pdp">

        {/* GALLERY */}
        <div className="gallery">
          <div className="hat-canvas" style={{ background: `linear-gradient(145deg, #111 0%, #1a1a1a 100%)` }}>
            <div className="hat-bg" style={{ color: cw.accent }} />

            {/* SVG Snapback Illustration */}
            <svg className="hat-svg" viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Vibin Snapback Hat">

              {/* BRIM */}
              <path
                d="M55 215 Q60 235 80 240 L320 240 Q340 235 345 215 L330 200 L70 200 Z"
                fill={cw.brim}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
              />
              {/* Brim underside stitching */}
              <path d="M75 228 L325 228" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4 4"/>

              {/* CROWN BODY */}
              <path
                d="M70 200 C65 180 60 140 80 100 C100 60 150 42 200 40 C250 42 300 60 320 100 C340 140 335 180 330 200 Z"
                fill={cw.bg}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1.5"
              />

              {/* CROWN PANELS — center seam */}
              <path d="M200 42 L200 200" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
              {/* Side panel seams */}
              <path d="M130 52 C120 100 115 155 118 200" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
              <path d="M270 52 C280 100 285 155 282 200" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>

              {/* BUTTON top */}
              <circle cx="200" cy="44" r="7" fill={cw.accent} stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>

              {/* FRONT PANEL — slightly lighter for depth */}
              <path
                d="M118 200 C116 165 120 120 130 90 C145 58 170 44 200 42 C230 44 255 58 270 90 C280 120 284 165 282 200 Z"
                fill={cw.bg}
                fillOpacity="0.5"
              />

              {/* VIBIN WORDMARK on crown */}
              <text
                x="200"
                y="132"
                textAnchor="middle"
                fontFamily="'Cabinet Grotesk', sans-serif"
                fontWeight="900"
                fontSize="28"
                fill={cw.accent}
                letterSpacing="4"
              >VIBIN</text>

              {/* Embroidered arc detail */}
              <path
                d="M155 145 Q200 155 245 145"
                stroke={cw.accent}
                strokeWidth="1.5"
                strokeOpacity="0.5"
                fill="none"
                strokeDasharray="3 3"
              />

              {/* SWEATBAND LINE */}
              <path
                d="M70 200 Q200 196 330 200"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="2"
                fill="none"
              />

              {/* SNAPBACK ADJUSTER */}
              <rect x="155" y="230" width="90" height="10" rx="3" fill="#1a1a1a" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
              {/* Snap holes */}
              {[170, 185, 200, 215, 230].map((x, i) => (
                <circle key={i} cx={x} cy="235" r="2.5" fill="rgba(255,255,255,0.15)"/>
              ))}

              {/* STITCHING detail on brim edge */}
              <path
                d="M62 218 Q200 214 338 218"
                stroke={cw.accent}
                strokeWidth="1"
                strokeOpacity="0.35"
                fill="none"
              />

            </svg>
          </div>

          {/* Color Thumbs */}
          <div className="thumbs">
            {COLORWAYS.map((c, i) => (
              <div
                key={c.name}
                className={`thumb ${color === i ? 'on' : ''}`}
                style={{ background: c.hex }}
                onClick={() => setColor(i)}
                title={c.name}
              />
            ))}
          </div>
        </div>

        {/* DETAILS */}
        <div className="details">
          <div className="eye">★ Vibin Apparel · Headwear · Drop 01</div>
          <h1 className="title">Vibin<br/><em>Snapback.</em></h1>
          <div className="colorway-name">{cw.name}</div>

          <div className="price">
            $38.00 <span className="tag">NEW</span>
          </div>

          <p className="desc">
            Structured 6-panel snapback with embroidered VIBIN wordmark on the front crown. Flat brim with tonal stitching. One-size-fits-most snap closure. Built for everyday wear — the cap that goes with everything in Drop 01.
          </p>

          {/* COLOR */}
          <div className="opt-label">Color · <span className="sel">{cw.name}</span></div>
          <div className="color-row">
            {COLORWAYS.map((c, i) => (
              <div
                key={c.name}
                className={`color-swatch ${color === i ? 'on' : ''}`}
                style={{ background: c.hex }}
                onClick={() => setColor(i)}
                title={c.name}
              />
            ))}
          </div>

          {/* SIZE */}
          <div className="opt-label">Size · <span className="sel">One Size</span></div>
          <div style={{ marginBottom: '1.5rem', padding: '0.7rem 1rem', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', fontSize: '0.85rem', color: '#aaa', display: 'inline-block' }}>
            One Size Fits Most (adjustable snap)
          </div>

          {/* QTY + ATC */}
          <div className="qty-row">
            <div className="qty-ctrl">
              <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <input type="text" value={qty} readOnly />
              <button onClick={() => setQty(Math.min(5, qty + 1))}>+</button>
            </div>
            <button className={`btn-atc ${added ? 'done' : ''}`} onClick={addToCart}>
              {added ? `✓ Added to Bag` : `Add to Bag · $${(38 * qty).toFixed(2)}`}
            </button>
          </div>

          {/* FEATURES */}
          <div className="features">
            <div className="feat">
              <span className="feat-icon">🧢</span>
              <div>
                <div className="feat-name">Structured Crown</div>
                <div className="feat-desc">6-panel, firm front panel</div>
              </div>
            </div>
            <div className="feat">
              <span className="feat-icon">✦</span>
              <div>
                <div className="feat-name">Embroidered Logo</div>
                <div className="feat-desc">Tonal VIBIN wordmark</div>
              </div>
            </div>
            <div className="feat">
              <span className="feat-icon">🔧</span>
              <div>
                <div className="feat-name">Snap Closure</div>
                <div className="feat-desc">Adjustable 5-snap back</div>
              </div>
            </div>
            <div className="feat">
              <span className="feat-icon">🧵</span>
              <div>
                <div className="feat-name">Flat Brim</div>
                <div className="feat-desc">Pre-curved or keep flat</div>
              </div>
            </div>
          </div>

          {/* SPECS */}
          <div className="specs">
            {[
              ['Material', '100% Structured Twill'],
              ['Fit', 'One Size Fits Most'],
              ['Closure', 'Adjustable Snapback'],
              ['Brim', 'Flat, 3.5 inch'],
              ['Crown', '6-Panel, High Profile'],
              ['Care', 'Spot Clean Only'],
              ['Origin', 'Designed in Jacksonville, FL'],
            ].map(([k, v]) => (
              <div className="spec-row" key={k}>
                <span className="spec-k">{k}</span>
                <span className="spec-v">{v}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      <footer>
        <div className="foot-logo">VIBIN</div>
        <div className="foot-tag">Apparel for those who move different · Jacksonville, FL · © 2026 HVD Holdings</div>
      </footer>
    </>
  )
}
