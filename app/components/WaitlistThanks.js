'use client'

import { useState } from 'react'

/**
 * Thank-you state after a waitlist sign-up. The private link is only present for NEW sign-ups
 * (the API never returns it for an email already on the list).
 */
export default function WaitlistThanks({ result, dark = true }) {
  const [copied, setCopied] = useState(false)
  const fg = dark ? '#f6f1e7' : '#0a0a0a'
  if (!result?.created || !result.earlyAccessLink) {
    return <p style={{ fontSize: 14, color: fg }}>You&apos;re already on the list. Your link is in your email.</p>
  }
  async function copy() {
    try { await navigator.clipboard.writeText(result.earlyAccessLink); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch {}
  }
  return (
    <div style={{ fontSize: 14, color: fg }}>
      <p style={{ margin: '0 0 8px' }}>✓ You&apos;re on the list. Here&apos;s your private early-access link:</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input readOnly value={result.earlyAccessLink} onFocus={e => e.target.select()} aria-label="Your private early-access link"
          style={{ flex: '1 1 260px', padding: '10px 12px', background: 'transparent', border: `1px solid ${fg}`, color: fg, fontSize: 13 }} />
        <button type="button" onClick={copy} style={{ padding: '10px 14px', background: fg, color: dark ? '#0a0a0a' : '#f6f1e7', border: 0, fontWeight: 700, cursor: 'pointer' }}>
          {copied ? 'Copied ✓' : 'Copy link'}
        </button>
      </div>
      <p style={{ margin: '8px 0 0', opacity: 0.8 }}>It works Thu Nov 12, 6:00–7:00 PM ET for one checkout. Keep it private. From 7:00 PM ET everyone can pre-order.</p>
    </div>
  )
}
