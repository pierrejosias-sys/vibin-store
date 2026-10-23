'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '../lib/supabase-public'
import { useCart } from '../lib/cart-context'
import { SIZES } from '../lib/drops'

const S = {
  page: { background: '#0a0a0a', color: '#f5f5f5', minHeight: '100vh', padding: '64px 20px', fontFamily: 'inherit' },
  wrap: { maxWidth: 1100, margin: '0 auto' },
  eyebrow: { letterSpacing: 4, fontSize: 12, textTransform: 'uppercase', opacity: 0.6 },
  h1: { fontSize: 'clamp(36px, 7vw, 72px)', margin: '12px 0 16px', lineHeight: 1 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20, marginTop: 40 },
  card: { border: '1px solid #222', padding: 20, background: '#111', position: 'relative' },
  btn: { background: '#f5f5f5', color: '#0a0a0a', border: 0, padding: '12px 18px', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 1 },
  btnOff: { background: '#333', color: '#777', cursor: 'not-allowed' },
  size: { minWidth: 44, padding: '8px 10px', border: '1px solid #444', background: 'transparent', color: '#f5f5f5', cursor: 'pointer' },
  input: { padding: '12px 14px', background: '#111', border: '1px solid #333', color: '#f5f5f5', minWidth: 260 },
  countBox: { display: 'inline-block', minWidth: 72, textAlign: 'center', marginRight: 12 },
}

function useCountdown(releaseAt, serverNow) {
  const [offset] = useState(() => serverNow - Date.now())
  const [now, setNow] = useState(serverNow)
  useEffect(() => {
    if (!releaseAt) return
    const t = setInterval(() => setNow(Date.now() + offset), 1000)
    return () => clearInterval(t)
  }, [releaseAt, offset])
  if (!releaseAt) return null
  const diff = Math.max(0, new Date(releaseAt).getTime() - now)
  return {
    done: diff === 0,
    days: Math.floor(diff / 86400000),
    hours: Math.floor(diff / 3600000) % 24,
    minutes: Math.floor(diff / 60000) % 60,
    seconds: Math.floor(diff / 1000) % 60,
  }
}

function Waitlist({ dropId }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')

  async function submit(e) {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setStatus('invalid'); return }
    setStatus('loading')
    const code = 'VIBE' + Math.random().toString(36).substring(2, 6).toUpperCase()
    const { error } = await supabase.from('vibin_signups').insert({
      email: email.trim().toLowerCase(),
      coupon_code: code,
      source: `${dropId}-waitlist`,
      metadata: { page: '/drop/01', drop: dropId },
    })
    // 23505 = already on the list — treat as success
    setStatus(!error || error.code === '23505' ? 'done' : 'error')
  }

  if (status === 'done') return <p style={{ marginTop: 24 }}>You&apos;re on the list. We&apos;ll email you the second it drops.</p>
  return (
    <form onSubmit={submit} style={{ marginTop: 32, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      <input style={S.input} type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} aria-label="Email" required />
      <button style={S.btn} disabled={status === 'loading'}>{status === 'loading' ? 'Joining…' : 'Join the waitlist'}</button>
      {status === 'invalid' && <p style={{ width: '100%', color: '#f66' }}>Enter a valid email.</p>}
      {status === 'error' && <p style={{ width: '100%', color: '#f66' }}>Something went wrong. Try again.</p>}
    </form>
  )
}

