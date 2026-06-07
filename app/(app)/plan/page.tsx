'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getMonday, formatDate, getWeekLabel } from '@/lib/dates'
import { ensureHousehold, getHouseholdId } from '@/lib/household'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import {
  CUISINE_LABELS, CUISINE_EMOJI, CUISINE_HEX,
  MEAL_LABELS, MEAL_EMOJI, MEAL_COLORS, MEAL_ORDER,
  DIET_MODES,
  type CuisineType, type MealType, type DietMode,
} from '@/lib/types'

const CUISINES: CuisineType[] = ['tamil', 'north', 'marathi', 'bihari', 'gujarati', 'bengali', 'kerala', 'andhra', 'goan', 'rajasthani', 'punjabi', 'kashmiri', 'cafe']

export default function PlanPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-[#8C8680] text-lg">Loading...</div>}>
      <PlanContent />
    </Suspense>
  )
}

function PlanContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const weekStart = searchParams.get('week') || formatDate(getMonday())

  const [dietMode, setDietMode] = useState<DietMode>('regular')
  const [vegDays, setVegDays] = useState(4)
  const [selectedCuisines, setSelectedCuisines] = useState<CuisineType[]>(['tamil', 'north'])
  const [selectedMeals, setSelectedMeals] = useState<MealType[]>(['dinner'])
  const [loading, setLoading] = useState(false)
  const [loadingDefaults, setLoadingDefaults] = useState(true)
  const [error, setError] = useState('')
  const [showMacros, setShowMacros] = useState(false)
  const [calories, setCalories] = useState<number | null>(null)
  const [protein, setProtein] = useState<number | null>(null)
  const [carbs, setCarbs] = useState<number | null>(null)
  const [fat, setFat] = useState<number | null>(null)
  const [usingDefaults, setUsingDefaults] = useState(true)

  useEffect(() => { loadDefaults() }, [])

  async function loadDefaults() {
    const householdId = await ensureHousehold()
    if (!householdId) { setLoadingDefaults(false); return }
    const supabase = createSupabaseBrowser()
    const { data } = await supabase.from('households').select('*').eq('id', householdId).single()
    if (data) {
      setSelectedCuisines(data.default_cuisines || ['tamil', 'north'])
      setSelectedMeals(data.default_meals || ['dinner'])
      setVegDays(data.default_veg_days ?? 4)
      setDietMode(data.diet_mode || 'regular')
      setCalories(data.daily_calories)
      setProtein(data.daily_protein_g)
      setCarbs(data.daily_carbs_g)
      setFat(data.daily_fat_g)
      if (data.daily_calories || data.daily_protein_g) setShowMacros(true)
    }
    setLoadingDefaults(false)
  }

  function selectDietMode(mode: DietMode) {
    setDietMode(mode)
    setUsingDefaults(false)
    const m = DIET_MODES[mode]
    if (m.macros) {
      setCalories(m.macros.cal)
      setProtein(m.macros.protein)
      setCarbs(m.macros.carbs)
      setFat(m.macros.fat)
      setShowMacros(true)
    } else {
      setCalories(null)
      setProtein(null)
      setCarbs(null)
      setFat(null)
    }
  }

  function toggleCuisine(c: CuisineType) {
    setSelectedCuisines(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
    setUsingDefaults(false)
  }

  function toggleMeal(m: MealType) {
    setSelectedMeals(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])
    setUsingDefaults(false)
  }

  async function handleGenerate() {
    if (selectedCuisines.length === 0) { setError('Select at least one cuisine'); return }
    if (selectedMeals.length === 0) { setError('Select at least one meal'); return }
    setError('')
    setLoading(true)
    try {
      const householdId = await ensureHousehold()
      const res = await fetch('/api/generate-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          household_id: householdId,
          week_start_date: weekStart,
          veg_days: vegDays,
          cuisines: selectedCuisines,
          meals: selectedMeals,
          diet_mode: dietMode,
          daily_calories: calories,
          daily_protein_g: protein,
          daily_carbs_g: carbs,
          daily_fat_g: fat,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      router.push(`/menu/${data.menu_id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Generation failed')
      setLoading(false)
    }
  }

  async function saveAsDefaults() {
    const householdId = getHouseholdId()
    if (!householdId) return
    const supabase = createSupabaseBrowser()
    await supabase.from('households').update({
      default_cuisines: selectedCuisines,
      default_meals: selectedMeals,
      default_veg_days: vegDays,
      diet_mode: dietMode,
      daily_calories: calories,
      daily_protein_g: protein,
      daily_carbs_g: carbs,
      daily_fat_g: fat,
    }).eq('id', householdId)
    setUsingDefaults(true)
  }

  if (loadingDefaults) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-8 h-8 border-3 border-[#2D2A26] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="py-6">
      <h1 className="text-[28px] font-bold text-[#2D2A26] mb-1">Plan your menu</h1>
      <p className="text-[#8C8680] text-[17px] mb-8">{getWeekLabel(weekStart)}</p>

      {/* Diet mode */}
      <div className="mb-10">
        <h2 className="text-[17px] font-semibold text-[#2D2A26] mb-4">Diet mode</h2>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
          {(Object.entries(DIET_MODES) as [DietMode, typeof DIET_MODES[DietMode]][]).map(([key, mode]) => (
            <button
              key={key}
              onClick={() => selectDietMode(key)}
              className="flex-shrink-0 px-4 py-3 rounded-2xl text-left transition-all border-2"
              style={{
                background: dietMode === key ? mode.bg : '#FFFDF9',
                borderColor: dietMode === key ? mode.color : 'transparent',
                minWidth: '130px',
              }}
            >
              <div className="text-xl mb-1">{mode.emoji}</div>
              <div className="font-semibold text-[14px] text-[#2D2A26]">{mode.label}</div>
              <div className="text-[11px] mt-0.5" style={{ color: dietMode === key ? mode.color : '#8C8680' }}>{mode.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Meals to plan — colored selectors */}
      <div className="mb-10">
        <h2 className="text-[17px] font-semibold text-[#2D2A26] mb-4">Meals to plan</h2>
        <div className="flex gap-3">
          {MEAL_ORDER.map(m => {
            const c = MEAL_COLORS[m]
            const selected = selectedMeals.includes(m)
            return (
              <button
                key={m}
                onClick={() => toggleMeal(m)}
                className="flex-1 p-4 text-center transition-all border-2 rounded-2xl"
                style={{
                  background: selected ? c.activeBg : '#FFFDF9',
                  borderColor: selected ? c.color : '#E5DFD6',
                  boxShadow: selected ? `0 4px 14px ${c.color}25` : 'none',
                }}
              >
                <div className="text-2xl mb-1">{MEAL_EMOJI[m]}</div>
                <div className="font-semibold text-[15px]" style={{ color: selected ? c.color : '#8C8680' }}>
                  {MEAL_LABELS[m]}
                </div>
                {selected && (
                  <div className="w-2 h-2 rounded-full mx-auto mt-2" style={{ background: c.color }} />
                )}
              </button>
            )
          })}
        </div>
        {selectedMeals.length === 0 && (
          <p className="text-[15px] text-[#C62828] mt-3">Select at least one meal</p>
        )}
      </div>

      {/* Veg/Non-Veg split */}
      <div className="mb-10">
        <h2 className="text-[17px] font-semibold text-[#2D2A26] mb-4">Veg / Non-Veg split</h2>
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[17px] text-[#2E7D32] font-semibold">{vegDays} veg days</span>
            <span className="text-[17px] text-[#C62828] font-semibold">{7 - vegDays} non-veg days</span>
          </div>
          <input
            type="range" min={0} max={7} value={vegDays}
            onChange={e => { setVegDays(Number(e.target.value)); setUsingDefaults(false) }}
            className="w-full"
          />
          <div className="flex justify-between text-[13px] text-[#8C8680] mt-2">
            <span>All non-veg</span>
            <span>All veg</span>
          </div>
        </div>
      </div>

      {/* Cuisines — colored grid */}
      <div className="mb-10">
        <h2 className="text-[17px] font-semibold text-[#2D2A26] mb-4">Cuisines to include</h2>
        <div className="grid grid-cols-3 gap-2.5">
          {CUISINES.map(c => {
            const selected = selectedCuisines.includes(c)
            const hex = CUISINE_HEX[c] || '#F5F0EA'
            return (
              <button
                key={c}
                onClick={() => toggleCuisine(c)}
                className="relative p-4 text-center transition-all border-2 rounded-2xl overflow-hidden"
                style={{
                  background: selected ? hex : '#FFFDF9',
                  borderColor: selected ? '#2D2A26' : '#E5DFD6',
                  boxShadow: selected ? '0 4px 12px rgba(45,42,38,0.12)' : 'none',
                }}
              >
                <div className="text-2xl mb-1">{CUISINE_EMOJI[c]}</div>
                <div className="font-semibold text-[13px] text-[#2D2A26]">{CUISINE_LABELS[c]}</div>
                {selected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#2D2A26] flex items-center justify-center">
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>
        {selectedCuisines.length === 0 && (
          <p className="text-[15px] text-[#C62828] mt-3">Select at least one cuisine</p>
        )}
      </div>

      {/* Macro goals */}
      <div className="mb-10">
        <button
          onClick={() => setShowMacros(!showMacros)}
          className="flex items-center justify-between w-full text-left"
        >
          <h2 className="text-[17px] font-semibold text-[#2D2A26]">Daily macro goals</h2>
          <svg
            width="20" height="20" viewBox="0 0 20 20" fill="none"
            className="transition-transform" style={{ transform: showMacros ? 'rotate(180deg)' : 'rotate(0)' }}
          >
            <path d="M5 7.5L10 12.5L15 7.5" stroke="#8C8680" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <p className="text-[13px] text-[#8C8680] mt-1 mb-4">
          {dietMode !== 'regular' ? `Auto-set for ${DIET_MODES[dietMode].label} mode` : 'Optional — filter dishes by nutrition'}
        </p>
        {showMacros && (
          <div className="card p-5 space-y-5">
            <MacroSlider label="Calories" unit="kcal" value={calories} onChange={v => { setCalories(v); setUsingDefaults(false) }} min={1000} max={4000} step={50} color="#E07B39" />
            <MacroSlider label="Protein" unit="g" value={protein} onChange={v => { setProtein(v); setUsingDefaults(false) }} min={30} max={300} step={5} color="#D84315" />
            <MacroSlider label="Carbs" unit="g" value={carbs} onChange={v => { setCarbs(v); setUsingDefaults(false) }} min={20} max={500} step={5} color="#C49A2B" />
            <MacroSlider label="Fat" unit="g" value={fat} onChange={v => { setFat(v); setUsingDefaults(false) }} min={10} max={200} step={5} color="#7B61A9" />
          </div>
        )}
      </div>

      {/* Save as defaults */}
      {!usingDefaults && (
        <button
          onClick={saveAsDefaults}
          className="w-full text-center text-[14px] font-medium text-[#8C8680] hover:text-[#2D2A26] transition-colors mb-4 py-2"
        >
          Save these as my defaults
        </button>
      )}

      {error && (
        <p className="text-[15px] text-[#C62828] mb-5 bg-red-50 p-4 rounded-2xl">{error}</p>
      )}

      <button
        onClick={handleGenerate}
        disabled={loading || selectedCuisines.length === 0 || selectedMeals.length === 0}
        className="w-full bg-[#2D2A26] text-white py-4 rounded-2xl font-semibold text-[17px] hover:bg-[#45403A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-3">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            Generating your menu...
          </span>
        ) : (
          'Generate Menu'
        )}
      </button>
    </div>
  )
}

function MacroSlider({ label, unit, value, onChange, min, max, step, color }: {
  label: string; unit: string; value: number | null; onChange: (v: number | null) => void
  min: number; max: number; step: number; color: string
}) {
  const active = value !== null
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => onChange(active ? null : Math.round((min + max) / 2))}
          className="flex items-center gap-2"
        >
          <div
            className="w-4 h-4 rounded border-2 flex items-center justify-center transition-colors"
            style={{ borderColor: active ? color : '#C5C0BA', background: active ? color : 'transparent' }}
          >
            {active && <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </div>
          <span className="text-[14px] font-medium text-[#2D2A26]">{label}</span>
        </button>
        {active && (
          <span className="text-[15px] font-semibold" style={{ color }}>{value} {unit}</span>
        )}
      </div>
      {active && (
        <input
          type="range" min={min} max={max} step={step} value={value ?? min}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: color }}
        />
      )}
    </div>
  )
}
