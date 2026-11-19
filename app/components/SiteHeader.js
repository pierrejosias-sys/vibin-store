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

// Line icons drawn in currentColor, so they follow the nav's text color (off-white on dark pages).
// Emoji (🔍👤🛒) render as color pictures on iPhone, which clashed with the rest of the nav.
const SVG = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: 'false' }
export function SearchIcon() { return <svg {...SVG}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg> }
export function AccountIcon() { return <svg {...SVG}><circle cx="12" cy="8.5" r="3.75" /><path d="M4.5 20c1.2-3.6 4.1-5.5 7.5-5.5s6.3 1.9 7.5 5.5" /></svg> }
export function BagIcon() { return <svg {...SVG}><path d="M5.5 8h13l-1 12.5h-11z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg> }
export function MenuIcon() { return <svg {...SVG}><path d="M4 7h16M4 12h16M4 17h16" /></svg> }
export function CloseIcon() { return <svg {...SVG}><path d="M6 6l12 12M18 6L6 18" /></svg> }

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
          <Link href="/search" className="nav-icon" aria-label="Search" style={ICON}><SearchIcon /></Link>
          <Link href={signedIn ? '/profile' : '/login'} className="nav-icon" aria-label={signedIn ? 'Your account' : 'Sign in'} style={ICON}><AccountIcon /></Link>
          <Link href="/cart" className="nav-icon" aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : 'Cart'} style={ICON}>
            <BagIcon />{cartCount > 0 && <span className="cart-dot">{cartCount}</span>}
          </Link>
          <button type="button" className="nav-burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(o => !o)}>
            {open ? <CloseIcon /> : <MenuIcon />}
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
