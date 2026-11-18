'use client'

import { useEffect, useRef, useState } from 'react'
import { useCart } from '../lib/cart-context'
import styles from '../styles.css'
import { FREE_SHIPPING_LABEL } from '../lib/shipping'

/* ==========================================================================
   Vibin Verify — /verify
   Hang-tag QR -> /verify?c=CODE. Authenticity is checked against the live registry
   (GET /api/verify/:code — no account needed). An email is only asked for when claiming
   points (POST /api/claim) or spending them (POST /api/redeem). Claims, balances and
   reward codes all live server-side in Supabase; this page keeps nothing but the last
   balance the server reported. The browser never talks to the database directly.
   ========================================================================== */

const CONFIG = {
  pointsPerPiece: 100,
  pointsLimited: 150,
  welcomeBonus: 50,
  tiers: [
    { id: 't10', label: '$10 off your next order', detail: 'Reward code at checkout', cost: 200, codeTag: 'VIBIN10' },
    { id: 't25', label: '$25 off your next order', detail: 'Reward code at checkout', cost: 400, codeTag: 'VIBIN25' },
    { id: 't50', label: '$50 off + early access', detail: 'First shot at the next drop, before it opens', cost: 750, codeTag: 'VIBIN50' },
  ],
}

const QR_DATA_URI = 'data:image/png;base64,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'

const DEMO_CODES = [
  { code: 'VBN-TCH5-2601', label: 'Tech Shorts' },
  { code: 'VBN-HDE8-2601', label: 'Hoodie' },
  { code: 'VBN-BRF3-2601', label: 'Boxer Briefs' },
  { code: 'VBN-MDV9-2601', label: 'Already claimed' },
  { code: 'VBN-FAKE-0000', label: 'Fake code' },
]

