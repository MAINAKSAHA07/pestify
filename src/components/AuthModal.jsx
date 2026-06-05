import { useState, useEffect } from 'react'
import { pb } from '../lib/pocketbase'
import { sendWhatsAppOtp, verifyWhatsAppOtp } from '../lib/whatsappAuth'
import { getAuthMethods, isGoogleAuthEnabled, startGoogleRedirectLogin, parseAuthError, GOOGLE_REDIRECT_URI } from '../lib/googleAuth'

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const [mode, setMode] = useState('email')
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [googleEnabled, setGoogleEnabled] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setEmail('')
    setPassword('')
    setName('')
    setPhone('')
    setOtp('')
    setError('')
    setInfo('')
    setLoading(false)
    setMode('email')

    getAuthMethods()
      .then((methods) => setGoogleEnabled(isGoogleAuthEnabled(methods)))
      .catch(() => setGoogleEnabled(false))
  }, [isOpen])

  if (!isOpen) return null

  const title =
    mode === 'whatsapp-phone'
      ? 'Login with WhatsApp'
      : mode === 'whatsapp-otp'
        ? 'Enter WhatsApp Code'
        : isSignUp
          ? 'Create an Account'
          : 'Welcome Back'

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isSignUp) {
        await pb.collection('users').create({
          email,
          password,
          passwordConfirm: password,
          name: name || undefined,
        })
      }
      await pb.collection('users').authWithPassword(email, password)
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    if (!googleEnabled) {
      setError('Google login is not enabled on PocketBase. Enable it in Admin → Settings → Auth providers.')
      return
    }

    setError('')
    setLoading(true)

    startGoogleRedirectLogin().catch((err) => {
      console.error('Google OAuth error:', err)
      setError(parseAuthError(err))
      setLoading(false)
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
    } catch (err) {
      setError(err.message)
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
              <button type="submit" disabled={loading} className="btnX h-11 w-full bg-[#25D366] font-semibold text-white hover:bg-[#1da851] disabled:opacity-70">
                {loading ? 'Sending...' : 'Send Code on WhatsApp'}
              </button>
              <button type="button" onClick={() => setMode('email')} className="w-full text-xs font-semibold text-ink/50 hover:text-eco">
                ← Back to email login
              </button>
            </form>
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

          {mode === 'email' && (
            <>
              <form onSubmit={handleEmailSubmit} className="space-y-4" noValidate>
                {isSignUp && (
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-ink/60">Full Name</span>
                    <input
                      type="text"
                      placeholder="e.g. Priya Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-11 w-full rounded-xl border border-black/10 bg-cream/30 px-3.5 text-sm focus:border-eco focus:outline-none focus:ring-2 focus:ring-eco/20"
                    />
                  </label>
                )}
                <label className="block space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink/60">Email Address</span>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 w-full rounded-xl border border-black/10 bg-cream/30 px-3.5 text-sm focus:border-eco focus:outline-none focus:ring-2 focus:ring-eco/20"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink/60">Password</span>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 w-full rounded-xl border border-black/10 bg-cream/30 pl-3.5 pr-10 text-sm focus:border-eco focus:outline-none focus:ring-2 focus:ring-eco/20"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40">
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </label>
                <button type="submit" disabled={loading} className="btnX mt-2 h-11 w-full bg-forest font-semibold text-cream hover:bg-green disabled:opacity-70">
                  {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
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
                <button
                  type="button"
                  onClick={() => setMode('whatsapp-phone')}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-black/10 bg-[#25D366]/10 px-4 py-2.5 text-sm font-semibold text-[#128C7E] hover:bg-[#25D366]/20 disabled:opacity-75"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.883 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Continue with WhatsApp
                </button>

                {googleEnabled ? (
                  <>
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
                    <p className="text-[10px] leading-relaxed text-ink/45">
                      Google redirect URI: <code className="rounded bg-cream px-1 break-all">{GOOGLE_REDIRECT_URI}</code>
                    </p>
                  </>
                ) : (
                  <p className="rounded-xl border border-amber/30 bg-amber/10 px-3 py-2 text-xs text-forest">
                    Google login is not configured on the server yet. Enable Google in PocketBase Admin → Settings → Auth providers.
                  </p>
                )}
              </div>

              <div className="mt-6 border-t border-black/5 pt-4 text-center text-xs text-ink/60">
                {isSignUp ? (
                  <p>
                    Already have an account?{' '}
                    <button type="button" onClick={() => setIsSignUp(false)} className="font-bold text-eco hover:underline">
                      Sign In
                    </button>
                  </p>
                ) : (
                  <p>
                    Don&apos;t have an account?{' '}
                    <button type="button" onClick={() => setIsSignUp(true)} className="font-bold text-eco hover:underline">
                      Create Account
                    </button>
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
