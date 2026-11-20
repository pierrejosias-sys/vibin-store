/**
 * Vibin Verify: framework-free server helpers for /api/verify/[code], /api/claim and /api/redeem.
 * The (service-role) Supabase client is passed in, so everything here runs against a fake `rpc` in tests.
 *
 * Every state change is ONE Postgres function call = ONE transaction
 * (supabase/migrations/20261118000001_vibin_verify.sql):
 *   verify_scan    scan counter + public piece data
 *   verify_claim   atomic first-claim + points award
 *   verify_redeem  atomic points spend + single-use reward code
 * so a double-tap, a replay, or two phones scanning one tag can never pay points twice.
 */
import { normalizeEmail } from './early-access.mjs'

const firstRow = data => (Array.isArray(data) ? data[0] : data) || null
const NOT_FOUND = { status: 404, body: { status: 'not_found' } }

/** 'vbn-tch5-2601', ' VBN TCH5 2601 ' or 'VBNTCH52601' -> 'VBN-TCH5-2601'. Anything else -> null. */
export function normalizeCode(raw) {
  if (typeof raw !== 'string' || raw.length > 40) return null
  const s = raw.replace(/[\s\-‐-―]+/g, '')
  if (!/^[A-Za-z0-9]{11}$/.test(s)) return null // ASCII only before upper-casing (no dotless-i look-alikes)
  const m = /^VBN([A-Z0-9]{4})([A-Z0-9]{4})$/.exec(s.toUpperCase())
  return m ? `VBN-${m[1]}-${m[2]}` : null
}

/** 'vibin10' -> 'VIBIN10'. The database looks up the cost; a price sent by the browser is never used. */
export function normalizeTier(raw) {
  const s = typeof raw === 'string' ? raw.trim().toUpperCase() : ''
  return /^[A-Z0-9]{4,12}$/.test(s) ? s : null
}

/**
 * GET /api/verify/:code -> { status, body }
 *   200 authentic | claimed (a claimed code is still genuine; it just pays no points again)
 *   404 not_found   (an unregistered code is never auto-created)
 */
export async function handleScan(supabase, rawCode) {
  const code = normalizeCode(rawCode)
  if (!code) return NOT_FOUND
  const { data, error } = await supabase.rpc('verify_scan', { p_code: code })
  if (error) throw new Error(error.message)
  const row = firstRow(data)
  if (!row) return NOT_FOUND
  return {
    status: 200,
    body: {
      status: row.claimed ? 'claimed' : 'authentic',
      code: row.code,
      product: row.product,
      drop: row.drop_name,
      colorway: row.colorway,
      size: row.size,
      points_value: row.points_value,
      ...(row.claimed ? { claimed_at: row.claimed_at } : {}),
    },
  }
}

/**
 * POST /api/claim { code, account_or_email } -> { status, body }
 *   200 claimed (points_awarded includes any first-ever +50 bonus; bonus_awarded shows it separately)
 *   409 already_claimed (claimed_at, no points)   404 not_found   400 bad email
 */
export async function handleClaim(supabase, input) {
  const code = normalizeCode(input?.code)
  const email = normalizeEmail(input?.account_or_email ?? input?.account ?? input?.email)
  if (!email) return { status: 400, body: { error: 'Enter a valid email.' } }
  if (!code) return NOT_FOUND
  const { data, error } = await supabase.rpc('verify_claim', { p_code: code, p_account: email })
  if (error) throw new Error(error.message)
  const row = firstRow(data)
  if (!row || row.o_outcome === 'not_found') return NOT_FOUND
  if (row.o_outcome === 'already_claimed') {
    return { status: 409, body: { status: 'already_claimed', claimed_at: row.o_claimed_at } }
  }
  if (row.o_outcome !== 'claimed') throw new Error(`unexpected claim outcome: ${row.o_outcome}`)
  return {
    status: 200,
    body: {
      status: 'claimed',
      points_awarded: row.o_points_awarded,
      bonus_awarded: row.o_bonus,
      new_balance: row.o_new_balance,
      claimed_at: row.o_claimed_at,
    },
  }
}

/**
 * Redeem is session-bound: the caller must be signed in, and the email they redeem under must be
 * the signed-in account's email. Returns { status, body } to reject, or null when allowed.
 */
export function redeemSessionCheck(user, input) {
  const sessionEmail = normalizeEmail(user?.email)
  if (!user || !sessionEmail) {
    return { status: 401, body: { status: 'login_required', error: 'Sign in to redeem points.' } }
  }
  const email = normalizeEmail(input?.account ?? input?.account_or_email ?? input?.email)
  if (email && email !== sessionEmail) {
    return { status: 403, body: { status: 'account_mismatch', error: 'Redeem with the email you are signed in with.' } }
  }
  return null
}

/**
 * POST /api/redeem { account, tier_id } -> { status, body }
 *   200 redeemed (single-use reward_code tied to the account; points deducted in the same transaction)
 *   402 insufficient_points (balance, points_needed)   400 bad email / unknown tier
 */
export async function handleRedeem(supabase, input) {
  const email = normalizeEmail(input?.account ?? input?.account_or_email ?? input?.email)
  const tier = normalizeTier(input?.tier_id)
  if (!email) return { status: 400, body: { error: 'Enter a valid email.' } }
  if (!tier) return { status: 400, body: { error: 'Unknown reward.' } }
  const { data, error } = await supabase.rpc('verify_redeem', { p_account: email, p_tier_id: tier })
  if (error) throw new Error(error.message)
  const row = firstRow(data)
  if (!row) throw new Error('verify_redeem returned no row')
  if (row.o_outcome === 'invalid_tier') return { status: 400, body: { error: 'Unknown reward.' } }
  if (row.o_outcome === 'insufficient_points') {
    return {
      status: 402,
      body: { status: 'insufficient_points', balance: row.o_new_balance ?? 0, points_needed: row.o_points_needed },
    }
  }
  if (row.o_outcome !== 'redeemed') throw new Error(`unexpected redeem outcome: ${row.o_outcome}`)
  return {
    status: 200,
    body: {
      status: 'redeemed',
      reward_code: row.o_reward_code,
      tier_id: tier,
      label: row.o_tier_label,
      points_spent: row.o_points_spent,
      new_balance: row.o_new_balance,
    },
  }
}
