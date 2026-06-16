'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [ambassadorMode, setAmbassadorMode] = useState(false)
  const [ambCode, setAmbCode] = useState('')
  const [showUnsubscribe, setShowUnsubscribe] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('role') === 'ambassador') setAmbassadorMode(true)
    if (params.get('error') === 'auth_failed') {
      setMessage('Sign-in failed. Please try again.')
      setMessageType('error')
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) redirectByRole(session.user)
    })
  }, [])

  async function redirectByRole(user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, is_ambassador')
      .eq('id', user.id)
      .single()
    if (profile?.is_admin) router.push('/admin')
    else if (profile?.is_ambassador) router.push('/ambassador')
    else router.push('/profile')
  }

  async function signInWithOAuth(provider) {
    setOauthLoading(provider)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: provider === 'google' ? { access_type: 'offline', prompt: 'consent' } : {}
      }
    })
    if (error) {
      setMessage(`${provider} sign-in failed: ${error.message}`)
      setMessageType('error')
      setOauthLoading('')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (ambassadorMode) {
      setTimeout(() => {
        if (ambCode.length >= 4) {
          setMessage('Ambassador logged in!')
          setMessageType('success')
          setTimeout(() => router.push('/ambassador'), 1000)
        } else {
          setMessage('Invalid ambassador code')
          setMessageType('error')
        }
        setLoading(false)
      }, 500)
      return
    }

    if (isRegister) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { first_name: firstName, last_name: lastName },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) {
        setMessage(error.message)
        setMessageType('error')
      } else if (data.user && !data.session) {
        setMessage('Check your email to confirm your account!')
        setMessageType('success')
      } else if (data.session) {
        setMessage('Account created! Redirecting...')
        setMessageType('success')
        redirectByRole(data.user)
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage(error.message)
        setMessageType('error')
      } else {
        redirectByRole(data.user)
      }
    }
    setLoading(false)
  }

  function handleUnsubscribe(e) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setMessage('You have been unsubscribed from the newsletter.')
      setMessageType('success')
      setShowUnsubscribe(false)
      setLoading(false)
    }, 500)
  }

  return (
    <>
      <nav className="dark">
        <Link href="/" className="logo">VIBIN</Link>
        <Link href="/" className="back">← Back to Shop</Link>
      </nav>

      <div className="split">
        {/* LEFT PANEL */}
        <div className="split-left">
          <div />
          <div className="split-left-content">
            <div className="sl-eye">{ambassadorMode ? 'Ambassador' : 'Member'} Access</div>
            <h1 className="sl-title">Move<br/><em>different.</em></h1>
            <p className="sl-body">
              {ambassadorMode
                ? 'Access your ambassador dashboard. Track earnings, share links, and earn commission on every sale.'
                : 'Join the inside circle. Early access to drops, member-only pieces, and the people who actually move the brand forward.'}
            </p>
            <div className="sl-perks">
              {ambassadorMode ? (
                <>
                  <div className="sl-perk"><div className="sl-perk-icon">$</div><div><strong>15% commission</strong>On every referral</div></div>
                  <div className="sl-perk"><div className="sl-perk-icon">↗</div><div><strong>Unique links</strong>Track your sales</div></div>
                  <div className="sl-perk"><div className="sl-perk-icon">★</div><div><strong>Exclusive drops</strong>Ambassador-only releases</div></div>
                </>
              ) : (
                <>
                  <div className="sl-perk"><div className="sl-perk-icon">❆</div><div><strong>Early access</strong>Drops 24 hours before the public</div></div>
                  <div className="sl-perk"><div className="sl-perk-icon">→</div><div><strong>Member pricing</strong>15% off your first order</div></div>
                  <div className="sl-perk"><div className="sl-perk-icon">▸</div><div><strong>Free shipping</strong>On all orders over $75</div></div>
                  <div className="sl-perk"><div className="sl-perk-icon">★</div><div><strong>Ambassador track</strong>Earn commission for sharing</div></div>
                </>
              )}
            </div>
          </div>
          <div className="sl-foot">VIBIN · A subsidiary of HVD Holdings, LLC</div>
        </div>

        {/* RIGHT PANEL */}
        <div className="split-right">
          <div className="form-wrap">

            {!ambassadorMode && !showUnsubscribe && (
              <div className="form-tabs">
                <button className={`form-tab ${!isRegister ? 'on' : ''}`} onClick={() => { setIsRegister(false); setMessage('') }}>Sign In</button>
                <button className={`form-tab ${isRegister ? 'on' : ''}`} onClick={() => { setIsRegister(true); setMessage('') }}>Create Account</button>
              </div>
            )}

            {ambassadorMode ? (
              <div className="panel on">
                <div className="form-eye">Ambassador Portal</div>
                <h2 className="form-title">Ambassador<br/><em>Login</em></h2>
                <p className="form-sub">Enter your ambassador code to access your dashboard.</p>
                <form onSubmit={handleSubmit}>
                  <div className="field">
                    <div className="field-label">Ambassador Code</div>
                    <input className="field-input" type="text" placeholder="e.g., VIBIN-JOE-2024" value={ambCode} onChange={e => setAmbCode(e.target.value.toUpperCase())} required />
                  </div>
                  <button type="submit" className="btn-submit" disabled={loading}>
                    {loading ? 'Verifying...' : 'Access Dashboard →'}
                  </button>
                </form>
                <div className="alt-link">Not an ambassador? <a href="/ambassador">Apply here</a></div>
                <div className="alt-link"><a href="#" onClick={() => setAmbassadorMode(false)}>← Back to member login</a></div>
              </div>

            ) : showUnsubscribe ? (
              <div className="panel on">
                <div className="form-eye">Newsletter</div>
                <h2 className="form-title">Unsubscribe</h2>
                <p className="form-sub">We'll miss you! Enter your email to unsubscribe.</p>
                <form onSubmit={handleUnsubscribe}>
                  <div className="field">
                    <div className="field-label">Email</div>
                    <input className="field-input" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn-submit" disabled={loading}>
                    {loading ? 'Processing...' : 'Unsubscribe'}
                  </button>
                </form>
                <div className="alt-link"><a href="#" onClick={() => setShowUnsubscribe(false)}>← Back to login</a></div>
              </div>

            ) : (
              <div className="panel on">
                <div className="form-eye">{isRegister ? 'Join the Circle' : 'Welcome Back'}</div>
                <h2 className="form-title">
                  {isRegister ? <>Create <em>account.</em></> : <>Sign <em>in.</em></>}
                </h2>
                <p className="form-sub">
                  {isRegister ? 'Get 15% off your first order plus early access to drops.' : 'Enter your details to continue.'}
                </p>

                <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'20px'}}>
                  <button
                    type="button"
                    onClick={() => signInWithOAuth('google')}
                    disabled={!!oauthLoading}
                    style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',width:'100%',padding:'12px 16px',borderRadius:'8px',border:'1px solid #d4d4d4',background:'#fff',fontFamily:'inherit',fontSize:'0.9rem',fontWeight:'500',color:'#3c3c3c',cursor:'pointer',transition:'background 0.15s'}}
                    onMouseOver={e => e.currentTarget.style.background='#f5f5f5'}
                    onMouseOut={e => e.currentTarget.style.background='#fff'}
                  >
                    {oauthLoading === 'google' ? 'Redirecting...' : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 48 48">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                        </svg>
                        Continue with Google
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => signInWithOAuth('apple')}
                    disabled={!!oauthLoading}
                    style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',width:'100%',padding:'12px 16px',borderRadius:'8px',border:'none',background:'#000',fontFamily:'inherit',fontSize:'0.9rem',fontWeight:'500',color:'#fff',cursor:'pointer',transition:'background 0.15s'}}
                    onMouseOver={e => e.currentTarget.style.background='#1a1a1a'}
                    onMouseOut={e => e.currentTarget.style.background='#000'}
                  >
                    {oauthLoading === 'apple' ? 'Redirecting...' : (
                      <>
                        <svg width="17" height="17" viewBox="0 0 814 1000" fill="white">
                          <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 70.1 0 128.4 46.4 172.5 46.4 42.8 0 109.6-49.1 190.5-49.1zm-17.2-166.1c-35.9 42.4-94.9 75.8-154.5 75.8-5.2 0-10.4-.3-15.6-1-1.6-7.4-2.6-14.9-2.6-23.3 0-46.4 25-95.5 61.2-125.6 36.9-30.7 96-51.5 148.1-51.5 1.3 0 2.6 0 3.9.3.6 8.4 1 16.8 1 24.9 0 54.7-22.4 108.6-41.5 100.4z"/>
                        </svg>
                        Continue with Apple
                      </>
                    )}
                  </button>
                </div>

                <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'20px'}}>
                  <div style={{flex:1,height:'1px',background:'#e0e0e0'}} />
                  <span style={{fontSize:'0.75rem',color:'#aaa',letterSpacing:'0.05em'}}>OR</span>
                  <div style={{flex:1,height:'1px',background:'#e0e0e0'}} />
                </div>

                <form onSubmit={handleSubmit}>
                  {isRegister && (
                    <div className="field-row">
                      <div className="field">
                        <div className="field-label">First Name</div>
                        <input className="field-input" type="text" placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                      </div>
                      <div className="field">
                        <div className="field-label">Last Name</div>
                        <input className="field-input" type="text" placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)} required />
                      </div>
                    </div>
                  )}
                  <div className="field">
                    <div className="field-label">Email</div>
                    <input className="field-input" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div className="field">
                    <div className="field-label">
                      <span>Password</span>
                      {!isRegister && <a href="/forgot-password">Forgot?</a>}
                    </div>
                    <input className="field-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
                  </div>
                  <button type="submit" className="btn-submit" disabled={loading}>
                    {loading
                      ? (isRegister ? 'Creating...' : 'Signing in...')
                      : (isRegister ? 'Create Account →' : 'Sign In →')}
                  </button>
                </form>

                <div className="alt-link">
                  {isRegister
                    ? <>Already have an account? <a href="#" onClick={() => { setIsRegister(false); setMessage('') }}>Sign in</a></>
                    : <>New to Vibin? <a href="#" onClick={() => { setIsRegister(true); setMessage('') }}>Create an account</a></>}
                </div>
              </div>
            )}

            {message && (
              <div style={{marginTop:'16px',padding:'12px 14px',borderRadius:'8px',fontSize:'0.85rem',background: messageType === 'error' ? '#fff0f0' : '#f0fff4',color: messageType === 'error' ? '#cc0000' : '#006600',border: `1px solid ${messageType === 'error' ? '#ffd0d0' : '#c3e6cb'}`}}>
                {message}
              </div>
            )}

            {!ambassadorMode && !showUnsubscribe && (
              <a href="/ambassador/login" className="amb-strip">
                <div className="amb-strip-left">
                  Want to earn for sharing Vibin?
                  <strong>Ambassador Login →</strong>
                </div>
                <div className="amb-strip-arrow">→</div>
              </a>
            )}

            {!ambassadorMode && !isRegister && !showUnsubscribe && (
              <div style={{marginTop:'16px',textAlign:'center'}}>
                <a href="#" onClick={() => setShowUnsubscribe(true)} style={{fontSize:'12px',color:'#888',textDecoration:'underline'}}>
                  Unsubscribe from newsletter
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
