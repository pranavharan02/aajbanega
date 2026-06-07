'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'

const links = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/browse', label: 'Browse', icon: '🍽️' },
  { href: '/inventory', label: 'Pantry', icon: '🫙' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
]

export function Nav() {
  const pathname = usePathname()
  const { user, isTestMode, signOut } = useAuth()
  if (pathname?.startsWith('/cook')) return null
  if (pathname === '/login') return null

  const isLoggedIn = user || isTestMode

  return (
    <nav className="flex items-center justify-between py-5">
      <Link href="/" className="text-[28px] font-extrabold tracking-tight text-[#2D2A26] leading-none">
        आज क्या बनेगा?
      </Link>
      <div className="flex items-center gap-2">
        {isLoggedIn && (
          <div className="flex gap-1 p-1 rounded-2xl bg-[#FFFDF9] border border-[#E5DFD6]" style={{boxShadow:'0 1px 4px rgba(45,42,38,0.04)'}}>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-xl text-[14px] font-semibold transition-all ${
                  pathname === link.href
                    ? 'bg-[#2D2A26] text-white shadow-sm'
                    : 'text-[#8C8680] hover:text-[#2D2A26]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
        <div className="px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold tracking-wide uppercase">
          Beta
        </div>
        {isLoggedIn && (
          <button
            onClick={signOut}
            className="w-9 h-9 rounded-xl bg-[#FFFDF9] border border-[#E5DFD6] flex items-center justify-center text-[#8C8680] hover:text-[#C62828] transition-colors"
            title="Sign out"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 14H3.33C2.6 14 2 13.4 2 12.67V3.33C2 2.6 2.6 2 3.33 2H6M10.67 11.33L14 8L10.67 4.67M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        )}
      </div>
    </nav>
  )
}
