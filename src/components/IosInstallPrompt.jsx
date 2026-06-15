import { useState, useEffect } from 'react'

export default function IosInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // 1. Check if device is iOS (iPhone/iPad/iPod)
    const isIos = 
      /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) // iPadOS 13+

    // 2. Check if already running in standalone (PWA) mode
    const isStandalone = 
      window.navigator.standalone === true || 
      window.matchMedia('(display-mode: standalone)').matches

    // 3. Check if user dismissed the prompt in the last 7 days
    const lastDismissed = localStorage.getItem('pestyfi_ios_prompt_dismissed')
    let isRecentlyDismissed = false
    if (lastDismissed) {
      const diff = Date.now() - parseInt(lastDismissed, 10)
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000
      if (diff < sevenDaysInMs) {
        isRecentlyDismissed = true
      }
    }

    // Only show if user is on iOS, using Safari (browser), and hasn't added it or dismissed it recently
    if (isIos && !isStandalone && !isRecentlyDismissed) {
      // Small timeout to let the page settle before displaying
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleDismiss = () => {
    localStorage.setItem('pestyfi_ios_prompt_dismissed', Date.now().toString())
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-in slide-in-from-bottom duration-300">
      {/* Background Mask/Glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-forest/30 to-transparent pointer-events-none" />

      {/* Main card */}
      <div className="relative mx-auto max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-white p-5 shadow-premium ring-1 ring-black/5">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-eco via-amber to-urgent" />
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-black/5 bg-forest/5 p-0.5">
              <img src="/apple-touch-icon.png" alt="Pestyfi Logo" className="h-full w-full rounded-lg object-cover" />
            </div>
            <div>
              <h4 className="font-serif text-sm font-bold text-forest leading-tight">Install Pestyfi</h4>
              <p className="text-[10px] text-ink/40 font-semibold mt-0.5">Add to Home Screen for standalone access</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-lg p-1 text-ink/40 hover:bg-black/5"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Info */}
        <p className="text-xs text-ink/70 leading-relaxed mb-4">
          Add Pestyfi to your iPhone home screen to get standalone app experience, one-tap booking access, and instant order tracking.
        </p>

        {/* Step-by-Step Instructions */}
        <div className="space-y-3 border-t border-black/5 pt-3.5 text-xs text-ink/80">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-forest/5 text-base shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8m-4-6l-4-4m0 0L8 6m4-4v13" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              1. Tap the <strong className="text-forest">Share</strong> button in Safari toolbar
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-forest/5 text-base shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink/60">
                <rect x="3" y="3" width="18" height="18" rx="4" />
                <path d="M12 8v8M8 12h8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              2. Scroll down and choose <strong className="text-forest">Add to Home Screen</strong>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="mt-4 w-full rounded-xl bg-forest py-2 text-center text-xs font-bold text-cream hover:bg-green transition-colors"
        >
          Got It
        </button>
      </div>
    </div>
  )
}
