import { supabase } from './supabase'
import type { MealType, DietMode } from './types'

interface GenerateOptions {
  vegDays: number
  cuisines: string[]
  meals: MealType[]
  excludeSlugs?: string[]
  dietMode?: DietMode
  dailyCalories?: number | null
  dailyProtein?: number | null
  dailyCarbs?: number | null
  dailyFat?: number | null
}

export async function generateMenuAlgorithmic(options: GenerateOptions): Promise<{ slug: string; is_veg: boolean; meal_type: MealType }[]> {
  const { vegDays, cuisines, meals, excludeSlugs = [], dietMode, dailyCalories, dailyProtein, dailyCarbs, dailyFat } = options

  const { data: allDishes } = await supabase
    .from('dishes')
    .select('slug, cuisine, is_veg, meal_types, calories, protein_g, carbs_g, fat_g')
    .in('cuisine', cuisines)

  if (!allDishes || allDishes.length === 0) {
    throw new Error('No dishes found for selected cuisines')
  }

  type DishRow = { slug: string; cuisine: string; is_veg: boolean; meal_types: string[]; calories: number | null; protein_g: number | null; carbs_g: number | null; fat_g: number | null }

  const mealsPerDay = meals.length || 1
  const calPerMeal = dailyCalories ? Math.round(dailyCalories / mealsPerDay) : null
  const proteinPerMeal = dailyProtein ? Math.round(dailyProtein / mealsPerDay) : null
  const carbsPerMeal = dailyCarbs ? Math.round(dailyCarbs / mealsPerDay) : null
  const fatPerMeal = dailyFat ? Math.round(dailyFat / mealsPerDay) : null

  const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  function scoreDish(d: DishRow): number {
    let score = 0
    const tolerance = 0.4

    if (calPerMeal && d.calories) {
      const ratio = d.calories / calPerMeal
      if (ratio >= 1 - tolerance && ratio <= 1 + tolerance) score += 2
      else score -= 1
    }
    if (proteinPerMeal && d.protein_g) {
      const ratio = Number(d.protein_g) / proteinPerMeal
      if (ratio >= 1 - tolerance && ratio <= 1 + tolerance) score += 3
      else if (dietMode === 'high-protein' || dietMode === 'cutting') score -= 2
    }
    if (carbsPerMeal && d.carbs_g) {
      const ratio = Number(d.carbs_g) / carbsPerMeal
      if (ratio >= 1 - tolerance && ratio <= 1 + tolerance) score += 1
      else if ((dietMode === 'keto' || dietMode === 'low-carb') && ratio > 1 + tolerance) score -= 3
    }
    if (fatPerMeal && d.fat_g) {
      const ratio = Number(d.fat_g) / fatPerMeal
      if (ratio >= 1 - tolerance && ratio <= 1 + tolerance) score += 1
    }
    return score
  }

  const hasMacroTargets = calPerMeal || proteinPerMeal || carbsPerMeal || fatPerMeal

  const menu: { slug: string; is_veg: boolean; meal_type: MealType }[] = []
  const usedSlugs = new Set(excludeSlugs)

  for (const meal of meals) {
    let eligible: DishRow[] = (allDishes as DishRow[]).filter(d =>
      d.meal_types?.includes(meal) && !usedSlugs.has(d.slug)
    )

    if (hasMacroTargets) {
      eligible = eligible
        .map(d => ({ ...d, _score: scoreDish(d) }))
        .sort((a, b) => (b as any)._score - (a as any)._score)
    } else {
      eligible = shuffle(eligible)
    }

    const vegPool = eligible.filter(d => d.is_veg)
    const nvPool = eligible.filter(d => !d.is_veg)

    for (let day = 0; day < 7; day++) {
      const isVegDay = day < vegDays
      let pick: DishRow | undefined

      if (isVegDay) {
        const unusedVeg = vegPool.filter(d => !usedSlugs.has(d.slug))
        pick = unusedVeg.length > 0 ? unusedVeg[0] : vegPool[0]
      } else if (nvPool.length > 0) {
        const unusedNv = nvPool.filter(d => !usedSlugs.has(d.slug))
        pick = unusedNv.length > 0 ? unusedNv[0] : nvPool[0]
      } else {
        const unusedVeg = vegPool.filter(d => !usedSlugs.has(d.slug))
        pick = unusedVeg.length > 0 ? unusedVeg[0] : vegPool[0]
      }

      if (pick) {
        menu.push({ slug: pick.slug, is_veg: pick.is_veg, meal_type: meal })
        usedSlugs.add(pick.slug)
      }
    }
  }

  const result: typeof menu = []
  for (const meal of meals) {
    const mealItems = shuffle(menu.filter(m => m.meal_type === meal))
    result.push(...mealItems)
  }

  return result
}
