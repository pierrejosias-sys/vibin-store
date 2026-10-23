'use client'

import { useState } from 'react'

/**
 * "Coming soon" waitlist for items that aren't produced yet.
 * Saves via /api/waitlist (waitlist_signups) with source `coming-soon-<slug>`.
 */
export default function ComingSoonSignup({ slug, name, dark = true }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')

  async function submit(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setStatus('invalid'); return }
    setStatus('loading')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: `coming-soon-${String(slug).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 28)}` }),
      })
      setStatus(res.ok ? 'done' : 'error')
    } catch { setStatus('error') }
  }

  const fg = dark ? '#f6f1e7' : '#0a0a0a'
  const stop = e => e.stopPropagation()

  return (
    <div onClick={stop} style={{ position: 'relative', zIndex: 2, padding: '10px 12px', background: dark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.9)', color: fg }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Coming soon</div>
      {status === 'done' ? (
        <div style={{ fontSize: 13 }}>✓ You&apos;re on the list — we&apos;ll email you when it drops.</div>
      ) : (
        <form onSubmit={submit} style={{ display: 'flex', gap: 6 }}>
          <input
            type="email" required value={email} onChange={e => setEmail(e.target.value)} onClick={stop}
            placeholder="Email for first access" aria-label={`Email for ${name} waitlist`}
            style={{ flex: 1, minWidth: 0, padding: '8px 10px', fontSize: 13, border: `1px solid ${fg}44`, background: 'transparent', color: fg }}
          />
          <button type="submit" disabled={status === 'loading'} style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700, border: 'none', background: fg, color: dark ? '#0a0a0a' : '#f6f1e7', cursor: 'pointer' }}>
            {status === 'loading' ? '…' : 'Notify me'}
          </button>
        </form>
      )}
      {status === 'invalid' && <div style={{ fontSize: 12, color: '#ff6b4a', marginTop: 4 }}>Enter a valid email.</div>}
      {status === 'error' && <div style={{ fontSize: 12, color: '#ff6b4a', marginTop: 4 }}>Something went wrong. Try again.</div>}
    </div>
  )
}
