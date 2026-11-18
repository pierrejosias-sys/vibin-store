import { createClient } from '@supabase/supabase-js'
import { requireAdmin, forbidden } from '../../../lib/admin-auth'
import { summarizeSignups } from '../../../lib/back-in-stock.mjs'

// Service role bypasses RLS, so the admin check comes first.
function serviceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
}

// GET: back-in-stock sign-ups grouped per product (counts per size/colour + the list).
export async function GET() {
  if (!(await requireAdmin())) return forbidden()
  const supabase = serviceClient()
  const { data: rows, error } = await supabase
    .from('back_in_stock_signups')
    .select('id, email, product_id, size, color, created_at, notified_at')
    .order('created_at', { ascending: false })
    .limit(5000)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  const ids = [...new Set((rows || []).map(r => r.product_id))]
  let products = []
  if (ids.length) {
    const res = await supabase.from('products').select('id, name, slug, in_stock').in('id', ids)
    if (res.error) return Response.json({ error: res.error.message }, { status: 500 })
    products = res.data || []
  }
  return Response.json({ products: summarizeSignups(rows, products), total: (rows || []).length, sending: false })
}
