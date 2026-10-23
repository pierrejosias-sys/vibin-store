/** Server-only waitlist helpers (service-role Supabase client required). */
import { newEarlyAccessToken, isWellFormedToken, earlyAccessLink } from './early-access.mjs'
import { syncSignupToBrevo, sendLinkEmail } from './brevo.mjs'

const likeExact = s => s.replace(/[\\%_]/g, m => '\\' + m)
const uniq = a => [...new Set(a.filter(Boolean))]

/** Inserts or merges (dedupe by email) a sign-up. Returns the row. */
export async function upsertSignup(supabase, { email, firstName, source, style, consent }) {
  const { data: existing, error: readErr } = await supabase.from('waitlist_signups')
    .select('*').ilike('email', likeExact(email)).maybeSingle()
  if (readErr) throw new Error(readErr.message)
  const now = new Date().toISOString()
  if (existing) {
    const patch = {
      sources: uniq([...(existing.sources || []), source]),
      styles: uniq([...(existing.styles || []), style]),
      first_name: existing.first_name || firstName || null,
      updated_at: now,
      ...(consent && !existing.consent_email ? { consent_email: true, consent_at: now } : {}),
    }
    const { data, error } = await supabase.from('waitlist_signups').update(patch).eq('id', existing.id).select('*').single()
    if (error) throw new Error(error.message)
    return { row: data, created: false }
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabase.from('waitlist_signups').insert({
      email, first_name: firstName || null, sources: uniq([source]), styles: uniq([style]),
      consent_email: !!consent, consent_at: consent ? now : null, early_access_token: newEarlyAccessToken(),
    }).select('*').single()
    if (!error) return { row: data, created: true }
    if (error.code !== '23505') throw new Error(error.message)
    // 23505: email inserted concurrently (merge on retry) or token collision (new token)
    const again = await supabase.from('waitlist_signups').select('*').ilike('email', likeExact(email)).maybeSingle()
    if (again.data) return upsertSignup(supabase, { email, firstName, source, style, consent })
  }
  throw new Error('could not create sign-up')
}

/** Syncs one row to Brevo; sets synced_at only on success. Quiet no-op if not configured. */
export async function syncRow(supabase, row, opts) {
  if (!row.consent_email) return { skipped: true }
  const res = await syncSignupToBrevo({
    email: row.email,
    earlyAccessLink: earlyAccessLink(row.early_access_token),
    source: (row.sources || []).join(','),
  }, opts)
  if (res.ok) {
    await supabase.from('waitlist_signups').update({ synced_to: 'brevo', synced_at: new Date().toISOString(), sync_error: null }).eq('id', row.id)
  } else if (!res.skipped) {
    await supabase.from('waitlist_signups').update({ sync_error: res.error }).eq('id', row.id)
  }
  return res
}

/** 'valid' | 'used' | 'invalid'. A token is good for ONE completed early-access checkout. */
export async function earlyAccessTokenStatus(supabase, token) {
  if (!isWellFormedToken(token)) return 'invalid'
  const { data, error } = await supabase.from('waitlist_signups').select('id, token_used_at').eq('early_access_token', token).maybeSingle()
  if (error || !data) return 'invalid'
  return data.token_used_at ? 'used' : 'valid'
}

export async function isValidEarlyAccessToken(supabase, token) {
  return (await earlyAccessTokenStatus(supabase, token)) === 'valid'
}

/** Lock TTL: Stripe sessions for early access expire after STRIPE_SESSION_MINUTES (30), plus slack. */
export const EARLY_LOCK_TTL_MS = 35 * 60 * 1000

/**
 * Atomically locks an unused private link to one checkout attempt. Succeeds only if the link
 * exists, is unused, and is unlocked or its lock is older than the TTL. Returns true/false.
 */
