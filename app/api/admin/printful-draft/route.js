import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin, forbidden, ADMIN_RESPONSE_HEADERS } from '../../../lib/admin-auth'
import { createPodDraftForOrder, printfulKeyConfigured } from '../../../lib/printful-pod-draft.mjs'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Manual only: an admin presses "Create Printful draft" on /admin/orders. Creates a Printful DRAFT order
// (never confirmed here; Printful charges on confirm). No webhook or cron calls this.
function json(body, status = 200) {
  return Response.json(body, { status, headers: ADMIN_RESPONSE_HEADERS })
}

export async function GET() {
  if (!(await requireAdmin())) return forbidden()
  return json({ configured: printfulKeyConfigured() })
}

export async function POST(request) {
  if (!(await requireAdmin())) return forbidden()
  let orderId
  try { ({ orderId } = await request.json()) } catch { return json({ error: 'Invalid JSON' }, 400) }
  if (!printfulKeyConfigured()) {
    return json({ error: 'not_configured', message: "Printful isn't connected yet (PRINTFUL_API_KEY is not set). Nothing was sent." }, 503)
  }
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const result = await createPodDraftForOrder(orderId, { supabase, stripe })
  return json(result, result.status || (result.ok ? 200 : 500))
}
