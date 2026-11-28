/**
 * Brevo client for waitlist contacts + events (Brevo list id 2).
 * Env: BREVO_API_KEY, BREVO_WAITLIST_LIST_ID, NEXT_PUBLIC_SITE_URL.
 * Never throws: callers treat a failed send as a retry (cron) or a resend skip.
 * `transactional` (welcome / link re-send) is only a flag for the email API route;
 * the contact upsert itself is identical in both cases.
 *
 * Brevo API v3 shape: contacts use `attributes` (snake_case, declared in the
 * account); events use a flat `properties` object.
 */

const API = 'https://api.brevo.com/v3'
const LIST_ID = Number(process.env.BREVO_WAITLIST_LIST_ID || 0) || null
const KEY = process.env.BREVO_API_KEY || null
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://vibinapparel.com').replace(/\/$/, '')

async function brevo(path, method, body) {
  if (!KEY) return null
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'api-key': KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Brevo ${method} ${path} ${res.status}: ${await res.text()}`.slice(0, 200))
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

/**
 * Brevo contact payload for a waitlist row. Attribute names must exist in the
 * Brevo account or Brevo ignores them: FIRSTNAME, SOURCES (comma-separated),
 * STYLES, EARLY_ACCESS_LINK, AMBASSADOR_CODE, plus the list-2 UTM fields.
 * `attributes` are the contact-visible facts; the event carries the rest.
 */
export function contactPayload(row, { transactional = false, ambassadorCode = null } = {}) {
  return {
    email: row.email,
    attributes: {
      FIRSTNAME: row.first_name || '',
      SOURCES: row.sources ? row.sources.join(', ') : (row.source || ''),
      STYLES: row.styles ? row.styles.join(', ') : (row.style || ''),
      EARLY_ACCESS_LINK: row.early_access_link ? `${SITE_URL}${row.early_access_link}` : '',
      // Ambassador invite code that drove this sign-up (NOVA, COMET, ...); blank otherwise.
      AMBASSADOR_CODE: ambassadorCode || '',
      UTM_SOURCE: row.utm_source || '',
      UTM_CAMPAIGN: row.utm_campaign || '',
      UTM_MEDIUM: row.utm_medium || '',
    },
    listIds: LIST_ID ? [LIST_ID] : [],
    updateEnabled: true,
    transactional,
  }
}

/** Upsert one contact. Returns true on success, false when Brevo env is absent. */
export async function upsertBrevoContact(payload, { transactional = false } = {}) {
  if (!KEY || !LIST_ID) return false
  await brevo('/contacts', 'POST', { ...payload, transactional })
  return true
}

/**
 * Track one event for the email. Returns true on success, false when Brevo env absent.
 * Keep properties flat (Brevo ignores nesting).
 */
export async function addBrevoEvent(email, eventName, properties = {}) {
  if (!KEY) return false
  await brevo('/events', 'POST', { email, event: eventName, properties })
  return true
}