function normalize(raw) {
  let s = (raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (s.indexOf('VBN') === 0) s = s.slice(3)
  s = s.slice(0, 8)
  let out = 'VBN'
  if (s.length) out += '-' + s.slice(0, 4)
  if (s.length > 4) out += '-' + s.slice(4, 8)
  return out
}

const VERIFY_CSS = `
.verify-wrap { max-width: 1060px; margin: 0 auto; padding: 0 20px 72px; }
.verify-hero { padding: 40px 0 8px; }
/* The site stylesheet styles every bare <header> as the sticky 64px dark nav bar; this hero is a plain block. */
.verify-wrap header.verify-hero { position: static; z-index: auto; display: block; height: auto; background: transparent; color: inherit; border-bottom: 0; }
.verify-hero h1 { font-size: clamp(46px, 9vw, 92px); line-height: .98; margin: 0; text-transform: uppercase; }
.verify-hero h1 .turq { color: #0a9a87; }
.verify-hero p.lede { font-size: clamp(17px, 2.4vw, 20px); color: #4c483c; max-width: 620px; margin: 18px 0 0; font-weight: 500; }
.verify-hero p.lede strong { color: #12110d; }
.verify-tape { margin: 34px -20px 0; transform: rotate(-1.2deg); background: #12110d; color: #f2ecdd; overflow: hidden; white-space: nowrap; padding: 7px 0; font-family: monospace; font-size: 12px; letter-spacing: .3em; text-transform: uppercase; }
.verify-tape span { display: inline-block; padding-right: 12px; }
.verify-grid { display: grid; grid-template-columns: 1.25fr .75fr; gap: 28px; margin-top: 36px; align-items: start; }
@media (max-width: 820px) { .verify-grid { grid-template-columns: 1fr; } }
.verify-card { background: #faf6ea; border: 1.5px solid #d8d0ba; border-radius: 14px; padding: 26px; box-shadow: 0 10px 30px rgba(18,17,13,.12); }
.verify-card h2 { font-size: 26px; margin: 0 0 6px; text-transform: uppercase; }
.verify-card .sub { color: #4c483c; margin: 0 0 18px; font-size: 15px; }
.verify-label { display: block; font-family: monospace; font-size: 12px; letter-spacing: .14em; text-transform: uppercase; color: #4c483c; margin-bottom: 8px; }
.verify-row { display: flex; gap: 10px; flex-wrap: wrap; }
.verify-input { flex: 1 1 220px; min-height: 52px; padding: 12px 16px; font-family: monospace; font-size: 19px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; background: #f2ecdd; color: #12110d; border: 2px solid #12110d; border-radius: 10px; }
.verify-btn { min-height: 48px; padding: 12px 22px; border-radius: 10px; border: 2px solid #12110d; font-weight: 800; font-size: 16px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: #12110d; color: #f2ecdd; cursor: pointer; }
.verify-btn.turq { background: #0a9a87; border-color: #0a9a87; color: #06110e; }
.verify-btn.ghost { background: transparent; color: #12110d; }
.verify-btn.small { min-height: 40px; padding: 8px 14px; font-size: 14px; }
.verify-btn:disabled { opacity: .45; cursor: not-allowed; }
.verify-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.verify-chip { min-height: 40px; padding: 8px 13px; border-radius: 999px; border: 1.5px solid #d8d0ba; background: #f2ecdd; color: #12110d; font-family: monospace; font-size: 13px; font-weight: 600; cursor: pointer; }
.verify-chip:hover { border-color: #0a9a87; }
.verify-result { margin-top: 20px; }
.verify-result-box { border-radius: 12px; padding: 20px; border: 2px solid; }
.verify-result-box.ok { background: #d9f0ea; border-color: #0a9a87; }
.verify-result-box.warn { background: #f3e7c8; border-color: #9a6a12; }
.verify-result-box.bad { background: #f6e0da; border-color: #b3372a; }
.verify-result-box h3 { font-size: 24px; margin: 0; text-transform: uppercase; }
.verify-result-box p { margin: 6px 0; }
.verify-spec { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px 18px; margin: 14px 0 4px; }
.verify-spec div { border-top: 1.5px solid #d8d0ba; padding-top: 6px; }
.verify-spec dt { font-family: monospace; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: #4c483c; }
.verify-spec dd { margin: 2px 0 0; font-weight: 700; font-size: 15px; }
.verify-points { font-size: 30px; text-transform: uppercase; margin-top: 12px; font-weight: 800; }
.verify-points .n { color: #0a9a87; }
.verify-tag { display: grid; place-items: center; padding: 8px 0 4px; }
.verify-hangtag { width: 230px; background: #12110d; color: #f2ecdd; border-radius: 14px; padding: 20px 18px 18px; position: relative; box-shadow: 0 10px 30px rgba(18,17,13,.12); transform: rotate(2deg); }
.verify-hangtag .t-brand { font-size: 26px; letter-spacing: .05em; margin-top: 18px; text-transform: uppercase; font-weight: 800; }
.verify-hangtag .t-brand .dot { color: #12b5a5; }
.verify-hangtag .t-slogan { font-family: monospace; font-size: 10px; letter-spacing: .22em; text-transform: uppercase; opacity: .75; }
.verify-hangtag .qrbox { background: #fff; border-radius: 8px; padding: 10px; margin: 14px 0 10px; display: grid; place-items: center; min-height: 138px; }
.verify-hangtag .qrbox img { width: 118px; height: 118px; display: block; }
.verify-hangtag .t-code { font-family: monospace; font-weight: 700; font-size: 15px; letter-spacing: .1em; text-align: center; }
.verify-hangtag .t-note { font-size: 11px; text-align: center; opacity: .75; margin-top: 6px; line-height: 1.45; }
.verify-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 36px; }
@media (max-width: 820px) { .verify-steps { grid-template-columns: 1fr; } }
.verify-step { border: 1.5px solid #d8d0ba; border-radius: 14px; padding: 20px; background: #faf6ea; }
.verify-step .num { font-size: 34px; color: #0a9a87; line-height: 1; font-weight: 800; }
.verify-step h3 { font-size: 19px; margin: 8px 0 6px; text-transform: uppercase; }
.verify-step p { margin: 0; color: #4c483c; font-size: 15px; }
.verify-balance { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; background: #173f2c; color: #f2ecdd; border-radius: 12px; padding: 18px 20px; margin-bottom: 18px; }
.verify-balance .bal-label { font-family: monospace; font-size: 11px; letter-spacing: .16em; text-transform: uppercase; opacity: .85; }
.verify-balance .bal-num { font-size: 44px; line-height: 1; font-weight: 800; }
.verify-tier { display: flex; align-items: center; justify-content: space-between; gap: 14px; border: 1.5px solid #d8d0ba; border-radius: 12px; padding: 14px 16px; flex-wrap: wrap; margin-bottom: 12px; }
.verify-tier .t-info strong { display: block; font-size: 17px; }
.verify-tier .t-info span { color: #4c483c; font-size: 14px; }
.verify-tier .t-cost { font-family: monospace; font-weight: 700; font-size: 14px; white-space: nowrap; }
.verify-reward { margin-top: 14px; border: 2px dashed #96762f; border-radius: 12px; padding: 16px; text-align: center; }
.verify-reward .code { font-family: monospace; font-size: 24px; font-weight: 700; letter-spacing: .1em; color: #96762f; }
.verify-earn { margin: 14px 0 0; padding: 0; list-style: none; }
.verify-earn li { display: flex; justify-content: space-between; gap: 12px; padding: 9px 0; border-top: 1.5px solid #d8d0ba; font-size: 15px; }
.verify-earn li b { font-family: monospace; white-space: nowrap; }
.verify-input.email { text-transform: none; font-size: 17px; font-weight: 500; letter-spacing: 0; }
.verify-claim { margin-top: 16px; padding-top: 14px; border-top: 1.5px solid rgba(18,17,13,.18); }
.verify-claim .verify-points { margin: 0 0 12px; font-size: 24px; }
.verify-acct { margin: 0 0 16px; }
.verify-fine { margin: 8px 0 0; font-size: 13px; color: #4c483c; }
.verify-error { margin: 10px 0 0; font-size: 14px; font-weight: 600; color: #b3372a; }
.verify-faq { border-top: 1.5px solid #d8d0ba; padding: 6px 0; }
.verify-faq summary { font-weight: 800; padding: 12px 0; cursor: pointer; min-height: 44px; display: flex; align-items: center; }
.verify-faq p { margin: 0 0 14px; color: #4c483c; font-size: 15px; }
`

const API = {
  verify: (c) => '/api/verify/' + encodeURIComponent(c),
  claim: '/api/claim',
  redeem: '/api/redeem',
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EMAIL_KEY = 'vibin_verify_email'

/* One small JSON round-trip. Never throws; status 0 means the network failed. */
async function callApi(url, body) {
  try {
    const res = await fetch(url, body
      ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      : undefined)
    let data = null
    try { data = await res.json() } catch (e) { /* non-JSON error page */ }
    return { status: res.status, data }
  } catch (e) {
    return { status: 0, data: null }
  }
}

function fmtDate(iso) {
  const d = iso ? new Date(iso) : null
  if (!d || Number.isNaN(d.getTime())) return 'an earlier date'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })
}

