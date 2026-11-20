/**
 * CS-facing order/refund helpers. No Next runtime, no secrets, safe to unit-test.
 * Fields a Customer Service admin may see on /admin/orders.
 * Shipping address is included only because fulfillment needs it; no card data is stored or returned.
 */

export const CS_ORDER_FIELDS = [
  'id',
  'order_number',
  'created_at',
  'customer_email',
  'total',
  'status',
  'tracking_number',
  'items',
  'shipping_address',
  'ambassador_code',
]

export const REFUND_SUPPORT_TICKET = true
export const REFUND_EMAIL_ALERT = false

export function dollarsFromCents(cents) {
  const n = Number(cents)
  if (!Number.isFinite(n)) return 0
  return Math.round(n) / 100
}

export function refundStatusFor(orderTotal, amountRefundedCents) {
  const totalCents = Math.round(Number(orderTotal || 0) * 100)
  const refunded = Math.round(Number(amountRefundedCents || 0))
  if (refunded <= 0) return 'none'
  if (totalCents > 0 && refunded >= totalCents) return 'refunded'
  return 'partial'
}

export function formatEt(isoOrDate) {
  if (!isoOrDate) return '—'
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(d)
}

function pick(obj, keys) {
  const out = {}
  for (const k of keys) out[k] = obj?.[k] ?? null
  return out
}

function presentRefund(row) {
  return {
    amount: dollarsFromCents(row.amount_cents),
    status: row.status,
    stripe_event_at: row.stripe_event_at,
  }
}

/** Project an orders row (plus optional refunds[]) to the CS field list only. */
export function presentOrderForCs(order, refunds = []) {
  if (!order) return null
  const base = pick(order, CS_ORDER_FIELDS)
  const list = (refunds || []).map(presentRefund)
  const amountCents = (refunds || []).reduce((s, r) => s + Math.round(Number(r.amount_cents) || 0), 0)
  const latest = (refunds || []).reduce((a, r) => {
    if (!r?.stripe_event_at) return a
    if (!a || new Date(r.stripe_event_at) > new Date(a)) return r.stripe_event_at
    return a
  }, null)
  const status = refundStatusFor(order.total, amountCents)
  return {
    ...base,
    refunds: list,
    refund_amount: dollarsFromCents(amountCents),
    refund_status: status,
    refund_event_at: latest,
  }
}

/** Keys that must never appear on a CS order payload. */
export const CS_EXCLUDED_FIELDS = [
  'stripe_session_id',
  'stripe_payment_intent_id',
  'notes',
  'user_id',
  'commission_amount',
  'commission_status',
  'payment_intent',
  'card',
  'card_brand',
  'card_last4',
  'source',
  'access_token_hash',
]

export function assertCsPayload(payload) {
  if (!payload || typeof payload !== 'object') return false
  const keys = Object.keys(payload)
  if (keys.some(k => CS_EXCLUDED_FIELDS.includes(k))) return false
  if (payload.refunds && !Array.isArray(payload.refunds)) return false
  if (payload.refunds) {
    for (const r of payload.refunds) {
      const rk = Object.keys(r)
      if (rk.some(k => !['amount', 'status', 'stripe_event_at'].includes(k))) return false
    }
  }
  return true
}

/** Draft-only email. Not sent unless REFUND_EMAIL_ALERT is flipped (needs approval). */
export function draftRefundAlertEmail({ order, refund }) {
  const orderId = order?.id ?? ''
  const email = order?.customer_email ?? ''
  const total = Number(order?.total || 0).toFixed(2)
  const amount = Number(refund?.amount ?? dollarsFromCents(refund?.amount_cents) ?? 0).toFixed(2)
  const when = formatEt(refund?.stripe_event_at)
  return {
    to: 'hello@vibinapparel.com',
    subject: `Refund recorded for order ${orderId}`,
    text:
      `A Stripe charge.refunded event was recorded.\n\n` +
      `Order: ${orderId}\n` +
      `Customer: ${email}\n` +
      `Order total: $${total}\n` +
      `Refund amount: $${amount}\n` +
      `Refund status: ${refund?.status || ''}\n` +
      `Stripe event time: ${when}\n\n` +
      `See /admin/orders and the support queue.\n`,
  }
}

export function refundTicketMessage({ order, refund }) {
  const amount = Number(refund?.amount ?? dollarsFromCents(refund?.amount_cents) ?? 0).toFixed(2)
  const when = formatEt(refund?.stripe_event_at)
  return (
    `Stripe refund recorded for order ${order?.id ?? ''}.\n` +
    `Customer: ${order?.customer_email ?? ''}.\n` +
    `Order total: $${Number(order?.total || 0).toFixed(2)}. ` +
    `Refund amount: $${amount} (${refund?.status || ''}).\n` +
    `Stripe event time: ${when}.`
  )
}
