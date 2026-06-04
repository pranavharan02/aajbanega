import { createSupabaseBrowser } from './supabase-browser'

const INVENTORY_SEEDED_KEY = 'akb_inventory_seeded'

export const COMMON_STAPLES: Record<string, { qty: number; unit: string }> = {
  'Oil':               { qty: 1, unit: 'L' },
  'Ghee':              { qty: 0.5, unit: 'kg' },
  'Salt':              { qty: 1, unit: 'kg' },
  'Turmeric':          { qty: 100, unit: 'g' },
  'Red chilli powder': { qty: 100, unit: 'g' },
  'Coriander powder':  { qty: 100, unit: 'g' },
  'Cumin seeds':       { qty: 100, unit: 'g' },
  'Mustard seeds':     { qty: 100, unit: 'g' },
  'Garam masala':      { qty: 100, unit: 'g' },
  'Sugar':             { qty: 1, unit: 'kg' },
  'Water':             { qty: 1, unit: 'L' },
  'Curry leaves':      { qty: 1, unit: 'packets' },
  'Asafoetida':        { qty: 50, unit: 'g' },
  'Black pepper':      { qty: 50, unit: 'g' },
  'Coriander leaves':  { qty: 1, unit: 'packets' },
  'Green chilli':      { qty: 100, unit: 'g' },
  'Ginger':            { qty: 100, unit: 'g' },
  'Garlic':            { qty: 100, unit: 'g' },
  'Onion':             { qty: 1, unit: 'kg' },
  'Tomato':            { qty: 0.5, unit: 'kg' },
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

function setCookie(name: string, value: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
}

export function getHouseholdId(): string | null {
  return getCookie('akb_household')
}

export function setHouseholdId(id: string): void {
  setCookie('akb_household', id)
}

export async function ensureHousehold(): Promise<string> {
  const supabase = createSupabaseBrowser()
  const { data: { user } } = await supabase.auth.getUser()

  // Check cookie first
  const cookieId = getHouseholdId()

  if (user) {
    // Authenticated: find household linked to this user
    const { data: owned } = await supabase
      .from('households')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (owned) {
      setHouseholdId(owned.id)
      await seedCommonInventory(owned.id)
      return owned.id
    }

    const { data: member } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (member) {
      setHouseholdId(member.household_id)
      await seedCommonInventory(member.household_id)
      return member.household_id
    }

    // Create new household for this user
    const { data: created } = await supabase
      .from('households')
      .insert({
        user_id: user.id,
        default_servings: 2,
        default_cuisines: ['tamil', 'north'],
        default_veg_days: 4,
        preferred_cook_lang: 'hi',
        default_meals: ['dinner'],
      })
      .select('id')
      .single()

    if (created) {
      setHouseholdId(created.id)
      await seedCommonInventory(created.id)
      return created.id
    }
    console.error('Failed to create household')
    return ''
  }

  // Test mode / unauthenticated: use cookie
  if (cookieId) {
    const { data } = await supabase.from('households').select('id').eq('id', cookieId).single()
    if (data) {
      await seedCommonInventory(cookieId)
      return cookieId
    }
  }

  // Last resort: create anonymous household
  const { data: created } = await supabase
    .from('households')
    .insert({ default_servings: 2, default_cuisines: ['tamil', 'north'], default_veg_days: 4, preferred_cook_lang: 'hi', default_meals: ['dinner'] })
    .select('id')
    .single()

  if (created) {
    setHouseholdId(created.id)
    await seedCommonInventory(created.id)
    return created.id
  }
  console.error('Failed to create household')
  return ''
}

async function seedCommonInventory(householdId: string): Promise<void> {
  if (typeof window === 'undefined') return
  if (localStorage.getItem(INVENTORY_SEEDED_KEY)) return

  const supabase = createSupabaseBrowser()

  const { count } = await supabase
    .from('inventory')
    .select('id', { count: 'exact', head: true })
    .eq('household_id', householdId)

  if (count && count > 0) {
    localStorage.setItem(INVENTORY_SEEDED_KEY, 'true')
    return
  }

  const { data: ingredients } = await supabase
    .from('ingredients')
    .select('id, name_en')
    .in('name_en', Object.keys(COMMON_STAPLES))

  if (!ingredients?.length) return

  const items = ingredients.map(ing => {
    const defaults = COMMON_STAPLES[ing.name_en] || { qty: 1, unit: 'packets' }
    return {
      household_id: householdId,
      ingredient_id: ing.id,
      quantity: defaults.qty,
      unit: defaults.unit,
    }
  })

  await supabase.from('inventory').insert(items)
  localStorage.setItem(INVENTORY_SEEDED_KEY, 'true')
}
