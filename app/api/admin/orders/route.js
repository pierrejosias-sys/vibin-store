import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET all orders
export async function GET() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ orders: data })
}

// PATCH update an order (status, tracking)
export async function PATCH(request) {
  try {
    const { id, status, tracking_number } = await request.json()
    if (!id) return Response.json({ error: 'Missing order id' }, { status: 400 })

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
      .select()
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ order: data })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
