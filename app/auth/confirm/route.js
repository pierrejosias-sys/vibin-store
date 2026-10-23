import { NextResponse } from 'next/server'
import { authServerClient, roleProfile } from '../server-client'
import { destinationFor } from '../redirects.mjs'

const TYPES = new Set(['signup', 'email', 'recovery', 'magiclink', 'invite', 'email_change'])

// Email-link verification used by the branded templates:
//   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=<type>
// Works across devices/browsers (no PKCE verifier needed).
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next')

  if (tokenHash && TYPES.has(type)) {
    const supabase = await authServerClient()
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (!error) {
      const profile = type === 'recovery' ? null : await roleProfile(supabase)
      return NextResponse.redirect(`${origin}${destinationFor({ type, next, profile })}`)
    }
    console.error('auth/confirm verifyOtp failed:', error.message)
  }
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
