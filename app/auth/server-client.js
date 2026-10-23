import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/** Supabase client bound to the request cookies (anon key; respects RLS). */
export async function authServerClient() {
  const cookieStore = await cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) },
    },
  })
}

export async function roleProfile(supabase) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('is_admin, is_ambassador').eq('id', user.id).maybeSingle()
  return data || {}
}
