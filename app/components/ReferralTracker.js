'use client'

import { useEffect } from 'react'

/**
 * Remembers an ambassador referral (?ref=CODE) for the sales attribution that reads
 * localStorage "vibin_referrals". Renders nothing. Same behavior the home page always had.
 */
export default function ReferralTracker() {
  useEffect(() => {
    try {
      const ref = new URLSearchParams(window.location.search).get('ref')
      if (ref) {
        const refs = JSON.parse(localStorage.getItem('vibin_referrals') || '[]')
        refs.push({ code: ref, timestamp: new Date().toISOString() })
        localStorage.setItem('vibin_referrals', JSON.stringify(refs))
      }
    } catch {
      // localStorage may be blocked in some environments
    }
  }, [])
  return null
}
