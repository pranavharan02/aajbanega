'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

const EMOJIS = ['🍛', '🍗', '🫓', '🍲', '🧈', '🥘', '🥙', '🐟', '🦐', '🌶️']

const DISH_NAMES: Record<string, string> = {
  '🍛': 'Paneer Butter Masala',
  '🍗': 'Chicken Biryani',
  '🫓': 'Chole Bhature',
  '🍲': 'Sambar Rice',
  '🧈': 'Dal Makhani',
  '🥘': 'Mutton Rogan Josh',
  '🥙': 'Pav Bhaji',
  '🐟': 'Fish Curry',
  '🦐': 'Goan Prawn Curry',
  '🌶️': 'Masala Dosa',
}

const ITEM_H = 72
const COPIES = 5
const SPIN_ITEMS = 30 // spin through ~30 items before landing
const SPIN_DURATION = 2900 // longest reel (1.8 + 2*0.4)*1000 + 300
const PAUSE_BETWEEN = 4000 // pause showing result before next spin

export function SlotMachine() {
  const [spinning, setSpinning] = useState(false)
  const [isJackpot, setIsJackpot] = useState(false)
  const [dishName, setDishName] = useState('')
  const [leverPulled, setLeverPulled] = useState(false)
  const [glowing, setGlowing] = useState(false)

  const spinningRef = useRef(false)
  const prevTargets = useRef([0, 0, 0])
  const reel0 = useRef<HTMLDivElement>(null)
  const reel1 = useRef<HTMLDivElement>(null)
  const reel2 = useRef<HTMLDivElement>(null)
  const reelRefs = [reel0, reel1, reel2]

  const spin = useCallback(() => {
    if (spinningRef.current) return
    spinningRef.current = true
    setSpinning(true)
    setIsJackpot(false)
    setDishName('')
    setLeverPulled(true)
    setGlowing(true)

    // Decide outcome — ~12% jackpot (all 3 same emoji)
    const jackpot = Math.random() < 0.12
    let targets: number[]
    if (jackpot) {
      const idx = Math.floor(Math.random() * EMOJIS.length)
      targets = [idx, idx, idx]
    } else {
      targets = Array.from({ length: 3 }, () =>
        Math.floor(Math.random() * EMOJIS.length)
      )
      // Prevent accidental triple
      while (targets[0] === targets[1] && targets[1] === targets[2]) {
        targets[2] = (targets[2] + 1) % EMOJIS.length
      }
    }

    // Reset to first-copy equivalent position (visually identical, no transition)
    reelRefs.forEach((ref, i) => {
      const el = ref.current
      if (!el) return
      el.style.transition = 'none'
      el.style.transform = `translateY(${-prevTargets.current[i] * ITEM_H}px)`
    })
    void reel0.current?.offsetHeight // force reflow

    // Spin forward with deceleration — each reel stops later
    reelRefs.forEach((ref, i) => {
      const el = ref.current
      if (!el) return
      const landingPos = -(SPIN_ITEMS + targets[i]) * ITEM_H
      el.style.transition = `transform ${1.8 + i * 0.4}s cubic-bezier(0.12, 0.82, 0.25, 1)`
      el.style.transform = `translateY(${landingPos}px)`
    })

    prevTargets.current = targets

    // Lever springs back
    setTimeout(() => setLeverPulled(false), 250)
    // Glow fades
    setTimeout(() => setGlowing(false), 800)

    // All reels settled
    const longest = (1.8 + 2 * 0.4) * 1000 + 300
    setTimeout(() => {
      spinningRef.current = false
      setSpinning(false)
      const landed = EMOJIS[targets[0]]
      setDishName(DISH_NAMES[landed] || '')
      if (jackpot) setIsJackpot(true)
    }, longest)
  }, [])

  // Auto-spin on mount, then repeat after each spin settles + pause
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    function scheduleNext() {
      // Wait for current spin to finish + pause, then spin again
      timer = setTimeout(() => {
        if (!spinningRef.current) spin()
        scheduleNext()
      }, SPIN_DURATION + PAUSE_BETWEEN)
    }
    // Initial spin after short delay
    timer = setTimeout(() => {
      spin()
      scheduleNext()
    }, 1200)
    return () => clearTimeout(timer)
  }, [spin])

  // Build reel strip — COPIES copies of EMOJIS, unique per reel
  function buildStrip(reelIdx: number) {
    return Array.from({ length: COPIES }).flatMap((_, c) =>
      EMOJIS.map((emoji, i) => (
        <div
          key={`r${reelIdx}-${c}-${i}`}
          className="flex items-center justify-center text-[36px]"
          style={{ height: ITEM_H }}
        >
          {emoji}
        </div>
      ))
    )
  }

  return (
    <>
      {/* Full-page jackpot glow */}
      {isJackpot && (
        <div
          className="fixed inset-0 pointer-events-none z-40 animate-pulse"
          style={{
            background:
              'radial-gradient(circle at 50% 35%, rgba(212,168,83,0.2) 0%, transparent 55%)',
          }}
        />
      )}

      <div
        className={`relative mx-auto mb-10 transition-transform duration-700 ${
          isJackpot ? 'scale-[1.03]' : ''
        }`}
        style={{ maxWidth: 380 }}
      >
        {/* Glow ring */}
        {(glowing || isJackpot) && (
          <div
            className={`absolute -inset-3 rounded-[2rem] pointer-events-none ${
              isJackpot ? 'animate-pulse' : ''
            }`}
            style={{
              background:
                'radial-gradient(circle, rgba(212,168,83,0.35) 0%, transparent 70%)',
              opacity: isJackpot ? 1 : 0.6,
              transition: 'opacity 0.5s',
            }}
          />
        )}

        <div
          className="rounded-3xl overflow-hidden relative z-10"
          style={{
            background: '#2D2A26',
            boxShadow: isJackpot
              ? '0 0 40px rgba(212,168,83,0.6), 0 0 80px rgba(212,168,83,0.25)'
              : glowing
              ? '0 0 24px rgba(212,168,83,0.3), 0 16px 40px rgba(0,0,0,0.2)'
              : '0 16px 40px rgba(0,0,0,0.15)',
            transition: 'box-shadow 0.5s',
          }}
        >
          {/* Title bar */}
          <div className="text-center py-3">
            <div
              className="text-[14px] sm:text-[16px] font-extrabold tracking-[0.15em] uppercase"
              style={{ color: '#D4A853' }}
            >
              ★ Indian Kitchen ★
            </div>
          </div>

          {/* Body: 3 reels + lever */}
          <div className="flex items-center px-4 sm:px-5 pb-4">
            {/* Reels */}
            <div className="flex gap-2 flex-1 justify-center">
              {reelRefs.map((ref, idx) => (
                <div
                  key={idx}
                  className="overflow-hidden rounded-xl bg-[#FFFDF9] border-2 border-[#E5DFD6] relative"
                  style={{
                    width: ITEM_H,
                    height: ITEM_H,
                    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.12)',
                  }}
                >
                  <div className="absolute top-0 inset-x-0 h-3 bg-gradient-to-b from-[#FFFDF9] to-transparent z-10 pointer-events-none" />
                  <div className="absolute bottom-0 inset-x-0 h-3 bg-gradient-to-t from-[#FFFDF9] to-transparent z-10 pointer-events-none" />
                  <div ref={ref}>{buildStrip(idx)}</div>
                </div>
              ))}
            </div>

            {/* Lever */}
            <button
              onClick={spin}
              disabled={spinning}
              className="flex flex-col items-center ml-3 select-none disabled:cursor-wait"
              style={{ touchAction: 'manipulation' }}
              aria-label="Pull lever to spin"
            >
              {/* Arm */}
              <div
                style={{
                  width: 10,
                  height: 48,
                  borderRadius: 5,
                  background: 'linear-gradient(180deg, #C0B8A8, #8C8680)',
                  transform: leverPulled ? 'translateY(16px)' : 'translateY(0)',
                  transition: leverPulled
                    ? 'transform 0.12s ease-in'
                    : 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              />
              {/* Ball */}
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: leverPulled
                    ? 'radial-gradient(circle at 35% 35%, #D4A853, #A08040)'
                    : 'radial-gradient(circle at 35% 35%, #E8E0D4, #8C8680)',
                  border: '2px solid #A89E92',
                  marginTop: -2,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                  transform: leverPulled
                    ? 'translateY(16px) scale(0.9)'
                    : 'translateY(0) scale(1)',
                  transition: leverPulled
                    ? 'all 0.12s ease-in'
                    : 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              />
            </button>
          </div>

          {/* Result strip */}
          <div style={{ borderTop: '1px solid #45403A' }} className="py-2.5 px-4">
            <div className="text-center min-h-[28px] flex items-center justify-center">
              {isJackpot ? (
                <span
                  className="text-[16px] font-extrabold animate-pulse"
                  style={{ color: '#D4A853' }}
                >
                  🎰 JACKPOT! {dishName} 🎰
                </span>
              ) : dishName ? (
                <span
                  className="text-[14px] sm:text-[15px] font-bold"
                  style={{ color: '#D4A853' }}
                >
                  {dishName}
                </span>
              ) : (
                <span className="text-[13px]" style={{ color: '#8C8680' }}>
                  · · ·
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Hint */}
        <p
          className="text-center text-[12px] mt-3 transition-opacity duration-300"
          style={{ color: '#C5C0BA', opacity: spinning ? 0 : 1 }}
        >
          Tap the lever to spin
        </p>
      </div>
    </>
  )
}
