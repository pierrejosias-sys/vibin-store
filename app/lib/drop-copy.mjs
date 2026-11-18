/**
 * Wording for the Drop 01 pre-order window, shared by the promo bar and the home page.
 * Pure (no DB/env), unit-tested in tests/home-helpers.test.mjs.
 * phase: 'upcoming' | 'open' | 'closed' | 'tba', or null when the clock is not known yet (server render).
 * The null line is true in every phase, so the first paint never claims something that is not so.
 */
import { formatET } from './drop-window.mjs'

/** One line for the promo bar. */
export function dropPromoLine(drop, phase) {
  if (phase === 'open') return `${drop.shortName} pre-order is open${drop.closesAt ? ` · closes ${formatET(drop.closesAt)}` : ''}`
  if (phase === 'closed') return `${drop.shortName} pre-order is closed`
  if (phase === 'upcoming') return `${drop.shortName} pre-order opens ${formatET(drop.opensAt)}`
  return `${drop.shortName} · The Foundation`
}

/** Copy for the home page countdown block. */
export function dropBlockCopy(drop, phase) {
  if (phase === 'open') {
    return {
      eyebrow: `Pre-order is open · closes ${formatET(drop.closesAt)}`,
      body: `The Foundation is open for pre-order. Pieces ship by ${drop.shipsBy}.`,
      cta: { label: 'Shop Drop 01 →', href: '/drop/01' },
      counting: 'Closes in',
    }
  }
  if (phase === 'closed') {
    return {
      eyebrow: 'Pre-order closed',
      body: `Drop 01 pre-orders are closed and pieces ship by ${drop.shipsBy}. Join the list to hear about the next drop first.`,
      cta: { label: 'Join the list →', href: '#email-signup' },
      counting: null,
    }
  }
  return {
    eyebrow: phase === 'upcoming' ? `Pre-order opens · ${formatET(drop.opensAt)}` : 'Drop 01 · The Foundation',
    body: 'Drop 01: The Foundation. Join the list for early access: members get a private link one hour before everyone else.',
    cta: { label: 'Get Early Access →', href: '#email-signup' },
    counting: phase === 'upcoming' ? 'Opens in' : null,
  }
}

/** Splits a millisecond gap into countdown parts (never negative). */
export function countdownParts(ms) {
  const s = Math.max(0, Math.floor(ms / 1000))
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 }
}
