'use client'

// Hero wrapper: static brand gradient always renders first (SSR-safe, zero JS cost).
// The WebGL scene is lazy-loaded client-only after idle, and skipped entirely for
// prefers-reduced-motion users or browsers without WebGL.
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const Hero3DScene = dynamic(() => import('./Hero3DScene'), { ssr: false, loading: () => null })

export const HERO_FALLBACK_BG =
  'radial-gradient(ellipse 80% 40% at 50% 62%, rgba(233,201,154,0.55), transparent 70%),' +
  'linear-gradient(180deg, #06140f 0%, #0f3d2e 45%, #1f8a83 62%, #0b2a26 63%, #0a0a0a 100%)'

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
  } catch { return false }
}

export default function DropHero({ piecesPerStyle, children }) {
  const [enable3D, setEnable3D] = useState(false)
  const [mobile, setMobile] = useState(false)

  useEffect(() => {
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (rm.matches || !hasWebGL()) return
    setMobile(window.matchMedia('(max-width: 720px)').matches)
    const start = () => setEnable3D(true)
    const id = 'requestIdleCallback' in window ? window.requestIdleCallback(start, { timeout: 1500 }) : setTimeout(start, 300)
    const onChange = e => { if (e.matches) setEnable3D(false) }
    rm.addEventListener?.('change', onChange)
    return () => {
      rm.removeEventListener?.('change', onChange)
      if ('cancelIdleCallback' in window) window.cancelIdleCallback(id); else clearTimeout(id)
    }
  }, [])

  return (
    <section className="drop-hero" style={{ position: 'relative', minHeight: '88vh', overflow: 'hidden', background: HERO_FALLBACK_BG, display: 'flex', alignItems: 'flex-end' }}>
      <div aria-hidden="true" className="drop-hero-canvas" style={{ position: 'absolute', inset: 0 }}>
        {enable3D && <Hero3DScene piecesPerStyle={piecesPerStyle} mobile={mobile} />}
      </div>
      {/* Overlay: pointer-events pass through to the canvas except on interactive children */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', pointerEvents: 'none', padding: '96px 20px 48px', background: 'linear-gradient(180deg, transparent 0%, rgba(10,10,10,0.55) 55%, #0a0a0a 100%)' }}>
        <div className="drop-hero-overlay" style={{ maxWidth: 1100, margin: '0 auto' }}>{children}</div>
      </div>
      <style>{`.drop-hero-overlay a,.drop-hero-overlay button,.drop-hero-overlay input,.drop-hero-overlay form,.drop-hero-overlay p{pointer-events:auto}
      .drop-hero-pill{display:inline-block;border:1px solid rgba(243,234,215,.5);border-radius:999px;padding:6px 14px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#f3ead7;text-decoration:none;margin-right:8px;background:rgba(10,10,10,.35);backdrop-filter:blur(6px)}
      .drop-hero-hint{font-size:11px;letter-spacing:2px;text-transform:uppercase;opacity:.55;margin-top:14px}`}</style>
    </section>
  )
}
