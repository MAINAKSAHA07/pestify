import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

const OTP_LENGTH = 6

const LIQUID = '#2D6A4F'
const LIQUID_LIGHT = '#52B788'
const LIQUID_DARK = '#1A3A2A'

const SPRING_SNAP = { type: 'spring', bounce: 0, duration: 0.32 }
const SPRING_GOO = { type: 'spring', bounce: 0.16, duration: 0.4 }

function useOtpMetrics(length, containerRef) {
  const [metrics, setMetrics] = useState({ cellW: 44, cellH: 56, gap: 8 })

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    const measure = () => {
      const available = Math.max(el.clientWidth, 240)
      // Fit 6 cells + 5 gaps with side breathing room for goo blur
      const gap = available < 340 ? 6 : 8
      const cellW = Math.min(48, Math.floor((available - gap * (length - 1)) / length))
      const cellH = Math.round(cellW * 1.25)
      setMetrics({ cellW, cellH, gap })
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [length, containerRef])

  return metrics
}

function GooFilter({ id }) {
  return (
    <svg width="0" height="0" className="absolute overflow-hidden" aria-hidden="true">
      <defs>
        <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  )
}

function LiquidMass({ filledCount, length, reducedMotion, gooId, cellW, cellH, gap }) {
  const slot = cellW + gap
  const blobs = Array.from({ length }, (_, i) => i < filledCount)
  const bridges = Array.from({ length: length - 1 }, (_, i) => i < filledCount - 1)

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{ filter: reducedMotion ? undefined : `url(#${gooId})` }}
      aria-hidden="true"
    >
      {blobs.map((on, i) => (
        <motion.div
          key={`blob-${i}`}
          className="absolute top-0"
          style={{
            left: i * slot,
            width: cellW,
            height: cellH,
            borderRadius: Math.max(10, Math.round(cellW * 0.28)),
            background: `linear-gradient(165deg, ${LIQUID_LIGHT} 0%, ${LIQUID} 55%, ${LIQUID_DARK} 100%)`,
          }}
          initial={false}
          animate={{
            scale: on ? 1 : 0.5,
            opacity: on ? 1 : 0,
          }}
          transition={reducedMotion ? { duration: 0.12 } : SPRING_GOO}
        />
      ))}

      {bridges.map((on, i) => (
        <motion.div
          key={`bridge-${i}`}
          className="absolute rounded-full"
          style={{
            left: i * slot + cellW - Math.max(4, gap * 0.6),
            width: gap + Math.max(8, gap),
            top: cellH * 0.2,
            height: cellH * 0.6,
            background: `linear-gradient(180deg, ${LIQUID_LIGHT} 0%, ${LIQUID} 50%, ${LIQUID_DARK} 100%)`,
            transformOrigin: 'left center',
          }}
          initial={false}
          animate={{
            scaleX: on ? 1 : 0,
            opacity: on ? 1 : 0,
          }}
          transition={reducedMotion ? { duration: 0.12 } : SPRING_GOO}
        />
      ))}
    </div>
  )
}

