import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://coachreflection.com'

type CookieToSet = { name: string; value: string; options?: CookieOptions }

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes - redirect to login if not authenticated
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!user) {
      const redirectUrl = new URL('/login', APP_URL)
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Auth routes - redirect to dashboard if already authenticated
  if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup') {
    if (user) {
      // If trying to sign up for a club while logged in, redirect to club creation
      const plan = request.nextUrl.searchParams.get('plan')
      if (plan === 'club') {
        const clubUrl = new URL('/dashboard/club/create', APP_URL)
        // Preserve tier and billing params
        const tier = request.nextUrl.searchParams.get('tier')
        const billing = request.nextUrl.searchParams.get('billing')
        if (tier) clubUrl.searchParams.set('tier', tier)
        if (billing) clubUrl.searchParams.set('billing', billing)
        return NextResponse.redirect(clubUrl)
      }
      return NextResponse.redirect(new URL('/dashboard', APP_URL))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/signup',
  ],
}
