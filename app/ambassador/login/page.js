'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AmbassadorLoginPage() {
  const router = useRouter()
  const [ambCode, setAmbCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Check if already logged in as ambassador
    const saved = localStorage.getItem('vibin_ambassador')
    if (saved) {
      const amb = JSON.parse(saved)
      if (amb.code) {
        router.push('/ambassador')
      }
    }
  }, [router])

  function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    setTimeout(() => {
      if (ambCode.length >= 4) {
        const ambData = {
          code: ambCode.toUpperCase(),
          name: 'Ambassador',
          status: 'active',
          createdAt: new Date().toISOString()
        }
        localStorage.setItem('vibin_ambassador', JSON.stringify(ambData))
        setMessage('Ambassador verified! Redirecting...')
        setTimeout(() => router.push('/ambassador'), 1000)
      } else {
        setMessage('Invalid ambassador code. Must be at least 4 characters.')
      }
      setLoading(false)
    }, 500)
  }

  return (
    <div style={{background:'#0a0a0a', minHeight:'100vh', color:'#f6f1e7', fontFamily:'Manrope, sans-serif'}}>
      <header style={{padding:'20px 40px', borderBottom:'1px solid #1e1e1e', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <Link href="/" style={{fontFamily:'Anton, sans-serif', fontSize:'32px', color:'#f6f1e7', textDecoration:'none'}}>VIBIN</Link>
        <Link href="/login" style={{color:'#888', textDecoration:'none', fontSize:'14px'}}>← Back to Sign In</Link>
      </header>

      <div style={{maxWidth:'500px', margin:'0 auto', padding:'100px 20px'}}>
        <div style={{textAlign:'center', marginBottom:'40px'}}>
          <div style={{fontSize:'64px', marginBottom:'16px'}}>✦</div>
          <h1 style={{fontFamily:'Anton, sans-serif', fontSize:'48px', textTransform:'uppercase', marginBottom:'12px'}}>
            Ambassador <em style={{fontStyle:'italic', color:'#e05c2e'}}>Login</em>
          </h1>
          <p style={{color:'#888', fontSize:'16px', lineHeight:'1.6'}}>
            Enter your unique ambassador code to access your dashboard and track earnings.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{background:'#111', padding:'40px', borderRadius:'8px'}}>
          <div style={{marginBottom:'24px'}}>
            <label style={{display:'block', fontSize:'12px', color:'#888', marginBottom:'8px', letterSpacing:'.1em', textTransform:'uppercase'}}>
              Ambassador Code *
            </label>
            <input
              type="text"
              required
              value={ambCode}
              onChange={(e) => setAmbCode(e.target.value.toUpperCase())}
              placeholder="e.g., VIBIN-JOE-2024"
              style={{
                width:'100%',
                padding:'14px 16px',
                background:'#0a0a0a',
                border:'1px solid #3a3a3a',
                color:'#f6f1e7',
                fontSize:'14px',
                fontFamily:'JetBrains Mono, monospace',
                letterSpacing:'.05em',
                boxSizing:'border-box'
              }}
            />
            <p style={{fontSize:'12px', color:'#666', marginTop:'8px'}}>
              Your code was sent to you via email when you were approved.
            </p>
          </div>

          {message && (
            <div style={{
              padding:'12px 16px',
              background: message.includes('Invalid') ? '#3a1a1a' : '#1a3a1a',
              border: `1px solid ${message.includes('Invalid') ? '#ff0000' : '#00ff00'}`,
              color: message.includes('Invalid') ? '#ff6666' : '#00ff00',
              fontSize:'13px',
              marginBottom:'20px',
              borderRadius:'4px'
            }}>
              {message}
            </div>
          )}

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
            {loading ? 'Verifying...' : 'Access Dashboard →'}
          </button>
        </form>

        <div style={{marginTop:'30px', padding:'24px', background:'#111', borderRadius:'8px', textAlign:'center'}}>
          <p style={{fontSize:'14px', color:'#888', marginBottom:'16px'}}>Don't have an ambassador code?</p>
          <Link href="/ambassador/apply" style={{
            display:'inline-block',
            padding:'12px 24px',
            background:'transparent',
            border:'1px solid #3a3a3a',
            color:'#888',
            textDecoration:'none',
            borderRadius:'4px',
            fontSize:'13px',
            textTransform:'uppercase',
            letterSpacing:'.1em'
          }}>
            Apply to Become an Ambassador →
          </Link>
        </div>

        <div style={{marginTop:'30px', textAlign:'center'}}>
          <p style={{fontSize:'13px', color:'#666'}}>
            Need help? Email <a href="mailto:ambassador@vibinapparel.com" style={{color:'#e05c2e'}}>ambassador@vibinapparel.com</a>
          </p>
        </div>
      </div>
    </div>
  )
}
