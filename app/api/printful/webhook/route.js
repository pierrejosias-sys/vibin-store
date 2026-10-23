import { createClient } from '@supabase/supabase-js'
import { safeEqual } from '../../../lib/printful-core.mjs'

export const runtime = 'nodejs'

/**
 * Printful (API v1) webhook: package_shipped / order_failed / order_canceled.
 * Printful v1 webhooks are not signed, so the URL registered with Printful
 * carries a shared secret: /api/printful/webhook?secret=<PRINTFUL_WEBHOOK_SECRET>
 */
export async function POST(request) {
  const expected = process.env.PRINTFUL_WEBHOOK_SECRET
  const given = new URL(request.url).searchParams.get('secret') || request.headers.get('x-printful-secret')
  if (!expected || !safeEqual(given, expected)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let event
  try { event = await request.json() } catch { return Response.json({ error: 'Bad JSON' }, { status: 400 }) }

  const order = event?.data?.order
  const pfId = order?.id
  if (!pfId) return Response.json({ received: true })
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  let updates = null
  if (event.type === 'package_shipped') {
    const s = event.data.shipment || {}
    updates = {
      fulfillment_status: 'shipped',
      status: 'shipped',
      printful_status: order.status || 'fulfilled',
      tracking_number: s.tracking_number != null ? String(s.tracking_number) : null,
      tracking_url: s.tracking_url || null,
      carrier: s.carrier || null,
      shipped_at: s.ship_date ? new Date(s.ship_date).toISOString() : new Date().toISOString(),
    }
  } else if (event.type === 'order_failed') {
    updates = { fulfillment_status: 'printful_failed', printful_status: 'failed', printful_error: String(event.data.reason || 'order_failed').slice(0, 500) }
  } else if (event.type === 'order_canceled') {
    updates = { fulfillment_status: 'printful_canceled', printful_status: 'canceled' }
  }
  if (!updates) return Response.json({ received: true })

  const { error } = await supabase.from('orders').update(updates).eq('printful_order_id', pfId)
  if (error) {
    console.error(`[printful webhook] ${event.type} for Printful order ${pfId}:`, error.message)
    return Response.json({ error: 'update failed' }, { status: 500 })
  }
  return Response.json({ received: true })
}
