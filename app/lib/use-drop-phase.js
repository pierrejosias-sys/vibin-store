'use client'

import { useEffect, useState } from 'react'
import { dropPhase } from './drop-window.mjs'

/**
 * Current pre-order phase for a drop ('upcoming' | 'open' | 'closed' | 'tba'), read from the visitor's
 * clock after the page has loaded. It is null until then, so the server HTML and the first client
 * render are identical and pages stay cacheable.
 */
export function useDropPhase(drop, everyMs = 30000) {
  const [now, setNow] = useState(null)
  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), everyMs)
    return () => clearInterval(t)
  }, [everyMs])
  return { now, phase: now == null ? null : dropPhase(drop.opensAt, drop.closesAt, now) }
}
