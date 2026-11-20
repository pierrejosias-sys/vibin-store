import { handleRedeem, redeemSessionCheck } from '../../lib/verify.mjs'
import { getSessionUser } from '../../lib/admin-auth'
import { normalizeEmail } from '../../lib/early-access.mjs'
import { serviceClient, json, clientIp, limiter, readJson } from '../../lib/verify-server.mjs'

export const dynamic = 'force-dynamic'

const ipLimit = limiter(10)
const emailLimit = limiter(10)

// POST /api/redeem { account, tier_id }  (signed-in only; account must be the session email)
//   401 { status: 'login_required' }   403 { status: 'account_mismatch' }
//   200 { status: 'redeemed', reward_code, tier_id, label, points_spent, new_balance }
//   402 { status: 'insufficient_points', balance, points_needed }
//   400 { error }
// Atomic in Postgres (verify_redeem): the cost comes from verify_reward_tiers, points are deducted in
// the same transaction that issues the single-use reward code, and concurrent redeems cannot overspend.
export async function POST(request) {
  if (!ipLimit(clientIp(request))) return json({ error: 'Too many attempts. Try again in a few minutes.' }, 429)
  const body = await readJson(request)
  if (!body || typeof body !== 'object') return json({ error: 'Invalid request.' }, 400)
  // Spending points needs a signed-in session, and only the session's own email can be redeemed.
  const user = await getSessionUser()
  const denied = redeemSessionCheck(user, body)
  if (denied) return json(denied.body, denied.status)
  const email = normalizeEmail(user.email)
  if (email && !emailLimit(email)) return json({ error: 'Too many attempts. Try again in a few minutes.' }, 429)
  const supabase = serviceClient()
  if (!supabase) return json({ error: 'Rewards are temporarily unavailable.' }, 503)
  try {
    const { status, body: out } = await handleRedeem(supabase, { ...body, account: email })
    return json(out, status)
  } catch (err) {
    console.error('verify redeem failed:', err.message)
    return json({ error: 'Something went wrong. Try again.' }, 500)
  }
}
