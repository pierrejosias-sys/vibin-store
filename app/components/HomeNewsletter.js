'use client'

import { useState, useEffect } from 'react'
import { DROP_01 } from '../lib/drop-public.mjs'
import { earlyAccessLabel } from '../lib/drop-copy.mjs'

/**
 * Waitlist / newsletter form on the home page. Same request as before: POST /api/waitlist with
 * { email, source: 'homepage-newsletter' }. A new sign-up gets its private Drop 01 early-access link
 * on screen; an existing email is told the link is in their inbox.
 */
export default function HomeNewsletter() {
  const [status, setStatus] = useState('idle') // idle | sending | done | error
  const [result, setResult] = useState(null) // { created, link }
  const [copied, setCopied] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [inviteState, setInviteState] = useState(null) // { valid: true } | { valid: false } | null
  const [errorMsg, setErrorMsg] = useState(null)

  // Ambassador invite link: ?invite=NOVA pre-fills the code and checks it live.
  useEffect(() => {
    try {
      const fromUrl = new URLSearchParams(window.location.search).get('invite')
      if (!fromUrl) return
      const code = fromUrl.trim().toUpperCase()
      if (!/^[A-Z]{4,24}$/.test(code)) { setInviteState({ valid: false }); return }
      setInviteCode(code)
      fetch('/api/waitlist/validate-invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) })
        .then(r => r.json())
        .then(d => setInviteState(d.valid ? { valid: true } : { valid: false }))
        .catch(() => {})
    } catch {}
  }, [])

  async function onSubmit(e) {
    e.preventDefault()
    const email = new FormData(e.currentTarget).get('email')
    setStatus('sending')
    setErrorMsg(null)
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'homepage-newsletter', ...(inviteCode.trim() ? { inviteCode: inviteCode.trim() } : {}) }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'subscribe failed')
      setResult({ created: !!data.created, link: data.created && data.earlyAccessLink ? data.earlyAccessLink : null })
      setStatus('done')
    } catch (err) {
      setErrorMsg(err.message && err.message !== 'subscribe failed' ? err.message : null)
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
        <input type="text" name="inviteCode" className="nl-input" placeholder="Ambassador invite code (optional)" value={inviteCode} onChange={e => { setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 24)); setInviteState(null) }} aria-label="Ambassador invite code (optional)" />
        <button type="submit" className="nl-btn" disabled={status === 'sending' || status === 'done'}>
          {status === 'sending' ? 'Sending...' : status === 'done' ? '✓ Subscribed' : 'Subscribe'}
        </button>
      </form>

      {inviteState?.valid && (
        <div className="nl-result" role="status">✓ Invite code {inviteCode} accepted.</div>
      )}
      {inviteState && !inviteState.valid && (
        <div className="nl-result" role="status">That invite code isn’t valid — you can still join without one.</div>
      )}

      {status === 'done' && result && (
        <div className="nl-result" role="status">
          {result.link ? (
            <>
              <p>You&apos;re on the list. Your private Drop 01 early-access link:</p>
              <div className="nl-link-row">
                <input readOnly value={result.link} aria-label="Your early-access link" onFocus={e => e.target.select()} />
                <button type="button" onClick={copy}>{copied ? 'Copied ✓' : 'Copy link'}</button>
              </div>
              <p>It works {earlyAccessLabel(DROP_01)} for one checkout. Keep it private.</p>
            </>
          ) : (
            <p>You&apos;re already on the list. Your link is in your email.</p>
          )}
        </div>
      )}

      {status === 'error' && (
        <div className="nl-result nl-result--error" role="alert">
          {errorMsg || 'Something went wrong. Try again or contact us at hello@vibinapparel.com'}
        </div>
      )}
    </>
  )
}
