/**
 * Pure checkout-return verification (unit-tested in tests/order-status.test.mjs).
 * The success page must never trust ?success=true; it shows what the server can confirm.
 * Returns one of: 'paid' | 'pending' | 'failed' | 'unknown'.
 */
export const SESSION_ID_RE = /^cs_(test|live)_[A-Za-z0-9]{10,200}$/

export function isValidOrderId(id) {
  return typeof id === 'string' && /^\d{1,12}$/.test(id)
}

export function isValidSessionId(id) {
  return typeof id === 'string' && SESSION_ID_RE.test(id)
}

/**
 * @param order   orders row ({ id, status, stripe_session_id }) or null
 * @param sessionId  session_id from the return URL
 * @param session    Stripe Checkout Session ({ id, status, payment_status, metadata }) or null
 */
export function resolveOrderStatus(order, sessionId, session) {
  if (!order || !isValidSessionId(sessionId)) return 'unknown'
  // The URL must belong to this order: session id must match the one we stored.
  if (!order.stripe_session_id || order.stripe_session_id !== sessionId) return 'unknown'
  if (order.status === 'paid') return 'paid'
  if (order.status === 'cancelled' || order.status === 'refunded') return 'failed'
  if (session && session.id === sessionId) {
    if (session.metadata?.orderId && String(session.metadata.orderId) !== String(order.id)) return 'unknown'
    // Stripe says paid but the webhook hasn't landed yet: paid (webhook will catch up).
    if (session.payment_status === 'paid' || session.payment_status === 'no_payment_required') return 'paid'
    if (session.status === 'expired') return 'failed'
    return 'pending' // e.g. async payment still processing
  }
  return 'pending'
}

export const STATUS_COPY = {
  checking: { title: 'Checking your payment…', body: 'One moment while we confirm your order with Stripe.' },
  paid: { title: 'Order Confirmed!', body: 'Thank you for your order! Your payment was successful.' },
  pending: { title: 'Payment processing', body: 'We have your order but your payment is not confirmed yet. This page will update; you will not be charged twice.' },
  failed: { title: 'Payment not completed', body: 'This checkout expired or was cancelled, so you were not charged. Your bag is still saved.' },
  unknown: { title: "We couldn't confirm this order", body: 'If you completed payment, check your email for a Stripe receipt or contact hello@vibinapparel.com with your order number.' },
}