function StyleCard({ drop, style, released }) {
  const { updateCart } = useCart() || {}
  const [size, setSize] = useState(null)
  const [added, setAdded] = useState(false)
  const soldOut = released && drop.inventoryAvailable && style.remaining === 0
  const sizeLeft = sz => (sz in style.sizes ? style.sizes[sz] : style.remaining)
  const canBuy = released && !soldOut && style.price != null && size && sizeLeft(size) !== 0

  function addToCart() {
    if (!canBuy) return
    const cart = JSON.parse(localStorage.getItem('vibin_cart') || '[]')
    const id = `${drop.id}-${style.code}`
    const existing = cart.find(i => i.id === id && i.size === size)
    if (existing) existing.qty += 1
    else cart.push({ id, name: `${style.name} — ${drop.name}`, price: style.price, color: 'Black', size, qty: 1, slug: null, image_url: null, drop: drop.id, style: style.code })
    localStorage.setItem('vibin_cart', JSON.stringify(cart))
    updateCart?.()
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div style={{ ...S.card, opacity: soldOut ? 0.5 : 1 }}>
      <div style={S.eyebrow}>{drop.id.toUpperCase()}-{style.code.toUpperCase()}</div>
      <h3 style={{ margin: '8px 0' }}>{style.name}</h3>
      <div style={{ opacity: 0.8 }}>{style.price != null ? `$${style.price}` : 'Price TBA'}</div>
      <div style={{ margin: '12px 0', fontSize: 14 }}>
        {!released && <span>🔒 Locked until release · {drop.piecesPerStyle} numbered pieces</span>}
        {released && soldOut && <strong style={{ color: '#f66' }}>SOLD OUT</strong>}
        {released && !soldOut && style.remaining != null && <span>{style.remaining} of {drop.piecesPerStyle} left</span>}
      </div>
      {released && !soldOut && (
        <>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {SIZES.map(sz => {
              const left = sizeLeft(sz)
              const out = left === 0
              return (
                <button key={sz} disabled={out} onClick={() => setSize(sz)} title={left != null ? `${left} left` : undefined}
                  style={{ ...S.size, ...(size === sz ? { background: '#f5f5f5', color: '#0a0a0a' } : {}), ...(out ? { textDecoration: 'line-through', opacity: 0.4, cursor: 'not-allowed' } : {}) }}>
                  {sz}
                </button>
              )
            })}
          </div>
          {size && sizeLeft(size) != null && sz_note(sizeLeft(size), size)}
          <button style={{ ...S.btn, ...(canBuy ? {} : S.btnOff) }} disabled={!canBuy} onClick={addToCart}>
            {added ? 'Added ✓' : size ? 'Add to cart' : 'Pick a size'}
          </button>
        </>
      )}
    </div>
  )
}

function sz_note(left, size) {
  return <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 10 }}>{left} left in {size}</div>
}

export default function DropClient({ drop, released: releasedAtRender, serverNow }) {
  const router = useRouter()
  const countdown = useCountdown(releasedAtRender ? null : drop.releaseAt, serverNow)
  const released = releasedAtRender

  // When the countdown hits zero, re-render on the server to unlock products.
  useEffect(() => {
    if (countdown?.done && !released) router.refresh()
  }, [countdown?.done, released, router])

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <div style={S.eyebrow}>Vibin Apparel · SS26</div>
        <h1 style={S.h1}>{drop.name}</h1>
        <p style={{ maxWidth: 640, opacity: 0.8 }}>{drop.story}</p>
        <p style={{ opacity: 0.6, fontSize: 14 }}>Every piece is numbered 1–{drop.piecesPerStyle} with a scannable authenticity tag.</p>

        {!released && (
          <section style={{ marginTop: 40 }}>
            {countdown ? (
              <div aria-label="Countdown to release" style={{ fontSize: 40, fontWeight: 800 }}>
                {['days', 'hours', 'minutes', 'seconds'].map(k => (
                  <span key={k} style={S.countBox}>
                    {String(countdown[k]).padStart(2, '0')}
                    <div style={{ fontSize: 11, letterSpacing: 2, opacity: 0.6, fontWeight: 400 }}>{k.toUpperCase()}</div>
                  </span>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 28, fontWeight: 800 }}>Release date: TBA</div>
            )}
            <Waitlist dropId={drop.id} />
          </section>
        )}

        {released && !drop.inventoryAvailable && (
          <p style={{ marginTop: 24, color: '#fc6' }}>Live inventory is temporarily unavailable — checkout will confirm availability.</p>
        )}

        <div style={S.grid}>
          {drop.styles.map(style => (
            <StyleCard key={style.code} drop={drop} style={style} released={released} />
          ))}
        </div>
      </div>
    </main>
  )
}
