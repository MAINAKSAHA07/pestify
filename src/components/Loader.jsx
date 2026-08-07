import { useEffect, useState } from 'react'

const SESSION_KEY = 'pestyfi_boot_loader_seen'

/**
 * First-paint splash only — skipped on SPA remounts (e.g. returning from /backend)
 * so content doesn't flash blank after navigation.
 */
export default function Loader() {
  const [shouldRender] = useState(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return false
      sessionStorage.setItem(SESSION_KEY, '1')
      return true
    } catch {
      return true
    }
  })
  const [isVisible, setIsVisible] = useState(shouldRender)

  useEffect(() => {
    if (!shouldRender) return undefined

    const fadeTimeout = setTimeout(() => {
      setIsVisible(false)
    }, 1500)

    const removeTimeout = setTimeout(() => {
      setIsVisible(false)
    }, 2000)

    return () => {
      clearTimeout(fadeTimeout)
      clearTimeout(removeTimeout)
    }
  }, [shouldRender])

  const [mounted, setMounted] = useState(shouldRender)
  useEffect(() => {
    if (!shouldRender || isVisible) return undefined
    const t = setTimeout(() => setMounted(false), 500)
    return () => clearTimeout(t)
  }, [shouldRender, isVisible])

  if (!mounted) return null

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-forest transition-opacity duration-500 ease-in-out ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-hidden={!isVisible}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-grain opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(26,58,42,0.85), rgba(26,58,42,0.95)), url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=80')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        aria-hidden="true"
      />

      <div className="relative flex flex-col items-center">
        <div className="absolute h-36 w-36 animate-ping rounded-full bg-eco/20 duration-1000" />

        <div className="relative z-10 flex h-24 w-52 items-center justify-center rounded-xl2 bg-white px-6 py-4 shadow-premium ring-4 ring-eco/25">
          <img
            src="/logo.webp"
            alt="Pestyfi Eco Solutions"
            className="h-10 w-auto object-contain"
          />
        </div>

        <div className="mt-8 relative w-40 overflow-hidden rounded-full bg-white/10 h-1.5 ring-1 ring-white/10">
          <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-eco to-amber rounded-full w-full -translate-x-full animate-loaderProgress" />
        </div>

        <span className="mt-4 text-[10px] font-bold uppercase tracking-[0.25em] text-cream/70">
          Loading Eco Protection
        </span>
      </div>
    </div>
  )
}
