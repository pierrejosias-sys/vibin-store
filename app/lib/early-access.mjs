/**
 * Waitlist early access — pure logic (unit-tested in tests/early-access.test.mjs).
 * Early window: [earlyAccessAt, releaseAt) — only valid waitlist tokens may pre-order.
 * From releaseAt (public open) until close, everyone may.
 */
import { randomBytes, createHash } from 'node:crypto'
import { dropPhase } from './drop-window.mjs'

import { EARLY_ACCESS_COOKIE, isWellFormedToken } from './early-access-cookie.mjs'
export { EARLY_ACCESS_COOKIE, isWellFormedToken }

export function newEarlyAccessToken() {
  return randomBytes(24).toString('base64url') // 32 chars
}

/** 'tba' | 'upcoming' | 'early' | 'open' | 'closed' */
export function accessPhase({ earlyAccessAt, releaseAt, closesAt }, now = Date.now()) {
  const p = dropPhase(releaseAt, closesAt, now)
  if (p === 'upcoming' && earlyAccessAt && now >= new Date(earlyAccessAt).getTime()) return 'early'
  return p
}

/** Can this shopper check out drop items right now? */
export function canPreorder(phase, hasValidToken) {
  if (phase === 'open') return true
  if (phase === 'early') return !!hasValidToken
  return false
}

export function earlyAccessLink(token, base = 'https://vibinapparel.com') {
  return `${base.replace(/\/$/, '')}/drop/01?access=${encodeURIComponent(token)}`
}

/** Path-only private link (/drop/01?access=…). Callers persist the token too. */
export function resolveEarlyAccessLink(_email) {
  const token = newEarlyAccessToken()
  return `/drop/01?access=${encodeURIComponent(token)}`
}

export function tokenFromEarlyAccessLink(link) {
  try {
    return new URL(link, 'https://vibinapparel.com').searchParams.get('access') || null
  } catch {
    return null
  }
}

export function hashEmail(email) {
  return createHash('sha256').update(normalizeEmail(email) || '').digest('hex')
}

export function hashLinkId(link) {
  return createHash('sha256').update(String(link || '')).digest('hex').slice(0, 16)
}

export function normalizeEmail(e) {
  const s = String(e || '').trim().toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 254 ? s : null
}

const csvCell = v => {
  const s = v == null ? '' : String(v)
  return /[",\n\r]/.test(s) || /^[=+\-@]/.test(s) ? `"${s.replace(/^([=+\-@])/, "'$1").replace(/"/g, '""')}"` : s
}

/** CSV for Marketing: email, first_name, sources, styles, consent, early_access_link, created_at, synced_at, ambassador_code */
export function signupsToCsv(rows, base) {
  const head = ['email', 'first_name', 'sources', 'utm_source', 'utm_campaign', 'utm_medium', 'styles', 'consent_email', 'early_access_link', 'created_at', 'synced_at', 'ambassador_code']
  const lines = rows.map(r => [
    r.email, r.first_name, (r.sources || []).join('|'), r.utm_source, r.utm_campaign, r.utm_medium, (r.styles || []).join('|'), r.consent_email,
    earlyAccessLink(r.early_access_token, base), r.created_at, r.synced_at, r.ambassador_code,
  ].map(csvCell).join(','))
  return [head.join(','), ...lines].join('\n') + '\n'
}
