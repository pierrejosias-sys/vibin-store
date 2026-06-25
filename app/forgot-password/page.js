'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

export default function ForgotPasswordPage() {
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ), [])

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })

    if (error) {
      setMessage('Something went wrong. Please try again.')
    } else {
      setSent(true)
      setMessage(`If an account with ${email} exists, you'll receive a password reset link shortly.`)
    }

    setLoading(false)
  }

  return (
    <div style={{background:'#0a0a0a', minHeight:'100vh', color:'#f6f1e7', fontFamily:'Manrope, sans-serif'}}>
      <nav style={{padding:'20px 40px', borderBottom:'1px solid #1e1e1e', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <Link href="/" style={{fontFamily:'Anton, sans-serif', fontSize:'32px', color:'#f6f1e7', textDecoration:'none'}}>VIBIN</Link>
        <Link href="/login" style={{color:'#888', textDecoration:'none', fontSize:'14px'}}>← Back to Sign In</Link>
      </nav>

      <div style={{maxWidth:'400px', margin:'0 auto', padding:'100px 20px'}}>
        <div style={{textAlign:'center', marginBottom:'40px'}}>
          <div style={{fontSize:'48px', marginBottom:'16px'}}>🔒</div>
          <h1 style={{fontFamily:'Anton, sans-serif', fontSize:'36px', textTransform:'uppercase', marginBottom:'12px'}}>Reset Password</h1>
          <p style={{color:'#888', fontSize:'14px', lineHeight:'1.6'}}>
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {sent ? (
          <div style={{background:'#1a3a1a', border:'1px solid #2a5a2a', padding:'24px', borderRadius:'8px', textAlign:'center'}}>
            <div style={{fontSize:'32px', marginBottom:'12px'}}>✉️</div>
            <p style={{color:'#88cc88', fontSize:'14px', lineHeight:'1.6'}}>{message}</p>
            <Link href="/login" style={{display:'inline-block', marginTop:'20px', color:'#e05c2e', textDecoration:'none', fontSize:'14px'}}>
              ← Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{background:'#111', padding:'40px', borderRadius:'8px'}}>
            <div style={{marginBottom:'24px'}}>
              <label style={{display:'block', fontSize:'12px', color:'#888', marginBottom:'8px', letterSpacing:'.1em', textTransform:'uppercase'}}>
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={{
                  width:'100%',
                  padding:'12px',
                  background:'#0a0a0a',
                  border:'1px solid #3a3a3a',
                  color:'#f6f1e7',
                  fontSize:'14px',
                  boxSizing:'border-box',
                  borderRadius:'4px'
                }}
              />
            </div>

            {message && (
              <div style={{
                padding:'12px',
                background:'#3a1a1a',
                border:'1px solid #5a2a2a',
                color:'#ff8888',
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
                padding:'14px',
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
              {loading ? 'Sending...' : 'Send Reset Link →'}
            </button>

            <p style={{textAlign:'center', marginTop:'20px', fontSize:'13px', color:'#888'}}>
              Remember your password? <Link href="/login" style={{color:'#e05c2e', textDecoration:'none'}}>Sign In</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
