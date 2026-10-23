'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '../lib/supabase-public'
import { useCart } from '../lib/cart-context'
import { sizesForStyle } from '../lib/drops'
import { DROP_STYLE_IMAGES } from '../lib/drop-catalog.mjs'
import { countdownTarget, formatET } from '../lib/drop-window.mjs'

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

function ComingSoonCard({ drop, style }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  async function submit(e) {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setStatus('invalid'); return }
    setStatus('loading')
    const { error } = await supabase.from('vibin_signups').insert({
      email: email.trim().toLowerCase(),
      coupon_code: 'VIBE' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      source: `coming-soon-${drop.id}-${style.code}`,
      metadata: { page: '/drop/01', drop: drop.id, style: style.code, product: style.name },
    })
    setStatus(!error || error.code === '23505' ? 'done' : 'error')
  }
  return (
    <div style={S.card}>
      {DROP_STYLE_IMAGES[drop.id]?.[style.code]?.[0] && <img src={DROP_STYLE_IMAGES[drop.id][style.code][0]} alt={style.name} loading="lazy" style={{ width: '100%', aspectRatio: '3 / 4', objectFit: 'cover', borderRadius: 8, marginBottom: 12 }} />}
      <div style={S.eyebrow}>{drop.id.toUpperCase()}-{style.code.toUpperCase()}</div>
      <h3 style={{ margin: '8px 0' }}>{style.name}</h3>
      <div style={{ margin: '12px 0', fontSize: 14 }}><strong>Coming soon</strong> · not available to order yet</div>
      {status === 'done' ? <p style={{ fontSize: 14 }}>✓ You&apos;re on the list — we&apos;ll email you when it&apos;s ready.</p> : (
        <form onSubmit={submit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input style={S.input} type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} aria-label={`Email for ${style.name} waitlist`} required />
          <button style={S.btn} disabled={status === 'loading'}>{status === 'loading' ? 'Joining…' : 'Join the waitlist'}</button>
          {status === 'invalid' && <p style={{ width: '100%', color: '#f66' }}>Enter a valid email.</p>}
          {status === 'error' && <p style={{ width: '100%', color: '#f66' }}>Something went wrong. Try again.</p>}
        </form>
      )}
    </div>
  )
}

