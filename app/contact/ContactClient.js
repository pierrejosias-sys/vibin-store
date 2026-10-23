'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '../lib/cart-context'
import styles from '../styles.css'

const CONTACT_EMAIL = 'hello@vibinapparel.com'
const PHONE_DISPLAY = '(786) 716-1673'
const PHONE_TEL = '+17867161673'

const label = { display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '8px' }
const field = { width: '100%', padding: '14px', border: '1px solid var(--ink)', background: 'transparent', fontFamily: 'Manrope, sans-serif', fontSize: '15px', marginBottom: '20px', boxSizing: 'border-box' }
const h3 = { fontFamily: 'Anton, sans-serif', fontSize: '24px', textTransform: 'uppercase', marginBottom: '16px', color: 'var(--coral)' }

export default function ContactPage() {
  const { cartCount } = useCart() || {}
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  // No inbound contact/support email API exists in this app, so the form opens
  // the visitor's mail client with the message pre-filled.
  function onSubmit(e) {
    e.preventDefault()
    const subject = form.subject || `Message from ${form.name}`
    const body = `${form.message}\n\n— ${form.name} (${form.email})`
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    setSent(true)
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <nav>
        <Link href="/" className="logo">VIBIN</Link>
        <div className="nav-links">
          <Link href="/shop">Shop</Link>
          <Link href="/drop/01">New Drop</Link>
          <Link href="/lookbook">Lookbook</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
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
        <Link href="/">Home</Link> / <span className="current">Contact</span>
      </div>

      <section style={{maxWidth:'800px',margin:'0 auto',padding:'60px 20px'}}>
        <h1 style={{fontFamily:'Anton, sans-serif',fontSize:'56px',textTransform:'uppercase',marginBottom:'40px'}}>Contact</h1>

        <div style={{marginBottom:'40px',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'24px'}}>
          <div>
            <h3 style={h3}>Call</h3>
            <p><a href={`tel:${PHONE_TEL}`} style={{color:'inherit'}}>{PHONE_DISPLAY}</a></p>
          </div>
          <div>
            <h3 style={h3}>Visit</h3>
            <address style={{fontStyle:'normal',lineHeight:1.6}}>
              1285 West 26th Street<br/>Jacksonville, FL 32209
            </address>
          </div>
          <div>
            <h3 style={h3}>Email</h3>
            <p><a href={`mailto:${CONTACT_EMAIL}`} style={{color:'inherit'}}>{CONTACT_EMAIL}</a></p>
          </div>
        </div>

        <div style={{marginBottom:'40px',padding:'20px',background:'var(--cream2)',borderRadius:'8px'}}>
          <h3 style={{...h3,color:'inherit'}}>Send a Message</h3>
          <form onSubmit={onSubmit}>
            <label style={label} htmlFor="c-name">Name</label>
            <input id="c-name" style={field} required value={form.name} onChange={set('name')} />
            <label style={label} htmlFor="c-email">Email</label>
            <input id="c-email" type="email" style={field} required value={form.email} onChange={set('email')} />
            <label style={label} htmlFor="c-subject">Subject</label>
            <input id="c-subject" style={field} value={form.subject} onChange={set('subject')} />
            <label style={label} htmlFor="c-message">Message</label>
            <textarea id="c-message" rows={6} style={field} required value={form.message} onChange={set('message')} />
            <button type="submit" className="nl-btn" style={{cursor:'pointer'}}>Send Message</button>
          </form>
          {sent && <p style={{marginTop:'16px'}}>Your email app should open with your message. If it didn&apos;t, email us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>}
        </div>
      </section>
    </>
  )
}
