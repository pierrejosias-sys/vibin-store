import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/**
 * Server-side admin gate for /api/admin/* routes (middleware only covers /admin pages).
 * Returns the user if the request carries a Supabase session whose profile is_admin, else null.
 */
async function sessionClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() { /* read-only in route handlers */ },
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
  return profile?.is_admin ? user : null
}

export function forbidden() {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}
