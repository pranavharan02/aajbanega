'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'

const links = [
  { href: '/', label: 'Home', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { href: '/browse', label: 'Browse', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { href: '/inventory', label: 'Pantry', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg> },
  { href: '/settings', label: 'Settings', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg> },
]

export function Nav() {
  const pathname = usePathname()
  const { user, isTestMode, signOut } = useAuth()
  if (pathname?.startsWith('/cook')) return null
  if (pathname === '/login') return null

  const isLoggedIn = user || isTestMode

  return (
    <>
      {/* Top bar */}
      <nav className="flex items-center justify-between py-4">
        <Link href="/" className="text-[22px] sm:text-[28px] font-extrabold tracking-tight text-[#2D2A26] leading-none">
          आज क्या बनेगा?
        </Link>
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] sm:text-[11px] font-bold tracking-wide uppercase">
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

      {/* Bottom tab bar (mobile-native feel) */}
      {isLoggedIn && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#FFFDF9] border-t border-[#E5DFD6] safe-area-bottom" style={{ boxShadow: '0 -2px 12px rgba(45,42,38,0.06)' }}>
          <div className="flex justify-around items-center max-w-[680px] mx-auto px-2 pt-2 pb-[max(8px,env(safe-area-inset-bottom))]">
            {links.map((link) => {
              const active = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[60px] ${
                    active
                      ? 'text-[#2D2A26]'
                      : 'text-[#C5C0BA]'
                  }`}
                >
                  <span className={active ? 'text-[#2D2A26]' : 'text-[#C5C0BA]'}>{link.icon}</span>
                  <span className={`text-[11px] font-semibold ${active ? 'text-[#2D2A26]' : 'text-[#C5C0BA]'}`}>{link.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