function DigitSlot({
  digit,
  index,
  active,
  filled,
  waiting,
  reducedMotion,
  cellW,
  cellH,
  onPress,
}) {
  const radius = Math.max(10, Math.round(cellW * 0.28))

  return (
    <motion.button
      type="button"
      onPointerDown={onPress}
      aria-label={digit ? `Digit ${digit}` : `Digit slot ${index + 1}`}
      className="relative flex shrink-0 items-center justify-center border outline-none touch-manipulation"
      style={{ width: cellW, height: cellH }}
      initial={false}
      animate={{
        borderRadius: radius,
        borderColor: filled
          ? 'transparent'
          : active
            ? 'rgba(82, 183, 136, 0.85)'
            : waiting
              ? 'rgba(82, 183, 136, 0.35)'
              : 'rgba(13, 31, 23, 0.12)',
        backgroundColor: filled ? 'transparent' : 'rgba(245, 240, 232, 0.55)',
        boxShadow: filled
          ? 'none'
          : active
            ? '0 0 0 3px rgba(82, 183, 136, 0.22)'
            : '0 1px 2px rgba(13, 31, 23, 0.04)',
        scale: active && !filled ? 1.03 : 1,
      }}
      transition={SPRING_SNAP}
      whileTap={filled ? undefined : { scale: 0.97 }}
    >
      {!filled && waiting && !reducedMotion && (
        <motion.span
          className="pointer-events-none absolute inset-x-1 bottom-1 rounded-md"
          style={{
            background:
              'linear-gradient(165deg, rgba(82,183,136,0.55), rgba(45,106,79,0.65))',
          }}
          animate={{ height: ['18%', '28%', '18%'], opacity: [0.35, 0.6, 0.35] }}
          transition={{
            duration: 2.1,
            delay: index * 0.1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      <AnimatePresence mode="popLayout">
        {digit ? (
          <motion.span
            key={`d-${digit}-${index}`}
            className="relative z-10 font-sans font-bold tabular-nums text-cream"
            style={{
              fontSize: Math.max(16, Math.round(cellW * 0.42)),
              letterSpacing: '-0.02em',
              textShadow: '0 1px 2px rgba(13,31,23,0.25)',
            }}
            initial={reducedMotion ? false : { opacity: 0, y: 8, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.88, y: -3 }}
            transition={SPRING_GOO}
          >
            {digit}
          </motion.span>
        ) : active ? (
          <motion.span
            key="caret"
            className="relative z-10 rounded-full bg-eco"
            style={{ width: 6, height: Math.max(16, cellH * 0.32) }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: [1, 0.25, 1] }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: 1.05, repeat: Infinity, ease: 'easeInOut' }
            }
          />
        ) : null}
      </AnimatePresence>
    </motion.button>
  )
}

export default function LiquidOtpInput({
  value = '',
  onChange,
  onComplete,
  disabled = false,
  error = false,
  waiting = false,
  length = OTP_LENGTH,
}) {
  const reducedMotion = useReducedMotion()
  const gooId = useId().replace(/:/g, '')
  const wrapRef = useRef(null)
  const hiddenRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const { cellW, cellH, gap } = useOtpMetrics(length, wrapRef)
  const digits = Array.from({ length }, (_, i) => value[i] || '')
  const filledCount = value.length
  const isWaiting = waiting && !value && !disabled && !error
  const rowWidth = length * cellW + (length - 1) * gap

  useEffect(() => {
    if (!disabled) hiddenRef.current?.focus({ preventScroll: true })
  }, [disabled])

  useEffect(() => {
    const nextEmpty = digits.findIndex((d) => !d)
    setActiveIndex(nextEmpty === -1 ? length - 1 : nextEmpty)
  }, [value, length])

  const commit = (next) => {
    const cleaned = next.replace(/\D/g, '').slice(0, length)
    onChange?.(cleaned)
    if (cleaned.length === length) onComplete?.(cleaned)
  }

  const focusHidden = () => {
    if (!disabled) hiddenRef.current?.focus({ preventScroll: true })
  }

  return (
    <div ref={wrapRef} className="w-full space-y-3">
      <AnimatePresence>{isWaiting && <OtpWaitingBanner />}</AnimatePresence>

      <GooFilter id={`otp-goo-${gooId}`} />

      {/* Extra vertical pad so goo blur / drop-shadow aren't clipped */}
      <div className="overflow-visible px-0.5 py-2">
        <div
          role="group"
          aria-label={`${length}-digit verification code`}
          className="relative mx-auto"
          style={{
            width: rowWidth,
            height: cellH,
            filter:
              filledCount > 0
                ? 'drop-shadow(0 8px 14px rgba(45, 106, 79, 0.26))'
                : undefined,
          }}
          onClick={focusHidden}
        >
          <LiquidMass
            filledCount={filledCount}
            length={length}
            reducedMotion={reducedMotion}
            gooId={`otp-goo-${gooId}`}
            cellW={cellW}
            cellH={cellH}
            gap={gap}
          />

          <div className="relative z-10 flex" style={{ gap }}>
            {digits.map((digit, i) => (
              <DigitSlot
                key={i}
                index={i}
                digit={digit}
                active={!disabled && activeIndex === i}
                filled={Boolean(digit)}
                waiting={isWaiting}
                reducedMotion={reducedMotion}
                cellW={cellW}
                cellH={cellH}
                onPress={focusHidden}
              />
            ))}
          </div>
        </div>
      </div>

      <input
        ref={hiddenRef}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={length}
        value={value}
        disabled={disabled}
        onChange={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Backspace' && value.length > 0) {
            e.preventDefault()
            commit(value.slice(0, -1))
          }
        }}
        onPaste={(e) => {
          e.preventDefault()
          commit(e.clipboardData.getData('text') || '')
        }}
        aria-label="Verification code"
        aria-invalid={error || undefined}
        className="sr-only"
      />

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-xs font-semibold text-urgent"
        >
          That code doesn’t look right. Try again.
        </motion.p>
      )}
    </div>
  )
}

