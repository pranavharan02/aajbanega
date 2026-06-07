'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'

function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useReveal()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  )
}

const FEATURES = [
  {
    num: '01',
    title: 'Your weekly menu, sorted',
    desc: 'Pick your favourite cuisines, set how many veg and non-veg days you want, and get a balanced weekly menu — breakfast, lunch, and dinner. 216 dishes across 13 cuisines.',
    accent: '#E8D5C4',
    icon: '📋',
  },
  {
    num: '02',
    title: 'Share recipes with your cook',
    desc: 'Send your cook a single link. They see today\'s recipe in Hindi or Marathi — ingredients, quantities, step-by-step instructions — in large, clear text. No app download needed.',
    accent: '#D4E8D4',
    icon: '🗣️',
  },
  {
    num: '03',
    title: 'Smart shopping list',
    desc: 'The app tracks what\'s already in your pantry and builds a day-wise shopping list with only what you need to buy. No more forgetting jeera or buying double the onions.',
    accent: '#F5E6CC',
    icon: '🛒',
  },
]

export default function LandingV1() {
  return (
    <div className="landing-page">
      {/* Hero */}
      <div className="text-center pt-8 pb-16">
        <h1
          className="text-[36px] font-extrabold text-[#2D2A26] leading-tight mb-3 tracking-tight"
          style={{ animation: 'heroIn 0.7s cubic-bezier(0.16,1,0.3,1) both' }}
        >
          Your cook asks.<br />
          <span className="text-[#8C8680]">You&apos;re ready.</span>
        </h1>
        <p
          className="text-[17px] text-[#8C8680] leading-relaxed max-w-sm mx-auto mb-8"
          style={{ animation: 'heroIn 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s both' }}
        >
          Plan meals for the week. Share recipes with your cook in Hindi or Marathi. No app needed.
        </p>

        <div
          className="mx-auto rounded-2xl overflow-hidden shadow-2xl border border-[#D1D7DB]/50"
          style={{ maxWidth: '400px', animation: 'heroIn 0.7s cubic-bezier(0.16,1,0.3,1) 0.2s both' }}
        >
          <div className="flex items-center gap-3 px-4 py-3" style={{ background: '#075E54' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
            <div className="w-10 h-10 rounded-full bg-[#DFE5E7] flex items-center justify-center text-[16px]">👩‍🍳</div>
            <div className="text-left">
              <div className="text-white text-[16px] font-medium leading-tight">Didi (Cook)</div>
              <div className="text-[12px] leading-tight" style={{ color: '#8EBDB6' }}>online</div>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 001.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 00-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 005.34-1.48l.27.28v.79l4.26 4.25c.41.41 1.07.41 1.48 0 .41-.41.41-1.07 0-1.48L15.5 14z M9.5 14C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="5.5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="18.5" r="1.5"/></svg>
            </div>
          </div>
          <div className="px-4 py-4 space-y-2" style={{ background: '#ECE5DD', backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'200\' height=\'200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23c6bfb5\' fill-opacity=\'0.15\'%3E%3Cpath d=\'M20 10c0-5.5-4.5-10-10-10S0 4.5 0 10s4.5 10 10 10 10-4.5 10-10zm-18 0c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8-8-3.6-8-8z\'/%3E%3C/g%3E%3C/svg%3E")' }}>
            <div className="flex justify-center mb-1">
              <span className="px-3 py-1 rounded-lg text-[11px] font-medium shadow-sm" style={{ background: '#E1F2FA', color: '#5B7A84' }}>TODAY</span>
            </div>
            <div className="flex justify-start" style={{ animation: 'msgIn 0.4s cubic-bezier(0.16,1,0.3,1) 0.5s both' }}>
              <div className="relative rounded-lg rounded-tl-sm px-4 py-2 shadow-sm" style={{ background: '#FFFFFF', maxWidth: '80%' }}>
                <p className="text-[18px] text-[#111B21] font-medium">aaj kya banaun? 🍳</p>
                <div className="flex items-center justify-end gap-1 -mb-0.5">
                  <span className="text-[11px]" style={{ color: '#667781' }}>6:32 pm</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end" style={{ animation: 'msgIn 0.4s cubic-bezier(0.16,1,0.3,1) 0.9s both' }}>
              <div className="relative rounded-lg rounded-tr-sm px-4 py-2 shadow-sm" style={{ background: '#D9FDD3', maxWidth: '85%' }}>
                <p className="text-[18px] text-[#111B21] font-medium">ek second didi, bhej rahi hun 📋</p>
                <div className="flex items-center justify-end gap-1 -mb-0.5">
                  <span className="text-[11px]" style={{ color: '#667781' }}>6:32 pm</span>
                  <svg width="16" height="11" viewBox="0 0 16 11" fill="none"><path d="M11.07 0.73L4.53 7.27L1.77 4.51L0.36 5.93L4.53 10.1L12.48 2.15L11.07 0.73Z" fill="#53BDEB"/><path d="M14.07 0.73L7.53 7.27L6.83 6.57L5.42 7.98L7.53 10.1L15.48 2.15L14.07 0.73Z" fill="#53BDEB"/></svg>
                </div>
              </div>
            </div>
            <div className="flex justify-end" style={{ animation: 'msgIn 0.4s cubic-bezier(0.16,1,0.3,1) 1.3s both' }}>
              <div className="relative rounded-lg rounded-tr-sm shadow-sm overflow-hidden" style={{ background: '#D9FDD3', maxWidth: '85%' }}>
                <div className="px-3 py-2" style={{ background: '#E2F7CB' }}>
                  <p className="text-[11px] font-medium" style={{ color: '#5B7F3D' }}>aajbanega.com</p>
                  <p className="text-[14px] text-[#111B21] font-semibold mt-0.5">Today&apos;s Menu — Paneer Butter Masala</p>
                  <p className="text-[12px] text-[#667781] mt-0.5">Step-by-step recipe in Hindi</p>
                </div>
                <div className="px-4 py-1.5 flex items-center justify-end gap-1">
                  <span className="text-[11px]" style={{ color: '#667781' }}>6:33 pm</span>
                  <svg width="16" height="11" viewBox="0 0 16 11" fill="none"><path d="M11.07 0.73L4.53 7.27L1.77 4.51L0.36 5.93L4.53 10.1L12.48 2.15L11.07 0.73Z" fill="#53BDEB"/><path d="M14.07 0.73L7.53 7.27L6.83 6.57L5.42 7.98L7.53 10.1L15.48 2.15L14.07 0.73Z" fill="#53BDEB"/></svg>
                </div>
              </div>
            </div>
            <div className="flex justify-start" style={{ animation: 'msgIn 0.4s cubic-bezier(0.16,1,0.3,1) 1.7s both' }}>
              <div className="relative rounded-lg rounded-tl-sm px-4 py-2 shadow-sm" style={{ background: '#FFFFFF', maxWidth: '80%' }}>
                <p className="text-[18px] text-[#111B21]">theek hai, shuru karti hun 👍</p>
                <div className="flex items-center justify-end gap-1 -mb-0.5">
                  <span className="text-[11px]" style={{ color: '#667781' }}>6:34 pm</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-2 py-2" style={{ background: '#F0F2F5' }}>
            <div className="flex-1 flex items-center bg-white rounded-full px-3 py-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#8696A0" className="mr-2 flex-shrink-0"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>
              <span className="text-[14px] text-[#8696A0]">Type a message</span>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#00A884' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2a10 10 0 00-3.16 19.5l-1.34 2.84a.5.5 0 00.7.62l3.55-1.78A10 10 0 0012 2zm0 18a8 8 0 110-16 8 8 0 010 16z"/><path d="M12 14a2 2 0 100-4 2 2 0 000 4z"/></svg>
            </div>
          </div>
        </div>

        <div
          className="flex items-center justify-center gap-4 mt-8 mb-8"
          style={{ animation: 'heroIn 0.8s cubic-bezier(0.16,1,0.3,1) 0.4s both' }}
        >
          <span className="px-4 py-2 rounded-full bg-white text-[14px] font-semibold text-[#2D2A26] shadow-sm border border-[#E5DFD6]/50 animate-float" style={{ animationDelay: '0s' }}>
            🍛 216 dishes
          </span>
          <span className="px-4 py-2 rounded-full bg-white text-[14px] font-semibold text-[#2D2A26] shadow-sm border border-[#E5DFD6]/50 animate-float" style={{ animationDelay: '0.5s' }}>
            🌍 13 cuisines
          </span>
          <span className="px-4 py-2 rounded-full bg-white text-[14px] font-semibold text-[#2D2A26] shadow-sm border border-[#E5DFD6]/50 animate-float" style={{ animationDelay: '1s' }}>
            🗣️ 3 languages
          </span>
        </div>

        <div style={{ animation: 'heroIn 0.8s cubic-bezier(0.16,1,0.3,1) 0.5s both' }}>
          <Link
            href="/login"
            className="inline-block bg-[#2D2A26] text-white px-12 py-4 rounded-2xl font-bold text-[19px] hover:bg-[#45403A] transition-all hover:scale-[1.03] shadow-xl active:scale-100"
          >
            Start Planning
          </Link>
          <p className="text-[13px] text-[#C5C0BA] mt-4">Free. No downloads. Works on any phone.</p>
        </div>
      </div>

      {/* Sticky scroll feature cards */}
      <div className="relative" style={{ marginLeft: '-20px', marginRight: '-20px' }}>
        {FEATURES.map((f, i) => (
          <div key={f.num} className="sticky px-5" style={{ top: `${100 + i * 16}px`, zIndex: i + 1, paddingBottom: '24px' }}>
            <Reveal>
              <div
                className="rounded-3xl p-8 shadow-lg border border-white/60"
                style={{ background: f.accent, minHeight: '280px' }}
              >
                <div className="flex items-start justify-between mb-5">
                  <span className="text-[13px] font-bold text-[#2D2A26]/40 tracking-widest uppercase">{f.num}</span>
                  <span className="text-4xl">{f.icon}</span>
                </div>
                <h3 className="text-[28px] font-extrabold text-[#2D2A26] leading-tight mb-3">{f.title}</h3>
                <p className="text-[16px] text-[#2D2A26]/70 leading-relaxed max-w-md">{f.desc}</p>
              </div>
            </Reveal>
          </div>
        ))}
      </div>

      {/* Plan together */}
      <div className="py-20">
        <Reveal>
          <h2 className="text-[28px] font-extrabold text-[#2D2A26] text-center leading-tight mb-4">
            Plan together with<br />flatmates & family
          </h2>
          <p className="text-[16px] text-[#8C8680] text-center max-w-sm mx-auto mb-10 leading-relaxed">
            Everyone gets a say in what&apos;s for dinner. No more WhatsApp polls.
          </p>
        </Reveal>
        <div className="space-y-4">
          <Reveal delay={0.1}>
            <div className="card p-6">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#E8D5C4] flex items-center justify-center text-lg font-bold">👥</div>
                <h3 className="font-bold text-[17px] text-[#2D2A26]">Invite your household</h3>
              </div>
              <p className="text-[15px] text-[#8C8680] leading-relaxed">
                Add flatmates or family members with a WhatsApp invite link. Each person joins your shared household in seconds.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="card p-6">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#D4E8D4] flex items-center justify-center text-lg font-bold">✅</div>
                <h3 className="font-bold text-[17px] text-[#2D2A26]">Vote on the menu</h3>
              </div>
              <p className="text-[15px] text-[#8C8680] leading-relaxed">
                After the menu is generated, each flatmate gets a link to review and approve. The menu finalizes only when everyone says yes.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="card p-6">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#F5E6CC] flex items-center justify-center text-lg font-bold">🔄</div>
                <h3 className="font-bold text-[17px] text-[#2D2A26]">Swap dishes you don&apos;t like</h3>
              </div>
              <p className="text-[15px] text-[#8C8680] leading-relaxed">
                Not feeling Palak Paneer on Wednesday? Swap it for something else from the same cuisine. Everyone sees the updated menu in real-time.
              </p>
            </div>
          </Reveal>
        </div>
      </div>

      {/* How it works */}
      <Reveal>
        <div className="py-10">
          <h2 className="text-[22px] font-bold text-[#2D2A26] mb-8 text-center">How it works</h2>
          <div className="space-y-5">
            {[
              { step: '1', text: 'Pick your cuisines and set veg/non-veg days', sub: 'Tamil, North Indian, Marathi... choose any combination' },
              { step: '2', text: 'Get a balanced weekly menu', sub: 'Variety-optimized — no repeats, proper nutrition' },
              { step: '3', text: 'Swap dishes, get approval from flatmates', sub: 'Everyone votes before the menu is locked in' },
              { step: '4', text: 'Share one link with your cook', sub: 'Recipes in Hindi or Marathi, no app needed' },
            ].map((s, i) => (
              <Reveal key={s.step} delay={i * 0.08}>
                <div className="flex gap-5 items-start">
                  <div className="w-11 h-11 rounded-2xl bg-[#2D2A26] text-white flex items-center justify-center font-bold text-[16px] flex-shrink-0 shadow-md">
                    {s.step}
                  </div>
                  <div>
                    <p className="text-[16px] font-semibold text-[#2D2A26]">{s.text}</p>
                    <p className="text-[14px] text-[#8C8680] mt-0.5">{s.sub}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Cuisines marquee */}
      <Reveal>
        <div className="py-10 overflow-hidden" style={{ marginLeft: '-20px', marginRight: '-20px' }}>
          <h2 className="text-[22px] font-bold text-[#2D2A26] mb-6 text-center px-5">13 cuisines, one app</h2>
          <div className="space-y-3">
            <div className="relative">
              <div className="flex gap-3 animate-marquee whitespace-nowrap">
                {['🥥 Tamil', '🫓 North Indian', '🌶 Marathi', '🫘 Bihari', '🦐 Goan', '🏜️ Rajasthani', '🥑 Café',
                  '🥥 Tamil', '🫓 North Indian', '🌶 Marathi', '🫘 Bihari', '🦐 Goan', '🏜️ Rajasthani', '🥑 Café',
                ].map((c, i) => (
                  <span key={i} className="inline-block px-5 py-2.5 rounded-full bg-white text-[15px] font-medium text-[#2D2A26] shadow-sm border border-[#E5DFD6]/50 flex-shrink-0">
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="flex gap-3 animate-marquee-reverse whitespace-nowrap">
                {['🫙 Gujarati', '🐟 Bengali', '🌴 Kerala', '🔥 Andhra', '🧈 Punjabi', '🏔️ Kashmiri',
                  '🫙 Gujarati', '🐟 Bengali', '🌴 Kerala', '🔥 Andhra', '🧈 Punjabi', '🏔️ Kashmiri',
                ].map((c, i) => (
                  <span key={i} className="inline-block px-5 py-2.5 rounded-full bg-white text-[15px] font-medium text-[#2D2A26] shadow-sm border border-[#E5DFD6]/50 flex-shrink-0">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Bottom CTA */}
      <Reveal>
        <div className="text-center py-16">
          <p className="text-[15px] text-[#8C8680] mb-6">Ready to stop asking &ldquo;aaj kya banega?&rdquo; every evening?</p>
          <Link
            href="/login"
            className="inline-block bg-[#2D2A26] text-white px-10 py-4 rounded-2xl font-semibold text-[18px] hover:bg-[#45403A] transition-all hover:scale-[1.03] shadow-lg active:scale-100"
          >
            Start Planning
          </Link>
          <p className="text-[13px] text-[#C5C0BA] mt-4">No credit card. No downloads. Works on any phone.</p>
        </div>
      </Reveal>

      {/* Footer */}
      <div className="pt-6 border-t border-[#E5DFD6] flex justify-center gap-6 text-[13px] text-[#C5C0BA] pb-4">
        <Link href="/privacy" className="hover:text-[#2D2A26] transition-colors">Privacy</Link>
        <Link href="/terms" className="hover:text-[#2D2A26] transition-colors">Terms</Link>
      </div>
    </div>
  )
}
