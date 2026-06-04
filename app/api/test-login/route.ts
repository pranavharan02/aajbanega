import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Rate limit: 5 signups per IP per hour
const signupLimits = new Map<string, { count: number; resetAt: number }>()
const SIGNUP_LIMIT = 5
const SIGNUP_WINDOW = 60 * 60 * 1000

export async function POST(request: NextRequest) {
  // Rate limit by IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const now = Date.now()
  const entry = signupLimits.get(ip)
  if (entry && now < entry.resetAt && entry.count >= SIGNUP_LIMIT) {
    return NextResponse.json({ error: 'Too many signups. Try again later.' }, { status: 429 })
  }
  if (!entry || now >= entry.resetAt) {
    signupLimits.set(ip, { count: 1, resetAt: now + SIGNUP_WINDOW })
  } else {
    entry.count++
  }

  const { name, email } = await request.json()

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Name and email required' }, { status: 400 })
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  // Cap name length
  const cleanName = name.trim().slice(0, 100)
  const cleanEmail = email.trim().slice(0, 254).toLowerCase()

  // Check for existing household with this email
  const { data: existing } = await supabase
    .from('households')
    .select('id, invite_code')
    .eq('email', cleanEmail)
    .limit(1)
    .single()

  let household: { id: string; invite_code: string }

  if (existing) {
    household = existing
  } else {
    const { data: newHousehold, error } = await supabase
      .from('households')
      .insert({
        name: cleanName,
        email: cleanEmail,
        default_servings: 2,
        default_cuisines: ['tamil', 'north'],
        default_veg_days: 4,
        preferred_cook_lang: 'hi',
        default_meals: ['dinner'],
        onboarding_done: false,
      })
      .select('id, invite_code')
      .single()

    if (error || !newHousehold) {
      return NextResponse.json({ error: error?.message || 'Failed to create household' }, { status: 500 })
    }
    household = newHousehold
  }

  const response = NextResponse.json({ household_id: household.id, invite_code: household.invite_code })

  response.cookies.set('akb_household', household.id, {
    path: '/',
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  })

  response.cookies.set('akb_test_mode', 'true', {
    path: '/',
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  })

  return response
}
