'use client'

import { useState } from 'react'

/**
 * Waitlist / newsletter form on the home page. Same request as before: POST /api/waitlist with
 * { email, source: 'homepage-newsletter' }. A new sign-up gets its private Drop 01 early-access link
 * on screen; an existing email is told the link is in their inbox.
 */
export default function HomeNewsletter() {
  const [status, setStatus] = useState('idle') // idle | sending | done | error
  const [result, setResult] = useState(null) // { created, link }
  const [copied, setCopied] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    const email = new FormData(e.currentTarget).get('email')
    setStatus('sending')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'homepage-newsletter' }),
      })
      if (!res.ok) throw new Error('subscribe failed')
      const data = await res.json()
      setResult({ created: !!data.created, link: data.created && data.earlyAccessLink ? data.earlyAccessLink : null })
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(result.link)
      setCopied(true)
    } catch {}
  }

  return (
    <>
      <form className="nl-form" onSubmit={onSubmit}>
        <input type="email" name="email" className="nl-input" placeholder="your@email.com" aria-label="Email address" required />
        <button type="submit" className="nl-btn" disabled={status === 'sending' || status === 'done'}>
          {status === 'sending' ? 'Sending...' : status === 'done' ? '✓ Subscribed' : 'Subscribe'}
        </button>
      </form>

      {status === 'done' && result && (
        <div className="nl-result" role="status">
          {result.link ? (
            <>
              <p>You&apos;re on the list. Your private Drop 01 early-access link:</p>
              <div className="nl-link-row">
                <input readOnly value={result.link} aria-label="Your early-access link" onFocus={e => e.target.select()} />
                <button type="button" onClick={copy}>{copied ? 'Copied ✓' : 'Copy link'}</button>
              </div>
              <p>It works Thu Nov 19, 6:00–7:00 PM ET for one checkout. Keep it private.</p>
            </>
          ) : (
            <p>You&apos;re already on the list. Your link is in your email.</p>
          )}
        </div>
      )}

      {status === 'error' && (
        <div className="nl-result nl-result--error" role="alert">
          Something went wrong. Try again or contact us at hello@vibinapparel.com
        </div>
      )}
    </>
  )
}
