'use client'

import { useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase-browser'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleGoogleLogin() {
    setLoading(true)
    setError('')
    const supabase = createSupabaseBrowser()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  async function handlePhoneLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const phone = form.get('phone') as string
    if (!phone) return

    setLoading(true)
    setError('')
    const supabase = createSupabaseBrowser()
    const { error } = await supabase.auth.signInWithOtp({
      phone: phone.startsWith('+') ? phone : `+91${phone}`,
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setLoading(false)
      setError('OTP sent! Check your phone.')
    }
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

        <div className="card p-6 space-y-5">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-[#E5DFD6] py-3.5 rounded-xl font-semibold text-[16px] text-[#2D2A26] hover:bg-[#FAFAF8] transition-colors disabled:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#E5DFD6]" />
            <span className="text-[13px] text-[#8C8680]">or</span>
            <div className="flex-1 h-px bg-[#E5DFD6]" />
          </div>

          <form onSubmit={handlePhoneLogin} className="space-y-3">
            <div className="flex gap-2">
              <span className="px-3 py-3 rounded-xl bg-[#F5F0EA] text-[15px] text-[#8C8680] font-medium">+91</span>
              <input
                name="phone"
                type="tel"
                placeholder="Phone number"
                className="flex-1 px-4 py-3 rounded-xl border border-[#E5DFD6] text-[16px] bg-[#FFFDF9] focus:outline-none focus:ring-2 focus:ring-[#2D2A26]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2D2A26] text-white py-3.5 rounded-xl font-semibold text-[15px] hover:bg-[#45403A] transition-colors disabled:opacity-50"
            >
              Send OTP
            </button>
          </form>

          {error && (
            <p className={`text-[14px] text-center ${error.includes('sent') ? 'text-[#2E7D32]' : 'text-[#C62828]'}`}>{error}</p>
          )}
        </div>

        <p className="text-center text-[13px] text-[#C5C0BA] mt-6">
          Free to use. No credit card needed.
        </p>
      </div>
    </div>
  )
}
