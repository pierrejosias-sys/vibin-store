'use client'

import { useEffect, useState } from 'react'
import { offersBackInStock } from '../lib/back-in-stock-rules.mjs'

/**
 * "Notify me when back in stock" on the product page. Shows only for sold-out or coming-soon products.
 * One email field. The sign-up is for the size (and colour) the shopper has selected, so nobody is
 * emailed about a size they didn't ask for. Saves via /api/back-in-stock (back_in_stock_signups),
 * which is separate from the Drop 01 waitlist.
 */
export default function BackInStockSignup({ product, size, color }) {
  const productId = product?.id
  const productName = product?.name || 'this piece'
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const sizeLabel = size && size !== 'OS' ? size : ''
  const what = [color, sizeLabel ? `size ${sizeLabel}` : ''].filter(Boolean).join(', ')

  // A new size or colour is a new request: show the form again.
  useEffect(() => { if (status === 'done') setStatus('idle') }, [size, color]) // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(e) {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setStatus('error'); setMessage('Enter a valid email.'); return }
    setStatus('loading')
    try {
      const res = await fetch('/api/back-in-stock', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), productId, size: size || '', color: color || '' }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) { setStatus('done'); return }
      setStatus('error'); setMessage(data.error || 'Something went wrong. Try again.')
    } catch {
      setStatus('error'); setMessage('Something went wrong. Try again.')
    }
  }

  // Renders nothing for products that are in stock (checked after the hooks, per the rules of hooks).
  if (!offersBackInStock(product)) return null

  const box = { marginTop: 16, padding: '16px', border: '1.5px solid var(--ink, #0a0a0a)', background: 'var(--cream, #f6f1e7)' }
  const label = { fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }

  if (status === 'done') {
    return (
      <div style={box} role="status" aria-live="polite">
        <div style={label}>You're on the list</div>
        <div style={{ fontSize: 14 }}>We'll email you once when {productName}{what ? ` (${what})` : ''} is back in stock. That's the only email this sign-up sends.</div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} style={box} noValidate>
      <div style={label}>Notify me when back in stock</div>
      <div style={{ fontSize: 13, marginBottom: 10 }}>
        {what ? <>For <strong>{what}</strong>. Pick another size above to ask about that one instead.</> : 'Get one email when it’s back.'}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="email" required value={email} onChange={e => setEmail(e.target.value)}
          placeholder="Your email" aria-label={`Email to hear when ${productName} is back in stock`}
          style={{ flex: 1, minWidth: 0, padding: '10px 12px', fontSize: 14, border: '1.5px solid var(--ink, #0a0a0a)', background: 'transparent', color: 'inherit' }}
        />
        <button type="submit" disabled={status === 'loading'} style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700, border: 'none', background: 'var(--ink, #0a0a0a)', color: 'var(--cream, #f6f1e7)', cursor: 'pointer' }}>
          {status === 'loading' ? '…' : 'Notify me'}
        </button>
      </div>
      {status === 'error' && <div role="alert" style={{ fontSize: 12, color: '#c0392b', marginTop: 6 }}>{message}</div>}
    </form>
  )
}
