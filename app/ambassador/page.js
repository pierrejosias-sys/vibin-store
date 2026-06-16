'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function AmbassadorHub() {
  const [ambassador, setAmbassador] = useState(null)
  const [authState, setAuthState] = useState('loading')
  const [refCopied, setRefCopied] = useState(false)
  const [capCopied, setCapCopied] = useState(null)
  const [referredOrders, setReferredOrders] = useState([])
  const [payouts, setPayouts] = useState([])
  const [earnings, setEarnings] = useState({ total: 0, pending: 0, paid: 0 })
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    async function checkAccess() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setAuthState('unauthenticated'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_ambassador')
        .eq('id', session.user.id)
        .single()

      if (!profile?.is_ambassador) {
        const { data: application } = await supabase
          .from('ambassadors')
          .select('status, name, email')
          .eq('email', session.user.email)
          .single()
        setAuthState(application?.status === 'pending' ? 'pending' : 'unauthenticated')
        return
      }

      const { data: ambData } = await supabase
        .from('ambassadors')
        .select('*')
        .eq('email', session.user.email)
        .single()

      setAmbassador(ambData)
      setAuthState('approved')

      if (ambData?.code) {
        // Load referred orders
        const { data: orders } = await supabase
          .from('orders')
          .select('id, created_at, total_amount, status, commission_amount, commission_status')
          .eq('ambassador_code', ambData.code)
          .order('created_at', { ascending: false })

        if (orders) {
          setReferredOrders(orders)
          const total = orders.reduce((sum, o) => sum + (o.commission_amount || 0), 0)
          const paid = orders.filter(o => o.commission_status === 'paid').reduce((sum, o) => sum + (o.commission_amount || 0), 0)
          setEarnings({ total, pending: total - paid, paid })
        }

        // Load payout history
        const { data: payoutData } = await supabase
          .from('payouts')
          .select('*')
          .eq('ambassador_code', ambData.code)
          .order('created_at', { ascending: false })

        if (payoutData) setPayouts(payoutData)
      }
    }
    checkAccess()
  }, [])

  const shareLink = ambassador
    ? `https://vibinapparel.com/?ref=${ambassador.code}`
    : 'https://vibinapparel.com/?ref=YOURCODE'

  const copyRef = () => {
    navigator.clipboard.writeText(shareLink)
    setRefCopied(true)
    setTimeout(() => setRefCopied(false), 2000)
  }

  const copyCaption = (text) => {
    const filled = ambassador ? text.replace('[YOURCODE]', ambassador.code) : text
    navigator.clipboard.writeText(filled)
    setCapCopied(text)
    setTimeout(() => setCapCopied(null), 2000)
  }

  const fmt = (n) => `$${(n || 0).toFixed(2)}`

  const getTier = (count) => {
    if (count >= 15) return { label: 'ELITE', color: '#e05c2e' }
    if (count >= 5) return { label: 'RISING', color: '#d4a017' }
    return { label: 'STARTER', color: '#888' }
  }

  const captions = [
    'Move different. Vibin Apparel SS26 is live. Heavyweight cotton built to last past the season. Use my code [YOURCODE] for 15% off. ✦ #VibinDifferent',
    'Coral Vol 01 hoodie was MADE for these temps. Last pieces — once gone, gone. Code [YOURCODE] = 15% off. Link in bio. @vibinapparel',
    "Vibin different isn't a tagline. It's a posture. Confident. Calm. Community. Wear yours — code [YOURCODE]. ✦",
  ]
  const captionLabels = ['Drop 01 · Foundation Tee', 'Drop 01 · Vol 01 Hoodie', 'General · Community']

  const s = {
    page: { background: '#0a0a0a', minHeight: '100vh', color: '#f0ede6', fontFamily: 'Manrope, sans-serif' },
    header: { padding: '20px 40px', borderBottom: '1px solid #1e1e1e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    logo: { fontFamily: 'Anton, sans-serif', fontSize: '32px', color: '#f0ede6', textDecoration: 'none' },
    tab: (active) => ({
      padding: '10px 20px', background: active ? '#e05c2e' : 'transparent',
      border: `1px solid ${active ? '#e05c2e' : '#2a2a2a'}`, borderRadius: '4px',
      color: active ? '#fff' : '#888', fontWeight: 'bold', fontSize: '13px',
      cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '.05em',
      textTransform: 'uppercase',
    }),
    section: { padding: '50px 40px', borderBottom: '1px solid #1e1e1e' },
    mono: { fontFamily: 'JetBrains Mono, monospace' },
    anton: { fontFamily: 'Anton, sans-serif' },
    card: { background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px', padding: '24px' },
    badge: (color) => ({
      display: 'inline-block', padding: '3px 10px', borderRadius: '100px',
      fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '.1em',
      textTransform: 'uppercase', background: `${color}22`, color,
    }),
  }

  // ─── LOADING ───
  if (authState === 'loading') {
    return (
      <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ ...s.mono, color: '#555', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '.1em' }}>Checking access...</p>
      </div>
    )
  }

  // ─── NOT LOGGED IN ───
  if (authState === 'unauthenticated') {
    return (
      <div style={s.page}>
        <header style={s.header}>
          <Link href="/" style={s.logo}>VIBIN</Link>
        </header>
        <div style={{ maxWidth: '560px', margin: '0 auto', padding: '100px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '24px' }}>✦</div>
          <h1 style={{ ...s.anton, fontSize: '42px', textTransform: 'uppercase', marginBottom: '16px' }}>Ambassador Hub</h1>
          <p style={{ color: '#888', fontSize: '15px', marginBottom: '40px', lineHeight: '1.6' }}>
            This area is for approved Vibin ambassadors only. Apply to join the program or log in if you've already been approved.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" style={{ display: 'inline-block', padding: '14px 28px', background: '#e05c2e', color: '#fff', textDecoration: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '14px' }}>Log In →</Link>
            <Link href="/ambassador/apply" style={{ display: 'inline-block', padding: '14px 28px', background: 'transparent', color: '#f0ede6', textDecoration: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '14px', border: '1px solid #3a3a3a' }}>Apply to Join</Link>
          </div>
        </div>
      </div>
    )
  }

  // ─── PENDING ───
  if (authState === 'pending') {
    return (
      <div style={s.page}>
        <header style={s.header}>
          <Link href="/" style={s.logo}>VIBIN</Link>
        </header>
        <div style={{ maxWidth: '560px', margin: '0 auto', padding: '100px 20px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', background: '#1a1500', border: '1px solid #3d3000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '28px' }}>⏳</div>
          <h1 style={{ ...s.anton, fontSize: '42px', textTransform: 'uppercase', marginBottom: '16px' }}>Application Under Review</h1>
          <p style={{ color: '#888', fontSize: '15px', marginBottom: '16px', lineHeight: '1.6' }}>
            Your application is being reviewed. You'll receive an email within 48 hours.
          </p>
          <div style={{ padding: '20px', background: '#111', border: '1px solid #2a2000', borderRadius: '8px', marginBottom: '40px' }}>
            <p style={{ ...s.mono, fontSize: '10px', color: '#555', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: '8px' }}>Status</p>
            <p style={{ ...s.anton, fontSize: '28px', color: '#d4a017', textTransform: 'uppercase' }}>Pending Review</p>
          </div>
          <Link href="/" style={{ color: '#888', textDecoration: 'none', fontSize: '14px' }}>← Back to Store</Link>
        </div>
      </div>
    )
  }

  const tier = getTier(referredOrders.length)

  // ─── APPROVED DASHBOARD ───
  return (
    <div style={s.page}>
      <header style={s.header}>
        <Link href="/" style={s.logo}>VIBIN</Link>
        <span style={{ ...s.mono, fontSize: '11px', letterSpacing: '.15em', textTransform: 'uppercase', color: '#e05c2e' }}>Ambassador Hub</span>
      </header>

      {/* Hero */}
      <section style={{ padding: '60px 40px', textAlign: 'center', borderBottom: '1px solid #1e1e1e' }}>
        <h1 style={{ ...s.anton, fontSize: 'clamp(36px,6vw,64px)', textTransform: 'uppercase', marginBottom: '12px' }}>
          Welcome, {ambassador?.name?.split(' ')[0]} ✦
        </h1>
        <p style={{ color: '#888', fontSize: '16px' }}>Your dashboard. Your commissions. Your community.</p>
        <div style={{ marginTop: '12px' }}>
          <span style={s.badge(tier.color)}>{tier.label} Ambassador</span>
        </div>
      </section>

      {/* Stats */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1px', background: '#1e1e1e', borderBottom: '1px solid #1e1e1e' }}>
        {[
          { label: 'COMMISSION RATE', value: `${ambassador?.commission_rate || 15}%` },
          { label: 'TOTAL EARNED', value: fmt(earnings.total) },
          { label: 'ORDERS REFERRED', value: referredOrders.length },
          { label: 'PENDING PAYOUT', value: fmt(earnings.pending) },
        ].map((stat, i) => (
          <div key={i} style={{ background: '#111', padding: '30px', textAlign: 'center' }}>
            <div style={{ ...s.mono, fontSize: '10px', letterSpacing: '.15em', textTransform: 'uppercase', color: '#555', marginBottom: '8px' }}>{stat.label}</div>
            <div style={{ ...s.anton, fontSize: '32px', textTransform: 'uppercase', color: i === 3 && earnings.pending > 0 ? '#d4a017' : 'inherit' }}>{stat.value}</div>
          </div>
        ))}
      </section>

      {/* Tabs */}
      <div style={{ padding: '24px 40px', borderBottom: '1px solid #1e1e1e', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {['overview', 'orders', 'payouts', 'tools'].map(tab => (
          <button key={tab} style={s.tab(activeTab === tab)} onClick={() => setActiveTab(tab)}>{tab}</button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Referral Link */}
          <section style={s.section}>
            <h2 style={{ ...s.anton, fontSize: '24px', textTransform: 'uppercase', marginBottom: '30px', textAlign: 'center' }}>Your Referral Link</h2>
            <div style={{ display: 'flex', maxWidth: '700px', margin: '0 auto', gap: '30px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
              <div style={{ flex: '1 1 300px' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                  <input value={shareLink} readOnly style={{ flex: 1, padding: '16px', background: '#111', border: '1px solid #1e1e1e', borderRadius: '4px', color: '#f0ede6', ...s.mono, fontSize: '13px' }} />
                  <button onClick={copyRef} style={{ padding: '16px 24px', background: '#e05c2e', border: 'none', borderRadius: '4px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
                    {refCopied ? 'Copied ✓' : 'Copy'}
                  </button>
                </div>
                <p style={{ color: '#888', fontSize: '13px', textAlign: 'center' }}>Share this link on social media, emails, or messages</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', display: 'inline-block', marginBottom: '12px' }}>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(shareLink)}`} alt="QR Code" style={{ width: '160px', height: '160px', display: 'block' }} />
                </div>
                <p style={{ color: '#888', fontSize: '12px', ...s.mono }}>{ambassador?.code}</p>
              </div>
            </div>
          </section>

          {/* Commission Tiers */}
          <section style={s.section}>
            <h2 style={{ ...s.anton, fontSize: '24px', textTransform: 'uppercase', marginBottom: '30px', textAlign: 'center' }}>Commission Tiers</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px', maxWidth: '800px', margin: '0 auto' }}>
              {[
                { tier: 'STARTER', range: '0–4 sales', rate: '15%', min: 0 },
                { tier: 'RISING', range: '5–14 sales', rate: '20%', min: 5 },
                { tier: 'ELITE', range: '15+ sales', rate: '25% + early access', min: 15 },
              ].map((t, i) => {
                const isCurrentTier = tier.label === t.tier
                return (
                  <div key={i} style={{ ...s.card, border: `1px solid ${isCurrentTier ? '#e05c2e' : '#1e1e1e'}`, textAlign: 'center', position: 'relative' }}>
                    {isCurrentTier && <div style={{ position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)', background: '#e05c2e', color: '#fff', fontSize: '10px', ...s.mono, padding: '3px 12px', borderRadius: '0 0 6px 6px', letterSpacing: '.1em' }}>YOUR TIER</div>}
                    <div style={{ ...s.mono, fontSize: '10px', letterSpacing: '.15em', textTransform: 'uppercase', color: '#555', marginBottom: '8px', marginTop: '12px' }}>{t.tier}</div>
                    <div style={{ ...s.anton, fontSize: '32px', textTransform: 'uppercase', marginBottom: '8px' }}>{t.rate}</div>
                    <div style={{ ...s.mono, fontSize: '11px', color: '#888' }}>{t.range}</div>
                  </div>
                )
              })}
            </div>
          </section>
        </>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <section style={s.section}>
          <h2 style={{ ...s.anton, fontSize: '24px', textTransform: 'uppercase', marginBottom: '30px' }}>Referred Orders</h2>
          {referredOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#555' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>📦</div>
              <p style={{ ...s.mono, fontSize: '13px', letterSpacing: '.1em' }}>No referred orders yet. Share your link to start earning!</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', ...s.mono, fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2a2a2a', color: '#555', fontSize: '11px', letterSpacing: '.1em', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Order</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Order Total</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Commission</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {referredOrders.map((order) => (
                    <tr key={order.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                      <td style={{ padding: '14px 16px', color: '#888' }}>#{order.id?.slice(-6)?.toUpperCase()}</td>
                      <td style={{ padding: '14px 16px', color: '#888' }}>{new Date(order.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>{fmt(order.total_amount)}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: '#22c55e' }}>{fmt(order.commission_amount)}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={s.badge(order.status === 'delivered' ? '#22c55e' : order.status === 'shipped' ? '#d4a017' : '#888')}>{order.status}</span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={s.badge(order.commission_status === 'paid' ? '#22c55e' : '#d4a017')}>{order.commission_status || 'pending'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Payouts Tab */}
      {activeTab === 'payouts' && (
        <section style={s.section}>
          <h2 style={{ ...s.anton, fontSize: '24px', textTransform: 'uppercase', marginBottom: '8px' }}>Payout History</h2>
          <p style={{ color: '#555', fontSize: '13px', ...s.mono, marginBottom: '30px' }}>Payouts are processed manually by the Vibin team. You'll receive an email when a payout is sent.</p>

          {/* Earnings Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '40px', maxWidth: '600px' }}>
            {[
              { label: 'Total Earned', value: fmt(earnings.total), color: '#f0ede6' },
              { label: 'Already Paid', value: fmt(earnings.paid), color: '#22c55e' },
              { label: 'Pending', value: fmt(earnings.pending), color: '#d4a017' },
            ].map((e, i) => (
              <div key={i} style={{ ...s.card, textAlign: 'center' }}>
                <div style={{ ...s.mono, fontSize: '10px', color: '#555', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '8px' }}>{e.label}</div>
                <div style={{ ...s.anton, fontSize: '28px', color: e.color }}>{e.value}</div>
              </div>
            ))}
          </div>

          {payouts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#555' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>💸</div>
              <p style={{ ...s.mono, fontSize: '13px', letterSpacing: '.1em' }}>No payouts yet. Keep referring and we'll reach out when you're eligible.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {payouts.map((p, i) => (
                <div key={i} style={{ ...s.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <p style={{ ...s.mono, fontSize: '10px', color: '#555', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '4px' }}>{new Date(p.created_at).toLocaleDateString()}</p>
                    <p style={{ fontSize: '14px', color: '#ccc' }}>{p.method || 'Bank Transfer'}</p>
                    {p.note && <p style={{ ...s.mono, fontSize: '12px', color: '#555', marginTop: '4px' }}>{p.note}</p>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ ...s.anton, fontSize: '24px', color: '#22c55e' }}>{fmt(p.amount)}</div>
                    <span style={s.badge('#22c55e')}>{p.status || 'paid'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Tools Tab */}
      {activeTab === 'tools' && (
        <section style={s.section}>
          <h2 style={{ ...s.anton, fontSize: '24px', textTransform: 'uppercase', marginBottom: '30px' }}>Caption Library</h2>
          <div style={{ display: 'grid', gap: '20px', maxWidth: '700px' }}>
            {captions.map((cap, i) => (
              <div key={i} style={s.card}>
                <div style={{ ...s.mono, fontSize: '10px', letterSpacing: '.15em', textTransform: 'uppercase', color: '#e05c2e', marginBottom: '12px' }}>{captionLabels[i]}</div>
                <div style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '16px', color: '#ccc' }}>{cap.replace('[YOURCODE]', ambassador?.code || 'YOURCODE')}</div>
                <button onClick={() => copyCaption(cap)} style={{ padding: '10px 20px', background: '#e05c2e', border: 'none', borderRadius: '4px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                  {capCopied === cap ? 'Copied ✓' : 'Copy Caption'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ ...s.mono, fontSize: '11px', color: '#555', letterSpacing: '.1em' }}>
          Questions? Email ambassador@vibinapparel.com · Vibin Apparel Ambassador Program · HVD Holdings, LLC
        </p>
      </footer>
    </div>
  )
}
