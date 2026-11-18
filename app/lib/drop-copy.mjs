/**
 * Wording for the Drop 01 pre-order window, shared by the promo bar and the home page.
 * Pure (no DB/env), unit-tested in tests/home-helpers.test.mjs.
 * phase: 'upcoming' | 'open' | 'closed' | 'tba', or null when the clock is not known yet (server render).
 * The null line is true in every phase, so the first paint never claims something that is not so.
 */
import { formatET } from './drop-window.mjs'

const ET = 'America/New_York'
// Intl can put a narrow no-break space before AM/PM; normalise it so the text is plain ASCII spacing.
const etPart = (iso, opts) => new Date(iso).toLocaleString('en-US', { timeZone: ET, ...opts }).replace(/\u202f/g, ' ')

/** "Jan 14": the opening day in Eastern time. */
export function openDateShort(drop) {
  return drop?.opensAt ? etPart(drop.opensAt, { month: 'short', day: 'numeric' }) : ''
}

/** "Jan 14 to 17" (or "Jan 30 to Feb 2"): the pre-order dates, for page descriptions. */
export function windowLabelShort(drop) {
  if (!drop?.opensAt) return ''
  const start = etPart(drop.opensAt, { month: 'short', day: 'numeric' })
  if (!drop.closesAt) return start
  const sameMonth = etPart(drop.opensAt, { month: 'short' }) === etPart(drop.closesAt, { month: 'short' })
  return `${start} to ${etPart(drop.closesAt, sameMonth ? { day: 'numeric' } : { month: 'short', day: 'numeric' })}`
}

/** "Thu Jan 14, 6:00–7:00 PM ET": the waitlist hour, from the early-access and public-open times. */
export function earlyAccessLabel(drop) {
  if (!drop?.earlyAccessAt || !drop?.opensAt) return ''
  const day = etPart(drop.earlyAccessAt, { weekday: 'short', month: 'short', day: 'numeric' }).replace(',', '')
  const [from, fromHalf] = etPart(drop.earlyAccessAt, { hour: 'numeric', minute: '2-digit' }).split(' ')
  const [to, toHalf] = etPart(drop.opensAt, { hour: 'numeric', minute: '2-digit' }).split(' ')
  return `${day}, ${fromHalf === toHalf ? from : `${from} ${fromHalf}`}–${to} ${toHalf} ET`
}

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
      body: `The Foundation is open for pre-order.${drop.shipsBy ? ` Pieces ship by ${drop.shipsBy}.` : ''}`,
      cta: { label: 'Shop Drop 01 →', href: '/drop/01' },
      counting: 'Closes in',
    }
  }
  if (phase === 'closed') {
    return {
      eyebrow: 'Pre-order closed',
      body: `Drop 01 pre-orders are closed${drop.shipsBy ? ` and pieces ship by ${drop.shipsBy}` : ''}. Join the list to hear about the next drop first.`,
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
