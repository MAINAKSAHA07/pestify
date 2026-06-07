import { useRef, useEffect, useState } from 'react'

export default function ScrollRevealText({
  text,
  className = '',
  activeClass = 'text-forest',
}) {
  const containerRef = useRef(null)
  const [progress, setProgress] = useState(0)
  const [isReduced, setIsReduced] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setIsReduced(mediaQuery.matches)

    const handleChange = (e) => setIsReduced(e.matches)
    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  useEffect(() => {
    if (isReduced) return

    const handleScroll = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight

      // Animation starts when the top of the element is at 85% of viewport height
      // and completes when the top reaches 20% of viewport height
      const start = windowHeight * 0.85
      const end = windowHeight * 0.20

      const totalRange = start - end
      const currentVal = rect.top

      const rawProgress = (start - currentVal) / totalRange
      const calculatedProgress = Math.max(0, Math.min(1, rawProgress))
      
      setProgress(calculatedProgress)
    }

    handleScroll()

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [isReduced])

  if (isReduced) {
    return <span className={`${activeClass} ${className}`}>{text}</span>
  }

  const words = text.split(/\s+/)
  const totalWords = words.length

  return (
    <span ref={containerRef} className={`inline-block ${className}`}>
      {words.map((word, idx) => {
        const wordStart = idx / totalWords
        const wordEnd = (idx + 1) / totalWords
        let wordProgress = (progress - wordStart) / (wordEnd - wordStart)
        wordProgress = Math.max(0, Math.min(1, wordProgress))

        return (
          <span
            key={idx}
            className={`inline-block mr-[0.22em] transition-all duration-150 ${activeClass}`}
            style={{
              opacity: 0.25 + 0.75 * wordProgress,
              transform: `translateY(${(1 - wordProgress) * 2}px)`,
            }}
          >
            {word}
          </span>
        )
      })}
    </span>
  )
}
