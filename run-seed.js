const path = require('path')
const envFile = require('fs').readFileSync(path.join(__dirname, '.env.local'), 'utf8')
for (const line of envFile.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) process.env[match[1].trim()] = match[2].trim()
}
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function run() {
  const raw = fs.readFileSync(path.join(__dirname, 'seed-dishes.json'), 'utf8').replace(/^﻿/, '')
  const dishes = JSON.parse(raw)
  console.log(`Processing ${dishes.length} dishes...`)

  // 1. Collect and insert unique ingredients
  const ingMap = new Map()
  for (const d of dishes) {
    for (const ing of d.ingredients || []) {
      if (!ingMap.has(ing.name_en)) ingMap.set(ing.name_en, ing)
    }
  }

  const ingRows = Array.from(ingMap.values()).map(ing => ({
    name_en: ing.name_en,
    name_hi: ing.name_hi || null,
    name_mr: ing.name_mr || null,
    category: ing.category || 'pantry',
    default_unit: ing.unit || null,
  }))

  const { error: ingErr } = await supabase.from('ingredients').upsert(ingRows, { onConflict: 'name_en', ignoreDuplicates: true })
  if (ingErr) console.error('Ingredients error:', ingErr.message)
  else console.log(`✓ ${ingRows.length} ingredients upserted`)

  // Fetch all ingredient IDs
  const { data: allIngs } = await supabase.from('ingredients').select('id, name_en')
  const ingIdMap = new Map(allIngs.map(i => [i.name_en, i.id]))

  // 2. Insert dishes
  let dishSuccess = 0
  for (const d of dishes) {
    const row = {
      slug: d.slug,
      name_en: d.name_en,
      name_hi: d.name_hi || null,
      name_mr: d.name_mr || null,
      cuisine: d.cuisine,
      is_veg: d.is_veg,
      meal_types: d.meal_types || ['lunch', 'dinner'],
      prep_time_min: d.prep_time_min || null,
      cook_time_min: d.cook_time_min || null,
      difficulty: d.difficulty || 'easy',
      default_servings: d.default_servings || 2,
      default_accompaniment: d.default_accompaniment || null,
      calories: d.calories || null,
      protein_g: d.protein_g || null,
      carbs_g: d.carbs_g || null,
      fat_g: d.fat_g || null,
      fiber_g: d.fiber_g || null,
      description_en: d.description_en || null,
      description_hi: d.description_hi || null,
      description_mr: d.description_mr || null,
      youtube_url: d.youtube_search ? `https://www.youtube.com/results?search_query=${encodeURIComponent(d.youtube_search + ' recipe')}` : (d.youtube_url || null),
      is_custom: false,
    }
    const { error } = await supabase.from('dishes').upsert(row, { onConflict: 'slug', ignoreDuplicates: true })
    if (error) console.error(`  Dish ${d.slug}: ${error.message}`)
    else dishSuccess++
  }
  console.log(`✓ ${dishSuccess}/${dishes.length} dishes inserted`)

  // Fetch all dish IDs
  const { data: allDishes } = await supabase.from('dishes').select('id, slug')
  const dishIdMap = new Map(allDishes.map(d => [d.slug, d.id]))

  // 3. Insert dish_ingredients
  let diCount = 0
  for (const d of dishes) {
    const dishId = dishIdMap.get(d.slug)
    if (!dishId) continue
    const rows = (d.ingredients || []).map(ing => {
      const ingId = ingIdMap.get(ing.name_en)
      if (!ingId) return null
      return {
        dish_id: dishId,
        ingredient_id: ingId,
        quantity: ing.quantity || 1,
        unit: ing.unit || 'pieces',
      }
    }).filter(Boolean)
    if (rows.length) {
      const { error } = await supabase.from('dish_ingredients').insert(rows)
      if (error) console.error(`  DI ${d.slug}: ${error.message}`)
      else diCount += rows.length
    }
  }
  console.log(`✓ ${diCount} dish_ingredients inserted`)

  // 4. Insert recipe_steps
  let stepCount = 0
  for (const d of dishes) {
    const dishId = dishIdMap.get(d.slug)
    if (!dishId) continue
    const rows = (d.steps || []).map((step, i) => ({
      dish_id: dishId,
      step_number: i + 1,
      instruction_en: step.instruction_en,
      instruction_hi: step.instruction_hi || null,
      instruction_mr: step.instruction_mr || null,
      duration_min: step.duration_min || null,
    }))
    if (rows.length) {
      const { error } = await supabase.from('recipe_steps').insert(rows)
      if (error) console.error(`  Steps ${d.slug}: ${error.message}`)
      else stepCount += rows.length
    }
  }
  console.log(`✓ ${stepCount} recipe_steps inserted`)

  // Final counts
  const counts = await Promise.all([
    supabase.from('dishes').select('id', { count: 'exact', head: true }),
    supabase.from('ingredients').select('id', { count: 'exact', head: true }),
    supabase.from('recipe_steps').select('id', { count: 'exact', head: true }),
    supabase.from('dish_ingredients').select('id', { count: 'exact', head: true }),
  ])
  console.log(`\nFinal counts:`)
  console.log(`  Dishes: ${counts[0].count}`)
  console.log(`  Ingredients: ${counts[1].count}`)
  console.log(`  Recipe steps: ${counts[2].count}`)
  console.log(`  Dish ingredients: ${counts[3].count}`)
}

run().catch(console.error)
