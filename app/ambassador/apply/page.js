'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function AmbassadorApply() {
  const [form, setForm] = useState({ name: '', email: '', instagram: '', tiktok: '', why: '', audience: '' })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Check for duplicate application
      const { data: existing } = await supabase
        .from('ambassadors')
        .select('id, status')
        .eq('email', form.email)
        .single()

      if (existing) {
        if (existing.status === 'pending') {
          setError('An application with this email is already under review.')
        } else if (existing.status === 'approved') {
          setError('This email is already an approved ambassador. Please log in.')
        } else {
          setError('A previous application from this email was declined. Contact ambassador@vibinapparel.com.')
        }
        setLoading(false)
        return
      }

      const { error: insertError } = await supabase
        .from('ambassadors')
        .insert({
          name: form.name,
          email: form.email,
          instagram_handle: form.instagram,
          tiktok_handle: form.tiktok,
          audience_size: form.audience,
          why: form.why,
          status: 'pending',
          commission_rate: 15,
          created_at: new Date().toISOString()
        })

      if (insertError) throw insertError

      setSubmitted(true)
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
    }

    setLoading(false)
  }

  if (submitted) {
    return (
      <div style={{background:'#0a0a0a',minHeight:'100vh',color:'#f0ede6',fontFamily:'Manrope, sans-serif'}}>
        <header style={{padding:'20px 40px',borderBottom:'1px solid #1e1e1e'}}>
          <Link href="/" style={{fontFamily:'Anton, sans-serif',fontSize:'32px',color:'#f0ede6',textDecoration:'none'}}>VIBIN</Link>
        </header>
        <div style={{maxWidth:'600px',margin:'0 auto',padding:'100px 20px',textAlign:'center'}}>
          <div style={{fontSize:'64px',marginBottom:'24px'}}>✦</div>
          <h1 style={{fontFamily:'Anton, sans-serif',fontSize:'48px',textTransform:'uppercase',marginBottom:'16px'}}>Application Received</h1>
          <p style={{color:'#888',fontSize:'16px',marginBottom:'16px',lineHeight:'1.6'}}>
            We've received your application and will review it within <strong style={{color:'#f0ede6'}}>48 hours</strong>.
          </p>
          <p style={{color:'#555',fontSize:'14px',marginBottom:'40px'}}>
            You'll receive an email at <strong style={{color:'#888'}}>{form.email}</strong> once a decision has been made.
            Do not attempt to access the ambassador dashboard until you receive your approval email.
          </p>
          <div style={{padding:'20px',background:'#111',border:'1px solid #1e1e1e',borderRadius:'8px',marginBottom:'40px'}}>
            <p style={{fontFamily:'JetBrains Mono, monospace',fontSize:'11px',color:'#555',letterSpacing:'.1em',textTransform:'uppercase',marginBottom:'8px'}}>Application Status</p>
            <p style={{fontFamily:'Anton, sans-serif',fontSize:'24px',color:'#e05c2e'}}>PENDING REVIEW</p>
          </div>
          <Link href="/" style={{display:'inline-block',padding:'16px 32px',background:'#1e1e1e',color:'#f0ede6',textDecoration:'none',borderRadius:'4px',fontWeight:'bold',fontSize:'14px'}}>
            ← Back to Store
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{background:'#0a0a0a',minHeight:'100vh',color:'#f0ede6',fontFamily:'Manrope, sans-serif'}}>
      <header style={{padding:'20px 40px',borderBottom:'1px solid #1e1e1e',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <Link href="/" style={{fontFamily:'Anton, sans-serif',fontSize:'32px',color:'#f0ede6',textDecoration:'none'}}>VIBIN</Link>
        <Link href="/careers" style={{color:'#888',textDecoration:'none',fontSize:'14px'}}>← Back to Careers</Link>
      </header>

      <div style={{maxWidth:'600px',margin:'0 auto',padding:'60px 20px'}}>
        <div style={{textAlign:'center',marginBottom:'40px'}}>
          <h1 style={{fontFamily:'Anton, sans-serif',fontSize:'48px',textTransform:'uppercase',marginBottom:'12px'}}>Apply to Become an Ambassador ✦</h1>
          <p style={{color:'#888',fontSize:'16px'}}>Applications are reviewed manually. Not everyone is approved.</p>
        </div>

        {error && (
          <div style={{padding:'16px',background:'#1a0a0a',border:'1px solid #5c1e1e',borderRadius:'4px',marginBottom:'24px',color:'#ff6b6b',fontSize:'14px'}}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{background:'#111',padding:'40px',borderRadius:'8px'}}>
          <div style={{marginBottom:'20px'}}>
            <label style={{display:'block',fontSize:'12px',color:'#888',marginBottom:'8px',letterSpacing:'.1em',textTransform:'uppercase'}}>Full Name *</label>
            <input name="name" type="text" required value={form.name} onChange={handleChange}
              style={{width:'100%',padding:'12px',background:'#0a0a0a',border:'1px solid #3a3a3a',color:'#f0ede6',fontSize:'14px',borderRadius:'4px'}} />
          </div>

          <div style={{marginBottom:'20px'}}>
            <label style={{display:'block',fontSize:'12px',color:'#888',marginBottom:'8px',letterSpacing:'.1em',textTransform:'uppercase'}}>Email *</label>
            <input name="email" type="email" required value={form.email} onChange={handleChange}
              style={{width:'100%',padding:'12px',background:'#0a0a0a',border:'1px solid #3a3a3a',color:'#f0ede6',fontSize:'14px',borderRadius:'4px'}} />
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px',marginBottom:'20px'}}>
            <div>
              <label style={{display:'block',fontSize:'12px',color:'#888',marginBottom:'8px',letterSpacing:'.1em',textTransform:'uppercase'}}>Instagram</label>
              <input name="instagram" type="text" value={form.instagram} onChange={handleChange} placeholder="@yourhandle"
                style={{width:'100%',padding:'12px',background:'#0a0a0a',border:'1px solid #3a3a3a',color:'#f0ede6',fontSize:'14px',borderRadius:'4px'}} />
            </div>
            <div>
              <label style={{display:'block',fontSize:'12px',color:'#888',marginBottom:'8px',letterSpacing:'.1em',textTransform:'uppercase'}}>TikTok</label>
              <input name="tiktok" type="text" value={form.tiktok} onChange={handleChange} placeholder="@yourhandle"
                style={{width:'100%',padding:'12px',background:'#0a0a0a',border:'1px solid #3a3a3a',color:'#f0ede6',fontSize:'14px',borderRadius:'4px'}} />
            </div>
          </div>

          <div style={{marginBottom:'20px'}}>
            <label style={{display:'block',fontSize:'12px',color:'#888',marginBottom:'8px',letterSpacing:'.1em',textTransform:'uppercase'}}>Audience Size</label>
            <select name="audience" value={form.audience} onChange={handleChange}
              style={{width:'100%',padding:'12px',background:'#0a0a0a',border:'1px solid #3a3a3a',color:'#f0ede6',fontSize:'14px',borderRadius:'4px'}}>
              <option value="">Select...</option>
              <option value="1-5K">1,000 – 5,000</option>
              <option value="5-10K">5,000 – 10,000</option>
              <option value="10-50K">10,000 – 50,000</option>
              <option value="50K+">50,000+</option>
            </select>
          </div>

          <div style={{marginBottom:'30px'}}>
            <label style={{display:'block',fontSize:'12px',color:'#888',marginBottom:'8px',letterSpacing:'.1em',textTransform:'uppercase'}}>Why do you want to join? *</label>
            <textarea name="why" required value={form.why} onChange={handleChange} rows="4"
              placeholder="Tell us why you'd be a great Vibin ambassador..."
              style={{width:'100%',padding:'12px',background:'#0a0a0a',border:'1px solid #3a3a3a',color:'#f0ede6',fontSize:'14px',fontFamily:'Manrope, sans-serif',resize:'vertical',borderRadius:'4px'}} />
          </div>

          <button type="submit" disabled={loading}
            style={{width:'100%',padding:'16px',background:loading?'#3a3a3a':'#e05c2e',color:'#fff',border:'none',borderRadius:'4px',fontSize:'14px',fontWeight:'bold',cursor:loading?'not-allowed':'pointer',textTransform:'uppercase',letterSpacing:'.1em'}}>
            {loading ? 'Submitting...' : 'Submit Application →'}
          </button>
        </form>

        <div style={{marginTop:'30px',padding:'20px',background:'#111',border:'1px solid #1e1e1e',borderRadius:'4px',fontSize:'13px',color:'#888',lineHeight:'1.8'}}>
          <strong style={{color:'#f0ede6',display:'block',marginBottom:'8px'}}>How it works</strong>
          1. Submit your application below<br />
          2. Our team reviews it within 48 hours<br />
          3. If approved, you'll receive a unique referral code via email<br />
          4. Earn 15–25% commission on every referred sale
        </div>
      </div>
    </div>
  )
}
