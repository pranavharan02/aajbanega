import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  let next = searchParams.get('next') ?? '/dashboard'
  if (!next.startsWith('/') || next.startsWith('//')) {
    next = '/dashboard'
  }

  // Handle OAuth errors from Supabase/Google
  if (error) {
    const msg = encodeURIComponent(errorDescription || error)
    return NextResponse.redirect(`${origin}/login?error=${msg}`)
  }

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (!exchangeError) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    // Code exchange failed — expired code, PKCE mismatch, etc.
    const msg = encodeURIComponent(exchangeError.message)
    return NextResponse.redirect(`${origin}/login?error=${msg}`)
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
