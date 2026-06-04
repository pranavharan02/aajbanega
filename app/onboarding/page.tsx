'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import { getHouseholdId, setHouseholdId } from '@/lib/household'
import { CUISINE_LABELS, MEAL_LABELS, MEAL_EMOJI, MEAL_ORDER, type CuisineType, type MealType } from '@/lib/types'

const CUISINES: CuisineType[] = ['tamil', 'north', 'marathi', 'bihari', 'gujarati', 'bengali', 'kerala', 'andhra', 'goan', 'rajasthani', 'punjabi', 'kashmiri']
const CUISINE_EMOJI: Record<string, string> = {
  tamil: '🥥', north: '🫓', marathi: '🌶', bihari: '🫘',
  gujarati: '🫙', bengali: '🐟', kerala: '🌴', andhra: '🔥',
  goan: '🦐', rajasthani: '🏜️', punjabi: '🧈', kashmiri: '🏔️',
}

type Step = 'name' | 'household' | 'preferences'

export default function OnboardingPage() {
  const router = useRouter()
  const { user, isTestMode } = useAuth()
  const supabase = createSupabaseBrowser()

  // In test mode, household was already created at login — skip to step 2
  const existingHouseholdId = getHouseholdId()
  const startStep: Step = (isTestMode && existingHouseholdId) ? 'household' : 'name'

  const [step, setStep] = useState<Step>(startStep)
  const [name, setName] = useState(user?.user_metadata?.full_name || '')
  const [flatmates, setFlatmates] = useState<{ contact: string }[]>([])
  const [selectedCuisines, setSelectedCuisines] = useState<CuisineType[]>(['tamil', 'north'])
  const [selectedMeals, setSelectedMeals] = useState<MealType[]>(['dinner'])
  const [vegDays, setVegDays] = useState(4)
  const [saving, setSaving] = useState(false)
  const [invitesSent, setInvitesSent] = useState(false)
  const [householdId, setHhId] = useState<string | null>(existingHouseholdId)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [codeLoaded, setCodeLoaded] = useState(false)

  // Fetch invite code + name for existing household
  if (existingHouseholdId && !codeLoaded) {
    setCodeLoaded(true)
    supabase.from('households').select('invite_code, name').eq('id', existingHouseholdId).single()
      .then(({ data }) => {
        if (data?.invite_code) setInviteCode(data.invite_code)
        if (data?.name && !name) setName(data.name)
      })
  }

  function addFlatmate() {
    setFlatmates(prev => [...prev, { contact: '' }])
  }

  function updateFlatmate(index: number, contact: string) {
    setFlatmates(prev => prev.map((f, i) => i === index ? { contact } : f))
  }

  function removeFlatmate(index: number) {
    setFlatmates(prev => prev.filter((_, i) => i !== index))
  }

  async function handleNameNext() {
    if (!name.trim()) return
    setSaving(true)

    const { data: household } = await supabase
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

    if (household) {
      setHhId(household.id)
      setInviteCode(household.invite_code)
      setHouseholdId(household.id)
    }
    setSaving(false)
    setStep('household')
  }

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
    const valid = flatmates.filter(f => f.contact.trim())
    valid.forEach(f => sendWhatsAppInvite(f.contact))
    setInvitesSent(true)
  }

  async function handleFinish() {
    if (!householdId) return
    setSaving(true)
    await supabase.from('households').update({
      default_cuisines: selectedCuisines,
      default_veg_days: vegDays,
      default_meals: selectedMeals,
      onboarding_done: true,
    }).eq('id', householdId)
    setSaving(false)
    router.push('/')
  }

  return (
    <div className="py-8 max-w-md mx-auto">
      {/* Progress */}
      <div className="flex gap-2 mb-10">
        {(['name', 'household', 'preferences'] as Step[]).map((s, i) => (
          <div
            key={s}
            className={`flex-1 h-1.5 rounded-full transition-colors ${
              i <= ['name', 'household', 'preferences'].indexOf(step)
                ? 'bg-[#2D2A26]' : 'bg-[#E5DFD6]'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Name */}
      {step === 'name' && (
        <div>
          <h1 className="text-[28px] font-bold text-[#2D2A26] mb-2">What's your name?</h1>
          <p className="text-[#8C8680] text-[16px] mb-8">So your household knows who's planning the meals.</p>

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

          <div className="space-y-3 mb-8">
            <button
              onClick={addFlatmate}
              className="w-full card p-4 text-left flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className="w-11 h-11 rounded-xl bg-[#F5F0EA] flex items-center justify-center text-[20px]">+</div>
              <div>
                <p className="font-semibold text-[16px] text-[#2D2A26]">Add a flatmate</p>
                <p className="text-[13px] text-[#8C8680]">They'll get a WhatsApp invite to join</p>
              </div>
            </button>
          </div>

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

          <div className="flex gap-3">
            <button
              onClick={() => setStep('preferences')}
              className="flex-1 bg-[#2D2A26] text-white py-4 rounded-2xl font-semibold text-[17px] hover:bg-[#45403A] transition-colors"
            >
              {flatmates.length > 0 ? 'Continue' : 'It\'s only me'}
            </button>
          </div>

          {flatmates.length === 0 && (
            <p className="text-center text-[13px] text-[#C5C0BA] mt-4">You can always invite people later from Settings.</p>
          )}
        </div>
      )}

      {/* Step 3: Preferences */}
      {step === 'preferences' && (
        <div>
          <h1 className="text-[28px] font-bold text-[#2D2A26] mb-2">Set your preferences</h1>
          <p className="text-[#8C8680] text-[16px] mb-8">Pick your cuisines and meal routine. You can change these anytime.</p>

          {/* Meals */}
          <div className="mb-8">
            <h2 className="text-[15px] font-semibold text-[#2D2A26] mb-3">Meals to plan</h2>
            <div className="flex gap-2">
              {MEAL_ORDER.map(m => (
                <button
                  key={m}
                  onClick={() => setSelectedMeals(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])}
                  className={`flex-1 py-3 rounded-xl text-[14px] font-semibold text-center transition-all ${
                    selectedMeals.includes(m)
                      ? 'bg-[#2D2A26] text-white' : 'bg-[#FFFDF9] border border-[#E5DFD6] text-[#2D2A26]'
                  }`}
                >
                  {MEAL_EMOJI[m]} {MEAL_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

          {/* Veg/NV */}
          <div className="mb-8">
            <h2 className="text-[15px] font-semibold text-[#2D2A26] mb-3">Veg / Non-Veg split</h2>
            <div className="card p-5">
              <div className="flex justify-between text-[15px] mb-3">
                <span className="text-[#2E7D32] font-semibold">{vegDays} veg</span>
                <span className="text-[#C62828] font-semibold">{7 - vegDays} non-veg</span>
              </div>
              <input type="range" min={0} max={7} value={vegDays} onChange={e => setVegDays(Number(e.target.value))} className="w-full" />
            </div>
          </div>

          {/* Cuisines */}
          <div className="mb-10">
            <h2 className="text-[15px] font-semibold text-[#2D2A26] mb-3">Favourite cuisines</h2>
            <div className="grid grid-cols-3 gap-2">
              {CUISINES.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedCuisines(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
                  className={`py-3 px-2 rounded-xl text-[13px] font-semibold text-center transition-all ${
                    selectedCuisines.includes(c)
                      ? 'bg-[#2D2A26] text-white' : 'bg-[#FFFDF9] border border-[#E5DFD6] text-[#2D2A26]'
                  }`}
                >
                  {CUISINE_EMOJI[c]} {CUISINE_LABELS[c]}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleFinish}
            disabled={saving || selectedCuisines.length === 0 || selectedMeals.length === 0}
            className="w-full bg-[#2D2A26] text-white py-4 rounded-2xl font-semibold text-[17px] hover:bg-[#45403A] transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Start Planning'}
          </button>
        </div>
      )}
    </div>
  )
}