export function OtpWaitingBanner() {
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      className="flex items-center justify-center gap-2.5 rounded-xl border border-eco/20 bg-eco/10 px-3 py-2.5"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={SPRING_SNAP}
      role="status"
      aria-live="polite"
    >
      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
        {!reducedMotion && (
          <motion.span
            className="absolute inset-0 rounded-full bg-[#25D366]/25"
            animate={{ scale: [1, 1.55], opacity: [0.55, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
        <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.988-1.307A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.084-1.118l-.292-.174-3.012.79.806-2.937-.19-.31A7.96 7.96 0 014 12a8 8 0 1116 0 8 8 0 01-8 8z" />
          </svg>
        </span>
      </div>

      <div className="min-w-0 text-left">
        <p className="text-xs font-bold text-forest">Waiting for your WhatsApp code</p>
        <p className="flex items-center gap-0.5 text-[11px] font-medium text-ink/50">
          Code is on the way
          {!reducedMotion && (
            <span className="inline-flex gap-0.5 pl-0.5" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="inline-block h-1 w-1 rounded-full bg-green"
                  animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
                  transition={{
                    duration: 1,
                    delay: i * 0.18,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </span>
          )}
        </p>
      </div>
    </motion.div>
  )
}

export function OtpSendingAnimation({ variant = 'sending' }) {
  const reducedMotion = useReducedMotion()
  const isVerify = variant === 'verifying'

  return (
    <motion.div
      className={`overflow-hidden rounded-xl border px-4 py-3 ${
        isVerify ? 'border-eco/25 bg-eco/10' : 'border-[#25D366]/25 bg-[#25D366]/8'
      }`}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={SPRING_SNAP}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 shrink-0">
          {!reducedMotion && (
            <motion.span
              className={`absolute inset-0 rounded-full border-2 ${
                isVerify ? 'border-eco/40' : 'border-[#25D366]/40'
              }`}
              animate={{ scale: [0.85, 1.25], opacity: [0.7, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
          <div
            className={`relative flex h-10 w-10 items-center justify-center rounded-full text-white ${
              isVerify ? 'bg-forest' : 'bg-[#25D366]'
            }`}
          >
            {isVerify ? (
              <motion.div
                className="h-4 w-4 rounded-full border-2 border-cream/30 border-t-cream"
                animate={reducedMotion ? undefined : { rotate: 360 }}
                transition={{ duration: 0.85, repeat: Infinity, ease: 'linear' }}
              />
            ) : (
              <motion.svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                animate={reducedMotion ? undefined : { rotate: [0, -8, 8, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <path
                  d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </motion.svg>
            )}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-forest">
            {isVerify ? 'Verifying your code' : 'Sending code via WhatsApp'}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-forest/10">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: isVerify
                  ? 'linear-gradient(90deg, #2D6A4F, #52B788, #2D6A4F)'
                  : 'linear-gradient(90deg, #25D366, #52B788, #25D366)',
                backgroundSize: '200% 100%',
              }}
              animate={
                reducedMotion
                  ? { width: '60%' }
                  : { width: ['18%', '88%', '42%', '95%'], backgroundPosition: ['0% 0%', '100% 0%'] }
              }
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
              }
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function LiquidOtpSuccess({ code }) {
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      className="flex flex-col items-center gap-3 py-2 text-center"
      initial={reducedMotion ? false : { opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={SPRING_SNAP}
    >
      <motion.div
        className="flex h-14 w-14 items-center justify-center rounded-full bg-eco text-cream shadow-lift"
        initial={reducedMotion ? false : { scale: 0.6 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', bounce: 0.25, duration: 0.45 }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
      <div>
        <p className="font-serif text-lg font-bold text-forest">Verification Successful</p>
        <p className="mt-1 text-xs text-ink/55">
          Your {code?.length || 6}-digit security code{' '}
          <span className="font-semibold text-green">{code}</span> has been verified.
        </p>
      </div>
    </motion.div>
  )
}
