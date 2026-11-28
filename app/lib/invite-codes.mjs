/**
 * Ambassador invite codes — server side (service role).
 * Codes live in public.ambassador_invite_codes (see supabase/migrations/
 * 20261124000001_ambassador_invite_codes.sql). Word-based, e.g. NOVA, COMET —
 * deliberately unlike the VBN-XXXX-XXXX verify codes and unlike the
 * ambassadors-table login codes. Multi-use: one code per ambassador slot,
 * shared with as many people as that ambassador reaches. Invite-only,
 * never a discount. Pure logic is unit-tested in tests/invite-codes.test.mjs.
 */

const CODE_RE = /^[A-Z]{4,24}$/

/** Upper-case letters only; anything else (incl. verify-code format) is null. */
export function normalizeInviteCode(value) {
  if (typeof value !== 'string') return null
  const code = value.trim().toUpperCase()
  return CODE_RE.test(code) ? code : null
}

/**
 * Validate a code against the store. Returns { ok: true, code, slot } or
 * { ok: false, reason } where reason is 'invalid' | 'revoked' | 'expired' |
 * 'unavailable' (table/DB not reachable — never treat as valid).
 */
export async function validateInviteCode(supabase, value) {
  const code = normalizeInviteCode(value)
  if (!code) return { ok: false, reason: 'invalid' }
  let data, error
  try {
    ;({ data, error } = await supabase.from('ambassador_invite_codes')
      .select('code, slot, status, expires_at').eq('code', code).maybeSingle())
  } catch (err) {
    console.error('validateInviteCode failed:', err.message)
    return { ok: false, reason: 'unavailable' }
  }
  if (error) {
    console.error('validateInviteCode failed:', error.message)
    return { ok: false, reason: 'unavailable' }
  }
  if (!data) return { ok: false, reason: 'invalid' }
  if (data.status === 'revoked') return { ok: false, reason: 'revoked' }
  if (data.expires_at && new Date(data.expires_at).getTime() <= Date.now()) return { ok: false, reason: 'expired' }
  return { ok: true, code: data.code, slot: data.slot }
}

/** Human-readable rejection for the join form. */
export function inviteCodeError(reason) {
  if (reason === 'revoked') return 'That invite code has been revoked. Join without a code, or ask your ambassador for a new one.'
  if (reason === 'expired') return 'That invite code has expired. Join without a code, or ask your ambassador for a new one.'
  if (reason === 'unavailable') return 'Invite codes are temporarily unavailable. Please try again in a minute \u2014 or join without a code.'
  return 'That invite code isn\u2019t valid. Check it and try again \u2014 or join without one.'
}

/**
 * Count a successful sign-up against the code. Never throws; the
 * waitlist_signups rows are the authoritative attribution — this counter is
 * a convenience and may undercount under concurrent sign-ups.
 */
export async function recordInviteCodeUse(supabase, code) {
  try {
    const { data, error } = await supabase.from('ambassador_invite_codes')
      .select('uses').eq('code', code).maybeSingle()
    if (error || !data) return
    await supabase.from('ambassador_invite_codes')
      .update({ uses: (data.uses || 0) + 1, last_used_at: new Date().toISOString() })
      .eq('code', code)
  } catch (err) {
    console.error('recordInviteCodeUse failed:', err.message)
  }
}
