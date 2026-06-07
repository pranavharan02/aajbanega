'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import {
  CUISINE_LABELS, CUISINE_EMOJI, CUISINE_HEX,
  type CuisineType, type Dish,
} from '@/lib/types'

const CUISINES: CuisineType[] = ['tamil', 'north', 'marathi', 'bihari', 'gujarati', 'bengali', 'kerala', 'andhra', 'goan', 'rajasthani', 'punjabi', 'kashmiri', 'cafe']

export default function BrowsePage() {
  const [cuisine, setCuisine] = useState<CuisineType | 'all'>('all')
  const [dishes, setDishes] = useState<Dish[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [liked, setLiked] = useState<string[]>([])
  const [skipped, setSkipped] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | null>(null)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startX = useRef(0)
  const cardRef = useRef<HTMLDivElement>(null)

  const loadDishes = useCallback(async () => {
    setLoading(true)
    const supabase = createSupabaseBrowser()
    let query = supabase.from('dishes').select('*').order('name_en')
    if (cuisine !== 'all') query = query.eq('cuisine', cuisine)
    const { data } = await query
    if (data) {
      const shuffled = [...data].sort(() => Math.random() - 0.5)
      setDishes(shuffled as Dish[])
      setCurrentIndex(0)
      setSkipped([])
    }
    setLoading(false)
  }, [cuisine])

  useEffect(() => { loadDishes() }, [loadDishes])

  const currentDish = dishes[currentIndex]
  const remaining = dishes.length - currentIndex

  function handleSwipe(direction: 'left' | 'right') {
    if (!currentDish) return
    setSwipeDir(direction)
    if (direction === 'right') {
      setLiked(prev => [...prev, currentDish.id])
    } else {
      setSkipped(prev => [...prev, currentDish.id])
    }
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
      setSwipeDir(null)
      setDragX(0)
    }, 300)
  }

  function handleTouchStart(e: React.TouchEvent | React.MouseEvent) {
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX
    startX.current = x
    setDragging(true)
  }

  function handleTouchMove(e: React.TouchEvent | React.MouseEvent) {
    if (!dragging) return
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX
    setDragX(x - startX.current)
  }

  function handleTouchEnd() {
    if (!dragging) return
    setDragging(false)
    if (Math.abs(dragX) > 100) {
      handleSwipe(dragX > 0 ? 'right' : 'left')
    } else {
      setDragX(0)
    }
  }

  const rotation = dragX * 0.05
  const opacity = Math.max(0.5, 1 - Math.abs(dragX) / 400)

  return (
    <div className="py-6">
      <h1 className="text-[28px] font-bold text-[#2D2A26] mb-1">Browse dishes</h1>
      <p className="text-[#8C8680] text-[15px] mb-6">Swipe right to save, left to skip</p>

      {/* Cuisine filter */}
      <div className="flex gap-2 overflow-x-auto pb-4 -mx-1 px-1 no-scrollbar mb-6">
        <button
          onClick={() => setCuisine('all')}
          className="flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-all"
          style={{
            background: cuisine === 'all' ? '#2D2A26' : '#FFFDF9',
            color: cuisine === 'all' ? 'white' : '#8C8680',
            border: cuisine === 'all' ? '1.5px solid #2D2A26' : '1.5px solid #E5DFD6',
          }}
        >
          All
        </button>
        {CUISINES.map(c => (
          <button
            key={c}
            onClick={() => setCuisine(c)}
            className="flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-all whitespace-nowrap"
            style={{
              background: cuisine === c ? CUISINE_HEX[c] : '#FFFDF9',
              color: cuisine === c ? '#2D2A26' : '#8C8680',
              border: cuisine === c ? '1.5px solid #2D2A26' : '1.5px solid #E5DFD6',
            }}
          >
            {CUISINE_EMOJI[c]} {CUISINE_LABELS[c]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-[#2D2A26] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !currentDish ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">
            {liked.length > 0 ? '🎉' : '🍽️'}
          </div>
          <h2 className="text-xl font-bold text-[#2D2A26] mb-2">
            {liked.length > 0 ? `You liked ${liked.length} dishes!` : 'No more dishes'}
          </h2>
          <p className="text-[#8C8680] mb-6">
            {liked.length > 0 ? 'Your favourites are saved for menu generation.' : 'Try a different cuisine filter.'}
          </p>
          <button onClick={loadDishes} className="bg-[#2D2A26] text-white px-8 py-3 rounded-2xl font-semibold hover:bg-[#45403A] transition-colors">
            Start Over
          </button>
        </div>
      ) : (
        <>
          {/* Card stack */}
          <div className="relative mx-auto" style={{ maxWidth: '380px', height: '480px' }}>
            {/* Next card preview (behind) */}
            {dishes[currentIndex + 1] && (
              <div
                className="absolute inset-0 card p-0 overflow-hidden"
                style={{ transform: 'scale(0.95) translateY(12px)', opacity: 0.5 }}
              >
                <DishCardContent dish={dishes[currentIndex + 1]} />
              </div>
            )}

            {/* Current card */}
            <div
              ref={cardRef}
              className="absolute inset-0 card p-0 overflow-hidden cursor-grab active:cursor-grabbing select-none"
              style={{
                transform: swipeDir
                  ? undefined
                  : `translateX(${dragX}px) rotate(${rotation}deg)`,
                opacity: swipeDir ? undefined : opacity,
                animation: swipeDir === 'left'
                  ? 'slideOutLeft 0.3s cubic-bezier(0.16,1,0.3,1) forwards'
                  : swipeDir === 'right'
                  ? 'slideOutRight 0.3s cubic-bezier(0.16,1,0.3,1) forwards'
                  : !dragging && dragX === 0 ? 'cardEnter 0.3s cubic-bezier(0.16,1,0.3,1) both' : undefined,
                transition: dragging ? 'none' : 'transform 0.2s, opacity 0.2s',
                zIndex: 2,
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleTouchStart}
              onMouseMove={handleTouchMove}
              onMouseUp={handleTouchEnd}
              onMouseLeave={() => { if (dragging) handleTouchEnd() }}
            >
              {/* Swipe overlays */}
              {dragX > 40 && (
                <div className="absolute top-6 left-6 z-10 px-4 py-2 rounded-xl border-3 border-[#2E7D32] text-[#2E7D32] font-bold text-xl rotate-[-12deg]" style={{ background: 'rgba(232,245,233,0.9)' }}>
                  LIKE
                </div>
              )}
              {dragX < -40 && (
                <div className="absolute top-6 right-6 z-10 px-4 py-2 rounded-xl border-3 border-[#C62828] text-[#C62828] font-bold text-xl rotate-[12deg]" style={{ background: 'rgba(255,235,238,0.9)' }}>
                  NOPE
                </div>
              )}

              <DishCardContent dish={currentDish} />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-6 mt-8">
            <button
              onClick={() => handleSwipe('left')}
              className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              style={{ background: '#FFEBEE', border: '2px solid #EF9A9A' }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="#C62828" strokeWidth="2.5" strokeLinecap="round"/></svg>
            </button>
            <div className="text-center">
              <span className="text-[13px] text-[#8C8680] font-medium">{remaining} left</span>
            </div>
            <button
              onClick={() => handleSwipe('right')}
              className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              style={{ background: '#E8F5E9', border: '2px solid #A5D6A7' }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.501 5.501 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>

          {/* Liked counter */}
          {liked.length > 0 && (
            <div className="text-center mt-6">
              <span className="px-4 py-2 rounded-full bg-[#E8F5E9] text-[#2E7D32] text-[14px] font-semibold">
                {liked.length} liked
              </span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function DishCardContent({ dish }: { dish: Dish }) {
  const bg = CUISINE_HEX[dish.cuisine] || '#F5F0EA'

  return (
    <div className="h-full flex flex-col">
      {/* Colored header */}
      <div className="h-48 flex items-center justify-center relative" style={{ background: bg }}>
        <span className="text-8xl opacity-30">{CUISINE_EMOJI[dish.cuisine]}</span>
        {/* Veg/NV badge */}
        <div
          className="absolute top-4 right-4 w-6 h-6 rounded border-2 flex items-center justify-center"
          style={{ borderColor: dish.is_veg ? '#2E7D32' : '#C62828' }}
        >
          <div className="w-3 h-3 rounded-full" style={{ background: dish.is_veg ? '#2E7D32' : '#C62828' }} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 flex flex-col">
        <h2 className="text-[22px] font-bold text-[#2D2A26] mb-1">{dish.name_en}</h2>
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-1 rounded-full text-[12px] font-semibold" style={{ background: bg, color: '#2D2A26' }}>
            {CUISINE_EMOJI[dish.cuisine]} {CUISINE_LABELS[dish.cuisine]}
          </span>
          <span className="text-[13px] text-[#8C8680]">
            {dish.difficulty}
          </span>
        </div>

        {dish.description_en && (
          <p className="text-[14px] text-[#8C8680] leading-relaxed mb-4 line-clamp-2">
            {dish.description_en}
          </p>
        )}

        <div className="mt-auto">
          {/* Macro bar */}
          <div className="grid grid-cols-4 gap-3 py-4 border-t border-[#E5DFD6]">
            <MacroPill label="Cal" value={dish.calories} unit="" color="#E07B39" />
            <MacroPill label="Protein" value={dish.protein_g} unit="g" color="#D84315" />
            <MacroPill label="Carbs" value={dish.carbs_g} unit="g" color="#C49A2B" />
            <MacroPill label="Fat" value={dish.fat_g} unit="g" color="#7B61A9" />
          </div>
        </div>
      </div>
    </div>
  )
}

function MacroPill({ label, value, unit, color }: { label: string; value: number | null; unit: string; color: string }) {
  return (
    <div className="text-center">
      <div className="text-[16px] font-bold" style={{ color }}>
        {value ?? '—'}{value ? unit : ''}
      </div>
      <div className="text-[11px] text-[#8C8680] mt-0.5">{label}</div>
    </div>
  )
}
