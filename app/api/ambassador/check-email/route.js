import { serviceClient } from '../_client.mjs'
import { normalizeApplyEmail, ambassadorEmailExists } from '../../../lib/ambassador-apply.mjs'

// Duplicate check for the apply form. Returns only { exists: true|false }.
export async function POST(request) {
  let body
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }) }
  const email = normalizeApplyEmail(body?.email)
  if (!email) return Response.json({ error: 'Enter a valid email.' }, { status: 400 })
  const db = serviceClient()
  if (!db) return Response.json({ error: 'Temporarily unavailable.' }, { status: 503 })
  try {
    return Response.json({ exists: await ambassadorEmailExists(db, email) })
  } catch (err) {
    console.error('ambassador check-email failed:', err.message)
    return Response.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
