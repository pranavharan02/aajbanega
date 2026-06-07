export interface Dish {
  id: string
  slug: string
  name_en: string
  name_hi: string | null
  name_mr: string | null
  cuisine: CuisineType
  is_veg: boolean
  prep_time_min: number | null
  cook_time_min: number | null
  difficulty: 'easy' | 'medium' | 'hard'
  default_servings: number
  default_accompaniment: string | null
  calories: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  fiber_g: number | null
  illustration_url: string | null
  is_custom: boolean
  description_en: string | null
  description_hi: string | null
  description_mr: string | null
  tags: string[] | null
  youtube_url: string | null
  meal_types: MealType[]
}

export interface Ingredient {
  id: string
  name_en: string
  name_hi: string | null
  name_mr: string | null
  category: string | null
  default_unit: string | null
}

export interface DishIngredient {
  id: string
  dish_id: string
  ingredient_id: string
  quantity: number
  unit: string
  ingredient?: Ingredient
}

export interface RecipeStep {
  id: string
  dish_id: string
  step_number: number
  instruction_en: string
  instruction_hi: string | null
  instruction_mr: string | null
  duration_min: number | null
}

export interface Household {
  id: string
  created_at: string
  default_servings: number
  default_cuisines: string[]
  default_veg_days: number
  preferred_cook_lang: string
  default_meals: MealType[]
  diet_mode: DietMode | null
  daily_calories: number | null
  daily_protein_g: number | null
  daily_carbs_g: number | null
  daily_fat_g: number | null
}

export interface WeeklyMenu {
  id: string
  household_id: string
  week_start_date: string
  is_finalized: boolean
  finalized_at: string | null
  created_at: string
  generation_mode: string | null
}

export interface MenuItem {
  id: string
  menu_id: string
  dish_id: string
  day_of_week: number
  date: string
  is_veg: boolean | null
  was_swapped: boolean
  meal_type: MealType
  dish?: Dish
}

export interface InventoryItem {
  id: string
  household_id: string
  ingredient_id: string
  quantity: number
  unit: string
  updated_at: string
  ingredient?: Ingredient
}

export interface ShoppingListItem {
  id: string
  menu_id: string
  ingredient_id: string
  required_qty: number
  in_stock_qty: number
  to_buy_qty: number
  is_purchased: boolean
  unit: string
  ingredient?: Ingredient
}

export type MealType = 'breakfast' | 'lunch' | 'dinner'
export type CuisineType = 'tamil' | 'north' | 'marathi' | 'bihari' | 'gujarati' | 'bengali' | 'kerala' | 'andhra' | 'goan' | 'rajasthani' | 'punjabi' | 'kashmiri' | 'cafe' | 'custom'
export type Language = 'en' | 'hi' | 'mr'
export type DietMode = 'regular' | 'high-protein' | 'keto' | 'low-carb' | 'cutting' | 'bulking'

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
}

export const MEAL_EMOJI: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '🌞',
  dinner: '🌙',
}

export const MEAL_COLORS: Record<MealType, { color: string; bg: string; activeBg: string; border: string }> = {
  breakfast: { color: '#E07B39', bg: '#FDF2E9', activeBg: '#F8DCC4', border: '#E9A872' },
  lunch:     { color: '#C49A2B', bg: '#FBF5E6', activeBg: '#F5E6B8', border: '#D4B44A' },
  dinner:    { color: '#1E3A5F', bg: '#E8EDF4', activeBg: '#C4D1E3', border: '#6882A6' },
}

export const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner']

export const CUISINE_LABELS: Record<string, string> = {
  tamil: 'Tamil',
  north: 'North Indian',
  marathi: 'Marathi',
  bihari: 'Bihari',
  gujarati: 'Gujarati',
  bengali: 'Bengali',
  kerala: 'Kerala',
  andhra: 'Andhra',
  goan: 'Goan',
  rajasthani: 'Rajasthani',
  punjabi: 'Punjabi',
  kashmiri: 'Kashmiri',
  cafe: 'Café',
}

export const CUISINE_EMOJI: Record<string, string> = {
  tamil: '🥥', north: '🫓', marathi: '🌶', bihari: '🫘',
  gujarati: '🫙', bengali: '🐟', kerala: '🌴', andhra: '🔥',
  goan: '🦐', rajasthani: '🏜️', punjabi: '🧈', kashmiri: '🏔️',
  cafe: '🥑',
}

export const CUISINE_HEX: Record<string, string> = {
  tamil: '#E8D5C4', north: '#F5E6CC', marathi: '#D4E8D4', bihari: '#E8DCC8',
  gujarati: '#F5E8D0', bengali: '#E8D4D4', kerala: '#C8E8D4', andhra: '#E8D0C4',
  goan: '#D4D8E8', rajasthani: '#E8E0C8', punjabi: '#F0E4CC', kashmiri: '#D8D4E8',
  cafe: '#C8E6C9',
}

export const CUISINE_COLORS: Record<string, string> = {
  tamil: 'bg-[#E8D5C4]',
  north: 'bg-[#F5E6CC]',
  marathi: 'bg-[#D4E8D4]',
  bihari: 'bg-[#E8DCC8]',
  gujarati: 'bg-[#F5E8D0]',
  bengali: 'bg-[#E8D4D4]',
  kerala: 'bg-[#C8E8D4]',
  andhra: 'bg-[#E8D0C4]',
  goan: 'bg-[#D4D8E8]',
  rajasthani: 'bg-[#E8E0C8]',
  punjabi: 'bg-[#F0E4CC]',
  kashmiri: 'bg-[#D8D4E8]',
  cafe: 'bg-[#C8E6C9]',
}

export const DIET_MODES: Record<DietMode, { label: string; emoji: string; desc: string; color: string; bg: string; macros: { cal: number; protein: number; carbs: number; fat: number } | null }> = {
  'regular':      { label: 'Regular',      emoji: '🍽️', desc: 'Balanced meals',          color: '#8C8680', bg: '#F5F0EA', macros: null },
  'high-protein': { label: 'High Protein', emoji: '💪', desc: '30g+ protein per meal',   color: '#D84315', bg: '#FBE9E7', macros: { cal: 2200, protein: 180, carbs: 200, fat: 70 } },
  'keto':         { label: 'Keto',         emoji: '🥑', desc: 'High fat, very low carb', color: '#2E7D32', bg: '#E8F5E9', macros: { cal: 1800, protein: 120, carbs: 30, fat: 140 } },
  'low-carb':     { label: 'Low Carb',     emoji: '🥗', desc: 'Under 100g carbs/day',    color: '#1565C0', bg: '#E3F2FD', macros: { cal: 1800, protein: 140, carbs: 80, fat: 90 } },
  'cutting':      { label: 'Cutting',      emoji: '✂️', desc: 'Low cal, high protein',    color: '#C62828', bg: '#FFEBEE', macros: { cal: 1500, protein: 160, carbs: 120, fat: 45 } },
  'bulking':      { label: 'Bulking',      emoji: '🏋️', desc: 'High cal, high protein',   color: '#6A1B9A', bg: '#F3E5F5', macros: { cal: 3000, protein: 200, carbs: 350, fat: 100 } },
}

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export const ACCOMPANIMENT_LABELS: Record<string, string> = {
  'steamed-rice': 'Steamed Rice',
  'roti': 'Roti',
  'bhakri': 'Bhakri',
  'pav': 'Pav',
  'paratha': 'Paratha',
  'naan': 'Naan',
  'appam': 'Appam',
}
