import { authServerClient } from '../../../auth/server-client'
import { isAllowlistedEmail, ADMIN_RESPONSE_HEADERS } from '../../../lib/admin-auth'
import { createRateLimiter } from '../../../lib/support.mjs'

export const dynamic = 'force-dynamic'

// Supabase Auth also rate-limits sign-in. This is an extra per-instance IP cap on the custom route.
const loginLimiter = createRateLimiter({ max: 5, windowMs: 15 * 60 * 1000 })

function clientIp(request) {
  const fwd = request.headers.get('x-forwarded-for') || ''
  const ip = fwd.split(',')[0].trim() || request.headers.get('x-real-ip') || ''
  return ip || 'unknown'
}

function json(body, status = 200) {
  return Response.json(body, { status, headers: ADMIN_RESPONSE_HEADERS })
}

export async function POST(request) {
  if (!loginLimiter(clientIp(request))) {
    return json({ error: 'Too many attempts. Try again later.' }, 429)
  }

  const body = await request.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!email || !password) return json({ error: 'Invalid email or password.' }, 400)

  const supabase = await authServerClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data?.user) return json({ error: 'Invalid email or password.' }, 401)

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', data.user.id).single()
  if (!profile?.is_admin || !isAllowlistedEmail(data.user.email)) {
    await supabase.auth.signOut()
    return json({ error: 'You do not have admin access.' }, 403)
  }

  return json({ ok: true })
}
