import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateMenuAlgorithmic } from '@/lib/menu-algorithm'
import type { MealType } from '@/lib/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 10
const RATE_WINDOW = 60 * 60 * 1000

function checkRateLimit(householdId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(householdId)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(householdId, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { household_id, week_start_date, veg_days, cuisines, meals = ['dinner'] as MealType[] } = body

    if (!household_id || !week_start_date || !cuisines?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!checkRateLimit(household_id)) {
      return NextResponse.json({ error: 'Too many menu generations. Please wait an hour before trying again.' }, { status: 429 })
    }

    const { data: recentMenus } = await supabase
      .from('weekly_menus')
      .select('id')
      .eq('household_id', household_id)
      .order('week_start_date', { ascending: false })
      .limit(2)

    let excludeSlugs: string[] = []
    if (recentMenus?.length) {
      const menuIds = recentMenus.map(m => m.id)
      const { data: recentItems } = await supabase
        .from('menu_items')
        .select('dish:dishes(slug)')
        .in('menu_id', menuIds)
      excludeSlugs = recentItems?.map((i: any) => i.dish?.slug).filter(Boolean) || []
    }

    let menuPicks: { slug: string; is_veg: boolean; meal_type: MealType }[]
    let generationMode = 'algorithmic'

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const { data: allDishes } = await supabase
          .from('dishes')
          .select('slug, name_en, cuisine, is_veg, meal_types')
          .in('cuisine', cuisines)

        const Anthropic = (await import('@anthropic-ai/sdk')).default
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

        const dishList = allDishes?.map(d =>
          `${d.slug} | ${d.name_en} | ${d.cuisine} | ${d.is_veg ? 'veg' : 'non-veg'} | meals: ${(d.meal_types as string[])?.join(',')}`
        ).join('\n')

        const mealsDesc = (meals as MealType[]).map(m =>
          m === 'breakfast' ? 'breakfast (prefer lighter/quicker dishes)' :
          m === 'lunch' ? 'lunch (prefer rice-based meals)' :
          'dinner (full range)'
        ).join(', ')

        const totalItems = meals.length * 7

        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          temperature: 0.7,
          system: `You are a weekly meal planner for an Indian household.
You must select dishes ONLY from the provided dish database.
Never invent dishes that aren't in the list.
Only assign a dish to a meal slot if its meal_types include that meal.`,
          messages: [{
            role: 'user',
            content: `Generate a 7-day menu (Monday to Sunday) for these meals: ${mealsDesc}.
Constraints:
- Vegetarian days: ${veg_days} (assign to specific days, applies to all meals)
- Non-vegetarian days: ${7 - veg_days}
- Cuisines: ${cuisines.join(', ')}
- Distribute cuisines roughly evenly
- Avoid recently served: ${excludeSlugs.join(', ') || 'none'}
- Ensure variety: avoid same primary ingredient on consecutive days
- Total items needed: ${totalItems} (${meals.length} meal(s) × 7 days)

Available dishes:
${dishList}

Respond in JSON only:
{
  "menu": [
    { "day": "monday", "meal_type": "breakfast", "dish_slug": "...", "is_veg": true },
    { "day": "monday", "meal_type": "dinner", "dish_slug": "...", "is_veg": false }
  ]
}`
          }],
        })

        const text = message.content?.[0]?.type === 'text' ? message.content[0].text : ''
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          if (parsed.menu?.length === totalItems) {
            menuPicks = parsed.menu.map((m: any) => ({ slug: m.dish_slug, is_veg: m.is_veg, meal_type: m.meal_type }))
            generationMode = 'ai'
          } else {
            throw new Error('Invalid AI response length')
          }
        } else {
          throw new Error('No JSON in AI response')
        }
      } catch {
        menuPicks = await generateMenuAlgorithmic({ vegDays: veg_days, cuisines, meals, excludeSlugs })
      }
    } else {
      menuPicks = await generateMenuAlgorithmic({ vegDays: veg_days, cuisines, meals, excludeSlugs })
    }

    const { data: menu, error: menuErr } = await supabase
      .from('weekly_menus')
      .insert({
        household_id,
        week_start_date,
        generation_mode: generationMode,
      })
      .select('id')
      .single()

    if (menuErr || !menu) {
      return NextResponse.json({ error: 'Failed to create menu' }, { status: 500 })
    }

    const slugs = menuPicks.map(p => p.slug)
    const { data: dishes } = await supabase
      .from('dishes')
      .select('id, slug, is_veg')
      .in('slug', slugs)

    const dishMap = new Map(dishes?.map(d => [d.slug, d]) || [])

    // Group picks by meal_type, then assign days 0-6 within each group
    const picksByMeal = new Map<string, typeof menuPicks>()
    for (const pick of menuPicks) {
      const list = picksByMeal.get(pick.meal_type) || []
      list.push(pick)
      picksByMeal.set(pick.meal_type, list)
    }

    const menuItems: any[] = []
    for (const [mealType, mealPicks] of picksByMeal) {
      mealPicks.forEach((pick, i) => {
        const d = new Date(week_start_date + 'T12:00:00Z')
        d.setUTCDate(d.getUTCDate() + i)
        const dateStr = d.toISOString().split('T')[0]
        const dish = dishMap.get(pick.slug)
        menuItems.push({
          menu_id: menu.id,
          dish_id: dish?.id,
          day_of_week: i,
          date: dateStr,
          is_veg: dish?.is_veg ?? pick.is_veg,
          meal_type: mealType,
        })
      })
    }

    await supabase.from('menu_items').insert(menuItems)

    return NextResponse.json({ menu_id: menu.id, generation_mode: generationMode })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
