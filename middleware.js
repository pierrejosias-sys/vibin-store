import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  const { pathname } = request.nextUrl

  // Routes that require authentication
  const protectedRoutes = ['/admin', '/ambassador', '/profile']
  const adminRoutes = ['/admin']
  const ambassadorRoutes = ['/ambassador']

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

  // Check role for admin/ambassador routes
  if (adminRoutes.some(r => pathname.startsWith(r)) || ambassadorRoutes.some(r => pathname.startsWith(r))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, is_ambassador')
      .eq('id', user.id)
      .single()

    if (adminRoutes.some(r => pathname.startsWith(r)) && !profile?.is_admin) {
      return NextResponse.redirect(new URL('/login?error=unauthorized', request.url))
    }

    if (ambassadorRoutes.some(r => pathname.startsWith(r)) && !profile?.is_ambassador && !profile?.is_admin) {
      return NextResponse.redirect(new URL('/login?error=unauthorized', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/ambassador/:path*',
    '/profile/:path*',
  ]
}