function trouble(status) {
  if (status === 429) return 'Too many tries from this connection. Wait a few minutes, then try again.'
  if (status === 503) return 'This is briefly unavailable. Try again in a few minutes.'
  return "We couldn't reach Vibin just now. Check your connection and try again."
}

function remember(email) {
  try { window.localStorage.setItem(EMAIL_KEY, email) } catch (e) { /* private mode: fine */ }
}

const notFound = (c) => ({ kind: 'bad', phase: 'missing', title: 'Code not found', body: c + " isn't in the Vibin registry. Check for lookalike letters (O/0, I/1) — and if it still isn't found, the piece wasn't issued by Vibin.", item: null, code: c, earned: null })
const alreadyClaimed = (item, c, at) => ({ kind: 'warn', phase: 'already', title: 'Real piece — points already claimed', body: 'This code was claimed on ' + fmtDate(at) + '. The piece checks out as genuine Vibin, but each code pays its points once, to the first claim. Bought it new and seeing this? Send a photo of the tag plus your order confirmation to the brand.', item, code: c, earned: null })

export default function VerifyPage() {
  const { cartCount } = useCart()
  const [code, setCode] = useState('')
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [claimEmail, setClaimEmail] = useState('')
  const [claimError, setClaimError] = useState('')
  const [account, setAccount] = useState('')
  const [balance, setBalance] = useState(null) // last balance the server reported; null = none seen yet
  const [pointsNote, setPointsNote] = useState('')
  const [reward, setReward] = useState(null)
  const [copied, setCopied] = useState(false)
  const autoRan = useRef(false)
  const seq = useRef(0) // answers to superseded lookups are ignored

  async function verify(raw) {
    const formatted = normalize(raw)
    setCode(formatted)
    setClaimError('')
    const plain = formatted.replace(/-/g, '')
    if (plain.length < 11) {
      seq.current += 1
      setBusy(false)
      setResult({ kind: 'bad', phase: 'short', title: 'That code looks short', body: 'Tag codes are VBN-XXXX-XXXX — 8 characters after the VBN. Check the tag and try again.', item: null, code: formatted, earned: null })
      return
    }
    const mine = ++seq.current
    setBusy(true)
    const { status, data } = await callApi(API.verify(formatted))
    if (mine !== seq.current) return
    setBusy(false)
    if (status === 404) { setResult(notFound(formatted)); return }
    if (status !== 200 || !data) {
      setResult({ kind: 'warn', phase: 'error', title: "Couldn't check that code", body: trouble(status), item: null, code: formatted, earned: null })
      return
    }
    const item = { product: data.product, drop: data.drop, colorway: data.colorway, size: data.size }
    if (data.status === 'claimed') { setResult(alreadyClaimed(item, formatted, data.claimed_at)); return }
    setResult({
      kind: 'ok',
      phase: 'verified',
      title: "Verified — it's real Vibin",
      body: 'This piece is genuine Vibin — no account needed to know that. Add your email below to bank its points. The first claim wins, then the code is locked.',
      item,
      code: formatted,
      earned: null,
      points: data.points_value,
    })
  }

  async function claim(e) {
    if (e) e.preventDefault()
    if (busy || !result || result.phase !== 'verified') return
    const email = claimEmail.trim()
    if (!EMAIL_RE.test(email)) { setClaimError('Enter a valid email so your points have somewhere to live.'); return }
    setClaimError('')
    setBusy(true)
    const { status, data } = await callApi(API.claim, { code: result.code, account_or_email: email })
    setBusy(false)
    if (status === 200 && data) {
      remember(email)
      setAccount(email)
      setBalance(data.new_balance)
      setPointsNote('')
      setResult({
        ...result,
        kind: 'ok',
        phase: 'claimed',
        title: "Verified — it's yours",
        body: 'This piece is genuine and its points are now banked to ' + email + '. Nobody else can claim this code.' + (data.bonus_awarded > 0 ? ' Includes your +50 first-verify welcome bonus.' : ''),
        earned: data.points_awarded,
      })
      return
    }
    if (status === 409) { setResult(alreadyClaimed(result.item, result.code, data && data.claimed_at)); return }
    if (status === 404) { setResult(notFound(result.code)); return }
    setClaimError(status === 400 ? "That email doesn't look right. Check it and try again." : trouble(status))
  }

  /* Auto-verify from QR landing (?c=CODE); remember the email the customer used last time */
  useEffect(() => {
    if (autoRan.current) return
    autoRan.current = true
    try {
      const saved = window.localStorage.getItem(EMAIL_KEY)
      if (saved && EMAIL_RE.test(saved)) { setAccount(saved); setClaimEmail(saved) }
    } catch (e) { /* storage blocked: fine */ }
    try {
      const params = new URLSearchParams(window.location.search)
      const c = params.get('c')
      if (c) verify(c)
    } catch (e) { /* no-op */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function redeem(tier) {
    if (busy) return
    const email = account.trim()
    if (!EMAIL_RE.test(email)) { setPointsNote('Enter the email your points are held under, then tap Redeem.'); return }
    setPointsNote('')
    setBusy(true)
    const { status, data } = await callApi(API.redeem, { account: email, tier_id: tier.codeTag })
    setBusy(false)
    if (status === 200 && data) {
      remember(email)
      setBalance(data.new_balance)
      setReward({ code: data.reward_code, label: data.label || tier.label })
      return
    }
    if (status === 402 && data) {
      remember(email)
      setBalance(data.balance)
      setPointsNote('You have ' + data.balance + ' points. ' + tier.label + ' needs ' + data.points_needed + '.')
      return
    }
    setPointsNote(status === 400 ? "That email doesn't look right." : trouble(status))
  }

  function copyText(text, setter) {
    const done = () => { setter(true); setTimeout(() => setter(false), 1800) }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, done)
    } else { done() }
  }

  const badge = result ? (result.kind === 'ok' ? '✓' : result.kind === 'warn' ? '!' : '✕') : ''

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <style>{VERIFY_CSS}</style>

      <div className="promo">
        <div className="promo-track">
          <span>Free shipping on orders over {FREE_SHIPPING_LABEL}</span>
          <span>New SS26 Drop is live</span>
          <span>Sign up for 15% off your first order</span>
          <span>Free shipping on orders over {FREE_SHIPPING_LABEL}</span>
          <span>New SS26 Drop is live</span>
          <span>Sign up for 15% off your first order</span>
        </div>
      </div>

      {/* NAV */}
      <nav>
        <a href="/" className="logo">VIBIN</a>
        <div className="nav-links">
          <a href="/shop">Shop</a>
          <a href="/shop" className="new">New Drop</a>
          <a href="/lookbook">Lookbook</a>
          <a href="/about">About</a>
          <a href="/verify">Verify</a>
          <a href="/returns">Stockists</a>
        </div>
        <div className="nav-actions">
          <a href="/qa" className="nav-icon" style={{ textDecoration: 'none', color: 'inherit' }}>🔍</a>
          <a href="/login" className="nav-icon" style={{ textDecoration: 'none', color: 'inherit' }}>👤</a>
          <a href="/cart" className="nav-icon" style={{ textDecoration: 'none', color: 'inherit' }}>
            🛒{cartCount > 0 && <span className="cart-dot">{cartCount}</span>}
          </a>
        </div>
      </nav>

      <div className="verify-wrap">
        <header className="verify-hero">
          <h1>Real piece?<br /><span className="turq">Prove it.</span></h1>
          <p className="lede">Every genuine Vibin piece ships with a <strong>unique code on its hang tag</strong>. Scan the QR or type the code below — the page confirms it&apos;s authentic and <strong>banks points toward your next purchase</strong>. Fakes don&apos;t scan. Yours will.</p>
        </header>

        <div className="verify-tape" aria-hidden="true"><span>We be vibin ★ Move different ★ Verify your piece ★ We be vibin ★ Move different ★ Verify your piece ★&nbsp;</span></div>

        <div className="verify-grid">
          {/* Verify tool */}
          <section className="verify-card" aria-labelledby="verify-h">
            <h2 id="verify-h">Check your code</h2>
            <p className="sub">Find the code printed under the QR on your hang tag. It looks like <strong>VBN-TCH5-2601</strong>.</p>
            <form onSubmit={(e) => { e.preventDefault(); verify(code) }} noValidate>
              <label className="verify-label" htmlFor="codeInput">Tag code</label>
              <div className="verify-row">
                <input
                  id="codeInput"
                  className="verify-input"
                  type="text"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck="false"
                  placeholder="VBN-____-____"
                  value={code}
                  onChange={(e) => setCode(normalize(e.target.value))}
                />
                <button className="verify-btn turq" type="submit" disabled={busy}>{busy ? 'Checking…' : 'Verify piece'}</button>
              </div>
              <p className="sub" style={{ margin: '10px 0 0', fontSize: 13 }}>Scanning the tag QR opens this page with your code already filled in.</p>
            </form>

            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 13, color: '#4c483c', margin: '0 0 8px', fontWeight: 600 }}>Demo codes — tap one to test the page the way a customer would:</p>
              <div className="verify-chips">
                {DEMO_CODES.map((d) => (
                  <button key={d.code} className="verify-chip" type="button" onClick={() => verify(d.code)}>
                    {d.code} · {d.label}
                  </button>
                ))}
              </div>
            </div>

            {result && (
              <div className="verify-result" role="status" aria-live="polite">
                <div className={`verify-result-box ${result.kind}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                    <div style={{ width: 42, height: 42, flex: 'none', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 22, fontWeight: 800, color: '#fff', background: result.kind === 'ok' ? '#0a9a87' : result.kind === 'warn' ? '#9a6a12' : '#b3372a' }} aria-hidden="true">{badge}</div>
                    <h3>{result.title}</h3>
                  </div>
                  <p>{result.body}</p>
                  {result.item && (
                    <dl className="verify-spec">
                      <div><dt>Piece</dt><dd>{result.item.product}</dd></div>
                      <div><dt>Drop</dt><dd>{result.item.drop}</dd></div>
                      <div><dt>Colorway</dt><dd>{result.item.colorway}</dd></div>
                      <div><dt>Size</dt><dd>{result.item.size}</dd></div>
                      <div><dt>Code</dt><dd style={{ fontFamily: 'monospace' }}>{result.code}</dd></div>
                    </dl>
                  )}
                  {result.phase === 'verified' && (
                    <form className="verify-claim" onSubmit={claim} noValidate>
                      <div className="verify-points">+<span className="n">{result.points}</span> points waiting</div>
                      <label className="verify-label" htmlFor="claimEmail">Your email — holds your points</label>
                      <div className="verify-row">
                        <input
                          id="claimEmail"
                          className="verify-input email"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          autoCapitalize="none"
                          spellCheck="false"
                          placeholder="you@email.com"
                          value={claimEmail}
                          onChange={(e) => setClaimEmail(e.target.value)}
                        />
                        <button className="verify-btn turq" type="submit" disabled={busy}>{busy ? 'Claiming…' : 'Claim points'}</button>
                      </div>
                      {claimError && <p className="verify-error" role="alert">{claimError}</p>}
                      <p className="verify-fine">The first piece you ever verify also adds a +50 welcome bonus.</p>
                    </form>
                  )}
                  {result.earned != null && (
                    <div className="verify-points">+<span className="n">{result.earned}</span> points banked</div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Hang tag */}
          <section className="verify-card" aria-labelledby="tag-h">
            <h2 id="tag-h">The tag</h2>
            <p className="sub">This is what the customer scans. One code per piece, printed at the factory.</p>
            <div className="verify-tag">
              <div className="verify-hangtag" aria-label="Sample Vibin hang tag">
                <div className="t-brand">Vibin<span className="dot">.</span></div>
                <div className="t-slogan">Move different ★ Vol. 01</div>
                <div className="qrbox"><img src={QR_DATA_URI} alt="QR code linking to the Vibin verify page with the sample code VBN-TCH5-2601 attached" width="118" height="118" /></div>
                <div className="t-code">VBN-TCH5-2601</div>
                <p className="t-note">Scan to verify it&apos;s real Vibin<br />&amp; earn points on every piece.</p>
              </div>
            </div>
            <p style={{ fontSize: 13, color: '#4c483c', textAlign: 'center', marginTop: 14 }}>Sample tag shown with the Tech Shorts demo code. The QR encodes this page&apos;s address with the code attached, so scanning lands the customer one tap from verified.</p>
          </section>
        </div>

        {/* Steps */}
        <div className="verify-steps">
          <div className="verify-step"><div className="num">01</div><h3>Find your code</h3><p>Every piece has a hang tag with a QR and a printed code underneath — one code, one piece, never reused.</p></div>
          <div className="verify-step"><div className="num">02</div><h3>Scan or type it</h3><p>Point your camera at the QR, or enter the code above. No account needed to check authenticity.</p></div>
          <div className="verify-step"><div className="num">03</div><h3>Get verified + points</h3><p>A real code confirms your piece. Add your email to claim its points — the first claim wins, then the code is locked.</p></div>
        </div>

        <div className="verify-grid">
          {/* Points */}
          <section className="verify-card" aria-labelledby="points-h">
            <h2 id="points-h">Vibin Points</h2>
            <p className="sub">Verifying a piece doesn&apos;t just prove it&apos;s real — it pays you back. Points stack across every piece you own.</p>
            <div className="verify-balance">
              <div>
                <div className="bal-label">Your balance</div>
                <div className="bal-num">{balance == null ? '—' : balance} <small style={{ fontSize: 18, letterSpacing: '.06em' }}>PTS</small></div>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 13, maxWidth: 220 }}>{balance == null ? 'Claim a piece to bank points. They live on your account, not in this tab.' : 'Held on your account — still here next visit.'}</div>
            </div>
            <div className="verify-acct">
              <label className="verify-label" htmlFor="acctEmail">Email your points are held under</label>
              <input
                id="acctEmail"
                className="verify-input email"
                style={{ width: '100%', boxSizing: 'border-box' }}
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck="false"
                placeholder="you@email.com"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
              />
            </div>
            {CONFIG.tiers.map((t) => {
              const known = balance != null
              const afford = known && balance >= t.cost
              return (
                <div key={t.id} className="verify-tier">
                  <div className="t-info"><strong>{t.label}</strong><span>{t.detail}</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="t-cost">{t.cost} PTS</span>
                    <button className={`verify-btn ${afford ? 'turq' : 'ghost'} small`} type="button" disabled={busy || (known && !afford)} onClick={() => redeem(t)}>Redeem</button>
                  </div>
                </div>
              )
            })}
            {pointsNote && <p className="verify-error" role="status">{pointsNote}</p>}
            {reward && (
              <div className="verify-reward">
                <div style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#4c483c' }}>Your reward code</div>
                <div className="code">{reward.code}</div>
                <p style={{ margin: '8px 0 12px', color: '#4c483c', fontSize: 14 }}>{reward.label} — single-use, tied to your account. Keep it safe.</p>
                <button className="verify-btn ghost small" type="button" onClick={() => copyText(reward.code, setCopied)}>{copied ? 'Copied ✓' : 'Copy code'}</button>
              </div>
            )}
            <ul className="verify-earn">
              <li><span>Verify a Drop 01 piece</span><b>+100 PTS</b></li>
              <li><span>Verify a limited / turquoise colorway</span><b>+150 PTS</b></li>
              <li><span>First piece you ever verify (welcome bonus)</span><b>+50 PTS</b></li>
            </ul>
          </section>

          {/* FAQ */}
          <section className="verify-card" aria-labelledby="faq-h">
            <h2 id="faq-h">Questions</h2>
            <p className="sub">The answers a customer needs before they message the brand.</p>
            <details className="verify-faq">
              <summary>My code says “already claimed.” What now?</summary>
              <p>Each code can be claimed once — that&apos;s what stops copied tags. If you bought the piece new and it says claimed, send a photo of the tag and your order confirmation to the brand and it&apos;ll be sorted out. Bought it secondhand? The piece can still be genuine; the points just went to the first owner.</p>
            </details>
            <details className="verify-faq">
              <summary>My code isn&apos;t found. Is my piece fake?</summary>
              <p>Check the code letter by letter — O and 0, I and 1 are easy to mix up, and the page flags those. If it still isn&apos;t found, the piece wasn&apos;t issued by Vibin. Buy only from Vibin and authorized sellers.</p>
            </details>
            <details className="verify-faq">
              <summary>Do points expire?</summary>
              <p>Points stay live for 12 months from the day they&apos;re earned. Reward codes are single-use and tied to the account that claimed them.</p>
            </details>
            <details className="verify-faq">
              <summary>Can I verify without an account?</summary>
              <p>Yes — authenticity checks never need an account. An account (or email) is only needed to hold points so they&apos;re still there on your next visit.</p>
            </details>
          </section>
        </div>

      </div>

      {/* FOOTER */}
      <footer>
        <div className="foot-top">Vibin <em>Different.</em></div>
        <div className="foot-cols">
          <div className="foot-brand">
            <div className="foot-logo">VIBIN</div>
            <div className="foot-tagline">A lifestyle streetwear brand from Miami, FL. Now based in Jacksonville. A subsidiary of HVD Holdings.</div>
          </div>
          <div className="foot-col">
            <h4>Shop</h4>
            <ul>
              <li><a href="/shop">All Products</a></li>
              <li><a href="/shop?cat=tees">Tees</a></li>
              <li><a href="/shop?cat=hoodies">Hoodies</a></li>
              <li><a href="/lookbook">Lookbook</a></li>
            </ul>
          </div>
          <div className="foot-col">
            <h4>Info</h4>
            <ul>
              <li><a href="/about">About</a></li>
              <li><a href="/verify">Verify</a></li>
              <li><a href="/shipping">Shipping</a></li>
              <li><a href="/returns">Returns</a></li>
              <li><a href="/qa">FAQ</a></li>
            </ul>
          </div>
        </div>
        <div className="foot-bottom">© 2026 Vibin Apparel · HVD Holdings, LLC · Jacksonville, FL</div>
      </footer>
    </>
  )
}
