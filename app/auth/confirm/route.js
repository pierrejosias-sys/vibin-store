import { NextResponse } from 'next/server'
import { authServerClient, roleProfile } from '../server-client'
import { resolveConfirmRedirect } from '../confirm-email.mjs'

// Email-link verification used by the branded templates:
//   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=<type>
// Works across devices/browsers (no PKCE verifier needed).
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next')

  const supabase = await authServerClient()
  const location = await resolveConfirmRedirect({
    tokenHash,
    type,
    next,
    origin,
    verifyOtp: (args) => supabase.auth.verifyOtp(args),
    getUser: () => supabase.auth.getUser(),
    roleProfile: () => roleProfile(supabase),
  })
  return NextResponse.redirect(location)
}
