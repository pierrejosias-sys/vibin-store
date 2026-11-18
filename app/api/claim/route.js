import { handleClaim } from '../../lib/verify.mjs'
import { normalizeEmail } from '../../lib/early-access.mjs'
import { serviceClient, json, clientIp, limiter, readJson } from '../../lib/verify-server.mjs'

export const dynamic = 'force-dynamic'

const ipLimit = limiter(10)
const emailLimit = limiter(10)

// POST /api/claim { code, account_or_email }
//   200 { status: 'claimed', points_awarded, bonus_awarded, new_balance, claimed_at }
//   409 { status: 'already_claimed', claimed_at }   (no points are paid twice)
//   404 { status: 'not_found' }   400 { error }
// Atomic in Postgres (verify_claim): two simultaneous claims on one code, exactly one wins.
export async function POST(request) {
  if (!ipLimit(clientIp(request))) return json({ error: 'Too many attempts. Try again in a few minutes.' }, 429)
  const body = await readJson(request)
  if (!body || typeof body !== 'object') return json({ error: 'Invalid request.' }, 400)
  const email = normalizeEmail(body.account_or_email ?? body.account ?? body.email)
  if (email && !emailLimit(email)) return json({ error: 'Too many attempts. Try again in a few minutes.' }, 429)
  const supabase = serviceClient()
  if (!supabase) return json({ error: 'Points are temporarily unavailable.' }, 503)
  try {
    const { status, body: out } = await handleClaim(supabase, body)
    return json(out, status)
  } catch (err) {
    console.error('verify claim failed:', err.message)
    return json({ error: 'Something went wrong. Try again.' }, 500)
  }
}
