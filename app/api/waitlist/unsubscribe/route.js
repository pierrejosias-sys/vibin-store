import { createClient } from '@supabase/supabase-js'
import { normalizeEmail } from '../../../lib/early-access.mjs'
import { unsubscribeSignup } from '../../../lib/waitlist.mjs'
import { unsubscribeFromBrevo } from '../../../lib/brevo.mjs'

// Replaces the old Mailchimp unsubscribe. Same response whether or not the email is on the list.
export async function POST(request) {
  let body
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }) }
  const email = normalizeEmail(body?.email)
  if (!email) return Response.json({ error: 'Enter a valid email.' }, { status: 400 })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return Response.json({ error: 'Unsubscribe is temporarily unavailable.' }, { status: 503 })
  try {
    await unsubscribeSignup(createClient(url, key, { auth: { persistSession: false } }), email)
    const brevo = await unsubscribeFromBrevo(email)
    if (brevo.ok === false) console.error('brevo unsubscribe failed:', brevo.error)
    return Response.json({ ok: true })
  } catch (err) {
    console.error('unsubscribe failed:', err.message)
    return Response.json({ error: 'Something went wrong. Try again.' }, { status: 500 })
  }
}
