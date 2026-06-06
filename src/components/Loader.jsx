import { useEffect, useState } from 'react'

export default function Loader() {
  const [isVisible, setIsVisible] = useState(true)
  const [shouldRender, setShouldRender] = useState(true)

  useEffect(() => {
    // Fade out after 1.5 seconds
    const fadeTimeout = setTimeout(() => {
      setIsVisible(false)
    }, 1500)

    // Unmount loader after transition finishes (500ms fade transition)
    const removeTimeout = setTimeout(() => {
      setShouldRender(false)
    }, 2000)

    return () => {
      clearTimeout(fadeTimeout)
      clearTimeout(removeTimeout)
    }
  }, [])

  if (!shouldRender) return null

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-forest transition-opacity duration-500 ease-in-out ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Subtle background overlay */}
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

      {/* Loader Content */}
      <div className="relative flex flex-col items-center">
        {/* Soft glowing radar pulse */}
        <div className="absolute h-36 w-36 animate-ping rounded-full bg-eco/20 duration-1000" />

        {/* Logo Card with scale animation */}
        <div className="relative z-10 flex h-24 w-52 items-center justify-center rounded-xl2 bg-white px-6 py-4 shadow-premium ring-4 ring-eco/25 transition-transform duration-500 hover:scale-105">
          <img
            src="/logo.webp"
            alt="Pestyfi Eco Solutions"
            className="h-10 w-auto object-contain"
          />
        </div>

        {/* Custom Progress Bar */}
        <div className="mt-8 relative w-40 overflow-hidden rounded-full bg-white/10 h-1.5 ring-1 ring-white/10">
          <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-eco to-amber rounded-full w-full -translate-x-full animate-loaderProgress" />
        </div>

        {/* Status text */}
        <span className="mt-4 text-[10px] font-bold uppercase tracking-[0.25em] text-cream/70">
          Loading Eco Protection
        </span>
      </div>
    </div>
  )
}
