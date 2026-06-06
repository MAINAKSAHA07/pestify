import { useState, useEffect } from 'react'
import { pb } from '../lib/pocketbase'
import { APPROVED_PINCODES, getAreaForPincode } from '../data/pincodes'

export default function LocationModal({ isOpen, onClose, onSelect }) {
  const [pincode, setPincode] = useState('')
  const [isLocating, setIsLocating] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('input') // 'input' | 'unserved' | 'unserved-submitted' | 'served'
  const [detectedPin, setDetectedPin] = useState('')
  const [servedArea, setServedArea] = useState('')
  
  // Lead form states for unserved areas
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [submittingLead, setSubmittingLead] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setPincode('')
      setError('')
      setStatus('input')
      setFullName('')
      setPhone('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleVerifyPincode = (pin) => {
    setError('')
    const cleanPin = pin.trim()
    if (!/^\d{6}$/.test(cleanPin)) {
      setError('Please enter a valid 6-digit PIN code.')
      return
    }

    if (APPROVED_PINCODES.has(cleanPin)) {
      const area = getAreaForPincode(cleanPin)
      setServedArea(area)
      setStatus('served')
      const locationData = { pincode: cleanPin, area, serviceable: true }
      localStorage.setItem('pestyfi_location', JSON.stringify(locationData))
      onSelect?.(locationData)
      
      // Auto close after showing success for 1.5 seconds
      setTimeout(() => {
        onClose()
      }, 1500)
    } else {
      setDetectedPin(cleanPin)
      setStatus('unserved')
    }
  }

  const handleDetectLocation = () => {
    setError('')
    setIsLocating(true)

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser. Please enter your PIN code manually.')
      setIsLocating(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          // Fetch reverse geocode using free keyless API
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          )
          
          if (!response.ok) {
            throw new Error('Failed to retrieve location details.')
          }

          const data = await response.json()
          const code = data.postcode

          if (code && /^\d{6}$/.test(code.trim())) {
            setPincode(code.trim())
            handleVerifyPincode(code.trim())
          } else {
            setError(`Detected PIN code "${code || 'unknown'}" is invalid. Please enter manually.`)
          }
        } catch (err) {
          console.error('Reverse geocoding error:', err)
          setError('Could not detect PIN code from geolocation. Please enter it manually.')
        } finally {
          setIsLocating(false)
        }
      },
      (err) => {
        console.warn('Geolocation error:', err)
        setError('Location access denied or unavailable. Please enter your PIN code manually.')
        setIsLocating(false)
      },
      { timeout: 10000 }
    );
  }

  const handleLeadSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!fullName.trim() || !phone.trim()) {
      setError('Please fill in all fields.')
      return
    }
    if (!/^\+?[0-9\s-]{8,}$/.test(phone)) {
      setError('Please enter a valid phone number.')
      return
    }

    setSubmittingLead(true)
    try {
      await pb.collection('leads').create({
        fullName,
        phone,
        location: `OUT_OF_SERVICE: ${detectedPin}`,
      })
      setStatus('unserved-submitted')
    } catch (err) {
      console.error('Failed to submit lead:', err)
      setError('Unable to submit request. Please try again.')
    } finally {
      setSubmittingLead(false)
    }
  }

  const handleContinueAnyway = () => {
    const locationData = { pincode: detectedPin, area: 'Other City', serviceable: false }
    localStorage.setItem('pestyfi_location', JSON.stringify(locationData))
    onSelect?.(locationData)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-forest/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Content Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl2 border border-white/10 bg-white shadow-premium ring-1 ring-black/5">
        {/* Top Decorative Gradient */}
        <div className="h-1.5 w-full bg-gradient-to-r from-eco via-amber to-urgent" />

        <div className="p-6 sm:p-8">
          {/* Modal Header */}
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-serif text-2xl font-bold text-forest">
              {status === 'served' ? 'We Serve Your Area!' : 'Check Service Availability'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-ink/40 hover:bg-black/5 transition-colors focus:outline-none"
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-urgent/20 bg-urgent/10 px-4 py-3 text-xs font-semibold text-urgent">
              {error}
            </div>
          )}

          {/* STATE 1: INITIAL INPUT */}
          {status === 'input' && (
            <div className="space-y-5">
              <p className="text-xs leading-relaxed text-ink/60">
                Pestyfi operates in selected regions across Mumbai, Navi Mumbai, and Thane. Let's verify if we can protect your home today.
              </p>

              {/* Geolocation Button */}
              <button
                type="button"
                disabled={isLocating}
                onClick={handleDetectLocation}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-black/10 bg-cream/40 px-4 py-3 text-sm font-semibold text-forest hover:bg-cream transition-colors disabled:opacity-60"
              >
                {isLocating ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-forest" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Detecting Location...
                  </>
                ) : (
                  <>
                    <span className="text-lg">📍</span>
                    Detect My Location
                  </>
                )}
              </button>

              <div className="relative flex items-center justify-center py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-black/5" />
                </div>
                <span className="relative bg-white px-3 text-xs font-semibold uppercase tracking-wider text-ink/40">Or enter manually</span>
              </div>

              {/* Pincode Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleVerifyPincode(pincode)
                }}
                className="space-y-4"
              >
                <label className="block space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink/60">6-Digit PIN Code</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    placeholder="e.g. 400001"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    className="h-11 w-full rounded-xl border border-black/10 bg-cream/20 px-3.5 text-center text-lg font-semibold tracking-[0.2em] placeholder:tracking-normal placeholder:font-normal placeholder:text-sm focus:border-eco focus:outline-none focus:ring-2 focus:ring-eco/20 transition-all"
                  />
                </label>

                <button
                  type="submit"
                  disabled={pincode.length < 6}
                  className="btnX h-11 w-full bg-forest font-semibold text-cream hover:bg-green disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                >
                  Verify Pincode
                </button>
              </form>
            </div>
          )}

          {/* STATE 2: SERVED */}
          {status === 'served' && (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-eco/25 text-3xl text-green animate-bounce">
                ✓
              </div>
              <h4 className="font-serif text-xl font-bold text-forest">{servedArea}</h4>
              <p className="mt-2 text-sm text-ink/70">
                Pincode <strong>{pincode}</strong> is fully serviceable.
              </p>
              <p className="mt-1 text-xs text-eco font-semibold">
                Applying active discounts for your area...
              </p>
            </div>
          )}

          {/* STATE 3: UNSERVED */}
          {status === 'unserved' && (
            <div className="space-y-5">
              <div className="rounded-xl bg-amber/10 border border-amber/20 p-4">
                <p className="text-sm font-semibold text-urgent text-center">
                  We are not serving in {detectedPin} yet.
                </p>
                <p className="mt-2 text-xs text-ink/70 leading-relaxed text-center font-medium">
                  We will be there at your city soon! Your request is noted.
                </p>
              </div>

              {/* Lead registration form to get notified */}
              <form onSubmit={handleLeadSubmit} className="space-y-3">
                <p className="text-xs text-ink/50 text-center">
                  Leave your contact details so we can alert you as soon as operations begin in {detectedPin}.
                </p>

                <label className="block space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink/60">Full Name</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-10 w-full rounded-xl border border-black/10 bg-cream/10 px-3 text-sm focus:border-eco focus:outline-none"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink/60">Phone Number</span>
                  <input
                    type="tel"
                    required
                    placeholder="+91 XXXXX XXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-10 w-full rounded-xl border border-black/10 bg-cream/10 px-3 text-sm focus:border-eco focus:outline-none"
                  />
                </label>

                <button
                  type="submit"
                  disabled={submittingLead}
                  className="btnX h-10 w-full bg-urgent font-semibold text-white hover:bg-urgent/90 disabled:opacity-60 transition-all"
                >
                  {submittingLead ? 'Registering Request...' : 'Notify Me'}
                </button>
              </form>

              <div className="flex flex-col gap-2 pt-2 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => {
                    setStatus('input')
                    setPincode('')
                  }}
                  className="text-xs font-bold text-forest hover:text-green text-center py-1.5"
                >
                  ← Try Another Pincode
                </button>
                <button
                  type="button"
                  onClick={handleContinueAnyway}
                  className="text-xs font-semibold text-ink/40 hover:text-ink/60 text-center py-1"
                >
                  Continue Browsing Site
                </button>
              </div>
            </div>
          )}

          {/* STATE 4: UNSERVED SUBMITTED */}
          {status === 'unserved-submitted' && (
            <div className="flex flex-col items-center py-6 text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-eco/25 text-3xl text-green">
                ✓
              </div>
              <h4 className="font-serif text-xl font-bold text-forest">Request Registered!</h4>
              <p className="text-sm text-ink/70 max-w-xs leading-relaxed">
                Thank you! We have recorded your interest for pincode <strong>{detectedPin}</strong>. We will notify you once we expand our services to your city.
              </p>
              
              <div className="w-full pt-4 space-y-2">
                <button
                  type="button"
                  onClick={handleContinueAnyway}
                  className="btnX h-11 w-full bg-forest font-semibold text-cream hover:bg-green transition-all"
                >
                  Browse Website
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatus('input')
                    setPincode('')
                  }}
                  className="text-xs font-bold text-forest hover:text-green block mx-auto py-2"
                >
                  Enter Another PIN Code
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