function CatalogCard({ drop, item, released }) {
  const { updateCart } = useCart() || {}
  const [size, setSize] = useState(item.sizes.length === 1 ? item.sizes[0] : null)
  const [added, setAdded] = useState(false)
  const canBuy = released && item.inStock && size

  function addToCart() {
    if (!canBuy) return
    const cart = JSON.parse(localStorage.getItem('vibin_cart') || '[]')
    const existing = cart.find(i => String(i.id) === String(item.productId) && i.size === size)
    if (existing) existing.qty += 1
    else cart.push({ id: item.productId, slug: item.slug, name: item.name, price: item.price, color: item.color || 'Black', size, qty: 1, image_url: item.images?.[0] || null, preorder: drop.id })
    localStorage.setItem('vibin_cart', JSON.stringify(cart))
    updateCart?.()
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div style={S.card}>
      {item.images?.[0] && <img src={item.images[0]} alt={item.name} loading="lazy" style={{ width: '100%', aspectRatio: '3 / 4', objectFit: 'cover', borderRadius: 8, marginBottom: 12 }} />}
      <div style={S.eyebrow}>{drop.id.toUpperCase()} · Made in-house</div>
      <h3 style={{ margin: '8px 0' }}>{item.name}</h3>
      <div style={{ opacity: 0.8 }}>${item.price}</div>
      {drop.shipsBy && <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>Pre-order · Ships by {drop.shipsBy}</div>}
      <div style={{ margin: '12px 0', fontSize: 14 }}>
        {!released && <span>🔒 {drop.phase === 'closed' ? 'Pre-order closed' : `Pre-order opens ${formatET(drop.releaseAt)}`}</span>}
        {released && !item.inStock && <strong style={{ color: '#f66' }}>SOLD OUT</strong>}
      </div>
      {released && item.inStock && (
        <>
          {item.sizes.length > 1 ? (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {item.sizes.map(sz => (
                <button key={sz} onClick={() => setSize(sz)} style={{ ...S.size, ...(size === sz ? { background: '#f5f5f5', color: '#0a0a0a' } : {}) }}>{sz}</button>
              ))}
            </div>
          ) : <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 12 }}>One size</div>}
          <button style={{ ...S.btn, ...(canBuy ? {} : S.btnOff) }} disabled={!canBuy} onClick={addToCart}>
            {added ? 'Added ✓' : size ? 'Add to cart' : 'Pick a size'}
          </button>
        </>
      )}
    </div>
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
    else cart.push({ id, name: `${style.name} — ${drop.name}`, price: style.price, color: 'Black', size, qty: 1, slug: null, image_url: DROP_STYLE_IMAGES[drop.id]?.[style.code]?.[0] || null, drop: drop.id, style: style.code })
    localStorage.setItem('vibin_cart', JSON.stringify(cart))
    updateCart?.()
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div style={{ ...S.card, opacity: soldOut ? 0.5 : 1 }}>
      {DROP_STYLE_IMAGES[drop.id]?.[style.code]?.[0] && <img src={DROP_STYLE_IMAGES[drop.id][style.code][0]} alt={style.name} loading="lazy" style={{ width: '100%', aspectRatio: '3 / 4', objectFit: 'cover', borderRadius: 8, marginBottom: 12 }} />}
      <div style={S.eyebrow}>{drop.id.toUpperCase()}-{style.code.toUpperCase()}</div>
      <h3 style={{ margin: '8px 0' }}>{style.name}</h3>
      {style.description && <p style={{ fontSize: 14, opacity: 0.8, margin: '0 0 8px' }}>{style.description}</p>}
      <div style={{ opacity: 0.8 }}>{style.price != null ? `$${style.price}` : 'Price TBA'}</div>
      {drop.shipsBy && <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>Pre-order · Ships by {drop.shipsBy}</div>}
      <div style={{ margin: '12px 0', fontSize: 14 }}>
        {!released && <span>🔒 {drop.phase === 'closed' ? 'Pre-order closed' : `Pre-order opens ${formatET(drop.releaseAt)}`} · {drop.piecesPerStyle} numbered pieces</span>}
        {released && soldOut && <strong style={{ color: '#f66' }}>SOLD OUT</strong>}
        {released && !soldOut && style.remaining != null && <span>{style.remaining} of {drop.piecesPerStyle} left</span>}
      </div>
      {released && !soldOut && (
        <>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {sizesForStyle(style.code).map(sz => {
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

export default function DropClient({ drop: dropProp, phase, serverNow }) {
  const router = useRouter()
  const drop = { ...dropProp, phase }
  const released = phase === 'open'
  const target = countdownTarget(phase, drop.releaseAt, drop.closesAt)
  const countdown = useCountdown(target, serverNow)

  // When a countdown hits zero, re-render on the server (opens or closes the pre-order).
  useEffect(() => {
    if (countdown?.done) router.refresh()
  }, [countdown?.done, router])

  const clock = countdown && (
    <div aria-label={phase === 'open' ? 'Countdown to pre-order close' : 'Countdown to pre-order open'} style={{ fontSize: 40, fontWeight: 800 }}>
      {['days', 'hours', 'minutes', 'seconds'].map(k => (
        <span key={k} style={S.countBox}>
          {String(countdown[k]).padStart(2, '0')}
          <div style={{ fontSize: 11, letterSpacing: 2, opacity: 0.6, fontWeight: 400 }}>{k.toUpperCase()}</div>
        </span>
      ))}
    </div>
  )

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <div style={S.eyebrow}>Vibin Apparel · SS26</div>
        <h1 style={S.h1}>{drop.name}</h1>
        <p style={{ maxWidth: 640, opacity: 0.8 }}>{drop.story}</p>
        <p style={{ opacity: 0.6, fontSize: 14 }}>Every piece is numbered 1–{drop.piecesPerStyle}.</p>
        {drop.shipsBy && <p style={{ fontSize: 16, fontWeight: 700 }}>Numbered pre-order · Ships by {drop.shipsBy}</p>}

        {(phase === 'upcoming' || phase === 'tba') && (
          <section style={{ marginTop: 40 }}>
            {phase === 'upcoming' ? (
              <>
                <div style={{ fontSize: 18, marginBottom: 12 }}>Pre-order opens {formatET(drop.releaseAt)}{drop.closesAt ? ` · closes ${formatET(drop.closesAt)}` : ''}</div>
                {clock}
              </>
            ) : (
              <div style={{ fontSize: 28, fontWeight: 800 }}>Release date: TBA</div>
            )}
            <Waitlist dropId={drop.id} />
          </section>
        )}

        {phase === 'open' && (
          <section style={{ marginTop: 40 }}>
            <div style={{ fontSize: 18, marginBottom: 12 }}>
              <strong>Pre-order open</strong>{drop.closesAt ? `, closes in… (${formatET(drop.closesAt)})` : ''}
            </div>
            {drop.closesAt && clock}
          </section>
        )}

        {phase === 'closed' && (
          <section style={{ marginTop: 40 }}>
            <div style={{ fontSize: 28, fontWeight: 800 }}>Pre-order closed</div>
            <p style={{ opacity: 0.8 }}>Closed {formatET(drop.closesAt)}. Join the list for the next drop.</p>
            <Waitlist dropId={drop.id} />
          </section>
        )}

        {released && !drop.inventoryAvailable && (
          <p style={{ marginTop: 24, color: '#fc6' }}>Live inventory is temporarily unavailable — checkout will confirm availability.</p>
        )}

        <div style={S.grid}>
          {(drop.catalog || []).filter(c => c.slug === 'vibin-classic-tee').map(c => <CatalogCard key={c.slug} drop={drop} item={c} released={released} />)}
          {drop.styles.filter(s => s.availability !== 'coming-soon').map(style => (
            <StyleCard key={style.code} drop={drop} style={style} released={released} />
          ))}
          {(drop.catalog || []).filter(c => c.slug !== 'vibin-classic-tee').map(c => <CatalogCard key={c.slug} drop={drop} item={c} released={released} />)}
          {drop.styles.filter(s => s.availability === 'coming-soon').map(style => (
            <ComingSoonCard key={style.code} drop={drop} style={style} />
          ))}
        </div>
      </div>
    </main>
  )
}
