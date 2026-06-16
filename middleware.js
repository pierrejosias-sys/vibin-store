import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request) {
  const { pathname } = request.nextUrl

  // Create a mutable response so SSR cookie refresh works
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — MUST call getUser() (not getSession()) per Supabase docs
  const { data: { user } } = await supabase.auth.getUser()

  // ── /admin routes ────────────────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    // Always allow the login page
    if (pathname === '/admin/login') return supabaseResponse

    // Not logged in → redirect to admin login
    if (!user) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/admin/login'
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Logged in but not admin → check profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      // Authenticated but not admin → kick to home
      return NextResponse.redirect(new URL('/', request.url))
    }

    return supabaseResponse
  }

  // ── /profile routes ──────────────────────────────────────────────────────────
  if (pathname.startsWith('/profile')) {
    if (!user) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return supabaseResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/profile/:path*',
  ],
}
