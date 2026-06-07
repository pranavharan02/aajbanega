'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null

export function InstallPrompt({ show }: { show: boolean }) {
  const [visible, setVisible] = useState(false)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      deferredPrompt = e as BeforeInstallPromptEvent
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => {
    if (show && deferredPrompt) {
      setVisible(true)
    } else if (show) {
      const check = setInterval(() => {
        if (deferredPrompt) {
          setVisible(true)
          clearInterval(check)
        }
      }, 500)
      const timeout = setTimeout(() => {
        clearInterval(check)
      }, 5000)
      return () => { clearInterval(check); clearTimeout(timeout) }
    }
  }, [show])

  async function handleInstall() {
    if (!deferredPrompt) return
    setInstalling(true)
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    deferredPrompt = null
    if (outcome === 'accepted') {
      setVisible(false)
    }
    setInstalling(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(45,42,38,0.5)', animation: 'fadeIn 0.3s ease both' }}
    >
      <div
        className="bg-[#FFFDF9] w-full sm:w-auto sm:min-w-[360px] sm:rounded-2xl rounded-t-2xl p-6 pb-8 sm:pb-6"
        style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) both' }}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-[#2D2A26] flex items-center justify-center text-[#F5F0EA] text-2xl font-bold">
            आज
          </div>
          <div>
            <h3 className="text-[17px] font-bold text-[#2D2A26]">Add to Home Screen</h3>
            <p className="text-[13px] text-[#8C8680]">Quick access to your meal plans</p>
          </div>
        </div>
        <p className="text-[14px] text-[#8C8680] mb-5">
          Install the app for a faster, native-like experience — works offline too.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleInstall}
            disabled={installing}
            className="flex-1 bg-[#2D2A26] text-white py-3.5 rounded-xl font-semibold text-[15px] hover:bg-[#45403A] transition-colors disabled:opacity-50"
          >
            {installing ? 'Installing...' : 'Install App'}
          </button>
          <button
            onClick={() => setVisible(false)}
            className="px-5 py-3.5 rounded-xl bg-[#F5F0EA] text-[#8C8680] text-[15px] font-medium hover:bg-[#E5DFD6] transition-colors"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  )
}
