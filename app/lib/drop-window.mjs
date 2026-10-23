/**
 * Pure pre-order window logic (no DB/env imports) — unit-tested in tests/drop-window.test.mjs.
 * Phases: 'tba' (no open time), 'upcoming' (before open), 'open', 'closed' (at/after close).
 */
export function dropPhase(opensAt, closesAt, now = Date.now()) {
  if (!opensAt) return 'tba'
  const t = typeof now === 'number' ? now : new Date(now).getTime()
  if (t < new Date(opensAt).getTime()) return 'upcoming'
  if (closesAt && t > new Date(closesAt).getTime()) return 'closed'
  return 'open'
}

/** Countdown target for a phase: open time before open, close time while open. */
export function countdownTarget(phase, opensAt, closesAt) {
  if (phase === 'upcoming') return opensAt
  if (phase === 'open') return closesAt || null
  return null
}

/** Formats an instant in US Eastern time, e.g. "Thu, Nov 12, 7:00 PM ET". */
export function formatET(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('en-US', {
    timeZone: 'America/New_York', weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  }) + ' ET'
}

/**
 * Server clock, with an optional override for previews/tests only.
 * DROP_NOW_OVERRIDE (ISO time) is ignored in production deployments.
 */
export function serverNow(env = process.env) {
  const o = env.DROP_NOW_OVERRIDE
  if (o && env.VERCEL_ENV !== 'production' && !Number.isNaN(Date.parse(o))) return Date.parse(o)
  return Date.now()
}
