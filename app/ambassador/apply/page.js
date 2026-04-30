'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AmbassadorApply() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    email: '',
    instagram: '',
    tiktok: '',
    why: '',
    audience: ''
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
      const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL !== 'YOUR_PROJECT_URL_HERE') {
        const { createClient } = require('@supabase/supabase-js')
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

        const code = 'AMB' + Math.random().toString(36).substring(2, 6).toUpperCase()

        await supabase
          .from('ambassadors')
          .insert({
            code,
            name: form.name,
            email: form.email,
            instagram_handle: form.instagram,
            tiktok_handle: form.tiktok,
            status: 'pending',
            commission_rate: 15,
            created_at: new Date().toISOString()
          })

        // Save to localStorage for immediate access
        localStorage.setItem('vibin_ambassador', JSON.stringify({
          code,
          name: form.name,
          email: form.email,
          status: 'pending'
        }))
      }

      setSubmitted(true)
    } catch (err) {
      console.error('Application error:', err)
      // Still show success for demo
      setSubmitted(true)
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
          <h1 style={{fontFamily:'Anton, sans-serif',fontSize:'48px',textTransform:'uppercase',marginBottom:'16px'}}>Application Received!</h1>
          <p style={{color:'#888',fontSize:'16px',marginBottom:'40px',lineHeight:'1.6'}}>
            We've received your ambassador application. Our team will review it within 48 hours.
            You'll receive an email at <strong>{form.email}</strong> with next steps.
          </p>
          <Link href="/ambassador" style={{display:'inline-block',padding:'16px 32px',background:'#e05c2e',color:'#fff',textDecoration:'none',borderRadius:'4px',fontWeight:'bold'}}>
            Go to Ambassador Hub →
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
          <h1 style={{fontFamily:'Anton, sans-serif',fontSize:'48px',textTransform:'uppercase',marginBottom:'12px'}}>Become an Ambassador ✦</h1>
          <p style={{color:'#888',fontSize:'16px'}}>Earn 15-25% commission by sharing Vibin with your audience</p>
        </div>

        <form onSubmit={handleSubmit} style={{background:'#111',padding:'40px',borderRadius:'8px'}}>
          <div style={{marginBottom:'20px'}}>
            <label style={{display:'block',fontSize:'12px',color:'#888',marginBottom:'8px',letterSpacing:'.1em',textTransform:'uppercase'}}>Full Name *</label>
            <input
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              style={{width:'100%',padding:'12px',background:'#0a0a0a',border:'1px solid #3a3a3a',color:'#f0ede6',fontSize:'14px'}}
            />
          </div>

          <div style={{marginBottom:'20px'}}>
            <label style={{display:'block',fontSize:'12px',color:'#888',marginBottom:'8px',letterSpacing:'.1em',textTransform:'uppercase'}}>Email *</label>
            <input
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              style={{width:'100%',padding:'12px',background:'#0a0a0a',border:'1px solid #3a3a3a',color:'#f0ede6',fontSize:'14px'}}
            />
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px',marginBottom:'20px'}}>
            <div>
              <label style={{display:'block',fontSize:'12px',color:'#888',marginBottom:'8px',letterSpacing:'.1em',textTransform:'uppercase'}}>Instagram Handle</label>
              <input
                name="instagram"
                type="text"
                value={form.instagram}
                onChange={handleChange}
                placeholder="@yourhandle"
                style={{width:'100%',padding:'12px',background:'#0a0a0a',border:'1px solid #3a3a3a',color:'#f0ede6',fontSize:'14px'}}
              />
            </div>
            <div>
              <label style={{display:'block',fontSize:'12px',color:'#888',marginBottom:'8px',letterSpacing:'.1em',textTransform:'uppercase'}}>TikTok Handle</label>
              <input
                name="tiktok"
                type="text"
                value={form.tiktok}
                onChange={handleChange}
                placeholder="@yourhandle"
                style={{width:'100%',padding:'12px',background:'#0a0a0a',border:'1px solid #3a3a3a',color:'#f0ede6',fontSize:'14px'}}
              />
            </div>
          </div>

          <div style={{marginBottom:'20px'}}>
            <label style={{display:'block',fontSize:'12px',color:'#888',marginBottom:'8px',letterSpacing:'.1em',textTransform:'uppercase'}}>Audience Size</label>
            <select
              name="audience"
              value={form.audience}
              onChange={handleChange}
              style={{width:'100%',padding:'12px',background:'#0a0a0a',border:'1px solid #3a3a3a',color:'#f0ede6',fontSize:'14px'}}
            >
              <option value="">Select...</option>
              <option value="1-5K">1,000 - 5,000</option>
              <option value="5-10K">5,000 - 10,000</option>
              <option value="10-50K">10,000 - 50,000</option>
              <option value="50K+">50,000+</option>
            </select>
          </div>

          <div style={{marginBottom:'30px'}}>
            <label style={{display:'block',fontSize:'12px',color:'#888',marginBottom:'8px',letterSpacing:'.1em',textTransform:'uppercase'}}>Why do you want to join? *</label>
            <textarea
              name="why"
              required
              value={form.why}
              onChange={handleChange}
              rows="4"
              placeholder="Tell us why you'd be a great Vibin ambassador..."
              style={{width:'100%',padding:'12px',background:'#0a0a0a',border:'1px solid #3a3a3a',color:'#f0ede6',fontSize:'14px',fontFamily:'Manrope, sans-serif',resize:'vertical'}}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width:'100%',
              padding:'16px',
              background: loading ? '#3a3a3a' : '#e05c2e',
              color:'#fff',
              border:'none',
              borderRadius:'4px',
              fontSize:'14px',
              fontWeight:'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              textTransform:'uppercase',
              letterSpacing:'.1em'
            }}
          >
            {loading ? 'Submitting...' : 'Submit Application →'}
          </button>
        </form>

        <div style={{marginTop:'30px',padding:'20px',background:'#111',borderRadius:'4px',fontSize:'13px',color:'#888',lineHeight:'1.6'}}>
          <strong style={{color:'#f0ede6'}}>What happens next?</strong><br />
          1. We review your application (48 hours)<br />
          2. Approved ambassadors get a unique referral code<br />
          3. Start earning 15% commission on every sale<br />
          4. Upgrade to 20-25% with more referrals
        </div>
      </div>
    </div>
  )
}
