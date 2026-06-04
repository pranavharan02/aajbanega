import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Check for test-mode cookie (set by /api/test-login)
  const isTestMode = request.cookies.get('akb_test_mode')?.value === 'true'
  const hasHousehold = !!request.cookies.get('akb_household')?.value

  const publicPaths = ['/login', '/cook/', '/auth/callback', '/api/', '/join/', '/onboarding']
  const isPublic = publicPaths.some(p => request.nextUrl.pathname.startsWith(p))

  // Allow through if: authenticated, test-mode, public path, or landing page
  if (!user && !isTestMode && !isPublic && request.nextUrl.pathname !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users without a household to onboarding
  if (user && !isPublic && request.nextUrl.pathname !== '/' && request.nextUrl.pathname !== '/onboarding') {
    try {
      const { data: household } = await supabase
        .from('households')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!household) {
        const { data: membership } = await supabase
          .from('household_members')
          .select('household_id')
          .eq('user_id', user.id)
          .limit(1)
          .single()

        if (!membership) {
          const url = request.nextUrl.clone()
          url.pathname = '/onboarding'
          return NextResponse.redirect(url)
        }
      }
    } catch {
      // If household check fails, let the request through
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|dish-images|icons|sw.js|manifest.json|offline.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
