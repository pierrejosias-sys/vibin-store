import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { isValidOrderId, isValidSessionId, resolveOrderStatus } from '../../lib/order-status.mjs'

export const dynamic = 'force-dynamic'

// GET /api/order-status?order=<id>&session_id=<cs_...>
// Verifies a checkout return server-side. Only returns a status + order id (no PII).
export async function GET(request) {
  const url = new URL(request.url)
  const orderId = url.searchParams.get('order')
  const sessionId = url.searchParams.get('session_id')
  const reply = status => Response.json({ status, order: status === 'unknown' ? null : orderId }, { headers: { 'Cache-Control': 'no-store' } })
  if (!isValidOrderId(orderId) || !isValidSessionId(sessionId)) return reply('unknown')

  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data: order } = await supabase.from('orders').select('id, status, stripe_session_id').eq('id', orderId).maybeSingle()
    if (!order || order.stripe_session_id !== sessionId) return reply('unknown')
    let session = null
    if (order.status !== 'paid') {
      try {
        session = await new Stripe(process.env.STRIPE_SECRET_KEY).checkout.sessions.retrieve(sessionId)
      } catch (err) {
        console.warn('order-status: stripe lookup failed', err.message)
      }
    }
    return reply(resolveOrderStatus(order, sessionId, session))
  } catch (err) {
    console.error('order-status error', err.message)
    return reply('unknown')
  }
}
