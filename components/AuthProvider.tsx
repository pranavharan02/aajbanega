'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  isTestMode: boolean
  testName: string | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({ user: null, isTestMode: false, testName: null, loading: true, signOut: async () => {} })

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isTestMode, setIsTestMode] = useState(false)
  const [testName, setTestName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseBrowser()

  useEffect(() => {
    // Check for test mode first
    if (typeof window !== 'undefined' && localStorage.getItem('akb_test_mode') === 'true') {
      setIsTestMode(true)
      setTestName(localStorage.getItem('akb_user_name'))
      setLoading(false)
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
      localStorage.removeItem('akb_test_mode')
      localStorage.removeItem('akb_user_name')
      localStorage.removeItem('akb_user_email')
      localStorage.removeItem('akb_household_id')
      localStorage.removeItem('akb_inventory_seeded')
      setIsTestMode(false)
      setTestName(null)
    }
    await supabase.auth.signOut()
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, isTestMode, testName, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
