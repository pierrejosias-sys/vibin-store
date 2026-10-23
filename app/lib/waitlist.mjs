/** Server-only waitlist helpers (service-role Supabase client required). */
import { newEarlyAccessToken, isWellFormedToken, earlyAccessLink } from './early-access.mjs'
import { syncSignupToBrevo } from './brevo.mjs'

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

/** Called from the Stripe webhook on checkout.session.completed. Idempotent; first session wins. */
export async function markEarlyAccessTokenUsed(supabase, token, sessionId) {
  if (!isWellFormedToken(token)) return false
  const { data, error } = await supabase.from('waitlist_signups')
    .update({ token_used_at: new Date().toISOString(), token_used_session_id: sessionId })
    .eq('early_access_token', token).is('token_used_at', null).select('id')
  if (error) { console.error('markEarlyAccessTokenUsed:', error.message); return false }
  return data.length > 0
}
