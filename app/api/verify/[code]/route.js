import { handleScan } from '../../../lib/verify.mjs'
import { serviceClient, json, clientIp, limiter } from '../../../lib/verify-server.mjs'

export const dynamic = 'force-dynamic'

const ipLimit = limiter(30)

// GET /api/verify/VBN-XXXX-XXXX
//   200 { status: 'authentic' | 'claimed', code, product, drop, colorway, size, points_value, claimed_at? }
//   404 { status: 'not_found' }   (an unregistered code is never auto-created)
// Side effect, by design: scan_count + 1 and last_scan_at = now. Checking authenticity needs no account.
export async function GET(request, { params }) {
  if (!ipLimit(clientIp(request))) return json({ error: 'Too many checks. Try again in a few minutes.' }, 429)
  const supabase = serviceClient()
  if (!supabase) return json({ error: 'Verification is temporarily unavailable.' }, 503)
  try {
    const { code } = await params
    const { status, body } = await handleScan(supabase, code)
    return json(body, status)
  } catch (err) {
    console.error('verify scan failed:', err.message)
    return json({ error: 'Something went wrong. Try again.' }, 500)
  }
}
