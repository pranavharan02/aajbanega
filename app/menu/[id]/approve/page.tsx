'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CUISINE_LABELS, DAY_NAMES, MEAL_EMOJI, MEAL_ORDER } from '@/lib/types'
import type { MenuItem, MealType } from '@/lib/types'

const CUISINE_BG: Record<string, string> = {
  tamil: '#E8D5C4', north: '#F5E6CC', marathi: '#D4E8D4', bihari: '#E8DCC8',
  gujarati: '#F5E8D0', bengali: '#E8D4D4', kerala: '#C8E8D4', andhra: '#E8D0C4',
  goan: '#D4D8E8', rajasthani: '#E8E0C8', punjabi: '#F0E4CC', kashmiri: '#D8D4E8', custom: '#F0EDE8',
}

interface DayGroup {
  day: number
  date: string
  meals: { meal_type: MealType; item: MenuItem }[]
}

export default function ApprovePage() {
  const params = useParams()
  const router = useRouter()
  const menuId = params.id as string

  const [items, setItems] = useState<MenuItem[]>([])
  const [householdName, setHouseholdName] = useState('')
  const [approvals, setApprovals] = useState<{ approved_by: string }[]>([])
  const [approvalsNeeded, setApprovalsNeeded] = useState(1)
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(false)
  const [approverName, setApproverName] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: menu }, { data: mi }, { data: ap }] = await Promise.all([
        supabase.from('weekly_menus').select('*, household:households(name)').eq('id', menuId).single(),
        supabase.from('menu_items').select('*, dish:dishes(*)').eq('menu_id', menuId).order('day_of_week'),
        supabase.from('menu_approvals').select('approved_by').eq('menu_id', menuId),
      ])
      if (menu) {
        setHouseholdName((menu as any).household?.name || '')
        setApprovalsNeeded(menu.approvals_needed || 1)
      }
      setItems(mi || [])
      setApprovals(ap || [])
      setLoading(false)
    }
    load()
  }, [menuId])

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
  for (const g of dayGroups) g.meals.sort((a, b) => MEAL_ORDER.indexOf(a.meal_type) - MEAL_ORDER.indexOf(b.meal_type))
  const hasMultipleMeals = items.length > 0 && new Set(items.map(i => i.meal_type || 'dinner')).size > 1

  async function handleApprove() {
    if (!approverName.trim()) return
    setApproving(true)

    await supabase.from('menu_approvals').upsert({
      menu_id: menuId,
      approved_by: approverName.trim(),
    }, { onConflict: 'menu_id,approved_by' })

    // Check if all approvals are in
    const { data: allApprovals } = await supabase
      .from('menu_approvals').select('id').eq('menu_id', menuId)

    if (allApprovals && allApprovals.length >= approvalsNeeded) {
      await supabase.from('weekly_menus').update({
        is_finalized: true,
        finalized_at: new Date().toISOString(),
      }).eq('id', menuId)
      await fetch(`/api/menus/${menuId}/finalize`, { method: 'POST' })
    }

    setDone(true)
    setApproving(false)
  }

  if (loading) return (
    <div className="py-20 flex justify-center">
      <div className="w-8 h-8 border-3 border-[#2D2A26] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (done) return (
    <div className="py-20 text-center">
      <div className="text-5xl mb-4">✅</div>
      <h1 className="text-2xl font-bold text-[#2D2A26] mb-2">Menu approved!</h1>
      <p className="text-[#8C8680]">
        {approvals.length + 1 >= approvalsNeeded
          ? 'All approvals are in — the menu is now finalized.'
          : `Waiting for ${approvalsNeeded - approvals.length - 1} more approval(s).`
        }
      </p>
    </div>
  )

  return (
    <div className="py-6 max-w-lg mx-auto">
      <div className="text-center mb-8">
        <p className="text-[15px] text-[#8C8680] mb-1">{householdName}'s menu</p>
        <h1 className="text-[26px] font-bold text-[#2D2A26]">Review & Approve</h1>
        <div className="flex justify-center gap-2 mt-3">
          {approvals.map(a => (
            <span key={a.approved_by} className="px-3 py-1 rounded-full bg-[#2E7D32] text-white text-[13px] font-medium">
              {a.approved_by} ✓
            </span>
          ))}
          <span className="px-3 py-1 rounded-full bg-[#F5F0EA] text-[#8C8680] text-[13px] font-medium">
            {approvalsNeeded - approvals.length} pending
          </span>
        </div>
      </div>

      {/* Menu preview */}
      <div className="space-y-2 mb-8">
        {dayGroups.map(group => (
          <div key={group.day} className="card overflow-hidden">
            <div className="px-4 pt-3 pb-1">
              <p className="text-[12px] text-[#8C8680] font-medium">{DAY_NAMES[group.day]}</p>
            </div>
            {group.meals.map(({ meal_type, item }) => {
              const dish = item.dish
              if (!dish) return null
              const bg = CUISINE_BG[dish.cuisine] || '#F0EDE8'
              return (
                <div key={item.id} className="px-4 py-2 flex items-center gap-3">
                  {hasMultipleMeals && <span className="text-sm">{MEAL_EMOJI[meal_type]}</span>}
                  <div className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden" style={{ backgroundColor: bg }}>
                    {dish.illustration_url ? (
                      <img src={dish.illustration_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center text-sm font-bold opacity-20">{dish.name_en.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[15px] text-[#2D2A26] truncate">{dish.name_en}</p>
                    <p className="text-[12px] text-[#8C8680]">{CUISINE_LABELS[dish.cuisine]} · {dish.calories} cal</p>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Approve form */}
      <div className="card p-5 space-y-4">
        <p className="font-semibold text-[16px] text-[#2D2A26]">Looks good? Approve the menu.</p>
        <input
          type="text"
          value={approverName}
          onChange={e => setApproverName(e.target.value)}
          placeholder="Your name"
          className="w-full px-4 py-3.5 rounded-xl border border-[#E5DFD6] text-[16px] bg-[#FFFDF9] focus:outline-none focus:ring-2 focus:ring-[#2D2A26]"
        />
        <button
          onClick={handleApprove}
          disabled={!approverName.trim() || approving}
          className="w-full bg-[#2E7D32] text-white py-4 rounded-2xl font-semibold text-[17px] hover:bg-[#256d29] transition-colors disabled:opacity-50"
        >
          {approving ? 'Approving...' : 'Approve Menu ✓'}
        </button>
      </div>
    </div>
  )
}
