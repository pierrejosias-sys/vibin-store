import { createClient } from '@supabase/supabase-js'
import { normalizeEmail } from '../../lib/early-access.mjs'
import { upsertSignup, syncRow, signupResponse, maybeSendLinkEmail } from '../../lib/waitlist.mjs'
import { createRateLimiter, clientIp } from '../../lib/support.mjs'

const ipLimit = createRateLimiter({ max: 5, windowMs: 10 * 60 * 1000 })

const SOURCE_RE = /^[a-z0-9-]{1,40}$/
const STYLE_RE = /^[a-z]{2,4}$/

// UTM values use the same allow-list as `source`: lowercase, digits, hyphens, max 40 chars.
// Invalid values are dropped, never an error: a sign-up must never fail because of a bad UTM.
function cleanUtm(value) {
  if (typeof value !== 'string') return null
  const v = value.trim().toLowerCase()
  return SOURCE_RE.test(v) ? v : null
}

export async function POST(request) {
  if (!ipLimit(clientIp(request))) return Response.json({ error: 'Too many tries. Please wait a few minutes.' }, { status: 429 })
  let body
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }) }
  const email = normalizeEmail(body?.email)
  if (!email) return Response.json({ error: 'Enter a valid email.' }, { status: 400 })
  const source = SOURCE_RE.test(body?.source || '') ? body.source : 'unknown'
  const style = STYLE_RE.test(body?.style || '') ? body.style : null
  const firstName = typeof body?.firstName === 'string' ? body.firstName.trim().slice(0, 60) || null : null
  // Campaign (first-touch UTM). Absent on direct / organic-no-link sign-ups.
  const utm_source = cleanUtm(body?.utm_source)
  const utm_campaign = cleanUtm(body?.utm_campaign)
  const utm_medium = cleanUtm(body?.utm_medium)
  // The forms state that joining = agreeing to marketing email; explicit false opts out.
  const consent = body?.consent !== false

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return Response.json({ error: 'Sign-up is temporarily unavailable.' }, { status: 503 })
  const supabase = createClient(url, key, { auth: { persistSession: false } })

  try {
    const result = await upsertSignup(supabase, { email, firstName, source, style, consent, utm_source, utm_campaign, utm_medium })
    await syncRow(supabase, result.row) // never throws; no-op without Brevo env
    // Existing email: never reveal the link here; email it to that address instead (max 1/24h).
    if (!result.created) await maybeSendLinkEmail(supabase, result.row)
    return Response.json(signupResponse(result))
  } catch (err) {
    console.error('waitlist signup failed:', err.message)
    return Response.json({ error: 'Something went wrong. Try again.' }, { status: 500 })
  }
}
