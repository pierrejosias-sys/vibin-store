import { serviceClient } from '../_client.mjs'
import { createRateLimiter, clientIp } from '../../../lib/support.mjs'

const ipLimit = createRateLimiter({ max: 5, windowMs: 10 * 60 * 1000 })
import { ambassadorCodeStatus } from '../../../lib/ambassador-apply.mjs'

// Referral-code gate for /ambassador/login. Returns only { status }.
export async function POST(request) {
  if (!ipLimit(clientIp(request))) return Response.json({ error: 'Too many tries. Please wait a few minutes.' }, { status: 429 })
  let body
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }) }
  const db = serviceClient()
  if (!db) return Response.json({ error: 'Temporarily unavailable.' }, { status: 503 })
  try {
    return Response.json({ status: await ambassadorCodeStatus(db, body?.code) })
  } catch (err) {
    console.error('ambassador code check failed:', err.message)
    return Response.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
