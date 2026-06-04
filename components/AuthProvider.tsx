'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import type { User } from '@supabase/supabase-js'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`
}

interface AuthContextType {
  user: User | null
  isTestMode: boolean
  testHouseholdId: string | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({ user: null, isTestMode: false, testHouseholdId: null, loading: true, signOut: async () => {} })

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isTestMode, setIsTestMode] = useState(false)
  const [testHouseholdId, setTestHouseholdId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseBrowser()

  useEffect(() => {
    // Check for test mode cookie
    const testCookie = getCookie('akb_test_mode')
    const hhCookie = getCookie('akb_household')
    if (testCookie === 'true' && hhCookie) {
      setIsTestMode(true)
      setTestHouseholdId(hhCookie)
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  async function signOut() {
    if (isTestMode) {
      deleteCookie('akb_test_mode')
      deleteCookie('akb_household')
      setIsTestMode(false)
      setTestHouseholdId(null)
    }
    await supabase.auth.signOut()
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, isTestMode, testHouseholdId, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
