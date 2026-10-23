/**
 * Drop 01 "is it live?" copy + add-to-bag gating — pure, unit-tested in tests/drop-status.test.mjs.
 * Source of truth is the same as /api/checkout: drops.release_at / closes_at (DB) + DROPS[id].earlyAccessAt,
 * evaluated with serverNow() by the caller.
 */
import { accessPhase, canPreorder } from './early-access.mjs'

/** "Nov 12, 7 PM ET" (minutes shown only when non-zero). */
export function shortOpenLabel(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const day = d.toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric' })
  const time = d.toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' }).replace(':00', '')
  return `${day}, ${time} ET`
}

/**
 * @returns {{ phase, live, canAdd, promo, metaLine, atcLabel }}
 *  live    – public window open (current "now live" copy is truthful)
 *  canAdd  – shopper may add drop items (open, or early hour with a waitlist cookie)
 */
export function dropStatus({ releaseAt, closesAt = null, earlyAccessAt = null }, now, hasEarlyToken = false) {
  const phase = accessPhase({ earlyAccessAt, releaseAt, closesAt }, now)
  const live = phase === 'open'
  const canAdd = canPreorder(phase, hasEarlyToken)
  const when = shortOpenLabel(releaseAt)
  let promo, metaLine, atcLabel
  if (live) {
    promo = 'Drop 01 is live'
    metaLine = 'SS26 Drop 01: The Foundation — now live.'
    atcLabel = null // current behavior
  } else if (phase === 'early') {
    promo = canAdd ? 'Early access is open for you' : `Drops ${when}`
    metaLine = `SS26 Drop 01: The Foundation — drops ${when}.`
    atcLabel = canAdd ? null : `Drops ${when} · Waitlist early access only`
  } else if (phase === 'upcoming') {
    promo = `Drops ${when}`
    metaLine = `SS26 Drop 01: The Foundation — drops ${when}.`
    atcLabel = `Drops ${when}`
  } else if (phase === 'closed') {
    promo = 'Drop 01 pre-order has closed'
    metaLine = 'SS26 Drop 01: The Foundation.'
    atcLabel = 'Pre-order closed'
  } else {
    promo = 'Drop 01 — date coming soon'
    metaLine = 'SS26 Drop 01: The Foundation — coming soon.'
    atcLabel = 'Coming soon'
  }
  return { phase, live, canAdd, promo, metaLine, atcLabel, opensAt: releaseAt || null }
}

/** Safe default while the status loads on the client: never claim live, never allow add. */
export const LOADING_STATUS = { phase: 'loading', live: false, canAdd: false, promo: 'Drop 01', metaLine: '', atcLabel: 'Checking availability…', opensAt: null }
