import { handleRedeem } from '../../lib/verify.mjs'
import { normalizeEmail } from '../../lib/early-access.mjs'
import { serviceClient, json, clientIp, limiter, readJson } from '../../lib/verify-server.mjs'

export const dynamic = 'force-dynamic'

const ipLimit = limiter(10)
const emailLimit = limiter(10)

// POST /api/redeem { account, tier_id }
//   200 { status: 'redeemed', reward_code, tier_id, label, points_spent, new_balance }
//   402 { status: 'insufficient_points', balance, points_needed }
//   400 { error }
// Atomic in Postgres (verify_redeem): the cost comes from verify_reward_tiers, points are deducted in
// the same transaction that issues the single-use reward code, and concurrent redeems cannot overspend.
export async function POST(request) {
  if (!ipLimit(clientIp(request))) return json({ error: 'Too many attempts. Try again in a few minutes.' }, 429)
  const body = await readJson(request)
  if (!body || typeof body !== 'object') return json({ error: 'Invalid request.' }, 400)
  const email = normalizeEmail(body.account ?? body.account_or_email ?? body.email)
  if (email && !emailLimit(email)) return json({ error: 'Too many attempts. Try again in a few minutes.' }, 429)
  const supabase = serviceClient()
  if (!supabase) return json({ error: 'Rewards are temporarily unavailable.' }, 503)
  try {
    const { status, body: out } = await handleRedeem(supabase, body)
    return json(out, status)
  } catch (err) {
    console.error('verify redeem failed:', err.message)
    return json({ error: 'Something went wrong. Try again.' }, 500)
  }
}
