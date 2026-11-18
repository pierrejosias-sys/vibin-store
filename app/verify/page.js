'use client'

import { useEffect, useRef, useState } from 'react'
import { useCart } from '../lib/cart-context'
import styles from '../styles.css'
import { FREE_SHIPPING_LABEL } from '../lib/shipping'

/* ==========================================================================
   Vibin Verify — /verify
   Frontend-only demo. No backend calls, no Supabase calls, no secrets.
   TODO (Dev): swap the DEMO_REGISTRY below for the real endpoints in the
   Dev spec on this page — GET /api/verify/:code, POST /api/claim,
   POST /api/redeem. Claude is building the Supabase schema separately.
   Points in this version are session-only (in-memory) by design.
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

/* Demo registry — production replaces this with GET /api/verify/:code */
const DEMO_REGISTRY = {
  'VBN-TCH5-2601': { product: 'Tech Shorts', drop: 'Drop 01 — SS26', colorway: 'Black / Gasoline Turquoise', size: 'L', points: 150, limited: true, claimed: false },
  'VBN-HDE8-2601': { product: 'Heavyweight Oversized Hoodie', drop: 'Drop 01 — SS26', colorway: 'Black', size: 'XL', points: 100, limited: false, claimed: false },
  'VBN-BRF3-2601': { product: 'Long-Leg Boxer Briefs', drop: 'Drop 01 — SS26', colorway: 'Black / Turquoise waistband', size: 'M', points: 100, limited: false, claimed: false },
  'VBN-MDV9-2601': { product: 'Move Different Tee', drop: 'Drop 01 — SS26', colorway: 'Deep Green', size: 'L', points: 100, limited: false, claimed: true, claimedAt: 'Nov 12, 2026' },
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

const SPEC_TEXT = [
  '# Vibin Verify — Dev Spec',
  '',
  'Customer flow: hang tag QR → vibinapparel.com/verify?c=<CODE> → page auto-verifies → first scan claims points.',
  '',
  '## Code format',
  'VBN-XXXX-XXXX (brand prefix + 8 chars from the full A–Z/0–9 alphabet; print in a mono font with a slashed/dotted zero). Case-insensitive.',
  'Codes are generated per production run and stored in the registry BEFORE product ships.',
  'A code not in the registry = not issued by Vibin. Never auto-create records on scan.',
  '',
  '## Registry record (one row per piece)',
  '- code (PK, unique)',
  '- product_name / sku',
  '- drop / colorway / size (shown on the verified card)',
  '- points_value (100 standard, 150 limited colorways)',
  '- status: unclaimed → claimed (one-way)',
  '- claimed_by / claimed_at',
  '- scan_count / last_scan_at (every lookup counts)',
  '',
  '## Endpoints',
  "GET  /api/verify/:code → 200 { status, product, drop, colorway, size, points_value } | 404 { status: 'not_found' }. Side effect: scan_count+1.",
  'POST /api/claim { code, account_or_email } → 200 { points_awarded, new_balance } | 409 already claimed. MUST be atomic.',
  'POST /api/redeem { account, tier_id } → 200 { reward_code } | 402 insufficient balance. Deduct in the same transaction.',
  '',
  '## Points config (launch)',
  '- Verify standard piece: +100 pts. Limited colorway: +150 pts. First-ever verify bonus: +50 pts.',
  '- Tiers: 200 pts → $10 off · 400 pts → $25 off · 750 pts → $50 off + early access to next drop.',
  '- Points expire 12 months after earning. Reward codes single-use, tied to account.',
  '',
  '## Anti-counterfeit rules',
  '- First scan claims; points move exactly once per code.',
  '- Rate-limit verify lookups per IP/device.',
  '- Flag codes with high scan_count or scans in far-apart places in a short window (copied tag signal) in an admin view.',
  "- One generic 'not found' answer — never reveal which part of a wrong code failed.",
  '- Audit log for claims/redemptions; support reversals only from the log, with a reason.',
  '',
  '## Launch checklist',
  '- [ ] Registry live; test batch of 50 codes printed on sample tags',
  '- [ ] QR artwork from final URLs; scan-tested on iPhone + Android',
  '- [ ] Claim/redeem atomic under double-tap',
  "- [ ] Support macros for 'already claimed' and 'not found' (copy lives in the page FAQ)",
  '- [ ] Admin view for flagged codes before Drop 01 ships',
  '',
].join('\n')

const VERIFY_CSS = `
.verify-wrap { max-width: 1060px; margin: 0 auto; padding: 0 20px 72px; }
.verify-hero { padding: 40px 0 8px; }
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
.verify-faq { border-top: 1.5px solid #d8d0ba; padding: 6px 0; }
.verify-faq summary { font-weight: 800; padding: 12px 0; cursor: pointer; min-height: 44px; display: flex; align-items: center; }
.verify-faq p { margin: 0 0 14px; color: #4c483c; font-size: 15px; }
.verify-dev { margin-top: 40px; border: 2px solid #12110d; border-radius: 14px; overflow: hidden; }
.verify-dev-head { background: #12110d; color: #f2ecdd; padding: 22px 26px; display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; align-items: center; }
.verify-dev-head h2 { font-size: 28px; margin: 0; text-transform: uppercase; color: #f2ecdd; }
.verify-dev-head p { margin: 4px 0 0; font-size: 14px; opacity: .85; max-width: 560px; }
.verify-dev-body { padding: 26px; background: #faf6ea; }
.verify-dev-body h3 { font-size: 20px; margin: 26px 0 8px; text-transform: uppercase; }
.verify-dev-body h3:first-child { margin-top: 0; }
.verify-dev-body p, .verify-dev-body li { font-size: 15px; color: #4c483c; }
.verify-dev-body strong { color: #12110d; }
.verify-dev-body ul { margin: 6px 0; padding-left: 20px; }
.verify-dev-body li { margin: 4px 0; }
.verify-todo { background: #f3e7c8; border: 2px solid #9a6a12; border-radius: 10px; padding: 14px 16px; margin-bottom: 18px; color: #12110d; font-size: 15px; }
.verify-codeblock { background: #12110d; color: #e9f5f1; border-radius: 10px; padding: 16px; overflow-x: auto; font-family: monospace; font-size: 13px; line-height: 1.6; margin: 10px 0; white-space: pre; }
.verify-table { width: 100%; border-collapse: collapse; font-size: 14px; margin: 10px 0; }
.verify-table th, .verify-table td { text-align: left; padding: 9px 10px; border-bottom: 1.5px solid #d8d0ba; vertical-align: top; }
.verify-table th { font-family: monospace; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: #4c483c; }
.verify-table td:first-child { font-family: monospace; font-weight: 600; white-space: nowrap; }
.verify-checklist { list-style: none; padding: 0; margin: 8px 0; }
.verify-checklist li { padding: 7px 0 7px 30px; position: relative; border-top: 1.5px solid #d8d0ba; }
`

export default function VerifyPage() {
  const { cartCount } = useCart()
  const [code, setCode] = useState('')
  const [result, setResult] = useState(null)
  const [balance, setBalance] = useState(0)
  const [claimed, setClaimed] = useState({})
  const [welcomed, setWelcomed] = useState(false)
  const [reward, setReward] = useState(null)
  const [copied, setCopied] = useState(false)
  const [specCopied, setSpecCopied] = useState(false)
  const autoRan = useRef(false)

  function verify(raw) {
    const formatted = normalize(raw)
    setCode(formatted)
    const plain = formatted.replace(/-/g, '')
    if (plain.length < 11) {
      setResult({ kind: 'bad', title: 'That code looks short', body: 'Tag codes are VBN-XXXX-XXXX — 8 characters after the VBN. Check the tag and try again.', item: null, code: formatted, earned: null })
      return
    }
    const item = DEMO_REGISTRY[formatted]
    if (!item) {
      setResult({ kind: 'bad', title: 'Code not found', body: formatted + " isn't in the Vibin registry. Check for lookalike letters (O/0, I/1) — and if it still isn't found, the piece wasn't issued by Vibin.", item: null, code: formatted, earned: null })
      return
    }
    if (claimed[formatted]) {
      setResult({ kind: 'ok', title: 'Verified — yours', body: 'You already claimed this piece in this session, so its points are in your balance. The piece is genuine.', item, code: formatted, earned: null })
      return
    }
    if (item.claimed) {
      setResult({ kind: 'warn', title: 'Real piece — points already claimed', body: 'This code was claimed on ' + (item.claimedAt || 'an earlier date') + '. The piece checks out as genuine Vibin, but each code pays its points once, to the first scan. Bought it new and seeing this? Send a photo of the tag plus your order confirmation to the brand.', item, code: formatted, earned: null })
      return
    }
    let earned = item.points
    let bonusNote = ''
    if (!welcomed) {
      setWelcomed(true)
      earned += CONFIG.welcomeBonus
      bonusNote = ' Includes your +50 first-verify welcome bonus.'
    }
    setClaimed((prev) => ({ ...prev, [formatted]: true }))
    setBalance((prev) => prev + earned)
    setResult({
      kind: 'ok',
      title: "Verified — it's real Vibin",
      body: 'This piece is genuine and its points are now claimed to you. Nobody else can claim this code. ' + (item.limited ? 'Limited colorway — paid the 150-point rate.' : 'Standard piece — 100 points.') + bonusNote,
      item,
      code: formatted,
      earned,
    })
  }

  /* Auto-verify from QR landing (?c=CODE) */
  useEffect(() => {
    if (autoRan.current) return
    autoRan.current = true
    try {
      const params = new URLSearchParams(window.location.search)
      const c = params.get('c')
      if (c) verify(c)
    } catch (e) { /* no-op */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function redeem(tier) {
    if (balance < tier.cost) return
    setBalance((prev) => prev - tier.cost)
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
    setReward({ code: tier.codeTag + '-' + rand, label: tier.label })
  }

  function downloadSpec() {
    const blob = new Blob([SPEC_TEXT], { type: 'text/markdown' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'vibin-verify-dev-spec.md'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 2000)
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
                <button className="verify-btn turq" type="submit">Verify piece</button>
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
          <div className="verify-step"><div className="num">03</div><h3>Get verified + points</h3><p>A real code confirms your piece and claims its points to you. First scan claims them — after that the code is locked.</p></div>
        </div>

        <div className="verify-grid">
          {/* Points */}
          <section className="verify-card" aria-labelledby="points-h">
            <h2 id="points-h">Vibin Points</h2>
            <p className="sub">Verifying a piece doesn&apos;t just prove it&apos;s real — it pays you back. Points stack across every piece you own.</p>
            <div className="verify-balance">
              <div>
                <div className="bal-label">Your balance this session</div>
                <div className="bal-num">{balance} <small style={{ fontSize: 18, letterSpacing: '.06em' }}>PTS</small></div>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 13, maxWidth: 220 }}>Verify a demo piece on the left to watch the balance move.</div>
            </div>
            {CONFIG.tiers.map((t) => {
              const can = balance >= t.cost
              return (
                <div key={t.id} className="verify-tier">
                  <div className="t-info"><strong>{t.label}</strong><span>{t.detail}</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="t-cost">{t.cost} PTS</span>
                    <button className={`verify-btn ${can ? 'turq' : 'ghost'} small`} type="button" disabled={!can} onClick={() => redeem(t)}>Redeem</button>
                  </div>
                </div>
              )
            })}
            {reward && (
              <div className="verify-reward">
                <div style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#4c483c' }}>Your reward code</div>
                <div className="code">{reward.code}</div>
                <p style={{ margin: '8px 0 12px', color: '#4c483c', fontSize: 14 }}>{reward.label} — single-use, tied to your account. (Demo code: production issues these from POST /api/redeem.)</p>
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

        {/* Dev handoff */}
        <div className="verify-dev" id="dev">
          <div className="verify-dev-head">
            <div>
              <h2>Hand-off for Dev</h2>
              <p>Everything needed to take this page from working prototype to production on vibinapparel.com. The customer flow above is the spec — build the backend to match it.</p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="verify-btn turq" type="button" onClick={downloadSpec}>Download spec (.md)</button>
              <button className="verify-btn ghost" type="button" style={{ color: '#f2ecdd', borderColor: '#f2ecdd' }} onClick={() => copyText(SPEC_TEXT, setSpecCopied)}>{specCopied ? 'Copied ✓' : 'Copy spec'}</button>
            </div>
          </div>
          <div className="verify-dev-body">
            <div className="verify-todo">
              <strong>TODO — Dev, frontend-only demo:</strong> This page is a working prototype with an in-memory demo registry. Points are session-only and reset on reload. There are no backend calls, no Supabase calls, and no secrets in this PR. Claude is building the Supabase schema separately — wire this page to <strong>GET /api/verify/:code</strong>, <strong>POST /api/claim</strong>, and <strong>POST /api/redeem</strong> per the spec below before Drop 01 ships.
            </div>
            <h3>1 — How it works in production</h3>
            <p>Each hang tag carries a <strong>unique code</strong> and a QR that encodes <strong>https://vibinapparel.com/verify?c=&lt;CODE&gt;</strong>. This page already reads the <strong>?c=</strong> parameter on load and auto-verifies, so a scan lands the customer on the result with zero typing. Codes are generated per production run, printed on tags, and stored in the registry <strong>before</strong> product ships. A code that isn&apos;t in the registry is treated as fake — never auto-create records on scan.</p>

            <h3>2 — Code format</h3>
            <div className="verify-codeblock">{'VBN-XXXX-XXXX        e.g. VBN-TCH5-2601\nAlphabet: full A–Z + 0–9 (36 chars). Print in a mono font\nwith a slashed/dotted zero so O/0 and I/1 stay readable.\nCodes are case-insensitive; the page uppercases and re-dashes input.'}</div>

            <h3>3 — Registry record (one row per piece)</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="verify-table">
                <thead><tr><th>Field</th><th>Notes</th></tr></thead>
                <tbody>
                  <tr><td>code</td><td>Primary key, unique. The full printed code.</td></tr>
                  <tr><td>product_name / sku</td><td>e.g. “Tech Shorts”, plus internal SKU.</td></tr>
                  <tr><td>drop / colorway / size</td><td>Shown on the verified result card.</td></tr>
                  <tr><td>points_value</td><td>100 standard, 150 limited colorways.</td></tr>
                  <tr><td>status</td><td>unclaimed → claimed. One-way. Never reset silently.</td></tr>
                  <tr><td>claimed_by / claimed_at</td><td>Account or email that claimed, timestamp.</td></tr>
                  <tr><td>scan_count / last_scan_at</td><td>Every lookup counts, claimed or not — spikes on one code = copied tag signal.</td></tr>
                </tbody>
              </table>
            </div>

            <h3>4 — Endpoints to build</h3>
            <div className="verify-codeblock">{'GET  /api/verify/:code\n     → 200 { status, product, drop, colorway, size, points_value }\n     → 404 { status: "not_found" }\n     Side effect: scan_count + 1, last_scan_at = now.\n\nPOST /api/claim   { code, account_or_email }\n     → 200 { points_awarded, new_balance }\n     → 409 if already claimed (return claimed_at, no points)\n     Must be atomic — two simultaneous claims, only one wins.\n\nPOST /api/redeem  { account, tier_id }\n     → 200 { reward_code }  (single-use, tied to account)\n     → 402 if balance < tier cost. Deduct points in same transaction.'}</div>

            <h3>5 — Anti-counterfeit rules</h3>
            <ul>
              <li><strong>First scan claims.</strong> Points move exactly once per code, ever.</li>
              <li><strong>Rate-limit</strong> verify lookups per IP/device — code guessing must be impractical.</li>
              <li><strong>Watch scan_count.</strong> A code scanned in two far-apart places in a short window is a copied tag — flag it in an admin view.</li>
              <li><strong>Never confirm</strong> which part of a wrong code is wrong. One generic “not found” answer.</li>
              <li>Keep an <strong>audit log</strong> of claims and redemptions; support can reverse a claim only from the log, with a reason.</li>
            </ul>

            <h3>6 — Points program (launch config)</h3>
            <p>All numbers live in one config object at the top of this page (<strong>CONFIG</strong>) so they can change without a redesign: <strong>100 pts</strong> per standard piece, <strong>150 pts</strong> limited colorways, <strong>+50</strong> first-ever verify. Redemption tiers: <strong>200 pts → $10 off</strong>, <strong>400 pts → $25 off</strong>, <strong>750 pts → $50 off + early access to the next drop</strong>. Points expire 12 months after they&apos;re earned.</p>

            <h3>7 — What this prototype already does</h3>
            <ul>
              <li>Full customer flow with all four states: <strong>verified, already claimed, not found, bad format</strong> — test them with the demo codes above.</li>
              <li>Reads <strong>?c=</strong> from the URL and auto-verifies (the QR landing behavior).</li>
              <li>Working points balance and redemption-code generation, in-memory for the session.</li>
              <li>Swap the demo registry for the two API calls in section 4 and the front end is production-shaped — same states, same layout.</li>
            </ul>

            <h3>8 — Launch checklist</h3>
            <ul className="verify-checklist">
              <li>Registry table live; test batch of 50 codes generated and printed on sample tags.</li>
              <li>QR artwork exported from final production URLs — scan-test with iPhone + Android cameras.</li>
              <li>Claim + redeem endpoints atomic under double-tap / double-scan.</li>
              <li>Support macro written for “already claimed” and “not found” cases (copy is in the FAQ above).</li>
              <li>Admin view for flagged codes (high scan_count) before Drop 01 ships.</li>
            </ul>
          </div>
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
