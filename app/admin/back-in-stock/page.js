'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

// Admin: who asked to hear when a sold-out piece is back. Separate from the Drop 01 waitlist.
// /admin is gated by middleware; the API checks admin again before reading with the service role.
export default function AdminBackInStock() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(null)

  useEffect(() => {
    fetch('/api/admin/back-in-stock')
      .then(async res => {
        const body = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(body.error || `Error ${res.status}`)
        setData(body)
      })
      .catch(e => setError(e.message))
  }, [])

  const page = { minHeight: '100vh', background: '#0a0a0a', color: '#f6f1e7', padding: '40px 24px', fontFamily: 'Manrope, sans-serif' }
  const card = { border: '1px solid #2a2a2a', background: '#121212', padding: 16, marginBottom: 12 }
  const mono = { fontFamily: 'JetBrains Mono, monospace', fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9a9a9a' }
  const fmt = s => (s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—')

  return (
    <div style={page}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <Link href="/admin" style={{ ...mono, textDecoration: 'none' }}>← Admin</Link>
        <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 40, margin: '12px 0 4px' }}>Back in stock</h1>
        <p style={{ color: '#9a9a9a', margin: '0 0 24px' }}>
          Shoppers who asked for one email when a sold-out piece returns. Sending isn't switched on yet, so nobody has been emailed.
        </p>

        {error && <div style={{ ...card, color: '#f87171' }}>Couldn't load sign-ups: {error}</div>}
        {!data && !error && <div style={card}>Loading…</div>}
        {data && data.products.length === 0 && <div style={card}>No sign-ups yet.</div>}

        {data && data.products.map(p => (
          <div key={p.productId} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>
                  {p.slug ? <Link href={`/product/${p.slug}`} style={{ color: 'inherit' }}>{p.name}</Link> : p.name}
                </div>
                <div style={mono}>{p.inStock === null ? 'Product removed' : p.inStock ? 'In stock now' : 'Sold out'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{p.waiting}</div>
                <div style={mono}>waiting{p.notified ? ` · ${p.notified} notified` : ''}</div>
              </div>
            </div>

            <table style={{ width: '100%', marginTop: 12, borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={mono}><th style={{ textAlign: 'left', padding: '4px 0' }}>Size</th><th style={{ textAlign: 'left' }}>Colour</th><th style={{ textAlign: 'right' }}>Waiting</th><th style={{ textAlign: 'right' }}>Notified</th></tr>
              </thead>
              <tbody>
                {p.variants.map(v => (
                  <tr key={`${v.size}|${v.color}`} style={{ borderTop: '1px solid #2a2a2a' }}>
                    <td style={{ padding: '6px 0' }}>{v.size || 'Any'}</td>
                    <td>{v.color || '—'}</td>
                    <td style={{ textAlign: 'right' }}>{v.waiting}</td>
                    <td style={{ textAlign: 'right' }}>{v.notified}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button type="button" onClick={() => setOpen(open === p.productId ? null : p.productId)}
              style={{ marginTop: 12, background: 'transparent', color: '#f6f1e7', border: '1px solid #3a3a3a', padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}>
              {open === p.productId ? 'Hide list' : `Show list (${p.signups.length})`}
            </button>
            {open === p.productId && (
              <table style={{ width: '100%', marginTop: 8, borderCollapse: 'collapse', fontSize: 13 }}>
                <tbody>
                  {p.signups.map(s => (
                    <tr key={s.id} style={{ borderTop: '1px solid #2a2a2a' }}>
                      <td style={{ padding: '6px 0' }}>{s.email}</td>
                      <td>{[s.size, s.color].filter(Boolean).join(' · ') || 'Any'}</td>
                      <td style={{ textAlign: 'right', color: '#9a9a9a' }}>{fmt(s.createdAt)}</td>
                      <td style={{ textAlign: 'right', color: s.notifiedAt ? '#22c55e' : '#9a9a9a' }}>{s.notifiedAt ? `Notified ${fmt(s.notifiedAt)}` : 'Waiting'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
