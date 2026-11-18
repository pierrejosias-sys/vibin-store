'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useCart } from '../lib/cart-context'
import { FREE_SHIPPING_LABEL } from '../lib/shipping'
import { useDropPhase } from '../lib/use-drop-phase'
import { DROP_01 } from '../lib/drop-public.mjs'
import { dropPromoLine } from '../lib/drop-copy.mjs'

const LINKS = [
  { href: '/shop', label: 'Shop' },
  { href: '/drop/01', label: 'Drop 01 ★', accent: true },
  { href: '/lookbook', label: 'Lookbook' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

const ICON = { textDecoration: 'none', color: 'inherit' }

// Supabase's browser client keeps the session in an sb-<project>-auth-token cookie, so a cookie
// check answers "signed in?" without loading the Supabase library on every page.
function hasSessionCookie() {
  try { return /(?:^|;\s*)sb-[a-z0-9]+-auth-token/.test(document.cookie) } catch { return false }
}

/** Promo bar + sticky nav shared by every storefront page. dark = for dark pages (Drop 01). */
export default function SiteHeader({ dark = false, promo = true }) {
  const { cartCount } = useCart()
  const [signedIn, setSignedIn] = useState(false)
  const [open, setOpen] = useState(false)
  // The drop line follows the pre-order window (opens / open / closed) instead of claiming "live".
  const { phase } = useDropPhase(DROP_01)
  const promoItems = [
    `Free shipping on orders over ${FREE_SHIPPING_LABEL}`,
    dropPromoLine(DROP_01, phase),
    'Sign up for 15% off your first order',
  ]

  useEffect(() => {
    const sync = () => setSignedIn(hasSessionCookie())
    sync()
    window.addEventListener('focus', sync)
    window.addEventListener('pageshow', sync)
    return () => {
      window.removeEventListener('focus', sync)
      window.removeEventListener('pageshow', sync)
    }
  }, [])

  return (
    <>
      {promo && (
        <div className="promo">
          <div className="promo-track">
            {[...promoItems, ...promoItems].map((text, i) => <span key={i}>{text}</span>)}
          </div>
        </div>
      )}

      <nav className={dark ? 'site-nav--dark' : undefined}>
        <Link href="/" className="logo">VIBIN</Link>
        <div className="nav-links">
          {LINKS.map(l => (
            <Link key={l.href} href={l.href} className={l.accent ? 'new' : undefined} style={l.accent ? { color: 'var(--coral)' } : undefined}>{l.label}</Link>
          ))}
        </div>
        <div className="nav-actions">
          <Link href="/search" className="nav-icon" aria-label="Search" style={ICON}>🔍</Link>
          <Link href={signedIn ? '/profile' : '/login'} className="nav-icon" aria-label={signedIn ? 'Your account' : 'Sign in'} style={ICON}>👤</Link>
          <Link href="/cart" className="nav-icon" aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : 'Cart'} style={ICON}>
            🛒{cartCount > 0 && <span className="cart-dot">{cartCount}</span>}
          </Link>
          <button type="button" className="nav-burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(o => !o)}>
            {open ? '✕' : '☰'}
          </button>
        </div>
        <div className={`nav-menu${open ? ' open' : ''}`}>
          {LINKS.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</Link>
          ))}
        </div>
      </nav>
    </>
  )
}
