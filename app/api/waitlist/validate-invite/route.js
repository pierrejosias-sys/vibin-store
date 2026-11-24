import { serviceClient } from '../../ambassador/_client.mjs'
import { createRateLimiter, clientIp } from '../../../lib/support.mjs'
import { validateInviteCode } from '../../../lib/invite-codes.mjs'

const ipLimit = createRateLimiter({ max: 10, windowMs: 10 * 60 * 1000 })

// Live check for the join form (?invite= pre-fill and the code field).
// Returns { valid: true, code, slot } or { valid: false, reason }.
// The waitlist POST re-validates server-side; this endpoint never signs anyone up.
export async function POST(request) {
  if (!ipLimit(clientIp(request))) return Response.json({ error: 'Too many tries. Please wait a few minutes.' }, { status: 429 })
  let body
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }) }
  const db = serviceClient()
  if (!db) return Response.json({ error: 'Temporarily unavailable.' }, { status: 503 })
  try {
    const check = await validateInviteCode(db, body?.code)
    if (!check.ok) return Response.json({ valid: false, reason: check.reason })
    return Response.json({ valid: true, code: check.code, slot: check.slot })
  } catch (err) {
    console.error('validate-invite failed:', err.message)
    return Response.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
