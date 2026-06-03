'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ensureHousehold, getHouseholdId } from '@/lib/household'
import { getMonday, formatDate, formatDateDisplay, getWeekLabel, shiftWeekStart } from '@/lib/dates'
import type { WeeklyMenu, MenuItem } from '@/lib/types'
import { CUISINE_LABELS, DAY_NAMES, MEAL_EMOJI } from '@/lib/types'
import { useAuth } from '@/components/AuthProvider'

const CUISINE_BG: Record<string, string> = {
  tamil: '#E8D5C4', north: '#F5E6CC', marathi: '#D4E8D4', bihari: '#E8DCC8',
  gujarati: '#F5E8D0', bengali: '#E8D4D4', kerala: '#C8E8D4', andhra: '#E8D0C4',
  goan: '#D4D8E8', rajasthani: '#E8E0C8', punjabi: '#F0E4CC', kashmiri: '#D8D4E8',
}

function Landing() {
  return (
    <div className="py-10">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-[44px] font-extrabold text-[#2D2A26] leading-[1.1] tracking-tight mb-4">
          आज क्या बनेगा?
        </h1>
        <p className="text-[20px] text-[#8C8680] leading-relaxed max-w-md mx-auto mb-10">
          Plan meals for the week.<br />Share with your cook. In their language.
        </p>
        <Link
          href="/login"
          className="inline-block bg-[#2D2A26] text-white px-10 py-4 rounded-2xl font-semibold text-[18px] hover:bg-[#45403A] transition-colors shadow-lg"
        >
          Start Planning — Free
        </Link>
      </div>

      {/* Value props */}
      <div className="space-y-4 mb-16">
        {[
          {
            emoji: '🤖',
            title: 'AI picks your menu',
            desc: 'Cuisine-aware, variety-optimized weekly menus across 12 Indian cuisines. Breakfast, lunch, dinner.',
          },
          {
            emoji: '🗣️',
            title: 'Recipes in Hindi & Marathi',
            desc: 'One-tap share with your cook. They see today\'s recipe in their language with large, clear text.',
          },
          {
            emoji: '🛒',
            title: 'Auto shopping list',
            desc: 'Knows what you have in your pantry, lists exactly what to buy — organized by day.',
          },
        ].map((prop) => (
          <div key={prop.title} className="card p-6 flex gap-5 items-start">
            <span className="text-3xl flex-shrink-0 mt-0.5">{prop.emoji}</span>
            <div>
              <h3 className="font-bold text-[18px] text-[#2D2A26] mb-1">{prop.title}</h3>
              <p className="text-[15px] text-[#8C8680] leading-relaxed">{prop.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="mb-16">
        <h2 className="text-[22px] font-bold text-[#2D2A26] mb-6 text-center">How it works</h2>
        <div className="space-y-3">
          {[
            { step: '1', text: 'Pick your cuisines and set veg/non-veg days' },
            { step: '2', text: 'AI generates a balanced weekly menu' },
            { step: '3', text: 'Swap dishes, finalize, and share with your cook' },
            { step: '4', text: 'Your cook opens the link — recipes in Hindi or Marathi' },
          ].map((s) => (
            <div key={s.step} className="flex gap-4 items-center">
              <div className="w-10 h-10 rounded-xl bg-[#2D2A26] text-white flex items-center justify-center font-bold text-[16px] flex-shrink-0">
                {s.step}
              </div>
              <p className="text-[16px] text-[#2D2A26]">{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cuisines */}
      <div className="mb-16">
        <h2 className="text-[22px] font-bold text-[#2D2A26] mb-6 text-center">12 regional cuisines</h2>
        <div className="flex flex-wrap gap-2 justify-center">
          {['Tamil', 'North Indian', 'Marathi', 'Bihari', 'Goan', 'Rajasthani', 'Gujarati', 'Bengali', 'Kerala', 'Andhra', 'Punjabi', 'Kashmiri'].map((c) => (
            <span key={c} className="px-4 py-2 rounded-full bg-white text-[14px] font-medium text-[#2D2A26] shadow-sm">
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center">
        <Link
          href="/login"
          className="inline-block bg-[#2D2A26] text-white px-10 py-4 rounded-2xl font-semibold text-[18px] hover:bg-[#45403A] transition-colors shadow-lg"
        >
          Start Planning — Free
        </Link>
        <p className="text-[13px] text-[#C5C0BA] mt-4">No credit card. No downloads. Works on any phone.</p>
      </div>

      {/* Footer */}
      <div className="mt-16 pt-6 border-t border-[#E5DFD6] flex justify-center gap-6 text-[13px] text-[#C5C0BA]">
        <Link href="/privacy" className="hover:text-[#2D2A26]">Privacy</Link>
        <Link href="/terms" className="hover:text-[#2D2A26]">Terms</Link>
      </div>
    </div>
  )
}

function Dashboard() {
  const [menu, setMenu] = useState<WeeklyMenu | null>(null)
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [weekStart, setWeekStart] = useState(() => formatDate(getMonday()))

  const loadMenu = useCallback(async () => {
    setLoading(true)
    await ensureHousehold()
    const householdId = getHouseholdId()
    if (!householdId) { setLoading(false); return }

    const { data: menus } = await supabase
      .from('weekly_menus')
      .select('*, menu_items:menu_items(*, dish:dishes(*))')
      .eq('household_id', householdId)
      .eq('week_start_date', weekStart)
      .order('created_at', { ascending: false })
      .limit(1)

    if (menus && menus.length > 0) {
      const m = menus[0]
      setMenu(m)
      setItems(m.menu_items || [])
    } else {
      setMenu(null)
      setItems([])
    }
    setLoading(false)
  }, [weekStart])

  useEffect(() => { loadMenu() }, [loadMenu])

  function shiftWeek(delta: number) {
    setWeekStart(shiftWeekStart(weekStart, delta))
  }

  const vegCount = items.filter(i => i.dish?.is_veg).length
  const nvCount = items.filter(i => i.dish && !i.dish.is_veg).length

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-10">
        <button onClick={() => shiftWeek(-1)} className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-white text-[#8C8680] transition-colors" aria-label="Previous week">
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none"><path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div className="text-center">
          <p className="text-[15px] text-[#8C8680] mb-0.5">Week of</p>
          <p className="text-xl font-semibold text-[#2D2A26]">{getWeekLabel(weekStart)}</p>
        </div>
        <button onClick={() => shiftWeek(1)} className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-white text-[#8C8680] transition-colors" aria-label="Next week">
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none"><path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#F5F0EA]" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 w-20 rounded bg-[#F5F0EA]" />
                  <div className="h-4 w-40 rounded bg-[#F5F0EA]" />
                  <div className="h-3 w-28 rounded bg-[#F5F0EA]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : menu ? (
        <div>
          <div className="flex gap-2 mb-6 flex-wrap">
            <span className="px-4 py-1.5 rounded-full bg-white text-[15px] font-medium shadow">
              <span className="text-[#2E7D32]">{vegCount} veg</span>
              <span className="text-[#C5C0BA] mx-1.5">/</span>
              <span className="text-[#C62828]">{nvCount} non-veg</span>
            </span>
            {menu.is_finalized && (
              <span className="px-4 py-1.5 rounded-full bg-[#2D2A26] text-white text-[15px] font-medium">Finalized</span>
            )}
          </div>

          <div className="space-y-3 mb-8">
            {items.map(item => {
              const dish = item.dish
              if (!dish) return null
              const bg = CUISINE_BG[dish.cuisine] || '#F5F5F5'
              return (
                <Link key={item.id} href={`/menu/${menu.id}`} className="card p-4 flex gap-4 block">
                  <div className="w-16 h-16 rounded-2xl flex-shrink-0 overflow-hidden" style={{ backgroundColor: bg }}>
                    {dish.illustration_url ? (
                      <img src={dish.illustration_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center text-2xl font-bold opacity-20">{dish.name_en.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-0.5">
                    <p className="text-[13px] text-[#8C8680]">
                      {DAY_NAMES[item.day_of_week]}, {formatDateDisplay(item.date)}
                      {item.meal_type && item.meal_type !== 'dinner' && ` ${MEAL_EMOJI[item.meal_type as keyof typeof MEAL_EMOJI]}`}
                    </p>
                    <p className="font-semibold text-[17px] text-[#2D2A26] truncate mt-0.5">{dish.name_en}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded-full text-[12px] font-medium" style={{ backgroundColor: bg }}>
                        {CUISINE_LABELS[dish.cuisine]}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${dish.is_veg ? 'bg-[#2E7D32]' : 'bg-[#C62828]'}`} />
                      <span className="text-[13px] text-[#8C8680] ml-auto">{dish.calories} cal</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          <Link
            href={`/menu/${menu.id}`}
            className="block w-full text-center bg-[#2D2A26] text-white py-4 rounded-2xl font-semibold text-[17px] hover:bg-[#45403A] transition-colors shadow"
          >
            View Full Menu
          </Link>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-7xl mb-6">🍛</div>
          <h2 className="text-3xl font-bold text-[#2D2A26] mb-3">No menu yet</h2>
          <p className="text-[#8C8680] mb-10 max-w-sm mx-auto text-lg leading-relaxed">
            Plan this week's meals — pick cuisines, set veg/non-veg split, and let AI build your menu.
          </p>
          <Link
            href={`/plan?week=${weekStart}`}
            className="inline-block bg-[#2D2A26] text-white px-10 py-4 rounded-2xl font-semibold text-[17px] hover:bg-[#45403A] transition-colors shadow"
          >
            Plan This Week's Menu
          </Link>
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const { user, isTestMode, loading } = useAuth()

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-8 h-8 border-3 border-[#2D2A26] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (user || isTestMode) ? <Dashboard /> : <Landing />
}
