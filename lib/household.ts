import { createSupabaseBrowser } from './supabase-browser'

const HOUSEHOLD_KEY = 'akb_household_id'
const INVENTORY_SEEDED_KEY = 'akb_inventory_seeded'

export const COMMON_STAPLES = [
  'Oil', 'Ghee', 'Salt', 'Turmeric', 'Red chilli powder', 'Coriander powder',
  'Cumin seeds', 'Mustard seeds', 'Garam masala', 'Sugar', 'Water',
  'Curry leaves', 'Asafoetida', 'Black pepper', 'Coriander leaves',
  'Green chilli', 'Ginger', 'Garlic', 'Onion', 'Tomato',
]

export function getHouseholdId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(HOUSEHOLD_KEY)
}

export function setHouseholdId(id: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(HOUSEHOLD_KEY, id)
}

export async function ensureHousehold(): Promise<string> {
  const supabase = createSupabaseBrowser()
  const { data: { user } } = await supabase.auth.getUser()

  let id = getHouseholdId()

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

    // Check membership
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
    throw new Error('Failed to create household')
  }

  // Unauthenticated fallback (for backward compatibility)
  if (id) {
    const { data } = await supabase.from('households').select('id').eq('id', id).single()
    if (data) {
      await seedCommonInventory(id)
      return id
    }
  }

  const { data: existing } = await supabase.from('households').select('id').is('user_id', null).limit(1).single()
  if (existing) {
    setHouseholdId(existing.id)
    await seedCommonInventory(existing.id)
    return existing.id
  }

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
  throw new Error('Failed to create household')
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
    .in('name_en', COMMON_STAPLES)

  if (!ingredients?.length) return

  const items = ingredients.map(ing => ({
    household_id: householdId,
    ingredient_id: ing.id,
    quantity: 1,
    unit: 'packets',
  }))

  await supabase.from('inventory').insert(items)
  localStorage.setItem(INVENTORY_SEEDED_KEY, 'true')
}
