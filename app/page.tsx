'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
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

function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useReveal()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  )
}

const FEATURES = [
  {
    num: '01',
    title: 'Your weekly menu, sorted',
    desc: 'Pick your favourite cuisines, set how many veg and non-veg days you want, and get a balanced weekly menu — breakfast, lunch, and dinner. 213 dishes across 12 regional Indian cuisines.',
    accent: '#E8D5C4',
    icon: '📋',
  },
  {
    num: '02',
    title: 'Share recipes with your cook',
    desc: 'Send your cook a single link. They see today\'s recipe in Hindi or Marathi — ingredients, quantities, step-by-step instructions — in large, clear text. No app download needed.',
    accent: '#D4E8D4',
    icon: '🗣️',
  },
  {
    num: '03',
    title: 'Smart shopping list',
    desc: 'The app tracks what\'s already in your pantry and builds a day-wise shopping list with only what you need to buy. No more forgetting jeera or buying double the onions.',
    accent: '#F5E6CC',
    icon: '🛒',
  },
]

function Landing() {
  return (
    <div className="landing-page">
      {/* Hero */}
      <div className="text-center pt-12 pb-6">
        <h1
          className="text-[52px] font-extrabold text-[#2D2A26] leading-[1.05] tracking-tight mb-5"
          style={{ animation: 'heroIn 0.8s cubic-bezier(0.16,1,0.3,1) both' }}
        >
          आज क्या बनेगा?
        </h1>
        <p
          className="text-[20px] text-[#8C8680] leading-relaxed max-w-sm mx-auto mb-10"
          style={{ animation: 'heroIn 0.8s cubic-bezier(0.16,1,0.3,1) 0.15s both' }}
        >
          Plan meals for the week.<br />Share with your cook. In their language.
        </p>
        <div style={{ animation: 'heroIn 0.8s cubic-bezier(0.16,1,0.3,1) 0.3s both' }}>
          <Link
            href="/login"
            className="inline-block bg-[#2D2A26] text-white px-10 py-4 rounded-2xl font-semibold text-[18px] hover:bg-[#45403A] transition-all hover:scale-[1.03] shadow-lg active:scale-100"
          >
            Start Planning
          </Link>
        </div>
      </div>

      {/* === Sticky scroll feature cards === */}
      <div className="relative" style={{ marginLeft: '-20px', marginRight: '-20px' }}>
        {FEATURES.map((f, i) => (
          <div key={f.num} className="sticky px-5" style={{ top: `${100 + i * 16}px`, zIndex: i + 1, paddingBottom: '24px' }}>
            <Reveal>
              <div
                className="rounded-3xl p-8 shadow-lg border border-white/60"
                style={{ background: f.accent, minHeight: '280px' }}
              >
                <div className="flex items-start justify-between mb-5">
                  <span className="text-[13px] font-bold text-[#2D2A26]/40 tracking-widest uppercase">{f.num}</span>
                  <span className="text-4xl">{f.icon}</span>
                </div>
                <h3 className="text-[28px] font-extrabold text-[#2D2A26] leading-tight mb-3">{f.title}</h3>
                <p className="text-[16px] text-[#2D2A26]/70 leading-relaxed max-w-md">{f.desc}</p>
              </div>
            </Reveal>
          </div>
        ))}
      </div>

      {/* === Plan together === */}
      <div className="py-20">
        <Reveal>
          <h2 className="text-[28px] font-extrabold text-[#2D2A26] text-center leading-tight mb-4">
            Plan together with<br />flatmates & family
          </h2>
          <p className="text-[16px] text-[#8C8680] text-center max-w-sm mx-auto mb-10 leading-relaxed">
            Everyone gets a say in what&apos;s for dinner. No more WhatsApp polls.
          </p>
        </Reveal>

        <div className="space-y-4">
          <Reveal delay={0.1}>
            <div className="card p-6">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#E8D5C4] flex items-center justify-center text-lg font-bold">👥</div>
                <h3 className="font-bold text-[17px] text-[#2D2A26]">Invite your household</h3>
              </div>
              <p className="text-[15px] text-[#8C8680] leading-relaxed">
                Add flatmates or family members with a WhatsApp invite link. Each person joins your shared household in seconds.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="card p-6">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#D4E8D4] flex items-center justify-center text-lg font-bold">✅</div>
                <h3 className="font-bold text-[17px] text-[#2D2A26]">Vote on the menu</h3>
              </div>
              <p className="text-[15px] text-[#8C8680] leading-relaxed">
                After the menu is generated, each flatmate gets a link to review and approve. The menu finalizes only when everyone says yes.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="card p-6">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#F5E6CC] flex items-center justify-center text-lg font-bold">🔄</div>
                <h3 className="font-bold text-[17px] text-[#2D2A26]">Swap dishes you don&apos;t like</h3>
              </div>
              <p className="text-[15px] text-[#8C8680] leading-relaxed">
                Not feeling Palak Paneer on Wednesday? Swap it for something else from the same cuisine. Everyone sees the updated menu in real-time.
              </p>
            </div>
          </Reveal>
        </div>
      </div>

      {/* === How it works === */}
      <Reveal>
        <div className="py-10">
          <h2 className="text-[22px] font-bold text-[#2D2A26] mb-8 text-center">How it works</h2>
          <div className="space-y-5">
            {[
              { step: '1', text: 'Pick your cuisines and set veg/non-veg days', sub: 'Tamil, North Indian, Marathi... choose any combination' },
              { step: '2', text: 'Get a balanced weekly menu', sub: 'Variety-optimized — no repeats, proper nutrition' },
              { step: '3', text: 'Swap dishes, get approval from flatmates', sub: 'Everyone votes before the menu is locked in' },
              { step: '4', text: 'Share one link with your cook', sub: 'Recipes in Hindi or Marathi, no app needed' },
            ].map((s, i) => (
              <Reveal key={s.step} delay={i * 0.08}>
                <div className="flex gap-5 items-start">
                  <div className="w-11 h-11 rounded-2xl bg-[#2D2A26] text-white flex items-center justify-center font-bold text-[16px] flex-shrink-0 shadow-md">
                    {s.step}
                  </div>
                  <div>
                    <p className="text-[16px] font-semibold text-[#2D2A26]">{s.text}</p>
                    <p className="text-[14px] text-[#8C8680] mt-0.5">{s.sub}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Reveal>

      {/* === Cuisines marquee (two lines, opposite directions) === */}
      <Reveal>
        <div className="py-10 overflow-hidden" style={{ marginLeft: '-20px', marginRight: '-20px' }}>
          <h2 className="text-[22px] font-bold text-[#2D2A26] mb-6 text-center px-5">12 regional cuisines</h2>
          <div className="space-y-3">
            <div className="relative">
              <div className="flex gap-3 animate-marquee whitespace-nowrap">
                {['🥥 Tamil', '🫓 North Indian', '🌶 Marathi', '🫘 Bihari', '🦐 Goan', '🏜️ Rajasthani',
                  '🥥 Tamil', '🫓 North Indian', '🌶 Marathi', '🫘 Bihari', '🦐 Goan', '🏜️ Rajasthani',
                ].map((c, i) => (
                  <span key={i} className="inline-block px-5 py-2.5 rounded-full bg-white text-[15px] font-medium text-[#2D2A26] shadow-sm border border-[#E5DFD6]/50 flex-shrink-0">
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="flex gap-3 animate-marquee-reverse whitespace-nowrap">
                {['🫙 Gujarati', '🐟 Bengali', '🌴 Kerala', '🔥 Andhra', '🧈 Punjabi', '🏔️ Kashmiri',
                  '🫙 Gujarati', '🐟 Bengali', '🌴 Kerala', '🔥 Andhra', '🧈 Punjabi', '🏔️ Kashmiri',
                ].map((c, i) => (
                  <span key={i} className="inline-block px-5 py-2.5 rounded-full bg-white text-[15px] font-medium text-[#2D2A26] shadow-sm border border-[#E5DFD6]/50 flex-shrink-0">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Bottom CTA */}
      <Reveal>
        <div className="text-center py-16">
          <p className="text-[15px] text-[#8C8680] mb-6">Ready to stop asking &ldquo;aaj kya banega?&rdquo; every evening?</p>
          <Link
            href="/login"
            className="inline-block bg-[#2D2A26] text-white px-10 py-4 rounded-2xl font-semibold text-[18px] hover:bg-[#45403A] transition-all hover:scale-[1.03] shadow-lg active:scale-100"
          >
            Start Planning
          </Link>
          <p className="text-[13px] text-[#C5C0BA] mt-4">No credit card. No downloads. Works on any phone.</p>
        </div>
      </Reveal>

      {/* Footer */}
      <div className="pt-6 border-t border-[#E5DFD6] flex justify-center gap-6 text-[13px] text-[#C5C0BA] pb-4">
        <Link href="/privacy" className="hover:text-[#2D2A26] transition-colors">Privacy</Link>
        <Link href="/terms" className="hover:text-[#2D2A26] transition-colors">Terms</Link>
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
            Plan this week's meals — pick cuisines, set veg/non-veg split, and get a balanced menu.
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
