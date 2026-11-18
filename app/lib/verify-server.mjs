/**
 * Server-only plumbing shared by the three Vibin Verify routes.
 * Same pattern as /api/waitlist and /api/support: the service-role key lives in Vercel env vars and is
 * only ever read here, on the server. The browser talks to the routes, never to these tables.
 */
import { createClient } from '@supabase/supabase-js'
import { createRateLimiter } from './support.mjs'

export const WINDOW_MS = 10 * 60 * 1000

/** Service-role client, or null when the env is not configured (routes answer 503). */
export function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null
}

export const json = (body, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

export const clientIp = req =>
  (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown'

/** In-memory, per server instance, best effort (same limiter as the support form). Returns hit(key) -> boolean. */
export const limiter = max => createRateLimiter({ max, windowMs: WINDOW_MS })

export async function readJson(request) {
  try { return await request.json() } catch { return null }
}
