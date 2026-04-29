'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from '../styles.css'

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const savedUser = localStorage.getItem('vibin_user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
      router.push('/profile')
    }
  }, [router])

  function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    setTimeout(() => {
      if (isRegister) {
        const newUser = {
          id: 'user_' + Date.now(),
          email,
          firstName,
          lastName,
          createdAt: new Date().toISOString()
        }
        localStorage.setItem('vibin_user', JSON.stringify(newUser))
        setUser(newUser)
        setMessage('Account created!')
        setTimeout(() => router.push('/profile'), 1000)
      } else {
        if (email && password.length >= 6) {
          const loggedInUser = {
            id: 'user_' + Date.now(),
            email,
            firstName: 'Demo',
            lastName: 'User'
          }
          localStorage.setItem('vibin_user', JSON.stringify(loggedInUser))
          setUser(loggedInUser)
          setMessage('Welcome back!')
          setTimeout(() => router.push('/profile'), 1000)
        } else {
          setMessage('Invalid email or password (min 6 chars)')
        }
      }
      setLoading(false)
    }, 1000)
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      
      <nav className="dark">
        <Link href="/" className="logo">VIBIN</Link>
        <Link href="/" className="back">← Back to Shop</Link>
      </nav>

      <div className="split">
        <div className="split-left">
          <div></div>
          <div className="split-left-content">
            <div className="sl-eye">Member Access</div>
            <h1 className="sl-title">Move<br/><em>different.</em></h1>
            <p className="sl-body">Join the inside circle. Early access to drops, member-only pieces, and the people who actually move the brand forward.</p>
            <div className="sl-perks">
              <div className="sl-perk">
                <div className="sl-perk-icon">✦</div>
                <div><strong>Early access</strong>Drops 24 hours before the public</div>
              </div>
              <div className="sl-perk">
                <div className="sl-perk-icon">→</div>
                <div><strong>Member pricing</strong>15% off your first order</div>
              </div>
              <div className="sl-perk">
                <div className="sl-perk-icon">▸</div>
                <div><strong>Free shipping</strong>On all orders over $75</div>
              </div>
              <div className="sl-perk">
                <div className="sl-perk-icon">★</div>
                <div><strong>Ambassador track</strong>Earn commission for sharing</div>
              </div>
            </div>
          </div>
          <div className="sl-foot">VIBIN · A subsidiary of HVD Holdings, LLC</div>
        </div>

        <div className="split-right">
          <div className="form-wrap">
            <div className="form-tabs">
              <button className={`form-tab ${!isRegister ? 'on' : ''}`} onClick={() => setIsRegister(false)}>Sign In</button>
              <button className={`form-tab ${isRegister ? 'on' : ''}`} onClick={() => setIsRegister(true)}>Create Account</button>
            </div>

            {isRegister ? (
              <div className="panel on">
                <div className="form-eye">Join the Circle</div>
                <h2 className="form-title">Create <em>account.</em></h2>
                <p className="form-sub">Get 15% off your first order plus early access to drops.</p>

                <form onSubmit={handleSubmit}>
                  <div className="field-row">
                    <div className="field">
                      <div className="field-label">First Name</div>
                      <input className="field-input" type="text" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                    </div>
                    <div className="field">
                      <div className="field-label">Last Name</div>
                      <input className="field-input" type="text" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                    </div>
                  </div>
                  <div className="field">
                    <div className="field-label">Email</div>
                    <input className="field-input" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="field">
                    <div className="field-label">Password</div>
                    <input className="field-input" type="password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                  </div>
                  <button type="submit" className="btn-submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Account →'}
                  </button>
                </form>

                <div className="alt-link">
                  Already have an account? <a href="#" onClick={() => setIsRegister(false)}>Sign in</a>
                </div>
              </div>
            ) : (
              <div className="panel on">
                <div className="form-eye">Welcome Back</div>
                <h2 className="form-title">Sign <em>in.</em></h2>
                <p className="form-sub">Enter your details to continue.</p>

                <form onSubmit={handleSubmit}>
                  <div className="field">
                    <div className="field-label">Email</div>
                    <input className="field-input" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="field">
                    <div className="field-label">
                      <span>Password</span>
                      <a href="#">Forgot?</a>
                    </div>
                    <input className="field-input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn-submit" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In →'}
                  </button>
                </form>

                <div className="alt-link">
                  New to Vibin? <a href="#" onClick={() => setIsRegister(true)}>Create an account</a>
                </div>
              </div>
            )}

            {message && (
              <div style={{ marginTop: '16px', padding: '12px', background: message.includes('error') || message.includes('Invalid') || message.includes('Invalid') ? '#ffcccc' : '#ccffcc', color: message.includes('error') || message.includes('Invalid') ? '#cc0000' : '#006600' }}>
                {message}
              </div>
            )}

            <a href="/ambassador" className="amb-strip">
              <div className="amb-strip-left">
                Want to earn for sharing Vibin?
                <strong>Become an Ambassador →</strong>
              </div>
              <div className="amb-strip-arrow">→</div>
            </a>
          </div>
        </div>
      </div>
    </>
  )
}