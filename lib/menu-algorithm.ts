import { supabase } from './supabase'
import type { MealType } from './types'

interface GenerateOptions {
  vegDays: number
  cuisines: string[]
  meals: MealType[]
  excludeSlugs?: string[]
}

export async function generateMenuAlgorithmic(options: GenerateOptions): Promise<{ slug: string; is_veg: boolean; meal_type: MealType }[]> {
  const { vegDays, cuisines, meals, excludeSlugs = [] } = options

  const { data: allDishes } = await supabase
    .from('dishes')
    .select('slug, cuisine, is_veg, meal_types')
    .in('cuisine', cuisines)

  if (!allDishes || allDishes.length === 0) {
    throw new Error('No dishes found for selected cuisines')
  }

  const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  const menu: { slug: string; is_veg: boolean; meal_type: MealType }[] = []
  const usedSlugs = new Set(excludeSlugs)

  for (const meal of meals) {
    const eligible = allDishes.filter(d =>
      (d.meal_types as string[])?.includes(meal) && !usedSlugs.has(d.slug)
    )

    const vegPool = shuffle(eligible.filter(d => d.is_veg))
    const nvPool = shuffle(eligible.filter(d => !d.is_veg))

    let vegIdx = 0
    let nvIdx = 0

    for (let day = 0; day < 7; day++) {
      const isVegDay = day < vegDays
      let pick: typeof allDishes[0] | undefined

      if (isVegDay) {
        pick = vegPool[vegIdx % vegPool.length]
        vegIdx++
      } else if (nvPool.length > 0) {
        pick = nvPool[nvIdx % nvPool.length]
        nvIdx++
      } else {
        pick = vegPool[vegIdx % vegPool.length]
        vegIdx++
      }

      if (pick) {
        menu.push({ slug: pick.slug, is_veg: pick.is_veg, meal_type: meal })
        usedSlugs.add(pick.slug)
      }
    }
  }

  // Shuffle within each meal group to distribute veg/nv across the week
  const result: typeof menu = []
  for (const meal of meals) {
    const mealItems = shuffle(menu.filter(m => m.meal_type === meal))
    result.push(...mealItems)
  }

  return result
}
