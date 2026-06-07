import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import Link from 'next/link'

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
    desc: "Send your cook a single link. They see today's recipe in Hindi or Marathi — ingredients, quantities, step-by-step instructions — in large, clear text. No app download needed.",
    accent: '#D4E8D4',
    icon: '🗣️',
  },
  {
    num: '03',
    title: 'Smart shopping list',
    desc: "The app tracks what's already in your pantry and builds a day-wise shopping list with only what you need to buy. No more forgetting jeera or buying double the onions.",
    accent: '#F5E6CC',
    icon: '🛒',
  },
]

const CUISINES = [
  '🥥 Tamil', '🫓 North Indian', '🌶 Marathi', '🫘 Bihari', '🫙 Gujarati', '🐟 Bengali',
  '🌴 Kerala', '🔥 Andhra', '🦐 Goan', '🏜️ Rajasthani', '🧈 Punjabi', '🏔️ Kashmiri', '🥑 Cafe',
]

const STEPS = [
  { step: '1', text: 'Pick your cuisines and set veg/non-veg days', sub: 'Tamil, North Indian, Marathi... choose any combination' },
  { step: '2', text: 'Get a balanced weekly menu', sub: 'Variety-optimized — no repeats, proper nutrition' },
  { step: '3', text: 'Swap dishes, get approval from flatmates', sub: 'Everyone votes before the menu is locked in' },
  { step: '4', text: 'Share one link with your cook', sub: 'Recipes in Hindi or Marathi, no app needed' },
]

const DIETS = [
  { name: 'Regular', desc: 'Balanced meals' },
  { name: 'High Protein', desc: '30g+ per meal' },
  { name: 'Keto', desc: 'High fat, very low carb' },
  { name: 'Low Carb', desc: 'Under 100g carbs/day' },
  { name: 'Cutting', desc: 'Low cal, high protein' },
  { name: 'Bulking', desc: 'Calorie surplus' },
]

const MENU_ITEMS = [
  { emoji: '🍛', dish: 'Paneer Butter Masala' },
  { emoji: '🍗', dish: 'Chicken Biryani' },
  { emoji: '🫓', dish: 'Chole Bhature' },
  { emoji: '🍲', dish: 'Sambar Rice' },
  { emoji: '🧈', dish: 'Dal Makhani' },
  { emoji: '🥘', dish: 'Mutton Rogan Josh' },
  { emoji: '🍛', dish: 'Rajma Chawal' },
  { emoji: '🥙', dish: 'Pav Bhaji' },
  { emoji: '🍗', dish: 'Butter Chicken' },
  { emoji: '🫓', dish: 'Masala Dosa' },
  { emoji: '🧈', dish: 'Palak Paneer' },
  { emoji: '🥘', dish: 'Egg Curry' },
  { emoji: '🍲', dish: 'Kadhi Pakora' },
  { emoji: '🐟', dish: 'Fish Curry' },
  { emoji: '🫓', dish: 'Aloo Paratha' },
  { emoji: '🧈', dish: 'Malai Kofta' },
  { emoji: '🍗', dish: 'Tandoori Chicken' },
  { emoji: '🍛', dish: 'Dal Baati Churma' },
  { emoji: '🦐', dish: 'Goan Prawn Curry' },
  { emoji: '🍲', dish: 'Misal Pav' },
  { emoji: '🍛', dish: 'Litti Chokha' },
]

