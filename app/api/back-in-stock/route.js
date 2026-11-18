import { createClient } from '@supabase/supabase-js'
import { parseSignup, saveSignup } from '../../lib/back-in-stock.mjs'

// "Notify me when back in stock" sign-up. Stores the request only; no email is sent here.
export async function POST(request) {
  let body
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }) }
  const parsed = parseSignup(body)
  if (parsed.error) return Response.json({ error: parsed.error }, { status: 400 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRole) return Response.json({ error: 'Sign-up is temporarily unavailable.' }, { status: 503 })
  const supabase = createClient(url, serviceRole, { auth: { persistSession: false } })

  try {
    const result = await saveSignup(supabase, parsed.value)
    if (!result.ok) return Response.json({ error: result.error }, { status: result.status })
    // Same answer for new and repeat sign-ups, so the form never reveals who already signed up.
    return Response.json({ ok: true })
  } catch (err) {
    console.error('back-in-stock signup failed:', err.message) // never log the email
    return Response.json({ error: 'Something went wrong. Try again.' }, { status: 500 })
  }
}
