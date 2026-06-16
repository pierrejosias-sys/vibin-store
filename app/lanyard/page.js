'use client'

import { useState } from 'react'
import Link from 'next/link'

const COLORWAYS = [
  { name: 'Black / Teal',   strap: '#0d0d0d', text: '#01696f', hardware: '#8a8a8a', badge: '#01696f', badgeText: '#fff',   hex: '#0d0d0d' },
  { name: 'Teal / Black',   strap: '#01696f', text: '#0d0d0d', hardware: '#5a5a5a', badge: '#0d0d0d', badgeText: '#01696f', hex: '#01696f' },
  { name: 'Forest / Cream', strap: '#1a2e1a', text: '#f5f0e8', hardware: '#7a7a7a', badge: '#f5f0e8', badgeText: '#1a2e1a', hex: '#1a2e1a' },
  { name: 'Sand / Black',   strap: '#c8b89a', text: '#0d0d0d', hardware: '#9a9a9a', badge: '#0d0d0d', badgeText: '#c8b89a', hex: '#c8b89a' },
]

export default function LanyardPage() {
  const [color, setColor] = useState(0)
  const [added, setAdded] = useState(false)
  const [qty, setQty] = useState(1)
  const cw = COLORWAYS[color]

  function addToCart() {
    try {
      const cart = JSON.parse(localStorage.getItem('vibin_cart') || '[]')
      const existing = cart.find(i => i.id === 'lanyard-001' && i.color === cw.name)
      if (existing) { existing.qty += qty } else {
        cart.push({ id: 'lanyard-001', name: 'Vibin Lanyard', price: 18, color: cw.name, size: 'OS', qty, slug: 'lanyard' })
      }
      localStorage.setItem('vibin_cart', JSON.stringify(cart))
    } catch(e) {}
    setAdded(true)
    setTimeout(() => setAdded(false), 2200)
  }

  // Repeated VIBIN text positions along the strap
  const vibinRepeats = Array.from({ length: 9 }, (_, i) => 60 + i * 52)

  return (
    <>
      <style>{`
        @import url('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&f[]=cabinet-grotesk@800,900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { -webkit-font-smoothing: antialiased; scroll-behavior: smooth; }
        body { font-family: 'Satoshi', sans-serif; background: #0a0a0a; color: #e8e6e0; min-height: 100dvh; }
        a { color: inherit; text-decoration: none; }
        button { cursor: pointer; border: none; background: none; font: inherit; color: inherit; }

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

        .breadcrumb {
          padding: 1rem 2rem;
          font-size: 0.78rem;
          color: #666;
          letter-spacing: 0.04em;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .breadcrumb a:hover { color: #01696f; }
        .breadcrumb .cur { color: #e8e6e0; }

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

        /* LANYARD CANVAS */
        .lanyard-canvas {
          width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 20px;
          background: linear-gradient(145deg, #111 0%, #1a1a1a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          transition: background 0.4s ease;
        }
        .lanyard-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 30%, rgba(1,105,111,0.12) 0%, transparent 65%);
          pointer-events: none;
        }
        .lanyard-svg { width: 52%; max-width: 260px; filter: drop-shadow(0 20px 60px rgba(0,0,0,0.7)); }

        /* THUMBS */
        .thumbs { display: flex; gap: 0.6rem; margin-top: 1rem; }
        .thumb {
          width: 48px; height: 48px;
          border-radius: 8px;
          cursor: pointer;
          border: 2px solid transparent;
          transition: border-color 0.2s;
        }
        .thumb.on { border-color: #01696f; outline: 2px solid #01696f; outline-offset: 2px; }

        /* DETAILS */
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
        .colorway-name { font-size: 0.85rem; color: #777; margin-bottom: 1.5rem; letter-spacing: 0.04em; }
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
        .desc {
          font-size: 0.95rem;
          line-height: 1.7;
          color: #9a9893;
          margin-bottom: 2rem;
          max-width: 44ch;
        }
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

        .qty-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
        .qty-ctrl {
          display: flex;
          align-items: center;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          overflow: hidden;
        }
        .qty-ctrl button {
          width: 40px; height: 44px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.2rem; color: #aaa;
          transition: background 0.15s, color 0.15s;
        }
        .qty-ctrl button:hover { background: rgba(255,255,255,0.06); color: #fff; }
        .qty-ctrl input {
          width: 44px; height: 44px;
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

      {/* PROMO */}
      <div className="promo">✦ Drop 01 — Lanyard Now Live · Free Shipping on Orders $75+ ✦</div>

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
        <Link href="/">Home</Link> / <Link href="/shop">Shop</Link> / <span className="cur">Vibin Lanyard</span>
      </div>

      {/* PDP */}
      <div className="pdp">

        {/* GALLERY */}
        <div className="gallery">
          <div className="lanyard-canvas">
            <div className="lanyard-glow" />

            <svg
              className="lanyard-svg"
              viewBox="0 0 160 520"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Vibin Apparel Lanyard"
            >
              {/* ── SWIVEL CLIP ── */}
              {/* Clip body */}
              <rect x="62" y="8" width="36" height="18" rx="5" fill={cw.hardware} />
              {/* Clip gate */}
              <rect x="74" y="4" width="12" height="10" rx="3" fill={cw.hardware} stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
              {/* Clip highlight */}
              <rect x="64" y="10" width="8" height="4" rx="2" fill="rgba(255,255,255,0.18)"/>
              {/* Clip connector ring */}
              <ellipse cx="80" cy="28" rx="7" ry="5" stroke={cw.hardware} strokeWidth="3" fill="none"/>

              {/* ── STRAP BODY — left side ── */}
              <rect x="60" y="33" width="18" height="450" rx="4" fill={cw.strap} />
              {/* Left strap edge highlight */}
              <rect x="60" y="33" width="2" height="450" rx="1" fill="rgba(255,255,255,0.06)"/>
              {/* Left strap edge shadow */}
              <rect x="76" y="33" width="2" height="450" rx="1" fill="rgba(0,0,0,0.18)"/>

              {/* ── STRAP BODY — right side ── */}
              <rect x="82" y="33" width="18" height="450" rx="4" fill={cw.strap} />
              {/* Right strap edge highlight */}
              <rect x="82" y="33" width="2" height="450" rx="1" fill="rgba(255,255,255,0.06)"/>
              {/* Right strap edge shadow */}
              <rect x="98" y="33" width="2" height="450" rx="1" fill="rgba(0,0,0,0.18)"/>

              {/* ── CENTER GAP (neck break) ── */}
              <rect x="78" y="33" width="4" height="450" fill="#0a0a0a"/>

              {/* ── VIBIN TEXT REPEATED DOWN LEFT STRAP ── */}
              {vibinRepeats.map((y, i) => (
                <text
                  key={`l-${i}`}
                  x="69"
                  y={y}
                  textAnchor="middle"
                  fontFamily="'Cabinet Grotesk', Arial Black, sans-serif"
                  fontWeight="900"
                  fontSize="7"
                  fill={cw.text}
                  letterSpacing="0.5"
                  transform={`rotate(90, 69, ${y})`}
                >VIBIN</text>
              ))}

              {/* ── VIBIN TEXT REPEATED DOWN RIGHT STRAP ── */}
              {vibinRepeats.map((y, i) => (
                <text
                  key={`r-${i}`}
                  x="91"
                  y={y}
                  textAnchor="middle"
                  fontFamily="'Cabinet Grotesk', Arial Black, sans-serif"
                  fontWeight="900"
                  fontSize="7"
                  fill={cw.text}
                  letterSpacing="0.5"
                  transform={`rotate(90, 91, ${y})`}
                >VIBIN</text>
              ))}

              {/* ── SAFETY BREAKAWAY BUCKLE ── */}
              <rect x="56" y="215" width="48" height="14" rx="4" fill={cw.hardware} stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
              <rect x="76" y="213" width="8" height="18" rx="2" fill="rgba(0,0,0,0.3)"/>
              <rect x="58" y="217" width="12" height="4" rx="1" fill="rgba(255,255,255,0.15)"/>

              {/* ── BADGE CARD HOLDER at bottom ── */}
              {/* Badge card */}
              <rect x="42" y="460" width="76" height="52" rx="5" fill={cw.badge} stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
              {/* Badge VIBIN wordmark */}
              <text
                x="80"
                y="481"
                textAnchor="middle"
                fontFamily="'Cabinet Grotesk', Arial Black, sans-serif"
                fontWeight="900"
                fontSize="10"
                fill={cw.badgeText}
                letterSpacing="2"
              >VIBIN</text>
              {/* Badge sub-line */}
              <text
                x="80"
                y="495"
                textAnchor="middle"
                fontFamily="'Satoshi', Arial, sans-serif"
                fontWeight="500"
                fontSize="5.5"
                fill={cw.badgeText}
                fillOpacity="0.65"
                letterSpacing="1.5"
              >APPAREL · JXV FL</text>
              {/* Badge barcode lines (decorative) */}
              {[48,50,52,54,56,59,61,63,65,67,70,72,74,76,78,111].map((x, i) => (
                <rect key={i} x={x} y="500" width={i % 3 === 0 ? 2 : 1} height="8" rx="0.5" fill={cw.badgeText} fillOpacity="0.3"/>
              ))}
              {/* Badge hole at top */}
              <circle cx="80" cy="462" r="3" fill="rgba(0,0,0,0.4)"/>

              {/* ── STRAP-TO-BADGE CONNECTOR ── */}
              <rect x="77" y="483" width="6" height="14" rx="2" fill={cw.hardware}/>

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
          <div className="eye">★ Vibin Apparel · Accessories · Drop 01</div>
          <h1 className="title">Vibin<br/><em>Lanyard.</em></h1>
          <div className="colorway-name">{cw.name}</div>

          <div className="price">
            $18.00 <span className="tag">NEW</span>
          </div>

          <p className="desc">
            Sublimation-printed 3/4" woven lanyard with the VIBIN wordmark repeating down both sides of the strap. Features a safety breakaway buckle, swivel metal clip, and a branded badge card holder. The everyday carry piece that reps the brand wherever you go.
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
            Standard 18" drop · One Size
          </div>

          {/* QTY + ATC */}
          <div className="qty-row">
            <div className="qty-ctrl">
              <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <input type="text" value={qty} readOnly />
              <button onClick={() => setQty(Math.min(10, qty + 1))}>+</button>
            </div>
            <button className={`btn-atc ${added ? 'done' : ''}`} onClick={addToCart}>
              {added ? `✓ Added to Bag` : `Add to Bag · $${(18 * qty).toFixed(2)}`}
            </button>
          </div>

          {/* FEATURES */}
          <div className="features">
            <div className="feat">
              <span className="feat-icon">🔗</span>
              <div>
                <div className="feat-name">Swivel Clip</div>
                <div className="feat-desc">Sturdy metal swivel hook</div>
              </div>
            </div>
            <div className="feat">
              <span className="feat-icon">✦</span>
              <div>
                <div className="feat-name">Full Sublimation</div>
                <div className="feat-desc">VIBIN repeat print, edge to edge</div>
              </div>
            </div>
            <div className="feat">
              <span className="feat-icon">🛡️</span>
              <div>
                <div className="feat-name">Safety Breakaway</div>
                <div className="feat-desc">Quick-release buckle at neck</div>
              </div>
            </div>
            <div className="feat">
              <span className="feat-icon">🪪</span>
              <div>
                <div className="feat-name">Badge Holder</div>
                <div className="feat-desc">Branded card sleeve included</div>
              </div>
            </div>
          </div>

          {/* SPECS */}
          <div className="specs">
            {[
              ['Width',      '3/4 inch (19mm)'],
              ['Length',     '18 inch drop (36" total)'],
              ['Print',      'Full sublimation, both sides'],
              ['Hardware',   'Swivel metal clip + key ring'],
              ['Buckle',     'Safety breakaway at neck'],
              ['Attachment', 'Branded badge card holder'],
              ['MOQ',        'Available individually'],
              ['Origin',     'Designed in Jacksonville, FL'],
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
