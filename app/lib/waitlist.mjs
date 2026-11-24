import { normalizeEmail, resolveEarlyAccessLink, hashLinkId, hashEmail } from './early-access.mjs'
import { upsertBrevoContact, addBrevoEvent, contactPayload } from './brevo.mjs'
import { createRateLimiter } from './support.mjs'

/** One sign-up write path: the waitlist route and any future join forms use this. */
export async function upsertSignup(supabase, { email, firstName, source, style, consent, utm_source, utm_campaign, utm_medium, ambassadorCode = null }) {
  const row = { email, first_name: firstName, source, style, consent, utm_source, utm_campaign, utm_medium, ambassador_code: ambassadorCode, brevo_synced_at: null, link_resent_at: null, resend_count: 0 }
  const { data, error } = await supabase.from('waitlist_signups').upsert(row, { onConflict: 'email', ignoreDuplicates: true }).select('*, id').maybeSingle()
  if (error || !data) throw new Error(`waitlist upsert failed: ${error?.message || 'no row returned'}`)
  // A re-sign-up is never an error: one row per email, first-touch sources/styles win.
  if (!data.created_at) throw new Error('waitlist upsert failed: no row returned')
  if (data.created_at !== data.updated_at) {
    const changes = {}
    if (data.first_name !== firstName) changes.first_name = firstName
    if (data.style !== style) changes.style = style
    if (data.consent !== consent) changes.consent = consent
    if (data.utm_source !== utm_source) changes.utm_source = utm_source
    if (data.utm_campaign !== utm_campaign) changes.utm_campaign = utm_campaign
    if (data.utm_medium !== utm_medium) changes.utm_medium = utm_medium
    // Ambassador code: first-touch wins — an earlier code is never overwritten.
    if (!data.ambassador_code && ambassadorCode) changes.ambassador_code = ambassadorCode
    if (Object.keys(changes).length) {
      const { error: updErr } = await supabase.from('waitlist_signups').update(changes).eq('id', data.id)
      if (updErr) throw new Error(`waitlist merge failed: ${updErr.message}`)
      Object.assign(data, changes)
    }
    // No new early-access link, no new Brevo sync, no event for re-sign-ups.
    return { row: data, created: false, ambassadorCodeAttached: Boolean(changes.ambassador_code) }
  }
  // Created: attach the link immediately so it is never blank in Supabase (sync failure after
  // this point must not lose the link). Deterministic: one link per email, no regeneration.
  const earlyAccessLink = resolveEarlyAccessLink(email)
  const { error: linkErr } = await supabase.from('waitlist_signups').update({ early_access_link: earlyAccessLink }).eq('id', data.id)
  if (linkErr) throw new Error(`early-access link write failed: ${linkErr.message}`)
  data.early_access_link = earlyAccessLink
  return { row: data, created: true, ambassadorCodeAttached: Boolean(ambassadorCode) }
}

/**
 * Sync one row to Brevo after insert. Never throws: a failed sync marks the row
 * stale (brevo_synced_at = NULL) for the retry cron; the link stays safe in Supabase.
 * No-op when Brevo env is absent (see brevo.mjs).
 */
export async function syncRow(supabase, row) {
  let sent = false
  try {
    const payload = contactPayload(row, { ambassadorCode: row.ambassador_code })
    sent = await upsertBrevoContact(payload)
    if (sent) await addBrevoEvent(row.email, 'waitlist_signup', { source: row.source, style: row.style, utm_source: row.utm_source, utm_campaign: row.utm_campaign, utm_medium: row.utm_medium })
  } catch (err) { console.error('waitlist brevo sync failed:', err.message) }
  try {
    await supabase.from('waitlist_signups').update({ brevo_synced_at: sent ? new Date().toISOString() : null }).eq('id', row.id)
  } catch (err) { console.error('waitlist brevo stamp failed:', err.message) }
}

/**
 * Shape the waitlist response.
 * New email: early-access link + QR returned so the page can confirm instantly.
 * Existing email: no link (it is emailed instead). Never include a link if missing.
 */
export function signupResponse({ row, created }) {
  if (!created) return { ok: true, already: true }
  return {
    ok: true,
    earlyAccessLink: row.early_access_link || null,
    linkId: row.early_access_link ? hashLinkId(row.early_access_link) : null,
    emailHash: hashEmail(row.email),
    already: false,
  }
}

/**
 * Existing email: re-send the early-access link to the email address itself.
 * Silent if the link is missing or Brevo is unavailable. Max one email per 24h
 * per email address. Never reveal the link in the API response.
 */
const emailLimit = createRateLimiter({ max: 3, windowMs: 24 * 60 * 60 * 1000 })

export async function maybeSendLinkEmail(supabase, row) {
  if (!row.early_access_link) return
  if (row.link_resent_at) {
    const last = Date.parse(row.link_resent_at)
    if (!Number.isNaN(last) && Date.now() - last < 24 * 60 * 60 * 1000) return
  }
  if (!emailLimit(hashEmail(row.email))) return
  try {
    const sent = await upsertBrevoContact(contactPayload(row, { ambassadorCode: row.ambassador_code }), { transactional: true })
    if (!sent) return
    await supabase.from('waitlist_signups').update({ link_resent_at: new Date().toISOString(), resend_count: (row.resend_count || 0) + 1 }).eq('id', row.id)
  } catch (err) { console.error('link re-send failed:', err.message) }
}
