'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '../lib/cart-context'
import styles from '../styles.css'
import { TOPIC_OPTIONS, createTicket, saveThread } from '../lib/support-client'

const CONTACT_EMAIL = 'hello@vibinapparel.com'
const PHONE_DISPLAY = '(786) 716-1673'
const PHONE_TEL = '+17867161673'

const label = { display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '8px' }
const field = { width: '100%', padding: '14px', border: '1px solid var(--ink)', background: 'transparent', fontFamily: 'Manrope, sans-serif', fontSize: '15px', marginBottom: '20px', boxSizing: 'border-box' }
const h3 = { fontFamily: 'Anton, sans-serif', fontSize: '24px', textTransform: 'uppercase', marginBottom: '16px', color: 'var(--coral)' }

export default function ContactPage() {
  const { cartCount } = useCart() || {}
  const [form, setForm] = useState({ name: '', email: '', orderNumber: '', topic: '', message: '', website: '' })
  const [sent, setSent] = useState(null)
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  // Submits into the support queue (support_chats/support_messages) via /api/support.
  async function onSubmit(e) {
    e.preventDefault()
    setError(null); setSending(true)
    try {
      const r = await createTicket({ ...form, source: 'contact' })
      if (r.ticket && r.token) saveThread(r)
      setSent(r.ticket || 'received')
      setForm({ name: '', email: '', orderNumber: '', topic: '', message: '', website: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
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
            <input id="c-name" style={field} maxLength={80} value={form.name} onChange={set('name')} autoComplete="name" />
            <label style={label} htmlFor="c-email">Email</label>
            <input id="c-email" type="email" style={field} required maxLength={254} value={form.email} onChange={set('email')} autoComplete="email" />
            <label style={label} htmlFor="c-topic">Topic</label>
            <select id="c-topic" style={field} required value={form.topic} onChange={set('topic')}>
              <option value="" disabled>Choose a topic</option>
              {TOPIC_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <label style={label} htmlFor="c-order">Order number (optional)</label>
            <input id="c-order" style={field} maxLength={40} placeholder="e.g. 1042" value={form.orderNumber} onChange={set('orderNumber')} />
            <label style={label} htmlFor="c-message">Message</label>
            <textarea id="c-message" rows={6} style={field} required maxLength={4000} value={form.message} onChange={set('message')} />
            {/* Honeypot: hidden from people, bots fill it in. */}
            <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: '1px', height: '1px', overflow: 'hidden' }}>
              <label htmlFor="c-website">Website</label>
              <input id="c-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
            </div>
            <button type="submit" className="nl-btn" style={{cursor:'pointer'}} disabled={sending}>{sending ? 'Sending…' : 'Send Message'}</button>
          </form>
          {error && <p role="alert" style={{marginTop:'16px',color:'var(--coral)'}}>{error}</p>}
          {sent && <p role="status" style={{marginTop:'16px'}}>Thanks, we got it{sent !== 'received' ? <> (ticket <strong>{sent}</strong>)</> : null}. We reply within 1 business day. You can follow the conversation anytime in the <strong>Help</strong> chat at the bottom right of this site on this device, or email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>}
        </div>
      </section>
    </>
  )
}
