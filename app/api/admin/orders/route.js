import { createClient } from '@supabase/supabase-js'
import { requireAdmin, forbidden, ADMIN_RESPONSE_HEADERS } from '../../../lib/admin-auth'
import { CS_ORDER_FIELDS, presentOrderForCs } from '../../../lib/order-cs.mjs'

export const dynamic = 'force-dynamic'

// Service role bypasses RLS — every handler must check requireAdmin() first.
function serviceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

function json(body, status = 200) {
  return Response.json(body, { status, headers: ADMIN_RESPONSE_HEADERS })
}

const ORDER_SELECT = CS_ORDER_FIELDS.join(', ')

async function refundsByOrderId(supabase, orderIds) {
  const map = new Map()
  if (!orderIds.length) return map
  const { data, error } = await supabase
    .from('order_refunds')
    .select('order_id, amount_cents, status, stripe_event_at')
    .in('order_id', orderIds)
    .order('stripe_event_at', { ascending: true })
  if (error) {
    // Table may not exist until the held migration is applied.
    if (/order_refunds|does not exist|schema cache/i.test(error.message || '')) return map
    throw error
  }
  for (const row of data || []) {
    const list = map.get(row.order_id) || []
    list.push(row)
    map.set(row.order_id, list)
  }
  return map
}

// GET orders for CS (field-limited)
export async function GET() {
  if (!(await requireAdmin())) return forbidden()
  const supabase = serviceClient()
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .order('created_at', { ascending: false })

  if (error) return json({ error: error.message }, 500)
  let refundMap
  try {
    refundMap = await refundsByOrderId(supabase, (data || []).map(o => o.id))
  } catch (e) {
    return json({ error: e.message }, 500)
  }
  const orders = (data || []).map(o => presentOrderForCs(o, refundMap.get(o.id) || []))
  return json({ orders })
}

// PATCH update an order (status, tracking) — fulfillment only
export async function PATCH(request) {
  if (!(await requireAdmin())) return forbidden()
  const supabase = serviceClient()
  try {
    const { id, status, tracking_number } = await request.json()
    if (!id) return json({ error: 'Missing order id' }, 400)

    const updates = {}
    if (status) updates.status = status
    if (tracking_number !== undefined) {
      updates.tracking_number = tracking_number
      if (!status) updates.status = 'shipped'
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select(ORDER_SELECT)
      .single()

    if (error) return json({ error: error.message }, 500)
    let refunds = []
    try {
      const map = await refundsByOrderId(supabase, [data.id])
      refunds = map.get(data.id) || []
    } catch (e) {
      return json({ error: e.message }, 500)
    }
    return json({ order: presentOrderForCs(data, refunds) })
  } catch (e) {
    return json({ error: e.message }, 500)
  }
}
