import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { adminEmailsFromEnv, isAllowlistedEmail } from './admin-allowlist.mjs'

export { adminEmailsFromEnv, isAllowlistedEmail }

/**
 * Server-side admin gate for /admin pages and /api/admin/* routes.
 * A request is allowed only when all of these hold:
 *   1. a verified Supabase session (getUser, not getSession)
 *   2. profiles.is_admin is true
 *   3. if ADMIN_EMAILS is set, the user's email is on that list
 * ADMIN_EMAILS is a comma/whitespace-separated list. The value is never logged.
 * When the env var is unset or empty, (3) is skipped so existing admins keep access
 * until the allowlist is configured in Vercel (an env change, needs Josias).
 */
async function sessionClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() { /* read-only in most route handlers */ },
      },
    }
  )
}

/** The signed-in user from the request's Supabase auth cookies (verified with Supabase), or null. */
export async function getSessionUser() {
  try {
    const supabase = await sessionClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user || null
  } catch {
    return null
  }
}

export async function requireAdmin() {
  const supabase = await sessionClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return null
  if (!isAllowlistedEmail(user.email)) return null
  return user
}

export const ADMIN_RESPONSE_HEADERS = {
  'X-Robots-Tag': 'noindex, nofollow',
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
}

export function forbidden() {
  return Response.json({ error: 'Forbidden' }, { status: 403, headers: ADMIN_RESPONSE_HEADERS })
}