export async function lockEarlyAccessToken(supabase, token, now = Date.now()) {
  if (!isWellFormedToken(token)) return false
  const stale = new Date(now - EARLY_LOCK_TTL_MS).toISOString()
  const { data, error } = await supabase.from('waitlist_signups')
    .update({ locked_at: new Date(now).toISOString(), locked_session_id: null })
    .eq('early_access_token', token).is('token_used_at', null)
    .or(`locked_at.is.null,locked_at.lt.${stale}`)
    .select('id')
  if (error) { console.error('lockEarlyAccessToken:', error.message); return false }
  return data.length === 1
}

export async function attachEarlyAccessLock(supabase, token, sessionId) {
  const { error } = await supabase.from('waitlist_signups').update({ locked_session_id: sessionId })
    .eq('early_access_token', token).is('token_used_at', null).is('locked_session_id', null)
  if (error) console.error('attachEarlyAccessLock:', error.message)
}

/** Releases the lock held by sessionId (or the pre-session lock when sessionId is null). */
export async function releaseEarlyAccessLock(supabase, token, sessionId) {
  if (!isWellFormedToken(token)) return false
  let q = supabase.from('waitlist_signups').update({ locked_at: null, locked_session_id: null })
    .eq('early_access_token', token).is('token_used_at', null)
  q = sessionId ? q.eq('locked_session_id', sessionId) : q.is('locked_session_id', null)
  const { data, error } = await q.select('id')
  if (error) { console.error('releaseEarlyAccessLock:', error.message); return false }
  return data.length > 0
}

/** Called from the Stripe webhook on checkout.session.completed. Idempotent; first session wins. */
export async function markEarlyAccessTokenUsed(supabase, token, sessionId) {
  if (!isWellFormedToken(token)) return false
  const { data, error } = await supabase.from('waitlist_signups')
    .update({ token_used_at: new Date().toISOString(), token_used_session_id: sessionId, locked_at: null, locked_session_id: null })
    .eq('early_access_token', token).is('token_used_at', null).select('id')
  if (error) { console.error('markEarlyAccessTokenUsed:', error.message); return false }
  return data.length > 0
}

export const LINK_EMAIL_INTERVAL_MS = 24 * 60 * 60 * 1000

/**
 * What the browser gets back. SECURITY: the private link is returned ONLY when this request
 * created the row. For an existing email we never return it (anyone can type any email).
 */
export function signupResponse({ created, row }, base) {
  return created
    ? { ok: true, created: true, earlyAccessLink: earlyAccessLink(row.early_access_token, base) }
    : { ok: true, created: false }
}

export function linkEmailDue(row, now = Date.now()) {
  return !row.last_link_email_at || now - new Date(row.last_link_email_at).getTime() >= LINK_EMAIL_INTERVAL_MS
}

/**
 * Re-signup with an existing email: email that address its link (max 1 per 24h, one recipient).
 * The 24h slot is claimed atomically before sending so concurrent requests can't double-send.
 */
export async function maybeSendLinkEmail(supabase, row, { now = Date.now(), env = process.env, fetchImpl = fetch } = {}) {
  if (!env.BREVO_API_KEY) return { skipped: 'not configured' }
  if (!linkEmailDue(row, now)) return { skipped: 'rate-limited' }
  const cutoff = new Date(now - LINK_EMAIL_INTERVAL_MS).toISOString()
  const { data, error } = await supabase.from('waitlist_signups')
    .update({ last_link_email_at: new Date(now).toISOString() })
    .eq('id', row.id).or(`last_link_email_at.is.null,last_link_email_at.lt.${cutoff}`).select('id')
  if (error || !data?.length) return { skipped: 'rate-limited' }
  const res = await sendLinkEmail({ email: row.email, link: earlyAccessLink(row.early_access_token) }, { env, fetchImpl })
  if (!res.ok) {
    // Give the slot back so a later retry can send.
    await supabase.from('waitlist_signups').update({ last_link_email_at: row.last_link_email_at || null }).eq('id', row.id)
  }
  return res
}
