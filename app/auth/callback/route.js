import { NextResponse } from 'next/server'
import { authServerClient, roleProfile } from '../server-client'
import { destinationFor } from '../redirects.mjs'

// PKCE / OAuth callback: ?code=... (default Supabase email links and OAuth).
// Branded email templates use /auth/confirm (token_hash) instead.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const next = searchParams.get('next')

  if (code) {
    const supabase = await authServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const recovery = type === 'recovery' || next === '/reset-password'
      const profile = recovery ? null : await roleProfile(supabase)
      return NextResponse.redirect(`${origin}${destinationFor({ type: recovery ? 'recovery' : type, next, profile })}`)
    }
    console.error('auth/callback exchange failed:', error.message)
  }
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
