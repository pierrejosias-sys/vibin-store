'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

const input = { width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #3a3a3a', color: '#f6f1e7', fontSize: '16px', boxSizing: 'border-box', borderRadius: '4px' }
const label = { display: 'block', fontSize: '12px', color: '#888', marginBottom: '8px', letterSpacing: '.1em', textTransform: 'uppercase' }

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY), [])
  const [ready, setReady] = useState(null) // null = checking, false = no session
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN')) setReady(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [supabase])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 8) return setError('Use at least 8 characters.')
    if (password !== confirm) return setError('Passwords do not match.')
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) return setError(err.message)
    setDone(true)
    setTimeout(() => router.push('/profile'), 1500)
  }

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#f6f1e7', fontFamily: 'Manrope, sans-serif' }}>
      <nav className="dark">
        <Link href="/" className="logo">VIBIN</Link>
        <Link href="/login" className="back">← Sign In</Link>
      </nav>
      <div style={{ maxWidth: '400px', margin: '0 auto', padding: '64px 20px' }}>
        <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: '36px', textTransform: 'uppercase', marginBottom: '12px', textAlign: 'center' }}>New Password</h1>
        {ready === null && <p style={{ color: '#888', textAlign: 'center' }}>Checking your reset link…</p>}
        {ready === false && (
          <div style={{ background: '#111', padding: '24px', borderRadius: '8px', textAlign: 'center' }}>
            <p style={{ color: '#ccc', fontSize: '14px', lineHeight: 1.6 }}>This reset link is invalid or has expired.</p>
            <Link href="/forgot-password" style={{ display: 'inline-block', marginTop: '16px', color: '#2f8f8a', textDecoration: 'none', fontSize: '14px' }}>Send a new link →</Link>
          </div>
        )}
        {ready && done && <p style={{ color: '#88cc88', textAlign: 'center' }}>Password updated. Redirecting…</p>}
        {ready && !done && (
          <form onSubmit={handleSubmit} style={{ background: '#111', padding: '24px', borderRadius: '8px' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={label} htmlFor="pw">New password</label>
              <input id="pw" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} style={input} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={label} htmlFor="pw2">Confirm password</label>
              <input id="pw2" type="password" autoComplete="new-password" required minLength={8} value={confirm} onChange={e => setConfirm(e.target.value)} style={input} />
            </div>
            {error && <div role="alert" style={{ padding: '12px', background: '#3a1a1a', border: '1px solid #5a2a2a', color: '#ff8888', fontSize: '13px', marginBottom: '20px', borderRadius: '4px' }}>{error}</div>}
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: loading ? '#3a3a3a' : '#1e3b2f', color: '#f6f1e7', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', textTransform: 'uppercase', letterSpacing: '.1em' }}>
              {loading ? 'Saving…' : 'Save password →'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
