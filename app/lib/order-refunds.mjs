import { newTicketCode, hashToken, newAccessToken } from './support.mjs'
import {
  dollarsFromCents,
  refundStatusFor,
  draftRefundAlertEmail,
  refundTicketMessage,
  REFUND_SUPPORT_TICKET,
  REFUND_EMAIL_ALERT,
} from './order-cs.mjs'

const ORDER_LOOKUP = 'id, order_number, created_at, customer_email, total, status, stripe_session_id, stripe_payment_intent_id'

function paymentIntentId(charge) {
  const pi = charge?.payment_intent
  if (!pi) return null
  return typeof pi === 'string' ? pi : pi.id || null
}

function eventAt(event) {
  const unix = event?.created
  if (unix) return new Date(Number(unix) * 1000).toISOString()
  return new Date().toISOString()
}

export async function findOrderForCharge(supabase, charge) {
  const orderId = charge?.metadata?.orderId
  if (orderId) {
    const { data } = await supabase.from('orders').select(ORDER_LOOKUP).eq('id', orderId).maybeSingle()
    if (data) return data
  }
  const pi = paymentIntentId(charge)
  if (pi) {
    const { data } = await supabase.from('orders').select(ORDER_LOOKUP).eq('stripe_payment_intent_id', pi).maybeSingle()
    if (data) return data
  }
  const sessionId = charge?.metadata?.checkout_session_id || charge?.metadata?.session_id
  if (sessionId) {
    const { data } = await supabase.from('orders').select(ORDER_LOOKUP).eq('stripe_session_id', sessionId).maybeSingle()
    if (data) return data
  }
  return null
}

/**
 * Persist a charge.refunded event, optionally open a support-queue ticket.
 * Idempotent on Stripe event id. Does not send email unless REFUND_EMAIL_ALERT is true.
 */
export async function handleChargeRefunded(supabase, event, { ticket = REFUND_SUPPORT_TICKET, emailAlert = REFUND_EMAIL_ALERT } = {}) {
  const charge = event?.data?.object
  if (!charge) return { ok: false, reason: 'no-charge' }
  if (!charge.refunded && !(Number(charge.amount_refunded) > 0)) {
    return { ok: true, skipped: 'not-refunded' }
  }

  const order = await findOrderForCharge(supabase, charge)
  if (!order) {
    console.error(`charge.refunded: no matching order (event ${event.id})`)
    return { ok: true, skipped: 'no-order' }
  }

  const amountCents = Math.round(Number(charge.amount_refunded) || 0)
  const status = refundStatusFor(order.total, amountCents)
  const stripeEventAt = eventAt(event)
  const row = {
    order_id: order.id,
    stripe_event_id: event.id,
    stripe_charge_id: charge.id || null,
    amount_cents: amountCents,
    currency: (charge.currency || 'usd').toLowerCase(),
    status,
    stripe_event_at: stripeEventAt,
  }

  const { data: inserted, error } = await supabase
    .from('order_refunds')
    .upsert(row, { onConflict: 'stripe_event_id', ignoreDuplicates: true })
    .select('id, order_id, amount_cents, status, stripe_event_at')
    .maybeSingle()

  if (error) throw new Error(`order_refunds: ${error.message}`)

  // already recorded
  if (!inserted) return { ok: true, skipped: 'duplicate', orderId: order.id }

  const refundView = { amount: dollarsFromCents(amountCents), status, stripe_event_at: stripeEventAt, amount_cents: amountCents }

  let ticketCode = null
  if (ticket) {
    ticketCode = await openRefundSupportTicket(supabase, { order, refund: refundView })
  }

  const draft = draftRefundAlertEmail({ order, refund: refundView })
  if (emailAlert) {
    console.error('REFUND_EMAIL_ALERT is on but no mailer is wired; draft was not sent')
  }

  return { ok: true, orderId: order.id, refund: refundView, ticket: ticketCode, emailDraft: draft, emailSent: false }
}

export async function openRefundSupportTicket(supabase, { order, refund }) {
  const now = new Date().toISOString()
  const accessToken = newAccessToken()
  const tokenHash = hashToken(accessToken)
  const orderNumber = String(order.order_number || order.id)
  let chat = null
  for (let i = 0; i < 3 && !chat; i++) {
    const { data, error } = await supabase.from('support_chats').insert({
      chat_id: newTicketCode(),
      email: order.customer_email,
      name: null,
      topic: 'returns',
      order_number: orderNumber,
      subject: `Refund · #${orderNumber}`,
      status: 'open',
      source: 'refund-webhook',
      access_token_hash: tokenHash,
      updated_at: now,
      last_message_at: now,
    }).select('id, chat_id').single()
    if (data) chat = data
    else if (error?.code !== '23505') throw new Error(`support_chats: ${error.message}`)
  }
  if (!chat) throw new Error('could not allocate refund ticket code')
  const message = refundTicketMessage({ order, refund })
  const { error: mErr } = await supabase.from('support_messages').insert({
    chat_id: chat.id,
    sender: 'system',
    sender_email: null,
    message,
  })
  if (mErr) {
    await supabase.from('support_chats').delete().eq('id', chat.id)
    throw new Error(`support_messages: ${mErr.message}`)
  }
  return chat.chat_id
}
