import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { EARLY_ACCESS_COOKIE, isWellFormedToken } from './app/lib/early-access-cookie.mjs'

export async function middleware(request) {
  const { pathname } = request.nextUrl

  // Waitlist early-access link: /drop/01?access=<token> -> cookie, then clean URL.
  // The token itself is validated server-side (drop page + /api/checkout).
  if (pathname.startsWith('/drop/')) {
    const accessParam = request.nextUrl.searchParams.get('access')
    if (!accessParam) return NextResponse.next()
    const clean = request.nextUrl.clone()
    clean.searchParams.delete('access')
    const res = NextResponse.redirect(clean)
    if (isWellFormedToken(accessParam)) {
      res.cookies.set(EARLY_ACCESS_COOKIE, accessParam, {
        httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 60,
      })
    }
    return res
  }

  // Routes that require authentication. /ambassador is public on purpose: the hub, /ambassador/apply and
  // /ambassador/login show their own signed-out / pending / approved states, and the data behind them is
  // protected by RLS and the server routes, not by this redirect.
  const protectedRoutes = ['/admin', '/profile']
  const adminRoutes = ['/admin']

  const isProtected = protectedRoutes.some(r => pathname.startsWith(r))
  if (!isProtected) return NextResponse.next()

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Not logged in — redirect to login
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check role for admin routes
  if (adminRoutes.some(r => pathname.startsWith(r))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.redirect(new URL('/login?error=unauthorized', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/profile/:path*',
    '/drop/:path*',
  ]
}
