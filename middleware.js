import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { EARLY_ACCESS_COOKIE, isWellFormedToken } from './app/lib/early-access-cookie.mjs'
import { isAllowlistedEmail } from './app/lib/admin-allowlist.mjs'

const ADMIN_HEADER_PATHS = ['/admin', '/api/admin', '/support-agent']

function needsAdminHeaders(pathname) {
  return ADMIN_HEADER_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
}

function applyAdminHeaders(response) {
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  return response
}

export async function middleware(request) {
  const { pathname } = request.nextUrl
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-vibin-pathname', pathname)

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

  // /api/admin/* is gated by requireAdmin() in each route (403, not a login redirect).
  // Only attach noindex/no-store headers here.
  if (pathname.startsWith('/api/admin')) {
    return applyAdminHeaders(NextResponse.next({ request: { headers: requestHeaders } }))
  }

  // /admin/login is the admin sign-in form; it must be reachable signed-out.
  // Rate limiting lives on POST /api/admin/login (Supabase Auth also rate-limits).
  if (pathname === '/admin/login') {
    return applyAdminHeaders(NextResponse.next({ request: { headers: requestHeaders } }))
  }

  // Routes that require authentication. /ambassador is public on purpose: the hub, /ambassador/apply and
  // /ambassador/login show their own signed-out / pending / approved states, and the data behind them is
  // protected by RLS and the server routes, not by this redirect.
  const protectedRoutes = ['/admin', '/profile', '/support-agent']
  const adminRoutes = ['/admin', '/support-agent']

  const isProtected = protectedRoutes.some(r => pathname === r || pathname.startsWith(r + '/'))
  if (!isProtected) return NextResponse.next({ request: { headers: requestHeaders } })

  let response = NextResponse.next({ request: { headers: requestHeaders } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: requestHeaders } })
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
    const loginUrl = new URL(pathname.startsWith('/admin') ? '/admin/login' : '/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    const res = NextResponse.redirect(loginUrl)
    return needsAdminHeaders(pathname) ? applyAdminHeaders(res) : res
  }

  // Check role for admin routes (profile flag + optional ADMIN_EMAILS allowlist)
  if (adminRoutes.some(r => pathname === r || pathname.startsWith(r + '/'))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      const res = NextResponse.redirect(new URL('/admin/login?error=unauthorized', request.url))
      return applyAdminHeaders(res)
    }
    if (!isAllowlistedEmail(user.email)) {
      const res = NextResponse.redirect(new URL('/admin/login?error=unauthorized', request.url))
      return applyAdminHeaders(res)
    }
  }

  return needsAdminHeaders(pathname) ? applyAdminHeaders(response) : response
}

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/api/admin/:path*',
    '/profile/:path*',
    '/drop/:path*',
    '/support-agent',
    '/support-agent/:path*',
  ]
}
