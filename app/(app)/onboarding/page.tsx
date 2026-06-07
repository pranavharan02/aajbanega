'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import { getHouseholdId, setHouseholdId } from '@/lib/household'
import {
  CUISINE_LABELS, CUISINE_EMOJI, CUISINE_HEX,
  type CuisineType, type Dish,
} from '@/lib/types'
import { InstallPrompt } from '@/components/InstallPrompt'

const CUISINES: CuisineType[] = ['tamil', 'north', 'marathi', 'bihari', 'gujarati', 'bengali', 'kerala', 'andhra', 'goan', 'rajasthani', 'punjabi', 'kashmiri', 'cafe']

type Step = 'name' | 'household' | 'cuisines' | 'browse'

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createSupabaseBrowser()

  const [step, setStep] = useState<Step>('name')
  const [name, setName] = useState('')
  const [flatmates, setFlatmates] = useState<{ contact: string }[]>([])
  const [selectedCuisines, setSelectedCuisines] = useState<CuisineType[]>(['tamil', 'north'])
  const [saving, setSaving] = useState(false)
  const [invitesSent, setInvitesSent] = useState(false)
  const [householdId, setHhId] = useState<string | null>(null)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [existingMembers, setExistingMembers] = useState<{ id: string; email?: string }[]>([])

  // Browse state
  const [dishes, setDishes] = useState<Dish[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [liked, setLiked] = useState<string[]>([])
  const [likedDishes, setLikedDishes] = useState<Dish[]>([])
  const [dishLoading, setDishLoading] = useState(false)
  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | null>(null)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [nudgeDismissed, setNudgeDismissed] = useState(false)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const startX = useRef(0)

  useEffect(() => {
    async function init() {
      const cookieHhId = getHouseholdId()
      async function loadMembers(hhId: string) {
        const { data: members } = await supabase
          .from('household_members')
          .select('id, user_id')
          .eq('household_id', hhId)
        if (members && members.length > 0) {
          setExistingMembers(members.map(m => ({ id: m.id, email: m.user_id })))
        }
      }

      if (cookieHhId) {
        const { data } = await supabase.from('households').select('id, name, invite_code').eq('id', cookieHhId).single()
        if (data) {
          setHhId(data.id)
          setName(data.name || '')
          setInviteCode(data.invite_code || null)
          await loadMembers(data.id)
          setStep('household')
          setReady(true)
          return
        }
      }
      if (user) {
        const { data } = await supabase.from('households').select('id, name, invite_code').eq('user_id', user.id).single()
        if (data) {
          setHhId(data.id)
          setName(data.name || user.user_metadata?.full_name || '')
          setInviteCode(data.invite_code || null)
          setHouseholdId(data.id)
          await loadMembers(data.id)
          setStep('household')
          setReady(true)
          return
        }
        setName(user.user_metadata?.full_name || '')
      }
      setReady(true)
    }
    init()
  }, [user, supabase])

  async function handleNameNext() {
    if (!name.trim()) return
    setSaving(true)
    if (householdId) {
      await supabase.from('households').update({ name: name.trim() }).eq('id', householdId)
    } else {
      const { data } = await supabase
        .from('households')
        .insert({
          user_id: user?.id || null,
          name: name.trim(),
          default_servings: 2,
          default_cuisines: ['tamil', 'north'],
          default_veg_days: 4,
          preferred_cook_lang: 'hi',
          default_meals: ['dinner'],
        })
        .select('id, invite_code')
        .single()
      if (data) {
        setHhId(data.id)
        setInviteCode(data.invite_code)
        setHouseholdId(data.id)
      }
    }
    setSaving(false)
    setStep('household')
  }

  function addFlatmate() { setFlatmates(prev => [...prev, { contact: '' }]) }
  function updateFlatmate(index: number, contact: string) { setFlatmates(prev => prev.map((f, i) => i === index ? { contact } : f)) }
  function removeFlatmate(index: number) { setFlatmates(prev => prev.filter((_, i) => i !== index)) }

  function getInviteUrl() {
    if (typeof window === 'undefined' || !inviteCode) return ''
    return `${window.location.origin}/join/${inviteCode}`
  }

  function sendWhatsAppInvite(contact: string) {
    const url = getInviteUrl()
    const message = `Hey! Join my household on आज क्या बनेगा? — we'll plan meals together.\n\n${url}`
    const waUrl = `https://wa.me/${contact.startsWith('+') ? contact.replace(/\D/g, '') : '91' + contact.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
    window.open(waUrl, '_blank')
  }

  function sendAllInvites() {
    flatmates.filter(f => f.contact.trim()).forEach(f => sendWhatsAppInvite(f.contact))
    setInvitesSent(true)
  }

  // Load dishes for selected cuisines when entering browse step
  const loadDishes = useCallback(async () => {
    setDishLoading(true)
    const { data } = await supabase
      .from('dishes')
      .select('*')
      .in('cuisine', selectedCuisines)
      .order('name_en')
    if (data) {
      const shuffled = [...data].sort(() => Math.random() - 0.5).slice(0, 30)
      setDishes(shuffled as Dish[])
      setCurrentIndex(0)
      setLiked([])
    }
    setDishLoading(false)
  }, [selectedCuisines, supabase])

  function startBrowse() {
    if (selectedCuisines.length === 0) return
    setStep('browse')
    loadDishes()
  }

  // Swipe handlers
  const currentDish = dishes[currentIndex]
  const remaining = dishes.length - currentIndex

  function handleSwipe(direction: 'left' | 'right') {
    if (!currentDish) return
    setSwipeDir(direction)
    if (direction === 'right') {
      setLiked(prev => [...prev, currentDish.id])
      setLikedDishes(prev => [...prev, currentDish])
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

  async function handleFinish() {
    const hhId = householdId
    if (!hhId) {
      const { data } = await supabase
        .from('households')
        .insert({
          user_id: user?.id || null,
          name: name.trim() || 'My Household',
          default_servings: 2,
          default_cuisines: selectedCuisines,
          default_veg_days: 4,
          preferred_cook_lang: 'hi',
          default_meals: ['dinner'],
          onboarding_done: true,
        })
        .select('id')
        .single()
      if (data) setHouseholdId(data.id)
      setShowInstallPrompt(true)
      setTimeout(() => { window.location.href = '/dashboard' }, 6000)
      return
    }

    setSaving(true)
    await supabase.from('households').update({
      default_cuisines: selectedCuisines,
      onboarding_done: true,
    }).eq('id', hhId)
    setSaving(false)
    setShowInstallPrompt(true)
    setTimeout(() => { router.push('/dashboard') }, 6000)
  }

  const rotation = dragX * 0.05
  const opacity = Math.max(0.5, 1 - Math.abs(dragX) / 400)

  const allSteps: Step[] = ['name', 'household', 'cuisines', 'browse']
  const stepIndex = allSteps.indexOf(step)

  if (!ready) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-8 h-8 border-3 border-[#2D2A26] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="py-8 max-w-md mx-auto">
      {/* Progress */}
      <div className="flex gap-2 mb-10">
        {allSteps.map((s, i) => (
          <div
            key={s}
            className={`flex-1 h-1.5 rounded-full transition-colors ${
              i <= stepIndex ? 'bg-[#2D2A26]' : 'bg-[#E5DFD6]'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Name */}
      {step === 'name' && (
        <div>
          <h1 className="text-[28px] font-bold text-[#2D2A26] mb-2">What&apos;s your name?</h1>
          <p className="text-[#8C8680] text-[16px] mb-8">So your household knows who&apos;s planning the meals.</p>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            autoFocus
            className="w-full px-5 py-4 rounded-2xl border-2 border-[#E5DFD6] text-[18px] bg-[#FFFDF9] focus:outline-none focus:border-[#2D2A26] transition-colors mb-6"
          />
          <button
            onClick={handleNameNext}
            disabled={!name.trim() || saving}
            className="w-full bg-[#2D2A26] text-white py-4 rounded-2xl font-semibold text-[17px] hover:bg-[#45403A] transition-colors disabled:opacity-50"
          >
            {saving ? 'Setting up...' : 'Continue'}
          </button>
        </div>
      )}

      {/* Step 2: Household */}
      {step === 'household' && (
        <div>
          <h1 className="text-[28px] font-bold text-[#2D2A26] mb-2">Who else lives with you?</h1>
          <p className="text-[#8C8680] text-[16px] mb-8">Invite flatmates so they can see and edit the menu too.</p>

          {existingMembers.length > 0 && (
            <div className="mb-6">
              <p className="text-[13px] font-semibold text-[#8C8680] uppercase tracking-wide mb-3">Already joined</p>
              <div className="space-y-2">
                {existingMembers.map(m => (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#E8F5E9] border border-[#A5D6A7]/40">
                    <div className="w-8 h-8 rounded-full bg-[#2E7D32]/10 flex items-center justify-center text-[14px]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <span className="text-[14px] text-[#2D2A26] font-medium">Flatmate</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="ml-auto"><path d="M20 6L9 17l-5-5" stroke="#2E7D32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                ))}
              </div>
            </div>
          )}

          {flatmates.length > 0 && (
            <div className="space-y-3 mb-6">
              {flatmates.map((f, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={f.contact}
                    onChange={e => updateFlatmate(i, e.target.value)}
                    placeholder="Phone number or email"
                    className="flex-1 px-4 py-3.5 rounded-xl border border-[#E5DFD6] text-[16px] bg-[#FFFDF9] focus:outline-none focus:ring-2 focus:ring-[#2D2A26]"
                  />
                  <button
                    onClick={() => removeFlatmate(i)}
                    className="w-11 h-11 rounded-xl bg-[#F5F0EA] hover:bg-[#E5DFD6] flex items-center justify-center text-[#8C8680] transition-colors flex-shrink-0"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4L12 12M4 12L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={addFlatmate}
            className="w-full card p-4 text-left flex items-center gap-4 hover:shadow-md transition-shadow mb-8"
          >
            <div className="w-11 h-11 rounded-xl bg-[#F5F0EA] flex items-center justify-center text-[20px]">+</div>
            <div>
              <p className="font-semibold text-[16px] text-[#2D2A26]">Add a flatmate</p>
              <p className="text-[13px] text-[#8C8680]">They&apos;ll get a WhatsApp invite to join</p>
            </div>
          </button>

          {flatmates.length > 0 && flatmates.some(f => f.contact.trim()) && !invitesSent && (
            <button
              onClick={sendAllInvites}
              className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-semibold text-[17px] hover:bg-[#20BD5A] transition-colors mb-3 flex items-center justify-center gap-3"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.571-1.46A11.93 11.93 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.37 0-4.554-.804-6.298-2.152l-.44-.348-2.713.867.91-2.631-.382-.464A9.935 9.935 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
              Send WhatsApp Invites
            </button>
          )}

          {invitesSent && (
            <div className="card p-4 mb-3 text-center">
              <p className="text-[#2E7D32] font-semibold text-[15px]">Invites opened in WhatsApp!</p>
              <p className="text-[13px] text-[#8C8680] mt-1">They can join anytime using the link.</p>
            </div>
          )}

          <button
            onClick={() => setStep('cuisines')}
            className="w-full bg-[#2D2A26] text-white py-4 rounded-2xl font-semibold text-[17px] hover:bg-[#45403A] transition-colors"
          >
            {flatmates.length > 0 || existingMembers.length > 0 ? 'Continue' : "It's only me"}
          </button>

          {flatmates.length === 0 && existingMembers.length === 0 && (
            <p className="text-center text-[13px] text-[#C5C0BA] mt-4">You can always invite people later from Settings.</p>
          )}
        </div>
      )}

      {/* Step 3: Pick cuisines */}
      {step === 'cuisines' && (
        <div>
          <h1 className="text-[28px] font-bold text-[#2D2A26] mb-2">Plan your first menu</h1>
          <p className="text-[#8C8680] text-[16px] mb-8">Pick the cuisines you love. We&apos;ll show you dishes to browse next.</p>

          <div className="grid grid-cols-3 gap-2.5 mb-10">
            {CUISINES.map(c => {
              const sel = selectedCuisines.includes(c)
              return (
                <button
                  key={c}
                  onClick={() => setSelectedCuisines(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
                  className="relative py-3.5 px-2 rounded-xl text-[13px] font-semibold text-center transition-all border-2"
                  style={{
                    background: sel ? CUISINE_HEX[c] : '#FFFDF9',
                    borderColor: sel ? '#2D2A26' : '#E5DFD6',
                    color: '#2D2A26',
                  }}
                >
                  {CUISINE_EMOJI[c]} {CUISINE_LABELS[c]}
                  {sel && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#2D2A26] flex items-center justify-center">
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          <button
            onClick={startBrowse}
            disabled={selectedCuisines.length === 0}
            className="w-full bg-[#2D2A26] text-white py-4 rounded-2xl font-semibold text-[17px] hover:bg-[#45403A] transition-colors disabled:opacity-50"
          >
            Browse Dishes
          </button>
          <p className="text-center text-[13px] text-[#C5C0BA] mt-3">
            {selectedCuisines.length} cuisine{selectedCuisines.length !== 1 ? 's' : ''} selected
          </p>
        </div>
      )}

      {/* Step 4: Browse dishes (swipe) */}
      {step === 'browse' && (
        <div>
          <h1 className="text-[28px] font-bold text-[#2D2A26] mb-1">Discover dishes</h1>
          <p className="text-[#8C8680] text-[15px] mb-4">Swipe right on dishes you like. We&apos;ll remember your favourites.</p>

          {/* Nudge after 10 swipes — shown at top */}
          {currentIndex >= 10 && !nudgeDismissed && currentDish && (
            <div className="card p-4 mb-4" style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) both' }}>
              <p className="text-[15px] font-semibold text-[#2D2A26] mb-1">
                {liked.length > 0 ? `Nice — ${liked.length} dish${liked.length !== 1 ? 'es' : ''} liked!` : "You've seen a bunch!"}
              </p>
              <p className="text-[13px] text-[#8C8680] mb-3">
                You can keep swiping or jump straight to planning your menu.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleFinish}
                  disabled={saving}
                  className="flex-1 bg-[#2D2A26] text-white py-3 rounded-xl font-semibold text-[14px] hover:bg-[#45403A] transition-colors disabled:opacity-50"
                >
                  {saving ? 'Setting up...' : 'Plan Menu'}
                </button>
                <button
                  onClick={() => setNudgeDismissed(true)}
                  className="px-4 py-3 rounded-xl bg-[#F5F0EA] text-[#8C8680] text-[14px] font-medium hover:bg-[#E5DFD6] transition-colors"
                >
                  Keep Swiping
                </button>
              </div>
            </div>
          )}

          {/* Liked dishes strip */}
          {likedDishes.length > 0 && (
            <div className="mb-4 overflow-hidden">
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {likedDishes.map(d => (
                  <div
                    key={d.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold flex-shrink-0 border"
                    style={{
                      background: CUISINE_HEX[d.cuisine] || '#F5F0EA',
                      borderColor: 'rgba(45,42,38,0.1)',
                      animation: 'fadeInUp 0.3s cubic-bezier(0.16,1,0.3,1) both',
                    }}
                  >
                    <span>{CUISINE_EMOJI[d.cuisine]}</span>
                    <span className="text-[#2D2A26] max-w-[120px] truncate">{d.name_en}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dishLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-3 border-[#2D2A26] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !currentDish ? (
            /* Done swiping */
            <div className="text-center py-12">
              <div className="text-6xl mb-4">{liked.length > 0 ? '🎉' : '👍'}</div>
              <h2 className="text-xl font-bold text-[#2D2A26] mb-2">
                {liked.length > 0 ? `You liked ${liked.length} dish${liked.length !== 1 ? 'es' : ''}!` : 'All done!'}
              </h2>
              <p className="text-[#8C8680] mb-8">
                {liked.length > 0 ? "Your favourites are saved. Let's start planning." : "No worries — you can browse anytime from the menu."}
              </p>
              <button
                onClick={handleFinish}
                disabled={saving}
                className="w-full bg-[#2D2A26] text-white py-4 rounded-2xl font-semibold text-[17px] hover:bg-[#45403A] transition-colors disabled:opacity-50"
              >
                {saving ? 'Setting up...' : 'Go to Dashboard'}
              </button>
            </div>
          ) : (
            <>
              {/* Card stack */}
              <div className="relative mx-auto" style={{ maxWidth: '340px', height: 'min(400px, 55vh)' }}>
                {/* Next card preview */}
                {dishes[currentIndex + 1] && (
                  <div
                    className="absolute inset-0 card p-0 overflow-hidden"
                    style={{ transform: 'scale(0.95) translateY(10px)', opacity: 0.5 }}
                  >
                    <SwipeCardContent dish={dishes[currentIndex + 1]} />
                  </div>
                )}

                {/* Current card */}
                <div
                  className="absolute inset-0 card p-0 overflow-hidden cursor-grab active:cursor-grabbing select-none"
                  style={{
                    transform: swipeDir ? undefined : `translateX(${dragX}px) rotate(${rotation}deg)`,
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
                  {dragX > 40 && (
                    <div className="absolute top-5 left-5 z-10 px-4 py-2 rounded-xl border-3 border-[#2E7D32] text-[#2E7D32] font-bold text-lg rotate-[-12deg]" style={{ background: 'rgba(232,245,233,0.9)' }}>
                      LIKE
                    </div>
                  )}
                  {dragX < -40 && (
                    <div className="absolute top-5 right-5 z-10 px-4 py-2 rounded-xl border-3 border-[#C62828] text-[#C62828] font-bold text-lg rotate-[12deg]" style={{ background: 'rgba(255,235,238,0.9)' }}>
                      SKIP
                    </div>
                  )}
                  <SwipeCardContent dish={currentDish} />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-center gap-6 mt-6">
                <button
                  onClick={() => handleSwipe('left')}
                  className="w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                  style={{ background: '#FFEBEE', border: '2px solid #EF9A9A' }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="#C62828" strokeWidth="2.5" strokeLinecap="round"/></svg>
                </button>
                <div className="text-center">
                  <span className="text-[13px] text-[#8C8680] font-medium">{remaining} left</span>
                </div>
                <button
                  onClick={() => handleSwipe('right')}
                  className="w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                  style={{ background: '#E8F5E9', border: '2px solid #A5D6A7' }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.501 5.501 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>

              {liked.length > 0 && (
                <div className="text-center mt-4">
                  <span className="px-4 py-2 rounded-full bg-[#E8F5E9] text-[#2E7D32] text-[13px] font-semibold">
                    {liked.length} liked
                  </span>
                </div>
              )}

              {/* Skip browsing link */}
              {currentIndex < 10 && (
                <button
                  onClick={handleFinish}
                  className="w-full text-center text-[14px] text-[#8C8680] hover:text-[#2D2A26] transition-colors mt-6 py-2"
                >
                  Skip — I&apos;ll browse later
                </button>
              )}
            </>
          )}
        </div>
      )}
      <InstallPrompt show={showInstallPrompt} />
    </div>
  )
}

function SwipeCardContent({ dish }: { dish: Dish }) {
  const bg = CUISINE_HEX[dish.cuisine] || '#F5F0EA'
  return (
    <div className="h-full flex flex-col">
      <div className="h-36 flex items-center justify-center relative" style={{ background: bg }}>
        <span className="text-7xl opacity-30">{CUISINE_EMOJI[dish.cuisine]}</span>
        <div
          className="absolute top-3 right-3 w-6 h-6 rounded border-2 flex items-center justify-center"
          style={{ borderColor: dish.is_veg ? '#2E7D32' : '#C62828' }}
        >
          <div className="w-3 h-3 rounded-full" style={{ background: dish.is_veg ? '#2E7D32' : '#C62828' }} />
        </div>
      </div>
      <div className="flex-1 p-5 flex flex-col">
        <h2 className="text-[20px] font-bold text-[#2D2A26] mb-1">{dish.name_en}</h2>
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-1 rounded-full text-[12px] font-semibold" style={{ background: bg, color: '#2D2A26' }}>
            {CUISINE_EMOJI[dish.cuisine]} {CUISINE_LABELS[dish.cuisine]}
          </span>
          <span className="text-[13px] text-[#8C8680]">{dish.difficulty}</span>
        </div>
        {dish.description_en && (
          <p className="text-[13px] text-[#8C8680] leading-relaxed line-clamp-2 mb-3">{dish.description_en}</p>
        )}
        <div className="mt-auto grid grid-cols-4 gap-2 pt-3 border-t border-[#E5DFD6]">
          <div className="text-center">
            <div className="text-[15px] font-bold text-[#E07B39]">{dish.calories ?? '—'}</div>
            <div className="text-[10px] text-[#8C8680]">Cal</div>
          </div>
          <div className="text-center">
            <div className="text-[15px] font-bold text-[#D84315]">{dish.protein_g ?? '—'}{dish.protein_g ? 'g' : ''}</div>
            <div className="text-[10px] text-[#8C8680]">Protein</div>
          </div>
          <div className="text-center">
            <div className="text-[15px] font-bold text-[#C49A2B]">{dish.carbs_g ?? '—'}{dish.carbs_g ? 'g' : ''}</div>
            <div className="text-[10px] text-[#8C8680]">Carbs</div>
          </div>
          <div className="text-center">
            <div className="text-[15px] font-bold text-[#1E3A5F]">{dish.fat_g ?? '—'}{dish.fat_g ? 'g' : ''}</div>
            <div className="text-[10px] text-[#8C8680]">Fat</div>
          </div>
        </div>
      </div>
    </div>
  )
}
