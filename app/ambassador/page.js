'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function AmbassadorHub() {
  const router = useRouter()
  const [ambassador, setAmbassador] = useState(null)
  const [authState, setAuthState] = useState('loading') // loading | unauthenticated | pending | approved
  const [refCopied, setRefCopied] = useState(false)
  const [capCopied, setCapCopied] = useState(null)

  useEffect(() => {
    async function checkAccess() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setAuthState('unauthenticated')
        return
      }

      // Check if approved ambassador
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_ambassador')
        .eq('id', session.user.id)
        .single()

      if (!profile?.is_ambassador) {
        // Check if they have a pending application
        const { data: application } = await supabase
          .from('ambassadors')
          .select('status, name, email')
          .eq('email', session.user.email)
          .single()

        if (application?.status === 'pending') {
          setAuthState('pending')
        } else {
          setAuthState('unauthenticated')
        }
        return
      }

      // Approved — load ambassador record
      const { data: ambData } = await supabase
        .from('ambassadors')
        .select('*')
        .eq('email', session.user.email)
        .single()

      setAmbassador(ambData)
      setAuthState('approved')
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
    "Vibin different isn't a tagline. It's a posture. Confident. Calm. Community. Wear yours — code [YOURCODE]. ✦",
  ]
  const captionLabels = ['Drop 01 · Foundation Tee', 'Drop 01 · Vol 01 Hoodie', 'General · Community']

  // ─── LOADING ───
  if (authState === 'loading') {
    return (
      <div style={{background:'#0a0a0a',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:'#f0ede6',fontFamily:'Manrope, sans-serif'}}>
        <p style={{color:'#555',fontFamily:'JetBrains Mono, monospace',letterSpacing:'.1em',fontSize:'12px',textTransform:'uppercase'}}>Checking access...</p>
      </div>
    )
  }

  // ─── NOT LOGGED IN ───
  if (authState === 'unauthenticated') {
    return (
      <div style={{background:'#0a0a0a',minHeight:'100vh',color:'#f0ede6',fontFamily:'Manrope, sans-serif'}}>
        <header style={{padding:'20px 40px',borderBottom:'1px solid #1e1e1e'}}>
          <Link href="/" style={{fontFamily:'Anton, sans-serif',fontSize:'32px',color:'#f0ede6',textDecoration:'none'}}>VIBIN</Link>
        </header>
        <div style={{maxWidth:'560px',margin:'0 auto',padding:'100px 20px',textAlign:'center'}}>
          <div style={{fontSize:'48px',marginBottom:'24px'}}>✦</div>
          <h1 style={{fontFamily:'Anton, sans-serif',fontSize:'42px',textTransform:'uppercase',marginBottom:'16px'}}>Ambassador Hub</h1>
          <p style={{color:'#888',fontSize:'15px',marginBottom:'40px',lineHeight:'1.6'}}>
            This area is for approved Vibin ambassadors only. Apply to join the program or log in if you've already been approved.
          </p>
          <div style={{display:'flex',gap:'16px',justifyContent:'center',flexWrap:'wrap'}}>
            <Link href="/login" style={{display:'inline-block',padding:'14px 28px',background:'#e05c2e',color:'#fff',textDecoration:'none',borderRadius:'4px',fontWeight:'bold',fontSize:'14px'}}>Log In →</Link>
            <Link href="/ambassador/apply" style={{display:'inline-block',padding:'14px 28px',background:'transparent',color:'#f0ede6',textDecoration:'none',borderRadius:'4px',fontWeight:'bold',fontSize:'14px',border:'1px solid #3a3a3a'}}>Apply to Join</Link>
          </div>
        </div>
      </div>
    )
  }

  // ─── PENDING APPROVAL ───
  if (authState === 'pending') {
    return (
      <div style={{background:'#0a0a0a',minHeight:'100vh',color:'#f0ede6',fontFamily:'Manrope, sans-serif'}}>
        <header style={{padding:'20px 40px',borderBottom:'1px solid #1e1e1e'}}>
          <Link href="/" style={{fontFamily:'Anton, sans-serif',fontSize:'32px',color:'#f0ede6',textDecoration:'none'}}>VIBIN</Link>
        </header>
        <div style={{maxWidth:'560px',margin:'0 auto',padding:'100px 20px',textAlign:'center'}}>
          <div style={{width:'64px',height:'64px',background:'#1a1500',border:'1px solid #3d3000',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px',fontSize:'28px'}}>⏳</div>
          <h1 style={{fontFamily:'Anton, sans-serif',fontSize:'42px',textTransform:'uppercase',marginBottom:'16px'}}>Application Under Review</h1>
          <p style={{color:'#888',fontSize:'15px',marginBottom:'16px',lineHeight:'1.6'}}>
            Your application has been received and is being reviewed by our team.
            You'll get an email once a decision has been made — typically within 48 hours.
          </p>
          <div style={{padding:'20px',background:'#111',border:'1px solid #2a2000',borderRadius:'8px',marginBottom:'40px'}}>
            <p style={{fontFamily:'JetBrains Mono, monospace',fontSize:'10px',color:'#555',letterSpacing:'.15em',textTransform:'uppercase',marginBottom:'8px'}}>Status</p>
            <p style={{fontFamily:'Anton, sans-serif',fontSize:'28px',color:'#d4a017',textTransform:'uppercase'}}>Pending Review</p>
          </div>
          <Link href="/" style={{color:'#888',textDecoration:'none',fontSize:'14px'}}>← Back to Store</Link>
        </div>
      </div>
    )
  }

  // ─── APPROVED DASHBOARD ───
  return (
    <div style={{background:'#0a0a0a',minHeight:'100vh',color:'#f0ede6',fontFamily:'Manrope, sans-serif'}}>
      <header style={{padding:'20px 40px',borderBottom:'1px solid #1e1e1e',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <Link href="/" style={{fontFamily:'Anton, sans-serif',fontSize:'32px',color:'#f0ede6',textDecoration:'none'}}>VIBIN</Link>
        <span style={{fontFamily:'JetBrains Mono, monospace',fontSize:'11px',letterSpacing:'.15em',textTransform:'uppercase',color:'#e05c2e'}}>Ambassador Hub</span>
      </header>

      <section style={{padding:'60px 40px',textAlign:'center',borderBottom:'1px solid #1e1e1e'}}>
        <h1 style={{fontFamily:'Anton, sans-serif',fontSize:'clamp(36px,6vw,64px)',textTransform:'uppercase',marginBottom:'12px'}}>Welcome, {ambassador?.name?.split(' ')[0]} ✦</h1>
        <p style={{color:'#888',fontSize:'16px'}}>Your dashboard. Your commissions. Your community.</p>
        <p style={{fontFamily:'JetBrains Mono, monospace',fontSize:'10px',color:'#555',marginTop:'8px',letterSpacing:'.15em'}}>VIBIN APPAREL · AMBASSADOR PROGRAM · SS26</p>
      </section>

      <section style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1px',background:'#1e1e1e',borderBottom:'1px solid #1e1e1e'}}>
        {[
          { label: 'COMMISSION RATE', value: `${ambassador?.commission_rate || 15}%` },
          { label: 'TOTAL EARNED', value: '$0.00' },
          { label: 'ORDERS REFERRED', value: '0' },
          { label: 'STATUS', value: 'ACTIVE' },
        ].map((stat, i) => (
          <div key={i} style={{background:'#111',padding:'30px',textAlign:'center'}}>
            <div style={{fontFamily:'JetBrains Mono, monospace',fontSize:'10px',letterSpacing:'.15em',textTransform:'uppercase',color:'#555',marginBottom:'8px'}}>{stat.label}</div>
            <div style={{fontFamily:'Anton, sans-serif',fontSize:'32px',textTransform:'uppercase',color: stat.label === 'STATUS' ? '#22c55e' : 'inherit'}}>{stat.value}</div>
          </div>
        ))}
      </section>

      <section style={{padding:'60px 40px',borderBottom:'1px solid #1e1e1e'}}>
        <h2 style={{fontFamily:'Anton, sans-serif',fontSize:'24px',textTransform:'uppercase',marginBottom:'30px',textAlign:'center'}}>Your Referral Link</h2>
        <div style={{display:'flex',maxWidth:'700px',margin:'0 auto',gap:'30px',alignItems:'center',flexWrap:'wrap',justifyContent:'center'}}>
          <div style={{flex:'1 1 300px'}}>
            <div style={{display:'flex',gap:'10px',marginBottom:'20px'}}>
              <input value={shareLink} readOnly style={{flex:1,padding:'16px',background:'#111',border:'1px solid #1e1e1e',borderRadius:'4px',color:'#f0ede6',fontFamily:'JetBrains Mono, monospace',fontSize:'13px'}} />
              <button onClick={copyRef} style={{padding:'16px 24px',background:'#e05c2e',border:'none',borderRadius:'4px',color:'#fff',fontWeight:'bold',cursor:'pointer'}}>
                {refCopied ? 'Copied ✓' : 'Copy'}
              </button>
            </div>
            <p style={{color:'#888',fontSize:'13px',textAlign:'center'}}>Share this link on social media, emails, or messages</p>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{background:'#fff',padding:'20px',borderRadius:'8px',display:'inline-block',marginBottom:'12px'}}>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(shareLink)}`} alt="QR Code" style={{width:'160px',height:'160px',display:'block'}} />
            </div>
            <p style={{color:'#888',fontSize:'12px',fontFamily:'JetBrains Mono, monospace'}}>{ambassador?.code}</p>
          </div>
        </div>
      </section>

      <section style={{padding:'60px 40px',borderBottom:'1px solid #1e1e1e'}}>
        <h2 style={{fontFamily:'Anton, sans-serif',fontSize:'24px',textTransform:'uppercase',marginBottom:'30px',textAlign:'center'}}>Commission Tiers</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'20px',maxWidth:'800px',margin:'0 auto'}}>
          {[
            { tier: 'STARTER', range: '0–4 sales', rate: '15%' },
            { tier: 'RISING', range: '5–14 sales', rate: '20%' },
            { tier: 'ELITE', range: '15+ sales', rate: '25% + early access' },
          ].map((t, i) => (
            <div key={i} style={{background:'#111',border:'1px solid #1e1e1e',borderRadius:'10px',padding:'30px',textAlign:'center'}}>
              <div style={{fontFamily:'JetBrains Mono, monospace',fontSize:'10px',letterSpacing:'.15em',textTransform:'uppercase',color:'#555',marginBottom:'8px'}}>{t.tier}</div>
              <div style={{fontFamily:'Anton, sans-serif',fontSize:'32px',textTransform:'uppercase',marginBottom:'8px'}}>{t.rate}</div>
              <div style={{fontFamily:'JetBrains Mono, monospace',fontSize:'11px',color:'#888'}}>{t.range}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{padding:'60px 40px',borderBottom:'1px solid #1e1e1e'}}>
        <h2 style={{fontFamily:'Anton, sans-serif',fontSize:'24px',textTransform:'uppercase',marginBottom:'30px',textAlign:'center'}}>Caption Library</h2>
        <div style={{display:'grid',gap:'20px',maxWidth:'700px',margin:'0 auto'}}>
          {captions.map((cap, i) => (
            <div key={i} style={{background:'#111',border:'1px solid #1e1e1e',borderRadius:'10px',padding:'24px'}}>
              <div style={{fontFamily:'JetBrains Mono, monospace',fontSize:'10px',letterSpacing:'.15em',textTransform:'uppercase',color:'#e05c2e',marginBottom:'12px'}}>{captionLabels[i]}</div>
              <div style={{fontSize:'14px',lineHeight:'1.6',marginBottom:'16px',color:'#ccc'}}>{cap.replace('[YOURCODE]', ambassador?.code || 'YOURCODE')}</div>
              <button onClick={() => copyCaption(cap)} style={{padding:'10px 20px',background:'#e05c2e',border:'none',borderRadius:'4px',color:'#fff',fontWeight:'bold',cursor:'pointer',fontSize:'13px'}}>
                {capCopied === cap ? 'Copied ✓' : 'Copy Caption'}
              </button>
            </div>
          ))}
        </div>
      </section>

      <footer style={{padding:'40px',textAlign:'center'}}>
        <p style={{fontFamily:'JetBrains Mono, monospace',fontSize:'11px',color:'#555',letterSpacing:'.1em'}}>
          Questions? Email ambassador@vibinapparel.com · Vibin Apparel Ambassador Program · HVD Holdings, LLC
        </p>
      </footer>
    </div>
  )
}
