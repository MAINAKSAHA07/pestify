import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { pb } from '../lib/pocketbase'
import { sendWhatsAppOtp, verifyWhatsAppOtp } from '../lib/whatsappAuth'
import { getAuthMethods, isGoogleAuthEnabled, startGoogleRedirectLogin, startGooglePopupLogin, parseAuthError } from '../lib/googleAuth'
import { formatFullPhone, formatDisplayPhone, isValidLocalPhone } from '../lib/phone'
import { getApiBaseUrl } from '../lib/api'
import PhoneInput from './PhoneInput'
import LiquidOtpInput, { LiquidOtpSuccess, OtpSendingAnimation } from './LiquidOtpInput'

const SHEET_SPRING = { type: 'spring', bounce: 0, duration: 0.38 }

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const reducedMotion = useReducedMotion()
  const [mode, setMode] = useState('whatsapp-phone')
  const [phoneCountry, setPhoneCountry] = useState('IN')
  const [phoneLocal, setPhoneLocal] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [googleEnabled, setGoogleEnabled] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [otpVerified, setOtpVerified] = useState(false)
  const [otpError, setOtpError] = useState(false)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  useEffect(() => {
    if (!isOpen) return
    setPhoneCountry('IN')
    setPhoneLocal('')
    setOtp('')
    setError('')
    setInfo('')
    setLoading(false)
    setMode('whatsapp-phone')
    setNewName('')
    setNewEmail('')
    setOtpVerified(false)
    setOtpError(false)

    getAuthMethods()
      .then((methods) => setGoogleEnabled(isGoogleAuthEnabled(methods)))
      .catch(() => setGoogleEnabled(false))
  }, [isOpen])

  // Lock scroll while modal is open — prevents background jump
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  const title =
    mode === 'whatsapp-phone'
      ? 'Login with WhatsApp'
      : mode === 'whatsapp-otp'
        ? 'Enter WhatsApp Code'
        : 'Setup Account Profile'

  const busy = loading || otpVerified

  const handleBackdropClose = () => {
    if (busy) return // Don't dismiss mid-verify / success beat
    onClose()
  }

  const handleGoogleLogin = () => {
    if (!googleEnabled) {
      setError('Google login is not enabled on PocketBase. Enable it in Admin → Settings → Auth providers.')
      return
    }

    setError('')
    setLoading(true)

    startGooglePopupLogin()
      .then((authData) => {
        pb.authStore.save(authData.token, authData.record)
        onSuccess?.()
        onClose()
      })
      .catch((err) => {
        if (err.message === 'Popup blocked') {
          console.warn('[Google Auth] Popup blocked, falling back to full-page redirect...')
          startGoogleRedirectLogin().catch((redirectErr) => {
            console.error('Google Redirect OAuth error:', redirectErr)
            setError(parseAuthError(redirectErr))
            setLoading(false)
          })
        } else {
          console.error('Google OAuth error:', err)
          setError(parseAuthError(err))
          setLoading(false)
        }
      })
  }

  const handleWhatsAppSendOtp = async (e) => {
    e?.preventDefault?.()
    setError('')
    setInfo('')

    if (!isValidLocalPhone(phoneCountry, phoneLocal)) {
      setError('Please enter a valid phone number for the selected country.')
      return
    }

    const fullPhone = formatFullPhone(phoneCountry, phoneLocal)
    setLoading(true)
    try {
      const data = await sendWhatsAppOtp(fullPhone)
      setInfo(`Code sent to ${formatDisplayPhone(data.phone || fullPhone)} on WhatsApp`)
      setMode('whatsapp-otp')
      setOtp('')
      setOtpError(false)
      setCooldown(60)
    } catch (err) {
      setError(err.message)
      const match = err.message.match(/(\d+)s/)
      if (match) {
        setCooldown(parseInt(match[1], 10))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsAppVerifyOtp = async (e, codeOverride) => {
    e?.preventDefault?.()
    const code = (codeOverride ?? otp).replace(/\D/g, '').slice(0, 6)
    if (code.length < 6 || loading || otpVerified) return

    setError('')
    setOtpError(false)
    setLoading(true)
    try {
      const fullPhone = formatFullPhone(phoneCountry, phoneLocal)
      const data = await verifyWhatsAppOtp(fullPhone, code)

      const isNew = !data.record.name ||
                    !data.record.name.trim() ||
                    data.record.name.startsWith('WhatsApp ')

      pb.authStore.save(data.token, data.record)
      localStorage.setItem('pestyfi_profile_phone', fullPhone)
      setOtp(code)
      setOtpVerified(true)

      window.setTimeout(() => {
        if (isNew) {
          setMode('onboarding')
          setOtpVerified(false)
        } else {
          onSuccess?.()
          onClose()
        }
      }, 900)
    } catch (err) {
      setError(err.message)
      setOtpError(true)
      setOtp('')
    } finally {
      setLoading(false)
    }
  }

  const handleOnboardingSubmit = async (e) => {
    e.preventDefault()
    if (!newName.trim()) {
      setError('Name is required.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${getApiBaseUrl()}/whatsapp/update-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': pb.authStore.token
        },
        body: JSON.stringify({
          userId: pb.authStore.model.id,
          name: newName.trim(),
          email: newEmail.trim()
        })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update account profile.')
      }

      pb.authStore.save(pb.authStore.token, data.record)

      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <motion.div
            className="fixed inset-0 bg-forest/80"
            style={{ backdropFilter: reducedMotion ? 'none' : 'blur(8px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.15 : 0.28 }}
            onClick={handleBackdropClose}
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            className="relative w-full max-w-md overflow-x-clip rounded-2xl2 border border-white/10 bg-white shadow-premium ring-1 ring-black/5"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            transition={reducedMotion ? { duration: 0.15 } : SHEET_SPRING}
          >
            <div className="h-1.5 w-full bg-gradient-to-r from-eco via-amber to-urgent" />

            <div className="p-5 sm:p-8">
              <div className="mb-5 flex items-center justify-between gap-3 sm:mb-6">
                <h3 id="auth-modal-title" className="font-serif text-xl font-bold text-forest sm:text-2xl">
                  {title}
                </h3>
                <motion.button
                  type="button"
                  onClick={handleBackdropClose}
                  disabled={busy}
                  className="rounded-lg p-1.5 text-ink/40 hover:bg-black/5 disabled:opacity-40"
                  aria-label="Close"
                  whileTap={busy ? undefined : { scale: 0.92 }}
                  transition={SHEET_SPRING}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </motion.button>
              </div>

              {error && (
                <div className="mb-4 whitespace-pre-line rounded-xl border border-urgent/20 bg-urgent/10 px-4 py-3 text-xs font-semibold text-urgent">
                  {error}
                </div>
              )}
              {/* Phone step only — OTP step has its own waiting banner */}
              {info && mode === 'whatsapp-phone' && (
                <div className="mb-4 rounded-xl border border-eco/20 bg-eco/10 px-4 py-3 text-xs font-semibold text-green">
                  {info}
                </div>
              )}

              <AnimatePresence mode="wait">
                {mode === 'whatsapp-phone' && (
                  <motion.div
                    key="phone"
                    initial={reducedMotion ? false : { opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -12 }}
                    transition={SHEET_SPRING}
                  >
                    <form onSubmit={handleWhatsAppSendOtp} className="space-y-4" noValidate>
                      <p className="text-xs leading-relaxed text-ink/60">
                        Enter your WhatsApp number. We&apos;ll send a one-time login code via WhatsApp.
                      </p>
                      <label className="block space-y-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-ink/60">WhatsApp Number</span>
                        <PhoneInput
                          theme="light"
                          countryId={phoneCountry}
                          localNumber={phoneLocal}
                          onCountryChange={setPhoneCountry}
                          onLocalNumberChange={setPhoneLocal}
                          required
                        />
                      </label>
                      <motion.button
                        type="submit"
                        disabled={loading || cooldown > 0}
                        className="btnX h-11 w-full bg-[#25D366] font-semibold text-white hover:bg-[#1da851] disabled:opacity-70"
                        whileTap={loading || cooldown > 0 ? undefined : { scale: 0.98 }}
                        transition={SHEET_SPRING}
                      >
                        {loading ? 'Sending...' : cooldown > 0 ? `Resend Code in ${cooldown}s` : 'Send Code on WhatsApp'}
                      </motion.button>
                      <AnimatePresence>
                        {loading && <OtpSendingAnimation />}
                      </AnimatePresence>
                    </form>
                  </motion.div>
                )}

                {mode === 'whatsapp-otp' && (
                  <motion.div
                    key="otp"
                    initial={reducedMotion ? false : { opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: 16 }}
                    transition={SHEET_SPRING}
                  >
                    <form onSubmit={handleWhatsAppVerifyOtp} className="space-y-5" noValidate>
                      {otpVerified ? (
                        <LiquidOtpSuccess code={otp} />
                      ) : (
                        <>
                          <div className="flex flex-col items-center gap-3 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-eco/30 bg-eco/10 text-green">
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path
                                  d="M12 3l7 3v5c0 4.5-2.8 8.4-7 10-4.2-1.6-7-5.5-7-10V6l7-3z"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinejoin="round"
                                />
                                <circle cx="12" cy="11" r="2.2" stroke="currentColor" strokeWidth="1.6" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-serif text-lg font-bold text-forest">Verification Code</p>
                              <p className="mt-1 text-xs leading-relaxed text-ink/55">
                                Enter the 6-digit code sent to{' '}
                                <strong className="text-ink/75">
                                  {formatDisplayPhone(formatFullPhone(phoneCountry, phoneLocal))}
                                </strong>
                              </p>
                            </div>
                          </div>

                          <LiquidOtpInput
                            value={otp}
                            onChange={(next) => {
                              setOtp(next)
                              setOtpError(false)
                              setError('')
                            }}
                            onComplete={(code) => {
                              handleWhatsAppVerifyOtp(null, code)
                            }}
                            disabled={loading}
                            error={otpError}
                            waiting={!loading && !otpError}
                          />

                          <AnimatePresence>
                            {loading && <OtpSendingAnimation variant="verifying" />}
                          </AnimatePresence>

                          <motion.button
                            type="submit"
                            disabled={loading || otp.length < 6}
                            className="btnX h-11 w-full bg-forest font-semibold text-cream hover:bg-green disabled:opacity-70"
                            whileTap={loading || otp.length < 6 ? undefined : { scale: 0.98 }}
                            transition={SHEET_SPRING}
                          >
                            {loading ? 'Verifying...' : 'Verify & Login'}
                          </motion.button>

                          <div className="flex flex-col items-center gap-2">
                            <p className="text-xs text-ink/45">
                              Didn&apos;t receive the code?{' '}
                              <button
                                type="button"
                                disabled={loading || cooldown > 0}
                                onClick={handleWhatsAppSendOtp}
                                className="font-semibold text-green underline underline-offset-2 hover:text-forest disabled:opacity-50"
                              >
                                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                              </button>
                            </p>
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() => {
                                setMode('whatsapp-phone')
                                setOtp('')
                                setOtpError(false)
                                setError('')
                              }}
                              className="text-xs font-semibold text-ink/50 hover:text-eco disabled:opacity-50"
                            >
                              ← Change number
                            </button>
                          </div>
                        </>
                      )}
                    </form>
                  </motion.div>
                )}

                {mode === 'onboarding' && (
                  <motion.div
                    key="onboarding"
                    initial={reducedMotion ? false : { opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: 12 }}
                    transition={SHEET_SPRING}
                  >
                    <form onSubmit={handleOnboardingSubmit} className="space-y-4" noValidate>
                      <p className="text-xs text-ink/65 leading-relaxed">
                        Welcome to Pestyfi! Please complete your account setup by entering your name and email.
                      </p>
                      <label className="block space-y-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-ink/60">Full Name *</span>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Rahul Sharma"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="h-11 w-full rounded-xl border border-black/10 bg-cream/30 px-3.5 text-sm focus:border-eco focus:outline-none focus:ring-2 focus:ring-eco/20"
                        />
                      </label>
                      <label className="block space-y-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-ink/60">Email Address (Optional)</span>
                        <input
                          type="email"
                          placeholder="e.g. rahul@example.com"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="h-11 w-full rounded-xl border border-black/10 bg-cream/30 px-3.5 text-sm focus:border-eco focus:outline-none focus:ring-2 focus:ring-eco/20"
                        />
                      </label>
                      <motion.button
                        type="submit"
                        disabled={loading || !newName.trim()}
                        className="btnX h-11 w-full bg-forest font-semibold text-cream hover:bg-green disabled:opacity-70"
                        whileTap={loading || !newName.trim() ? undefined : { scale: 0.98 }}
                        transition={SHEET_SPRING}
                      >
                        {loading ? 'Saving Profile...' : 'Complete Registration'}
                      </motion.button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
