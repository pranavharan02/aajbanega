'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  async function handleTestLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) { setError('Name and email are required'); return }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/test-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      })

      const data = await res.json()
      if (data.error) {
        setError(data.error)
        setLoading(false)
        return
      }

      // Set cookies in document.cookie immediately so they're available
      // before the next page's useEffect runs (API Set-Cookie headers may
      // not be reflected in document.cookie fast enough for client-side reads)
      if (data.household_id) {
        document.cookie = `akb_household=${encodeURIComponent(data.household_id)}; path=/; max-age=${60*60*24*365}; samesite=lax`
        document.cookie = `akb_test_mode=true; path=/; max-age=${60*60*24*365}; samesite=lax`
      }

      const next = searchParams.get('next') || '/onboarding'
      router.push(next)
    } catch {
      setError('Network error. Please check your connection.')
      setLoading(false)
    }
  }

  function handleGoogleLogin() {
    setError('Google login is not configured yet. Use the name + email form above for now.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5" style={{ background: '#F5F0EA' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-[36px] font-extrabold text-[#2D2A26] leading-tight mb-2">आज क्या बनेगा?</h1>
          <p className="text-[#8C8680] text-[17px] leading-relaxed">
            Plan meals for the week.<br />Share with your cook. In their language.
          </p>
        </div>

        <form onSubmit={handleTestLogin} className="card p-6 space-y-4 mb-4">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-3.5 rounded-xl border border-[#E5DFD6] text-[16px] bg-[#FFFDF9] focus:outline-none focus:ring-2 focus:ring-[#2D2A26]"
          />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full px-4 py-3.5 rounded-xl border border-[#E5DFD6] text-[16px] bg-[#FFFDF9] focus:outline-none focus:ring-2 focus:ring-[#2D2A26]"
          />
          <button
            type="submit"
            disabled={loading || !name.trim() || !email.trim()}
            className="w-full bg-[#2D2A26] text-white py-3.5 rounded-xl font-semibold text-[16px] hover:bg-[#45403A] transition-colors disabled:opacity-50"
          >
            {loading ? 'Setting up...' : 'Get Started'}
          </button>
        </form>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-[#E5DFD6] py-3.5 rounded-xl font-semibold text-[15px] text-[#8C8680] hover:bg-[#FAFAF8] transition-colors disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {error && (
          <div className={`mt-4 p-3 rounded-xl text-[14px] text-center ${
            error.includes('not configured') ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-[#C62828]'
          }`}>
            {error}
          </div>
        )}

        <p className="text-center text-[13px] text-[#C5C0BA] mt-6">
          Free to use. No credit card needed.
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F0EA' }}>
        <div className="w-8 h-8 border-3 border-[#2D2A26] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
