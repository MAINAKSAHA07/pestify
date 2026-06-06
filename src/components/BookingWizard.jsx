import { useState, useEffect } from 'react'
import { pb } from '../lib/pocketbase'
import { SERVICE_RATES } from '../data/content'
import { APPROVED_PINCODES } from '../data/pincodes'

export default function BookingWizard({ currentUser, locationInfo }) {
  const [step, setStep] = useState(1)
  const [service, setService] = useState('cockroach')
  const [bhkSize, setBhkSize] = useState('1BHK')
  const [extraRooms, setExtraRooms] = useState(0)

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState(() => {
    const saved = localStorage.getItem('pestyfi_location')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.pincode && parsed.serviceable) {
        return `${parsed.area} (${parsed.pincode})`
      }
    }
    return ''
  })

  // Sync location if updated from header
  useEffect(() => {
    if (locationInfo && locationInfo.pincode && locationInfo.serviceable) {
      setLocation(`${locationInfo.area} (${locationInfo.pincode})`)
    }
  }, [locationInfo])

  // Card details not required for Razorpay Payment Gateway

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successData, setSuccessData] = useState(null)

  // Auto-fill details if user is logged in
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.name || '')
      // email or other details could go here
    }
  }, [currentUser])

  // Load Razorpay Checkout SDK script dynamically
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
    return () => {
      const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
      if (existing) {
        document.body.removeChild(existing)
      }
    }
  }, [])

  const currentRate = SERVICE_RATES[service]

  const calculatePrice = () => {
    const base = currentRate.bhk[bhkSize] || 0
    const extraRoomCost = extraRooms * currentRate.extraRoom
    const subtotal = base + extraRoomCost
    const discount = Math.round(subtotal * 0.20) // 20% OFF prepaid discount
    const total = subtotal - discount
    return { base, extraRoomCost, subtotal, discount, total }
  }

  const { base, extraRoomCost, subtotal, discount, total } = calculatePrice()

  const handleNextStep = (e) => {
    e.preventDefault()
    setError('')
    if (step === 2) {
      if (!fullName.trim() || !phone.trim() || !location.trim()) {
        setError('Please fill in all contact and area details.')
        return
      }
      if (!/^\+?[0-9\s-]{8,}$/.test(phone)) {
        setError('Please enter a valid phone number.')
        return
      }
      const pincodeMatch = location.match(/\b\d{6}\b/)
      if (!pincodeMatch) {
        setError('Please include a valid 6-digit PIN code in your address.')
        return
      }
      const pincode = pincodeMatch[0]
      if (!APPROVED_PINCODES.has(pincode)) {
        setError(`We do not serve the PIN code ${pincode} yet. We will be there at your city soon! Your request has been noted.`)
        
        // Log out-of-service lead in PocketBase
        pb.collection('leads').create({
          fullName,
          phone,
          location: `OUT_OF_SERVICE: ${pincode} (${location})`
        }).catch(err => console.error('Failed to register out-of-service lead:', err))
        
        return
      }
    }
    setStep(step + 1)
  }

  const handlePrevStep = () => {
    setError('')
    setStep(step - 1)
  }

  const handlePayAndBook = (e) => {
    if (e) e.preventDefault()
    setError('')

    if (!window.Razorpay) {
      setError('Payment gateway (Razorpay) is still loading. Please try again in a moment.')
      return
    }

    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID
    if (!keyId) {
      setError('Payment gateway configuration is missing (VITE_RAZORPAY_KEY_ID is not set).')
      return
    }

    setLoading(true)

    const options = {
      key: keyId,
      amount: Math.round(total * 100), // Amount is in currency subunits (Paise)
      currency: 'INR',
      name: 'Pestyfi Eco Solutions',
      description: `${currentRate.label} (${bhkSize})`,
      image: '/favicon.svg',
      handler: async function (response) {
        try {
          const record = await pb.collection('bookings').create({
            fullName,
            phone,
            location,
            service: currentRate.label,
            bhkSize,
            extraRooms,
            price: total,
            paymentMethod: 'razorpay',
            status: 'paid',
            paymentId: response.razorpay_payment_id,
          })
          setSuccessData(record)
        } catch (err) {
          console.error('Error creating booking in PocketBase:', err)
          setError(err?.message || `Payment succeeded (ID: ${response.razorpay_payment_id}) but we failed to record your booking. Please contact support.`)
        } finally {
          setLoading(false)
        }
      },
      prefill: {
        name: fullName,
        contact: phone,
        email: currentUser?.email || '',
      },
      theme: {
        color: '#1A3A2A',
      },
      modal: {
        ondismiss: function () {
          setLoading(false)
        }
      }
    }

    try {
      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', function (resp) {
        console.error('Payment failed:', resp.error)
        setError(resp.error.description || 'Payment transaction failed. Please try again.')
        setLoading(false)
      })
      rzp.open()
    } catch (err) {
      console.error('Razorpay initialization failed:', err)
      setError('Could not initialize the payment gateway window.')
      setLoading(false)
    }
  }

  const handleReset = () => {
    setStep(1)
    setExtraRooms(0)
    setError('')
    setSuccessData(null)
  }

  if (successData) {
    return (
      <div className="rounded-2xl bg-white/10 p-6 ring-1 ring-white/15 text-center reveal is-in">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-eco/20 text-3xl mb-4 text-eco animate-bounce">
          ✓
        </div>
        <h3 className="font-serif text-2xl font-semibold text-cream">Booking Confirmed!</h3>
        <p className="mt-2 text-sm text-cream/80">
          Thank you, <strong>{fullName}</strong>. Your payment of <strong>₹{total.toLocaleString('en-IN')}/-</strong> was processed successfully.
        </p>

        <div className="my-6 rounded-xl bg-forest/30 border border-white/5 p-4 text-left text-xs space-y-2 text-cream/90">
          <div><span className="text-cream/50">Transaction ID:</span> {successData.id}</div>
          {successData.paymentId && (
            <div><span className="text-cream/50">Razorpay Payment ID:</span> {successData.paymentId}</div>
          )}
          <div><span className="text-cream/50">Service Selected:</span> {currentRate.label}</div>
          <div><span className="text-cream/50">Size:</span> {bhkSize} {extraRooms > 0 && `(+ ${extraRooms} extra room${extraRooms > 1 ? 's' : ''})`}</div>
          <div><span className="text-cream/50">Service Address:</span> {location}</div>
          <div><span className="text-cream/50">Contact:</span> {phone}</div>
        </div>

        <p className="text-xs text-eco/90 font-medium mb-5">
          * A confirmation SMS & details have been sent. Our team will call you shortly to align the service slot.
        </p>
        <button onClick={handleReset} className="btnPrimary w-full py-3">Book Another Service</button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white/10 p-6 ring-1 ring-white/15 reveal is-in">
      {/* Wizard Progress Header */}
      <div className="flex items-center justify-between text-xs font-semibold text-cream/60 mb-6 border-b border-white/10 pb-4">
        <span className={step === 1 ? 'text-amber font-bold' : ''}>1. Service</span>
        <span>→</span>
        <span className={step === 2 ? 'text-amber font-bold' : ''}>2. Contact</span>
        <span>→</span>
        <span className={step === 3 ? 'text-amber font-bold' : ''}>3. Payment</span>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-urgent/25 border border-urgent/40 px-4 py-3 text-xs font-semibold text-white">
          {error}
        </div>
      )}

      {/* STEP 1: CONFIGURE SERVICE */}
      {step === 1 && (
        <div className="space-y-5">
          <label className="grid gap-1.5 text-sm">
            <span className="font-semibold text-cream">Select Pest Control Service</span>
            <select
              value={service}
              onChange={(e) => {
                setService(e.target.value)
                setExtraRooms(0)
              }}
              className="h-11 rounded-xl bg-forest px-3.5 text-sm text-cream ring-1 ring-white/15 focus:outline-none focus:ring-2 focus:ring-amber cursor-pointer"
            >
              <option value="cockroach">Advance Golden Gel (Cockroaches)</option>
              <option value="termite">Anti Termite Treatment (Termites)</option>
              <option value="bedbug">BedBug Treatment (Bedbugs)</option>
              <option value="general">General Disinfection (Ants, Spiders, crawling insects)</option>
              <option value="mosquito">Mosquito Treatment (Mosquitoes)</option>
            </select>
          </label>

          <div>
            <span className="text-sm font-semibold text-cream block mb-2">BHK Size</span>
            <div className="grid grid-cols-4 gap-2">
              {['1BHK', '2BHK', '3BHK', '4BHK+'].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setBhkSize(size)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                    bhkSize === size
                      ? 'bg-amber text-forest border-amber shadow-md'
                      : 'bg-white/5 text-cream/80 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between bg-forest/30 border border-white/5 rounded-xl p-3">
            <div>
              <span className="text-xs font-bold text-cream">Extra Rooms</span>
              <p className="text-[10px] text-cream/60">
                +₹{currentRate.extraRoom.toLocaleString('en-IN')} per room
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setExtraRooms(Math.max(0, extraRooms - 1))}
                className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-cream hover:bg-white/15 transition-colors"
              >
                -
              </button>
              <span className="text-sm font-bold text-cream min-w-[12px] text-center">{extraRooms}</span>
              <button
                type="button"
                onClick={() => setExtraRooms(Math.min(10, extraRooms + 1))}
                className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-cream hover:bg-white/15 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Dynamic Summary Panel */}
          <div className="bg-forest/65 rounded-xl p-4 border border-white/10 space-y-2 text-xs text-cream/90">
            <div className="flex justify-between">
              <span>Base rate ({bhkSize}):</span>
              <span>₹{base.toLocaleString('en-IN')}</span>
            </div>
            {extraRooms > 0 && (
              <div className="flex justify-between">
                <span>Extra rooms ({extraRooms}):</span>
                <span>+₹{extraRoomCost.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="border-t border-white/10 pt-2 flex justify-between font-bold text-sm text-cream">
              <span>Subtotal:</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-eco font-medium">
              <span>Prepaid Discount (20% OFF):</span>
              <span>-₹{discount.toLocaleString('en-IN')}</span>
            </div>
            <div className="border-t border-white/10 pt-2 flex justify-between font-bold text-base text-amber">
              <span>Estimated Price:</span>
              <span>₹{total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button onClick={handleNextStep} className="btnPrimary w-full py-3 mt-4">
            Next: Contact Details
          </button>
        </div>
      )}

      {/* STEP 2: ADDRESS / DETAILS */}
      {step === 2 && (
        <form onSubmit={handleNextStep} className="space-y-4">
          <label className="grid gap-1.5 text-sm">
            <span className="font-semibold text-cream">Full Name</span>
            <input
              required
              type="text"
              placeholder="e.g. Priya Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-11 rounded-xl bg-white/10 px-3 text-cream placeholder:text-cream/50 ring-1 ring-white/15 focus:outline-none focus:ring-2 focus:ring-amber"
            />
          </label>

          <label className="grid gap-1.5 text-sm">
            <span className="font-semibold text-cream">Phone Number</span>
            <input
              required
              type="tel"
              placeholder="+91 XXXXX XXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-11 rounded-xl bg-white/10 px-3 text-cream placeholder:text-cream/50 ring-1 ring-white/15 focus:outline-none focus:ring-2 focus:ring-amber"
            />
          </label>

          <label className="grid gap-1.5 text-sm">
            <span className="font-semibold text-cream">Area / Location (Address)</span>
            <input
              required
              type="text"
              placeholder="e.g. Andheri West, Vashi Sector 17"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-11 rounded-xl bg-white/10 px-3 text-cream placeholder:text-cream/50 ring-1 ring-white/15 focus:outline-none focus:ring-2 focus:ring-amber"
            />
          </label>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handlePrevStep}
              className="btnGhost flex-1 py-3 text-sm"
            >
              Back
            </button>
            <button
              type="submit"
              className="btnPrimary flex-1 py-3 text-sm"
            >
              Next: Payment
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: PAYMENT */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-forest/50 border border-white/5 rounded-xl p-3 text-xs text-cream/90 space-y-1.5">
            <h4 className="font-serif font-bold text-sm text-amber border-b border-white/10 pb-1.5 mb-2">Order Summary</h4>
            <div className="flex justify-between"><span>Service:</span> <span className="font-semibold">{currentRate.label}</span></div>
            <div className="flex justify-between"><span>BHK Size:</span> <span>{bhkSize}</span></div>
            {extraRooms > 0 && <div className="flex justify-between"><span>Extra Rooms:</span> <span>{extraRooms}</span></div>}
            <div className="flex justify-between text-eco font-medium"><span>Prepaid Discount (20%):</span> <span>-₹{discount.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between text-sm font-bold text-cream border-t border-white/10 pt-1.5"><span>Net Total:</span> <span>₹{total.toLocaleString('en-IN')}</span></div>
          </div>

          <div className="bg-forest/30 border border-white/5 rounded-xl p-3 text-xs text-cream/90 space-y-1.5">
            <h4 className="font-semibold text-cream/70 border-b border-white/10 pb-1 mb-1.5">Contact & Location</h4>
            <div><span className="text-cream/50">Name:</span> {fullName}</div>
            <div><span className="text-cream/50">Phone:</span> {phone}</div>
            <div><span className="text-cream/50">Location:</span> {location}</div>
          </div>

          <p className="text-[11px] text-cream/60 text-center leading-relaxed">
            Clicking the payment button below will open the secure **Razorpay checkout** to pay via UPI, cards, net banking, or wallets.
          </p>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={handlePrevStep}
              className="btnGhost flex-1 py-3 text-sm disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={handlePayAndBook}
              disabled={loading}
              className="btnPrimary flex-1 py-3 text-sm disabled:opacity-75 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-forest" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </>
              ) : (
                `Pay ₹${total.toLocaleString('en-IN')}`
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
