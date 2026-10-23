'use client'
import { useEffect, useState } from 'react'
import { LOADING_STATUS } from './drop-status.mjs'

/** Client hook for Drop 01 live/upcoming state (from /api/drop-status). */
export function useDropStatus() {
  const [status, setStatus] = useState(LOADING_STATUS)
  useEffect(() => {
    let alive = true
    fetch('/api/drop-status', { cache: 'no-store' })
      .then(r => r.json())
      .then(s => { if (alive && s?.phase) setStatus(s) })
      .catch(() => { if (alive) setStatus({ ...LOADING_STATUS, phase: 'error', atcLabel: 'Unavailable right now' }) })
    return () => { alive = false }
  }, [])
  return status
}
