/** Campaign (UTM) capture for the Drop 01 waitlist: client-safe, first-touch wins.
 *
 * - Reads utm_source / utm_campaign / utm_medium from the URL on /drop/01.
 * - Remembers the FIRST campaign in sessionStorage (survives navigation within the
 *   visit, never overwrites), matching the server's first-touch rule.
 * - No cookies, no cross-site tracking, no PII. Values are validated against the
 *   same regex the API uses (SOURCE_RE): /^[a-z0-9-]{1,40}$/. The API re-validates.
 * - Used by app/drop/DropClient.js (Waitlist form).
 */

const UTM_RE = /^[a-z0-9-]{1,40}$/
const STORE_KEY = 'vibin:campaign:v1'

function clean(value) {
  if (typeof value !== 'string') return null
  const v = value.trim().toLowerCase()
  return UTM_RE.test(v) ? v : null
}

/** Normalises any object to { utm_source, utm_campaign, utm_medium } or null if all empty. */
function normalize(obj) {
  if (!obj || typeof obj !== 'object') return null
  const campaign = {
    utm_source: clean(obj.utm_source),
    utm_campaign: clean(obj.utm_campaign),
    utm_medium: clean(obj.utm_medium),
  }
  if (!campaign.utm_source && !campaign.utm_campaign && !campaign.utm_medium) return null
  return campaign
}

/** Parse UTM params from a URL search string. Returns null when none are present. */
export function readCampaignFromUrl(search = '') {
  let params
  try { params = new URLSearchParams(search) } catch { return null }
  return normalize({
    utm_source: params.get('utm_source'),
    utm_campaign: params.get('utm_campaign'),
    utm_medium: params.get('utm_medium'),
  })
}

function readStored() {
  try {
    const raw = sessionStorage.getItem(STORE_KEY)
    return raw ? normalize(JSON.parse(raw)) : null
  } catch { return null }
}

/** Store a campaign as the first touch. Never overwrites an existing stored campaign. */
export function rememberCampaign(campaign) {
  if (!campaign || typeof sessionStorage === 'undefined') return null
  const existing = readStored()
  if (existing) return existing
  try { sessionStorage.setItem(STORE_KEY, JSON.stringify(campaign)) } catch { /* storage blocked */ }
  return campaign
}

/** The campaign to attach to a waitlist sign-up: stored first touch, else the URL. {} if none. */
export function getCampaign() {
  if (typeof window === 'undefined') return {}
  const stored = typeof sessionStorage !== 'undefined' ? readStored() : null
  if (stored) return stored
  const fromUrl = readCampaignFromUrl(window.location.search)
  if (!fromUrl) return {}
  return rememberCampaign(fromUrl) || fromUrl
}
