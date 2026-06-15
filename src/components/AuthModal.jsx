import { useState, useEffect } from 'react'
import { pb } from '../lib/pocketbase'
import { sendWhatsAppOtp, verifyWhatsAppOtp } from '../lib/whatsappAuth'
import { getAuthMethods, isGoogleAuthEnabled, startGoogleRedirectLogin, startGooglePopupLogin, parseAuthError, GOOGLE_REDIRECT_URI } from '../lib/googleAuth'

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const [mode, setMode] = useState('whatsapp-phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [googleEnabled, setGoogleEnabled] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  useEffect(() => {
    if (!isOpen) return
    setPhone('')
    setOtp('')
    setError('')
    setInfo('')
    setLoading(false)
    setMode('whatsapp-phone')

    getAuthMethods()
      .then((methods) => setGoogleEnabled(isGoogleAuthEnabled(methods)))
      .catch(() => setGoogleEnabled(false))
  }, [isOpen])

  if (!isOpen) return null

  const title =
    mode === 'whatsapp-phone'
      ? 'Login with WhatsApp'
      : 'Enter WhatsApp Code'

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
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      const data = await sendWhatsAppOtp(phone)
      setInfo(`Code sent to ${data.phone} on WhatsApp`)
      setMode('whatsapp-otp')
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

  const handleWhatsAppVerifyOtp = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await verifyWhatsAppOtp(phone, otp)
      pb.authStore.save(data.token, data.record)
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-forest/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl2 border border-white/10 bg-white shadow-premium ring-1 ring-black/5">
        <div className="h-1.5 w-full bg-gradient-to-r from-eco via-amber to-urgent" />

        <div className="p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-serif text-2xl font-bold text-forest">{title}</h3>
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-ink/40 hover:bg-black/5" aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 whitespace-pre-line rounded-xl border border-urgent/20 bg-urgent/10 px-4 py-3 text-xs font-semibold text-urgent">{error}</div>
          )}
          {info && (
            <div className="mb-4 rounded-xl border border-eco/20 bg-eco/10 px-4 py-3 text-xs font-semibold text-green">{info}</div>
          )}

          {mode === 'whatsapp-phone' && (
            <>
              <form onSubmit={handleWhatsAppSendOtp} className="space-y-4" noValidate>
                <p className="text-xs leading-relaxed text-ink/60">
                  Enter your WhatsApp number. We&apos;ll send a one-time login code via WhatsApp Cloud API.
                </p>
                <label className="block space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink/60">WhatsApp Number</span>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-11 w-full rounded-xl border border-black/10 bg-cream/30 px-3.5 text-sm focus:border-eco focus:outline-none focus:ring-2 focus:ring-eco/20"
                  />
                </label>
                <button type="submit" disabled={loading || cooldown > 0} className="btnX h-11 w-full bg-[#25D366] font-semibold text-white hover:bg-[#1da851] disabled:opacity-70">
                  {loading ? 'Sending...' : cooldown > 0 ? `Resend Code in ${cooldown}s` : 'Send Code on WhatsApp'}
                </button>
              </form>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-black/5" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 font-semibold text-ink/40">Or continue with</span>
                </div>
              </div>

              <div className="space-y-3">
                {googleEnabled ? (
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-sm hover:bg-cream/10 disabled:opacity-75"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                  </button>
                ) : (
                  <p className="rounded-xl border border-amber/30 bg-amber/10 px-3 py-2 text-xs text-forest text-center">
                    Google login is not configured on the server yet.
                  </p>
                )}
              </div>
            </>
          )}

          {mode === 'whatsapp-otp' && (
            <form onSubmit={handleWhatsAppVerifyOtp} className="space-y-4" noValidate>
              <p className="text-xs text-ink/60">
                Enter the 6-digit code sent to <strong>{phone}</strong>
              </p>
              <label className="block space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-ink/60">Verification Code</span>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="h-11 w-full rounded-xl border border-black/10 bg-cream/30 px-3.5 text-center text-lg font-semibold tracking-[0.3em] focus:border-eco focus:outline-none focus:ring-2 focus:ring-eco/20"
                />
              </label>
              <button type="submit" disabled={loading || otp.length < 6} className="btnX h-11 w-full bg-forest font-semibold text-cream hover:bg-green disabled:opacity-70">
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('whatsapp-phone')
                  setOtp('')
                }}
                className="w-full text-xs font-semibold text-ink/50 hover:text-eco"
              >
                ← Change number / resend
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
