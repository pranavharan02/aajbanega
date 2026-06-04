'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getWeekLabel, formatDateDisplay } from '@/lib/dates'
import { CUISINE_LABELS, ACCOMPANIMENT_LABELS, DAY_NAMES, MEAL_EMOJI, MEAL_ORDER } from '@/lib/types'
import type { WeeklyMenu, MenuItem, MealType } from '@/lib/types'
import { toast } from '@/components/Toast'

const CUISINE_BG: Record<string, string> = {
  tamil: '#E8D5C4', north: '#F5E6CC', marathi: '#D4E8D4', bihari: '#E8DCC8', custom: '#F0EDE8',
  gujarati: '#F5E8D0', bengali: '#E8D4D4', kerala: '#C8E8D4', andhra: '#E8D0C4',
  goan: '#D4D8E8', rajasthani: '#E8E0C8', punjabi: '#F0E4CC', kashmiri: '#D8D4E8',
}

interface DayGroup {
  day: number
  date: string
  meals: { meal_type: MealType; item: MenuItem }[]
}

export default function MenuCalendarPage() {
  const params = useParams()
  const router = useRouter()
  const menuId = params.id as string
  const [menu, setMenu] = useState<WeeklyMenu | null>(null)
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [swapping, setSwapping] = useState<string | null>(null)
  const [finalizing, setFinalizing] = useState(false)
  const [showShareOptions, setShowShareOptions] = useState(false)
  const [swapSource, setSwapSource] = useState<string | null>(null)
  const [approvals, setApprovals] = useState<{ approved_by: string }[]>([])
  const [memberCount, setMemberCount] = useState(1)
  const [pendingApproval, setPendingApproval] = useState(false)

  const loadMenu = useCallback(async () => {
    const [{ data: m }, { data: mi }, { data: ap }] = await Promise.all([
      supabase.from('weekly_menus').select('*, household:households(id, name)').eq('id', menuId).single(),
      supabase.from('menu_items').select('*, dish:dishes(*)').eq('menu_id', menuId).order('day_of_week'),
      supabase.from('menu_approvals').select('approved_by').eq('menu_id', menuId),
    ])
    setMenu(m)
    setItems(mi || [])
    setApprovals(ap || [])
    if (m) {
      setMemberCount(m.approvals_needed || 1)
      setPendingApproval(!m.is_finalized && (ap?.length || 0) > 0 && (ap?.length || 0) < (m.approvals_needed || 1))
    }
    setLoading(false)
  }, [menuId])

  useEffect(() => { loadMenu() }, [loadMenu])

  // Group items by day
  const dayGroups: DayGroup[] = []
  const dayMap = new Map<number, DayGroup>()
  for (const item of items) {
    let group = dayMap.get(item.day_of_week)
    if (!group) {
      group = { day: item.day_of_week, date: item.date, meals: [] }
      dayMap.set(item.day_of_week, group)
      dayGroups.push(group)
    }
    group.meals.push({ meal_type: item.meal_type || 'dinner', item })
  }
  // Sort meals within each day
  for (const group of dayGroups) {
    group.meals.sort((a, b) => MEAL_ORDER.indexOf(a.meal_type) - MEAL_ORDER.indexOf(b.meal_type))
  }

  const hasMultipleMeals = items.length > 0 && new Set(items.map(i => i.meal_type || 'dinner')).size > 1

  async function handleSwap(itemId: string) {
    setSwapping(itemId)
    const item = items.find(i => i.id === itemId)
    if (!item?.dish) { setSwapping(null); return }
    const currentSlugs = items.map(i => i.dish?.slug).filter(Boolean) as string[]
    const mealType = item.meal_type || 'dinner'
    const { data: alternatives } = await supabase
      .from('dishes').select('id, slug, name_en, is_veg, meal_types')
      .eq('cuisine', item.dish.cuisine).eq('is_veg', item.dish.is_veg)
      .contains('meal_types', [mealType])
      .not('slug', 'in', `(${currentSlugs.map(s => `"${s}"`).join(',')})`)
      .limit(5)
    if (alternatives?.length) {
      const pick = alternatives[Math.floor(Math.random() * alternatives.length)]
      await supabase.from('menu_items').update({ dish_id: pick.id, was_swapped: true }).eq('id', item.id)
      toast(`Swapped to ${pick.name_en}`)
    } else { toast('No alternatives available', 'info') }
    await loadMenu()
    setSwapping(null)
  }

  async function handleItemSwap(sourceId: string, targetId: string) {
    const src = items.find(i => i.id === sourceId)
    const tgt = items.find(i => i.id === targetId)
    if (!src || !tgt) return
    setItems(prev => prev.map(i => {
      if (i.id === sourceId) return { ...i, dish: tgt.dish, dish_id: tgt.dish_id }
      if (i.id === targetId) return { ...i, dish: src.dish, dish_id: src.dish_id }
      return i
    }))
    setSwapSource(null)
    await Promise.all([
      supabase.from('menu_items').update({ dish_id: tgt.dish_id }).eq('id', src.id),
      supabase.from('menu_items').update({ dish_id: src.dish_id }).eq('id', tgt.id),
    ])
    const srcLabel = `${DAY_NAMES[src.day_of_week]} ${MEAL_EMOJI[src.meal_type || 'dinner']}`
    const tgtLabel = `${DAY_NAMES[tgt.day_of_week]} ${MEAL_EMOJI[tgt.meal_type || 'dinner']}`
    toast(`${srcLabel} ↔ ${tgtLabel}`)
  }

  async function handleFinalize() {
    setFinalizing(true)

    // Get household member count
    const hhId = menu?.household_id
    let totalMembers = 1
    if (hhId) {
      const { count } = await supabase.from('household_members').select('id', { count: 'exact', head: true }).eq('household_id', hhId)
      totalMembers = 1 + (count || 0) // owner + members
    }

    // Record this user's approval
    const myName = (typeof document !== 'undefined' && document.cookie.match(/akb_household=/)
      ? ((await supabase.from('households').select('name').eq('id', hhId).single()).data?.name || 'You')
      : 'You')

    await supabase.from('menu_approvals').upsert({
      menu_id: menuId,
      approved_by: myName,
    }, { onConflict: 'menu_id,approved_by' })

    // Update approvals_needed
    await supabase.from('weekly_menus').update({ approvals_needed: totalMembers }).eq('id', menuId)

    if (totalMembers <= 1) {
      // Solo household — finalize immediately
      await supabase.from('weekly_menus').update({ is_finalized: true, finalized_at: new Date().toISOString() }).eq('id', menuId)
      await fetch(`/api/menus/${menuId}/finalize`, { method: 'POST' })
      toast('Menu finalized!')
      setShowShareOptions(true)
    } else {
      toast('Your approval recorded! Share the link with your flatmate(s).')
    }

    await loadMenu()
    setFinalizing(false)
  }

  async function handleUnfinalize() {
    await supabase.from('weekly_menus').update({ is_finalized: false, finalized_at: null }).eq('id', menuId)
    await supabase.from('menu_approvals').delete().eq('menu_id', menuId)
    await loadMenu()
    setShowShareOptions(false)
    toast('Menu unlocked, approvals cleared')
  }

  function copyApprovalLink() {
    const url = `${window.location.origin}/menu/${menuId}/approve`
    navigator.clipboard.writeText(url)
    toast('Approval link copied!')
  }

  function shareApprovalWhatsApp() {
    const url = `${window.location.origin}/menu/${menuId}/approve`
    const msg = `Hey! Please review and approve this week's menu:\n${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  async function handleReset() {
    if (!confirm('Delete this menu and start over?')) return
    await supabase.from('shopping_lists').delete().eq('menu_id', menuId)
    await supabase.from('menu_items').delete().eq('menu_id', menuId)
    await supabase.from('weekly_menus').delete().eq('id', menuId)
    toast('Menu deleted')
    router.push(`/plan?week=${menu?.week_start_date || ''}`)
  }

  function copyCookLink(lang: string) {
    navigator.clipboard.writeText(`${window.location.origin}/cook/${menuId}?lang=${lang}`)
    toast(`${lang === 'hi' ? 'Hindi' : 'Marathi'} link copied!`)
  }

  if (loading) return (
    <div className="py-10 space-y-4">
      {[1,2,3,4].map(i => <div key={i} className="card p-5 h-24 animate-pulse" />)}
    </div>
  )
  if (!menu) return <div className="py-20 text-center text-[#8C8680] text-lg">Menu not found</div>

  const vegCount = items.filter(i => i.dish?.is_veg).length
  const nvCount = items.filter(i => i.dish && !i.dish.is_veg).length
  const totalItems = items.length
  const avgCal = totalItems ? Math.round(items.reduce((s, i) => s + (i.dish?.calories || 0), 0) / totalItems) : 0

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-[28px] font-bold text-[#2D2A26]">Weekly Menu</h1>
        {menu.is_finalized && (
          <button onClick={handleUnfinalize} className="text-[15px] text-[#8C8680] hover:text-[#2D2A26] transition-colors">Edit</button>
        )}
      </div>
      <p className="text-[#8C8680] text-[17px] mb-6">{getWeekLabel(menu.week_start_date)}</p>

      {/* Stats */}
      <div className="flex gap-2 mb-8 flex-wrap">
        <span className="px-4 py-2 rounded-full bg-white text-[15px] font-medium shadow-sm">
          <span className="text-[#2E7D32]">{vegCount}V</span>
          <span className="text-[#C5C0BA] mx-1">/</span>
          <span className="text-[#C62828]">{nvCount}NV</span>
        </span>
        <span className="px-4 py-2 rounded-full bg-white text-[15px] font-medium shadow-sm">~{avgCal} cal/dish</span>
        <span className="px-4 py-2 rounded-full bg-white text-[15px] font-medium shadow-sm capitalize">
          {menu.generation_mode === 'ai' ? 'AI-generated' : 'Auto-generated'}
        </span>
      </div>

      {/* Swap hint */}
      {swapSource !== null && !menu.is_finalized && (
        <div className="card mb-5 px-5 py-4 text-[15px] text-center">
          Tap another slot to swap
          <button onClick={() => setSwapSource(null)} className="ml-3 text-[#8C8680] hover:text-[#2D2A26] underline">Cancel</button>
        </div>
      )}

      {/* Calendar tiles */}
      <div className="space-y-3 mb-10">
        {dayGroups.map(group => (
          <div key={group.day} className="card overflow-hidden">
            {/* Day header */}
            <div className="px-5 pt-4 pb-2">
              <p className="text-[13px] text-[#8C8680] font-medium">
                {DAY_NAMES[group.day]}, {formatDateDisplay(group.date)}
              </p>
            </div>

            {/* Meal rows */}
            {group.meals.map(({ meal_type, item }) => {
              const dish = item.dish
              if (!dish) return null
              const bg = CUISINE_BG[dish.cuisine] || '#F0EDE8'
              const isTarget = swapSource !== null && swapSource !== item.id
              const isSource = swapSource === item.id

              return (
                <div
                  key={item.id}
                  className={`px-5 py-3 relative group transition-all ${
                    isTarget ? 'bg-[#F0EDE8] cursor-pointer' :
                    isSource ? 'opacity-50' : ''
                  } ${group.meals.length > 1 ? 'border-t border-[#F0EDE8]' : ''}`}
                  onClick={isTarget ? () => handleItemSwap(swapSource!, item.id) : undefined}
                >
                  {/* Action buttons */}
                  {!menu.is_finalized && swapSource === null && (
                    <div className="absolute top-3 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button onClick={(e) => { e.stopPropagation(); setSwapSource(item.id) }}
                        className="w-8 h-8 rounded-xl bg-[#F5F0EA] hover:bg-[#E5DFD6] flex items-center justify-center transition-colors" title="Move">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6L8 2L12 6M4 10L8 14L12 10" stroke="#2D2A26" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleSwap(item.id) }}
                        disabled={swapping === item.id}
                        className="w-8 h-8 rounded-xl bg-[#F5F0EA] hover:bg-[#E5DFD6] flex items-center justify-center transition-colors" title="Replace">
                        {swapping === item.id ? (
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="#2D2A26" strokeWidth="4" fill="none"/><path className="opacity-75" fill="#2D2A26" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1.33 8A6.67 6.67 0 0112.45 3.55M14.67 8A6.67 6.67 0 013.55 12.45" stroke="#2D2A26" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        )}
                      </button>
                    </div>
                  )}

                  <Link href={isTarget ? '#' : `/menu/${menuId}/dish/${dish.slug}`} className="flex gap-4 items-center" onClick={isTarget ? e => e.preventDefault() : undefined}>
                    {/* Meal icon */}
                    {hasMultipleMeals && (
                      <span className="text-lg flex-shrink-0 w-7 text-center" title={meal_type}>{MEAL_EMOJI[meal_type]}</span>
                    )}
                    <div className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden" style={{ backgroundColor: bg }}>
                      {dish.illustration_url ? (
                        <img src={dish.illustration_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <span className="w-full h-full flex items-center justify-center text-lg font-bold opacity-20">{dish.name_en.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[17px] text-[#2D2A26] truncate">{dish.name_en}</p>
                      <div className="flex gap-2 items-center mt-1 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ backgroundColor: bg }}>
                          {CUISINE_LABELS[dish.cuisine]}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${dish.is_veg ? 'bg-[#2E7D32]' : 'bg-[#C62828]'}`} />
                        {dish.default_accompaniment && (
                          <span className="text-[12px] text-[#8C8680]">+ {ACCOMPANIMENT_LABELS[dish.default_accompaniment] || dish.default_accompaniment}</span>
                        )}
                        <span className="text-[12px] text-[#8C8680] ml-auto">{dish.calories} cal</span>
                      </div>
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Actions */}
      {!menu.is_finalized && !pendingApproval ? (
        <button onClick={handleFinalize} disabled={finalizing}
          className="w-full bg-[#2D2A26] text-white py-4 rounded-2xl font-semibold text-[17px] hover:bg-[#45403A] transition-colors disabled:opacity-50 shadow-sm">
          {finalizing ? 'Processing...' : 'Finalize Menu'}
        </button>
      ) : pendingApproval ? (
        <div className="space-y-4">
          {/* Approval status */}
          <div className="card p-5 space-y-3">
            <p className="font-semibold text-[17px] text-[#2D2A26]">Waiting for approval</p>
            <div className="flex flex-wrap gap-2">
              {approvals.map(a => (
                <span key={a.approved_by} className="px-3 py-1.5 rounded-full bg-[#2E7D32] text-white text-[13px] font-medium">
                  {a.approved_by} ✓
                </span>
              ))}
              {Array.from({ length: memberCount - approvals.length }).map((_, i) => (
                <span key={i} className="px-3 py-1.5 rounded-full bg-[#F5F0EA] text-[#8C8680] text-[13px] font-medium">
                  Pending
                </span>
              ))}
            </div>
            <p className="text-[13px] text-[#8C8680]">
              {approvals.length} of {memberCount} approved. Share the link below so your flatmate can review and approve.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={copyApprovalLink}
              className="flex-1 bg-[#2D2A26] text-white py-4 rounded-2xl font-semibold text-[15px] hover:bg-[#45403A] transition-colors shadow-sm">
              Copy Approval Link
            </button>
            <button onClick={shareApprovalWhatsApp}
              className="flex-1 bg-[#25D366] text-white py-4 rounded-2xl font-semibold text-[15px] hover:bg-[#20BD5A] transition-colors shadow-sm flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.571-1.46A11.93 11.93 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.37 0-4.554-.804-6.298-2.152l-.44-.348-2.713.867.91-2.631-.382-.464A9.935 9.935 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
              WhatsApp
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {showShareOptions && (
            <div className="card p-5 space-y-3">
              <p className="font-semibold text-[17px]">Share with your cook</p>
              <div className="flex gap-3">
                <button onClick={() => copyCookLink('hi')}
                  className="flex-1 bg-[#F5F0EA] py-3 rounded-xl text-[15px] font-medium hover:bg-[#F0EDE8] transition-colors">Copy Hindi link</button>
                <button onClick={() => copyCookLink('mr')}
                  className="flex-1 bg-[#F5F0EA] py-3 rounded-xl text-[15px] font-medium hover:bg-[#F0EDE8] transition-colors">Copy Marathi link</button>
              </div>
            </div>
          )}
          {approvals.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {approvals.map(a => (
                <span key={a.approved_by} className="px-3 py-1 rounded-full bg-[#2E7D32] text-white text-[12px] font-medium">
                  {a.approved_by} ✓
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <Link href={`/shopping-list/${menuId}`}
              className="flex-1 text-center bg-[#2D2A26] text-white py-4 rounded-2xl font-semibold text-[15px] hover:bg-[#45403A] transition-colors shadow-sm">
              Shopping List
            </Link>
            <button onClick={() => setShowShareOptions(!showShareOptions)}
              className="flex-1 text-center border-2 border-[#2D2A26] text-[#2D2A26] py-4 rounded-2xl font-semibold text-[15px] hover:bg-[#F0EDE8] transition-colors">
              Share with Cook
            </button>
          </div>
        </div>
      )}

      <button onClick={handleReset}
        className="w-full mt-4 text-center text-[14px] text-[#C5C0BA] hover:text-[#C62828] py-3 transition-colors">
        Reset menu and start over
      </button>
    </div>
  )
}
