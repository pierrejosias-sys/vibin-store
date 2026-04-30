<<<<<<< HEAD
export default function Ambassador() {
  return (
    <div className="min- h- screen bg- black text- white p-6">
      <h1 className="text-3xl font- bold mb-8">AMBASSADOR PROGRAM</h1>
      <p className="text- white/70 mb-6">Represent VIBIN. Earn free gear.</p>
      <ul className="space- y-2 text- white/70">
        <li>15% commission on referrals</li>
        <li>Free gear for reps</li>
        <li>Exclusive drops access</li>
        <li>Detroit events</li>
      </ul>
    </div>
  )
}
=======
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AmbassadorHub() {
  const [ambassador, setAmbassador] = useState(null)
  const [stats, setStats] = useState({ earned: 0, clicks: 0, orders: 0, rate: '15%' })
  const [refCopied, setRefCopied] = useState(false)
  const [capCopied, setCapCopied] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('vibin_ambassador')
    if (saved) {
      const amb = JSON.parse(saved)
      setAmbassador(amb)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (ambassador) {
      const refs = JSON.parse(localStorage.getItem('vibin_referrals') || '[]')
      const ambRefs = refs.filter(r => r.ambassadorCode === ambassador.code)
      const orders = ambRefs.filter(r => r.purchased).length
      const earned = Math.round(orders * 48 * 0.15 * 100) / 100
      let rate = '15%'
      if (orders >= 15) rate = '25%'
      else if (orders >= 5) rate = '20%'
      setStats({ earned, clicks: ambRefs.length, orders, rate })
    }
  }, [ambassador])

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

  const assets = [
    { type: 'PHOTO', name: 'Foundation Tee Product Shot' },
    { type: 'PHOTO', name: 'Vol 01 Hoodie · Lookbook' },
    { type: 'REEL', name: 'Drop 01 Teaser (MP4)' },
    { type: 'STORY', name: '15% Off Story Template' },
    { type: 'LOGO', name: 'Brand Logo Pack (PNG + SVG)' },
    { type: 'REEL', name: 'Founder Spotlight' },
  ]

  const captions = [
    'Move different. Vibin Apparel SS26 is live. Heavyweight cotton built to last past the season. Use my code [YOURCODE] for 15% off. ✦ #VibinDifferent',
    'Coral Vol 01 hoodie was MADE for these temps. Last pieces — once gone, gone. Code [YOURCODE] = 15% off. Link in bio. @vibinapparel',
    'Vibin different isn\'t a tagline. It\'s a posture. Confident. Calm. Community. Wear yours — code [YOURCODE]. ✦',
  ]

  const captionLabels = ['Drop 01 · Foundation Tee', 'Drop 01 · Vol 01 Hoodie', 'General · Community']

  if (loading) {
    return (
      <div style={{background:'#0a0a0a',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:'#f0ede6'}}>Loading...</div>
    )
  }

  if (!ambassador) {
    return (
      <div style={{background:'#0a0a0a',minHeight:'100vh',color:'#f0ede6',fontFamily:'Manrope, sans-serif'}}>
        <header style={{padding:'20px 40px',borderBottom:'1px solid #1e1e1e'}}>
          <Link href="/" style={{fontFamily:'Anton, sans-serif',fontSize:'32px',color:'#f0ede6',textDecoration:'none'}}>VIBIN</Link>
        </header>
        <div style={{maxWidth:'600px',margin:'0 auto',padding:'80px 20px',textAlign:'center'}}>
          <h1 style={{fontFamily:'Anton, sans-serif',fontSize:'48px',textTransform:'uppercase',marginBottom:'20px'}}>Ambassador Hub ✦</h1>
          <p style={{color:'#888',marginBottom:'40px'}}>Your dashboard. Your commissions. Your community.</p>
          <p style={{color:'#555',marginBottom:'40px'}}>Vibin Apparel · Ambassador Program · SS26</p>
          <Link href="/login" style={{display:'inline-block',padding:'16px 32px',background:'#e05c2e',color:'#fff',textDecoration:'none',borderRadius:'4px',fontWeight:'bold'}}>Login →</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{background:'#0a0a0a',minHeight:'100vh',color:'#f0ede6',fontFamily:'Manrope, sans-serif'}}>
      <header style={{padding:'20px 40px',borderBottom:'1px solid #1e1e1e',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <Link href="/" style={{fontFamily:'Anton, sans-serif',fontSize:'32px',color:'#f0ede6',textDecoration:'none'}}>VIBIN</Link>
        <span style={{fontFamily:'JetBrains Mono, monospace',fontSize:'11px',letterSpacing:'.15em',textTransform:'uppercase',color:'#e05c2e'}}>Ambassador Hub</span>
      </header>

      {/* HERO */}
      <section style={{padding:'60px 40px',textAlign:'center',borderBottom:'1px solid #1e1e1e'}}>
        <h1 style={{fontFamily:'Anton, sans-serif',fontSize:'clamp(36px,6vw,64px)',textTransform:'uppercase',marginBottom:'12px'}}>Ambassador Hub ✦</h1>
        <p style={{color:'#888',fontSize:'16px'}}>Your dashboard. Your commissions. Your community.</p>
        <p style={{fontFamily:'JetBrains Mono, monospace',fontSize:'10px',color:'#555',marginTop:'8px',letterSpacing:'.15em'}}>VIBIN APPAREL · AMBASSADOR PROGRAM · SS26</p>
      </section>

      {/* STATS */}
      <section style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1px',background:'#1e1e1e',borderBottom:'1px solid #1e1e1e'}}>
        {[
          { label: 'TOTAL EARNED', value: `$${stats.earned.toFixed(2)}` },
          { label: 'LINK CLICKS', value: stats.clicks },
          { label: 'ORDERS REFERRED', value: stats.orders },
          { label: 'COMMISSION RATE', value: stats.rate },
        ].map((stat, i) => (
          <div key={i} style={{background:'#111',padding:'30px',textAlign:'center'}}>
            <div style={{fontFamily:'JetBrains Mono, monospace',fontSize:'10px',letterSpacing:'.15em',textTransform:'uppercase',color:'#555',marginBottom:'8px'}}>{stat.label}</div>
            <div style={{fontFamily:'Anton, sans-serif',fontSize:'36px',textTransform:'uppercase'}}>{stat.value}</div>
          </div>
        ))}
      </section>

      {/* REFERRAL LINK */}
      <section style={{padding:'60px 40px',borderBottom:'1px solid #1e1e1e'}}>
        <h2 style={{fontFamily:'Anton, sans-serif',fontSize:'24px',textTransform:'uppercase',marginBottom:'20px',textAlign:'center'}}>Your Referral Link</h2>
        <div style={{display:'flex',maxWidth:'500px',margin:'0 auto',gap:'10px'}}>
          <input value={shareLink} readOnly style={{flex:1,padding:'16px',background:'#111',border:'1px solid #1e1e1e',borderRadius:'4px',color:'#f0ede6',fontFamily:'JetBrains Mono, monospace',fontSize:'14px'}} />
          <button onClick={copyRef} style={{padding:'16px 24px',background:'#e05c2e',border:'none',borderRadius:'4px',color:'#fff',fontWeight:'bold',cursor:'pointer'}}>
            {refCopied ? 'Copied ✓' : 'Copy Link'}
          </button>
        </div>
      </section>

      {/* COMMISSION TIERS */}
      <section style={{padding:'60px 40px',borderBottom:'1px solid #1e1e1e'}}>
        <h2 style={{fontFamily:'Anton, sans-serif',fontSize:'24px',textTransform:'uppercase',marginBottom:'30px',textAlign:'center'}}>Commission Structure</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'20px',maxWidth:'800px',margin:'0 auto'}}>
          {[
            { tier: 'STARTER', range: '0–4 sales', rate: '15%' },
            { tier: 'RISING', range: '5–14 sales', rate: '20%' },
            { tier: 'ELITE', range: '15+ sales', rate: '25% + early access', current: true },
          ].map((t, i) => (
            <div key={i} style={{background:'#111',border:'1px solid #1e1e1e',borderRadius:'10px',padding:'30px',textAlign:'center',borderColor:t.current ? '#e05c2e' : '#1e1e1e'}}>
              <div style={{fontFamily:'JetBrains Mono, monospace',fontSize:'10px',letterSpacing:'.15em',textTransform:'uppercase',color:'#555',marginBottom:'8px'}}>{t.tier}</div>
              <div style={{fontFamily:'Anton, sans-serif',fontSize:'32px',textTransform:'uppercase',marginBottom:'8px'}}>{t.rate}</div>
              <div style={{fontFamily:'JetBrains Mono, monospace',fontSize:'11px',color:'#888'}}>{t.range}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CONTENT LIBRARY */}
      <section style={{padding:'60px 40px',borderBottom:'1px solid #1e1e1e'}}>
        <h2 style={{fontFamily:'Anton, sans-serif',fontSize:'24px',textTransform:'uppercase',marginBottom:'30px',textAlign:'center'}}>Content Library</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'20px'}}>
          {assets.map((asset, i) => (
            <div key={i} style={{background:'#111',border:'1px solid #1e1e1e',borderRadius:'10px',padding:'20px'}}>
              <div style={{fontFamily:'JetBrains Mono, monospace',fontSize:'9px',letterSpacing:'.15em',textTransform:'uppercase',color:'#e05c2e',marginBottom:'12px'}}>{asset.type}</div>
              <div style={{background:'#0a0a0a',height:'100px',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'16px',borderRadius:'4px'}}>
                <span style={{fontSize:'32px',color:'#333'}}>✦</span>
              </div>
              <div style={{fontSize:'14px',marginBottom:'12px'}}>{asset.name}</div>
              <button style={{width:'100%',padding:'10px',background:'transparent',border:'1px solid #1e1e1e',borderRadius:'4px',color:'#888',cursor:'pointer',fontSize:'12px'}}>↓ Download</button>
            </div>
          ))}
        </div>
      </section>

      {/* CAPTION LIBRARY */}
      <section style={{padding:'60px 40px',borderBottom:'1px solid #1e1e1e'}}>
        <h2 style={{fontFamily:'Anton, sans-serif',fontSize:'24px',textTransform:'uppercase',marginBottom:'30px',textAlign:'center'}}>Caption Library</h2>
        <div style={{display:'grid',gap:'20px',maxWidth:'700px',margin:'0 auto'}}>
          {captions.map((cap, i) => (
            <div key={i} style={{background:'#111',border:'1px solid #1e1e1e',borderRadius:'10px',padding:'24px'}}>
              <div style={{fontFamily:'JetBrains Mono, monospace',fontSize:'10px',letterSpacing:'.15em',textTransform:'uppercase',color:'#e05c2e',marginBottom:'12px'}}>{captionLabels[i]}</div>
              <div style={{fontSize:'14px',lineHeight:'1.6',marginBottom:'16px',color:'#ccc'}}>{cap}</div>
              <button onClick={() => copyCaption(cap)} style={{padding:'10px 20px',background:'#e05c2e',border:'none',borderRadius:'4px',color:'#fff',fontWeight:'bold',cursor:'pointer'}}>
                {capCopied === cap ? 'Copied ✓' : 'Copy Caption'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER NOTE */}
      <footer style={{padding:'40px',textAlign:'center'}}>
        <p style={{fontFamily:'JetBrains Mono, monospace',fontSize:'11px',color:'#555',letterSpacing:'.1em'}}>
          Questions? Email ambassador@vibinapparel.com · Vibin Apparel Ambassador Program · HVD Holdings, LLC
        </p>
      </footer>
    </div>
  )
}
>>>>>>> dev
