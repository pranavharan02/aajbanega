import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  const { name, email } = await request.json()

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Name and email required' }, { status: 400 })
  }

  const { data: household, error } = await supabase
    .from('households')
    .insert({
      name: name.trim(),
      email: email.trim(),
      default_servings: 2,
      default_cuisines: ['tamil', 'north'],
      default_veg_days: 4,
      preferred_cook_lang: 'hi',
      default_meals: ['dinner'],
      onboarding_done: false,
    })
    .select('id, invite_code')
    .single()

  if (error || !household) {
    return NextResponse.json({ error: error?.message || 'Failed to create household' }, { status: 500 })
  }

  const response = NextResponse.json({ household_id: household.id, invite_code: household.invite_code })

  // Set cookie so middleware can identify test-mode users
  response.cookies.set('akb_household', household.id, {
    path: '/',
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
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
