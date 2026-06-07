'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ensureHousehold, getHouseholdId } from '@/lib/household'
import {
  CUISINE_LABELS, CUISINE_EMOJI, CUISINE_HEX,
  MEAL_LABELS, MEAL_EMOJI, MEAL_COLORS, MEAL_ORDER,
  DIET_MODES,
  type CuisineType, type MealType, type DietMode,
} from '@/lib/types'
import Link from 'next/link'

const CUISINES: CuisineType[] = ['tamil', 'north', 'marathi', 'bihari', 'gujarati', 'bengali', 'kerala', 'andhra', 'goan', 'rajasthani', 'punjabi', 'kashmiri', 'cafe']

export default function SettingsPage() {
  const [servings, setServings] = useState(2)
  const [vegDays, setVegDays] = useState(4)
  const [cuisines, setCuisines] = useState<string[]>(['tamil', 'north'])
  const [meals, setMeals] = useState<MealType[]>(['dinner'])
  const [cookLang, setCookLang] = useState('hi')
  const [dietMode, setDietMode] = useState<DietMode>('regular')
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState<false | 'ok' | 'error'>(false)

  useEffect(() => { loadSettings() }, [])

  async function loadSettings() {
    setLoading(true)
    const householdId = await ensureHousehold()
    const { data } = await supabase.from('households').select('*').eq('id', householdId).single()
    if (data) {
      setServings(data.default_servings)
      setVegDays(data.default_veg_days)
      setCuisines(data.default_cuisines || ['tamil', 'north'])
      setCookLang(data.preferred_cook_lang || 'hi')
      setMeals(data.default_meals || ['dinner'])
      setDietMode(data.diet_mode || 'regular')
    }
    setLoading(false)
  }

  async function saveSettings() {
    const householdId = getHouseholdId()
    if (!householdId) return
    const { error } = await supabase.from('households').update({
      default_servings: servings,
      default_veg_days: vegDays,
      default_cuisines: cuisines,
      default_meals: meals,
      preferred_cook_lang: cookLang,
      diet_mode: dietMode,
    }).eq('id', householdId)
    if (error) {
      setSaved('error')
    } else {
      setSaved('ok')
    }
    setTimeout(() => setSaved(false), 2000)
  }

  function toggleCuisine(c: string) {
    setCuisines(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  }

  function toggleMeal(m: MealType) {
    setMeals(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])
  }

  if (loading) return <div className="py-20 text-center text-[#8C8680]">Loading...</div>

  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold text-[#2D2A26] mb-1">Settings</h1>
      <p className="text-[14px] text-[#8C8680] mb-8">These are your defaults — they pre-fill when you create a new menu.</p>

      <div className="space-y-8">
        {/* Household section */}
        <section>
          <h2 className="text-[13px] font-bold text-[#8C8680] uppercase tracking-wider mb-4">Household</h2>
          <div className="card p-5 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-medium text-[#2D2A26]">Default servings</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setServings(Math.max(1, servings - 1))} className="w-9 h-9 rounded-xl bg-[#F5F0EA] hover:bg-[#E5DFD6] flex items-center justify-center font-medium text-[#2D2A26] transition-colors">-</button>
                <span className="text-lg font-semibold w-6 text-center text-[#2D2A26]">{servings}</span>
                <button onClick={() => setServings(Math.min(10, servings + 1))} className="w-9 h-9 rounded-xl bg-[#F5F0EA] hover:bg-[#E5DFD6] flex items-center justify-center font-medium text-[#2D2A26] transition-colors">+</button>
              </div>
            </div>

            <div className="border-t border-[#E5DFD6]" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[15px] font-medium text-[#2D2A26]">Cook's language</span>
              </div>
              <div className="flex gap-2">
                {[{ key: 'hi', label: 'Hindi' }, { key: 'mr', label: 'Marathi' }].map(l => (
                  <button
                    key={l.key}
                    onClick={() => setCookLang(l.key)}
                    className="px-4 py-2.5 rounded-xl text-[14px] font-medium transition-all"
                    style={{
                      background: cookLang === l.key ? '#2D2A26' : '#F5F0EA',
                      color: cookLang === l.key ? 'white' : '#2D2A26',
                    }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Menu defaults section */}
        <section>
          <h2 className="text-[13px] font-bold text-[#8C8680] uppercase tracking-wider mb-4">Menu defaults</h2>
          <div className="card p-5 space-y-5">
            {/* Diet mode */}
            <div>
              <span className="text-[15px] font-medium text-[#2D2A26] block mb-3">Diet mode</span>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(DIET_MODES) as [DietMode, typeof DIET_MODES[DietMode]][]).map(([key, mode]) => (
                  <button
                    key={key}
                    onClick={() => setDietMode(key)}
                    className="px-3 py-2 rounded-xl text-[13px] font-medium transition-all"
                    style={{
                      background: dietMode === key ? mode.bg : '#F5F0EA',
                      color: dietMode === key ? mode.color : '#8C8680',
                      border: dietMode === key ? `1.5px solid ${mode.color}` : '1.5px solid transparent',
                    }}
                  >
                    {mode.emoji} {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-[#E5DFD6]" />

            {/* Meals */}
            <div>
              <span className="text-[15px] font-medium text-[#2D2A26] block mb-3">Default meals</span>
              <div className="flex gap-2">
                {MEAL_ORDER.map(m => {
                  const mc = MEAL_COLORS[m]
                  const sel = meals.includes(m)
                  return (
                    <button
                      key={m}
                      onClick={() => toggleMeal(m)}
                      className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-center transition-all"
                      style={{
                        background: sel ? mc.activeBg : '#F5F0EA',
                        color: sel ? mc.color : '#8C8680',
                        border: sel ? `1.5px solid ${mc.color}` : '1.5px solid transparent',
                      }}
                    >
                      {MEAL_EMOJI[m]} {MEAL_LABELS[m]}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="border-t border-[#E5DFD6]" />

            {/* Veg days */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[15px] font-medium text-[#2D2A26]">Veg days</span>
                <span className="text-[14px] text-[#8C8680]">{vegDays} veg / {7 - vegDays} non-veg</span>
              </div>
              <input type="range" min={0} max={7} value={vegDays} onChange={e => setVegDays(Number(e.target.value))} className="w-full" />
            </div>

            <div className="border-t border-[#E5DFD6]" />

            {/* Cuisines */}
            <div>
              <span className="text-[15px] font-medium text-[#2D2A26] block mb-3">Default cuisines</span>
              <div className="flex flex-wrap gap-2">
                {CUISINES.map(c => {
                  const sel = cuisines.includes(c)
                  return (
                    <button
                      key={c}
                      onClick={() => toggleCuisine(c)}
                      className="px-3 py-2 rounded-xl text-[13px] font-medium transition-all"
                      style={{
                        background: sel ? CUISINE_HEX[c] : '#F5F0EA',
                        color: '#2D2A26',
                        border: sel ? '1.5px solid #2D2A26' : '1.5px solid transparent',
                      }}
                    >
                      {CUISINE_EMOJI[c]} {CUISINE_LABELS[c]}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        <button
          onClick={saveSettings}
          className={`w-full py-3.5 rounded-xl font-medium text-base transition-colors ${saved === 'error' ? 'bg-[#C62828] text-white' : 'bg-[#2D2A26] text-white hover:bg-[#333]'}`}
        >
          {saved === 'ok' ? 'Saved!' : saved === 'error' ? 'Failed to save' : 'Save Settings'}
        </button>

        <div className="border-t border-[#E5DFD6] pt-6">
          <Link href="/add-dish" className="text-sm text-[#8C8680] hover:text-[#2D2A26]">
            + Add a custom dish to the database
          </Link>
        </div>
      </div>
    </div>
  )
}
