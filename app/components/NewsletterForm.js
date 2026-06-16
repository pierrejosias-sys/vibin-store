'use client'

import { useState } from 'react'
import { supabase } from '@/app/lib/supabase'

// PASTE YOUR MAILCHIMP FORM ACTION URL BELOW
// Get it from: Mailchimp → Audience → Signup Forms → Embedded Forms → copy the form action URL
const MAILCHIMP_URL = process.env.NEXT_PUBLIC_MAILCHIMP_URL || ''

export default function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email) return

    if (!MAILCHIMP_URL) {
      // Dev fallback: save to Supabase signups table if Mailchimp not configured
      setStatus('loading')
      try {
        const { error } = await supabase.from('signups').insert([{ email, source: 'homepage-newsletter' }])
        if (error) throw error
        setStatus('success')
        setEmail('')
      } catch (err) {
        setStatus('error')
        setErrorMsg('Something went wrong. Try again or email us at hello@vibinapparel.com')
      }
      return
    }

    setStatus('loading')
    try {
      const formData = new FormData()
      formData.append('EMAIL', email)
      formData.append('tags', '15off') // Mailchimp tag for the 15% off automation

      await fetch(MAILCHIMP_URL, {
        method: 'POST',
        body: formData,
        mode: 'no-cors',
      })
      // no-cors means we can't read the response — assume success if no exception thrown
      setStatus('success')
      setEmail('')
    } catch (err) {
      setStatus('error')
      setErrorMsg('Something went wrong. Try again or email us at hello@vibinapparel.com')
    }
  }

  if (status === 'success') {
    return (
      <div
        style={{
          background: '#0a0a0a',
          color: '#f6f1e7',
          padding: '16px 24px',
          fontFamily: 'Manrope, sans-serif',
          fontSize: '15px',
          letterSpacing: '.02em',
          borderRadius: '4px',
          border: '1px solid #2a2a2a',
        }}
      >
        You’re on the list. Check your email for your 15% off code. ✦
      </div>
    )
  }

  return (
    <form className="nl-form" onSubmit={handleSubmit}>
      <input
        type="email"
        className="nl-input"
        placeholder="your@email.com"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={status === 'loading'}
      />
      <button type="submit" className="nl-btn" disabled={status === 'loading'}>
        {status === 'loading' ? 'Sending...' : 'Subscribe'}
      </button>
      {status === 'error' && (
        <div
          style={{
            background: '#ff4a3d',
            color: '#fff',
            padding: '12px 16px',
            marginTop: '12px',
            fontFamily: 'Manrope, sans-serif',
            fontSize: '14px',
            borderRadius: '4px',
          }}
        >
          {errorMsg}
        </div>
      )}
    </form>
  )
}
