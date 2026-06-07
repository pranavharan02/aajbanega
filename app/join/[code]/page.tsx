'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import { useAuth } from '@/components/AuthProvider'
import { setHouseholdId } from '@/lib/household'

export default function JoinPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const code = params.code as string
  const supabase = createSupabaseBrowser()

  const [householdName, setHouseholdName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadHousehold() {
      const { data } = await supabase
        .from('households')
        .select('id, name')
        .eq('invite_code', code)
        .single()

      if (data) {
        setHouseholdName(data.name || 'a household')
      } else {
        setError('Invalid or expired invite link.')
      }
      setLoading(false)
    }
    loadHousehold()
  }, [code, supabase])

  async function handleJoin() {
    if (!user) return
    setJoining(true)

    const { data: household } = await supabase
      .from('households')
      .select('id')
      .eq('invite_code', code)
      .single()

    if (!household) {
      setError('Household not found.')
      setJoining(false)
      return
    }

    const { error: memberErr } = await supabase
      .from('household_members')
      .insert({
        household_id: household.id,
        user_id: user.id,
        role: 'member',
      })

    if (memberErr) {
      if (memberErr.code === '23505') {
        setHouseholdId(household.id)
        router.push('/dashboard')
        return
      }
      setError(memberErr.message)
      setJoining(false)
      return
    }

    setHouseholdId(household.id)
    router.push('/dashboard')
  }

  if (loading || authLoading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-8 h-8 border-3 border-[#2D2A26] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-20 text-center">
        <div className="text-5xl mb-4">😕</div>
        <h1 className="text-2xl font-bold text-[#2D2A26] mb-2">Oops</h1>
        <p className="text-[#8C8680] mb-6">{error}</p>
        <Link href="/" className="text-[#2D2A26] underline font-medium">Go home</Link>
      </div>
    )
  }

  return (
    <div className="py-20 text-center max-w-sm mx-auto">
      <div className="text-5xl mb-4">🏠</div>
      <h1 className="text-[28px] font-bold text-[#2D2A26] mb-2">You're invited!</h1>
      <p className="text-[#8C8680] text-[17px] mb-8">
        Join <strong className="text-[#2D2A26]">{householdName}'s</strong> household to plan meals together.
      </p>

      {user ? (
        <button
          onClick={handleJoin}
          disabled={joining}
          className="w-full bg-[#2D2A26] text-white py-4 rounded-2xl font-semibold text-[17px] hover:bg-[#45403A] transition-colors disabled:opacity-50"
        >
          {joining ? 'Joining...' : 'Join Household'}
        </button>
      ) : (
        <Link
          href={`/login?next=/join/${code}`}
          className="block w-full bg-[#2D2A26] text-white py-4 rounded-2xl font-semibold text-[17px] hover:bg-[#45403A] transition-colors text-center"
        >
          Sign in to Join
        </Link>
      )}
    </div>
  )
}