export default async function LandingPage() {
  const cookieStore = await cookies()
  const isTestMode = cookieStore.get('akb_test_mode')?.value === 'true'

  if (isTestMode) {
    redirect('/dashboard')
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {},
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      redirect('/dashboard')
    }
  } catch {
    // Auth check failed — show landing page
  }

  return (
    <div className="mx-auto max-w-[680px] px-5 overflow-hidden">
      {/* Nav */}
      <nav className="flex items-center justify-between py-4">
        <span className="text-[22px] sm:text-[28px] font-extrabold tracking-tight text-[#2D2A26] leading-none">
          आज क्या बनेगा?
        </span>
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] sm:text-[11px] font-bold tracking-wide uppercase">
            Beta
          </span>
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl bg-[#2D2A26] text-white text-sm font-semibold hover:bg-[#45403A] transition-colors"
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center pt-8 pb-6">
        <h1 className="text-[32px] sm:text-[36px] font-extrabold text-[#2D2A26] leading-tight mb-3 tracking-tight">
          Your cook asks.<br />
          <span className="text-[#8C8680]">You&apos;re ready.</span>
        </h1>
        <p className="text-[16px] sm:text-[17px] text-[#8C8680] leading-relaxed max-w-sm mx-auto mb-8 px-2">
          Plan meals for the week. Share recipes with your cook in Hindi or Marathi. No app needed.
        </p>

        {/* Slot Machine */}
        <div className="relative mx-auto max-w-md mb-10">
          <div className="h-[80px] overflow-hidden relative rounded-2xl bg-[#FFFDF9] border border-[#E5DFD6] shadow-lg">
            {/* Top gradient mask */}
            <div className="absolute top-0 left-0 right-0 h-5 bg-gradient-to-b from-[#FFFDF9] to-transparent z-10 pointer-events-none" />
            {/* Bottom gradient mask */}
            <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-[#FFFDF9] to-transparent z-10 pointer-events-none" />
            {/* Scrolling strip — duplicated for seamless loop */}
            <div className="animate-slot-scroll">
              {[...MENU_ITEMS, ...MENU_ITEMS].map((item, i) => (
                <div key={`${item.dish}-${i}`} className="h-[80px] flex items-center justify-center gap-3 px-4 sm:px-6">
                  <span className="text-[28px] sm:text-[32px]">{item.emoji}</span>
                  <span className="text-[16px] sm:text-[19px] font-bold text-[#2D2A26]">{item.dish}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Link
          href="/login"
          className="inline-block bg-[#2D2A26] text-white px-12 py-4 rounded-2xl font-bold text-[19px] hover:bg-[#45403A] transition-all shadow-xl"
        >
          Start Planning
        </Link>
        <p className="text-[13px] text-[#C5C0BA] mt-4">Free. No downloads. Works on any phone.</p>
      </section>

      {/* WhatsApp Preview */}
      <section className="py-10 text-center">
        <h2 className="text-[20px] sm:text-[22px] font-bold text-[#2D2A26] mb-2">Share with your cook in one tap</h2>
        <p className="text-[15px] text-[#8C8680] mb-6">Your cook gets today&apos;s recipe in Hindi — no app needed.</p>

        <div
          className="mx-auto rounded-2xl overflow-hidden shadow-xl border border-[#D1D7DB]/50"
          style={{ maxWidth: '100%', width: '360px' }}
        >
          <div className="flex items-center gap-3 px-4 py-3" style={{ background: '#075E54' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
            <div className="w-10 h-10 rounded-full bg-[#DFE5E7] flex items-center justify-center text-[16px]">👩‍🍳</div>
            <div className="text-left">
              <div className="text-white text-[16px] font-medium leading-tight">Didi (Cook)</div>
              <div className="text-[12px] leading-tight" style={{ color: '#8EBDB6' }}>online</div>
            </div>
          </div>
          <div className="px-4 py-4 space-y-2" style={{ background: '#ECE5DD' }}>
            <div className="flex justify-center mb-1">
              <span className="px-3 py-1 rounded-lg text-[11px] font-medium shadow-sm" style={{ background: '#E1F2FA', color: '#5B7A84' }}>TODAY</span>
            </div>
            <div className="flex justify-start">
              <div className="relative rounded-lg rounded-tl-sm px-4 py-2 shadow-sm" style={{ background: '#FFFFFF', maxWidth: '80%' }}>
                <p className="text-[15px] sm:text-[18px] text-[#111B21] font-medium">aaj kya banaun? 🍳</p>
                <div className="flex items-center justify-end gap-1 -mb-0.5">
                  <span className="text-[11px]" style={{ color: '#667781' }}>6:32 pm</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <div className="relative rounded-lg rounded-tr-sm px-4 py-2 shadow-sm" style={{ background: '#D9FDD3', maxWidth: '85%' }}>
                <p className="text-[15px] sm:text-[18px] text-[#111B21] font-medium">ek second didi, bhej rahi hun 📋</p>
                <div className="flex items-center justify-end gap-1 -mb-0.5">
                  <span className="text-[11px]" style={{ color: '#667781' }}>6:32 pm</span>
                  <svg width="16" height="11" viewBox="0 0 16 11" fill="none"><path d="M11.07 0.73L4.53 7.27L1.77 4.51L0.36 5.93L4.53 10.1L12.48 2.15L11.07 0.73Z" fill="#53BDEB"/><path d="M14.07 0.73L7.53 7.27L6.83 6.57L5.42 7.98L7.53 10.1L15.48 2.15L14.07 0.73Z" fill="#53BDEB"/></svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 sm:gap-4 mt-8 flex-wrap">
          <span className="px-3 sm:px-4 py-2 rounded-full bg-white text-[13px] sm:text-[14px] font-semibold text-[#2D2A26] shadow-sm border border-[#E5DFD6]/50">
            🍛 216 dishes
          </span>
          <span className="px-3 sm:px-4 py-2 rounded-full bg-white text-[13px] sm:text-[14px] font-semibold text-[#2D2A26] shadow-sm border border-[#E5DFD6]/50">
            🌍 13 cuisines
          </span>
          <span className="px-3 sm:px-4 py-2 rounded-full bg-white text-[13px] sm:text-[14px] font-semibold text-[#2D2A26] shadow-sm border border-[#E5DFD6]/50">
            🗣️ 3 languages
          </span>
        </div>
      </section>

      {/* Feature cards */}
      <section className="py-8">
        <div className="space-y-6">
          {FEATURES.map((f) => (
            <div
              key={f.num}
              className="rounded-3xl p-6 sm:p-8 shadow-lg border border-white/60"
              style={{ background: f.accent, minHeight: '220px' }}
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-[13px] font-bold text-[#2D2A26]/40 tracking-widest uppercase">{f.num}</span>
                <span className="text-3xl sm:text-4xl">{f.icon}</span>
              </div>
              <h3 className="text-[24px] sm:text-[28px] font-extrabold text-[#2D2A26] leading-tight mb-3">{f.title}</h3>
              <p className="text-[15px] sm:text-[16px] text-[#2D2A26]/70 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Plan together */}
      <section className="py-12">
        <h2 className="text-[24px] sm:text-[28px] font-extrabold text-[#2D2A26] text-center leading-tight mb-4">
          Plan together with<br />flatmates &amp; family
        </h2>
        <p className="text-[16px] text-[#8C8680] text-center max-w-sm mx-auto mb-10 leading-relaxed">
          Everyone gets a say in what&apos;s for dinner. No more WhatsApp polls.
        </p>
        <div className="space-y-4">
          {[
            { icon: '👥', title: 'Invite your household', desc: 'Add flatmates or family members with a WhatsApp invite link. Each person joins your shared household in seconds.' },
            { icon: '✅', title: 'Vote on the menu', desc: 'After the menu is generated, each flatmate gets a link to review and approve. The menu finalizes only when everyone says yes.' },
            { icon: '🔄', title: "Swap dishes you don't like", desc: "Not feeling Palak Paneer on Wednesday? Swap it for something else from the same cuisine. Everyone sees the updated menu in real-time." },
          ].map((item) => (
            <div key={item.title} className="bg-[#FFFDF9] rounded-2xl p-6 border border-[#E5DFD6]/50 shadow-sm">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#F5F0EA] flex items-center justify-center text-lg">{item.icon}</div>
                <h3 className="font-bold text-[17px] text-[#2D2A26]">{item.title}</h3>
              </div>
              <p className="text-[15px] text-[#8C8680] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-10">
        <h2 className="text-[22px] font-bold text-[#2D2A26] mb-8 text-center">How it works</h2>
        <div className="space-y-5">
          {STEPS.map((s) => (
            <div key={s.step} className="flex gap-5 items-start">
              <div className="w-11 h-11 rounded-2xl bg-[#2D2A26] text-white flex items-center justify-center font-bold text-[16px] flex-shrink-0 shadow-md">
                {s.step}
              </div>
              <div>
                <p className="text-[16px] font-semibold text-[#2D2A26]">{s.text}</p>
                <p className="text-[14px] text-[#8C8680] mt-0.5">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cuisines */}
      <section className="py-10">
        <h2 className="text-[22px] font-bold text-[#2D2A26] mb-6 text-center">13 cuisines, one app</h2>
        <div className="flex flex-wrap gap-2 justify-center">
          {CUISINES.map((c) => (
            <span key={c} className="px-4 py-2 rounded-full bg-white text-[14px] font-medium text-[#2D2A26] shadow-sm border border-[#E5DFD6]/50">
              {c}
            </span>
          ))}
        </div>
      </section>

      {/* Diets */}
      <section className="py-10">
        <h2 className="text-[22px] font-bold text-[#2D2A26] mb-6 text-center">Works with your diet</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {DIETS.map((d) => (
            <div key={d.name} className="p-4 rounded-xl bg-[#FFFDF9] border border-[#E5DFD6]/50 shadow-sm">
              <div className="font-semibold text-[15px] text-[#2D2A26]">{d.name}</div>
              <div className="text-[13px] text-[#8C8680] mt-0.5">{d.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="text-center py-16">
        <p className="text-[15px] text-[#8C8680] mb-6">
          No more &ldquo;aaj kya banayein?&rdquo; every morning.
        </p>
        <Link
          href="/login"
          className="inline-block bg-[#2D2A26] text-white px-10 py-4 rounded-2xl font-semibold text-[18px] hover:bg-[#45403A] transition-all shadow-lg"
        >
          Start Planning
        </Link>
        <p className="text-[13px] text-[#C5C0BA] mt-4">No credit card. No downloads. Works on any phone.</p>
      </section>

      {/* Footer */}
      <footer className="pt-6 border-t border-[#E5DFD6] flex justify-center gap-6 text-[13px] text-[#C5C0BA] pb-8">
        <Link href="/privacy" className="hover:text-[#2D2A26] transition-colors">Privacy</Link>
        <Link href="/terms" className="hover:text-[#2D2A26] transition-colors">Terms</Link>
      </footer>
    </div>
  )
}
