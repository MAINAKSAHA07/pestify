import { useState, useEffect } from 'react'
import { pb } from '../lib/pocketbase'
import { SERVICE_RATES, SERVICES } from '../data/content'
import { APPROVED_PINCODES } from '../data/pincodes'
import { parseStoredAddress, formatAddress } from './ProfileModal'

export default function BookingWizard({ currentUser, locationInfo, services: customServices, rates: customRates }) {
  const finalServices = customServices || SERVICES
  const finalRates = customRates || SERVICE_RATES

  const [step, setStep] = useState(1)
  const [duration, setDuration] = useState('one-time')
  const [pest, setPest] = useState('cockroach')
  const [service, setService] = useState('cockroach')
  const [propertyType, setPropertyType] = useState('residential')
  const [bhkSize, setBhkSize] = useState('1BHK')
  const [extraRooms, setExtraRooms] = useState(0)

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  
  // Structured Address fields matching ProfileModal
  const [flat, setFlat] = useState('')
  const [building, setBuilding] = useState('')
  const [society, setSociety] = useState('')
  const [area, setArea] = useState('')
  const [city, setCity] = useState('')
  const [pincode, setPincode] = useState('')
  const [location, setLocation] = useState('')

  const getTomorrowString = () => {
    const tom = new Date()
    tom.setDate(tom.getDate() + 1)
    return tom.toISOString().substring(0, 10)
  }

  const [preferredDate, setPreferredDate] = useState(getTomorrowString())
  const [preferredTime, setPreferredTime] = useState('09:00 AM - 12:00 PM')

  // Sync location if updated from header
  useEffect(() => {
    if (locationInfo && locationInfo.pincode && locationInfo.serviceable) {
      setPincode(locationInfo.pincode)
      if (locationInfo.area) {
        setCity(locationInfo.area)
      }
    }
  }, [locationInfo])

  // Card details not required for Razorpay Payment Gateway

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successData, setSuccessData] = useState(null)

  // Auto-fill details if user is logged in or profile has address
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.name || '')
      if (currentUser.phone) {
        setPhone(currentUser.phone)
      } else {
        const savedPhone = localStorage.getItem('pestyfi_profile_phone')
        if (savedPhone) {
          setPhone(savedPhone)
        }
      }
    } else {
      const savedPhone = localStorage.getItem('pestyfi_profile_phone')
      if (savedPhone) {
        setPhone(savedPhone)
      }
    }

    const addrStr = (currentUser && currentUser.address) || localStorage.getItem('pestyfi_profile_address')
    if (addrStr) {
      const parsed = parseStoredAddress(addrStr)
      setFlat(parsed.flat || '')
      setBuilding(parsed.building || '')
      setSociety(parsed.society || '')
      setArea(parsed.area || '')
      setCity(parsed.city || '')
      setPincode(parsed.pincode || '')
      const formatted = formatAddress(parsed)
      if (formatted) {
        setLocation(formatted)
      }
    } else {
      const saved = localStorage.getItem('pestyfi_location')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (parsed.pincode) {
            setPincode(parsed.pincode)
            if (parsed.area) {
              setCity(parsed.area)
            }
          }
        } catch (e) {}
      }
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

  const needsInspection = ['termite', 'bedbug', 'mosquito'].includes(service) || finalServices.find(s => s.id === service)?.inspectionRequired || propertyType === 'commercial'

  const currentRate = finalRates[service]

  const calculatePrice = () => {
    if (duration === 'annual') {
      const amcBase = currentRate?.amcBhk?.[bhkSize] || currentRate?.bhk?.[bhkSize] || 8000
      const discount = Math.round(amcBase * 0.20) // 20% OFF prepaid discount
      const total = amcBase - discount
      return { base: amcBase, extraRoomCost: 0, subtotal: amcBase, discount, total }
    }
    const base = currentRate?.bhk?.[bhkSize] || 0
    const extraRoomCost = extraRooms * (currentRate?.extraRoom || 0)
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
      if (!fullName.trim() || !phone.trim() || !pincode.trim()) {
        setError('Please fill in your name, contact phone, and PIN code.')
        return
      }
      if (!/^\+?[0-9\s-]{8,}$/.test(phone) || phone.replace(/\D/g, '').length < 10) {
        setError('Please enter a valid phone number with at least 10 digits.')
        return
      }
      const cleanPincode = pincode.trim()
      if (!/^\d{6}$/.test(cleanPincode)) {
        setError('Please enter a valid 6-digit PIN code.')
        return
      }
      if (!flat.trim() && !building.trim() && !society.trim()) {
        setError('Please enter your house/flat number, building name, or society name.')
        return
      }
      if (!area.trim() || !city.trim()) {
        setError('Please enter your area/street name and city.')
        return
      }

      const currentAddr = formatAddress({ flat, building, society, area, city, pincode: cleanPincode })

      if (!APPROVED_PINCODES.has(cleanPincode)) {
        setError(`We do not serve the PIN code ${cleanPincode} yet. We will be there at your city soon! Your request has been noted.`)
        
        // Log out-of-service lead in PocketBase
        pb.collection('leads').create({
          fullName,
          phone,
          location: `OUT_OF_SERVICE: ${cleanPincode} (${currentAddr})`
        }).catch(err => console.error('Failed to register out-of-service lead:', err))
        
        return
      }

      // Update location state for booking record and confirmation screen
      setLocation(currentAddr)

      // Save locally to localStorage to guarantee availability in the prefill next time
      const addressData = {
        flat: flat.trim(),
        building: building.trim(),
        society: society.trim(),
        area: area.trim(),
        city: city.trim(),
        pincode: cleanPincode
      }
      localStorage.setItem('pestyfi_profile_address', JSON.stringify(addressData))
      localStorage.setItem('pestyfi_profile_phone', phone)
    }
    setStep(step + 1)
  }

  const handlePrevStep = () => {
    setError('')
    setStep(step - 1)
  }

  const handlePayAndBook = async (e) => {
    if (e) e.preventDefault()
    setError('')

    if (needsInspection) {
      setLoading(true)
      try {
        const record = await pb.collection('bookings').create({
          fullName,
          phone,
          location,
          service: `${currentRate.label} (${duration === 'annual' ? 'Annual Plan' : 'One-Time'})`,
          bhkSize: propertyType === 'commercial' ? 'Commercial' : bhkSize,
          extraRooms: propertyType === 'commercial' ? 0 : extraRooms,
          price: 0,
          paymentMethod: 'home_inspection',
          status: 'Inspection Required',
          paymentId: '',
          preferredDate,
          preferredTime,
          propertyType,
        })

        // Sync back to profile in PocketBase if logged in
        if (currentUser) {
          try {
            const addressData = {
              flat: flat.trim(),
              building: building.trim(),
              society: society.trim(),
              area: area.trim(),
              city: city.trim(),
              pincode: pincode.trim()
            }
            await pb.collection('users').update(currentUser.id, {
              phone,
              address: JSON.stringify(addressData),
            })
          } catch (pErr) {
            console.warn('Failed to sync booking address to user profile:', pErr)
          }
        }

        setSuccessData(record)
      } catch (err) {
        console.error('Error creating inspection booking in PocketBase:', err)
        setError(err?.message || 'Failed to book your inspection. Please try again.')
      } finally {
        setLoading(false)
      }
      return
    }

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
            service: `${currentRate.label} (${duration === 'annual' ? 'Annual Plan' : 'One-Time'})`,
            bhkSize: propertyType === 'commercial' ? 'Commercial' : bhkSize,
            extraRooms: propertyType === 'commercial' ? 0 : extraRooms,
            price: total,
            paymentMethod: 'razorpay',
            status: 'paid',
            paymentId: response.razorpay_payment_id,
            preferredDate,
            preferredTime,
            propertyType,
          })

          // Sync back to profile in PocketBase if logged in
          if (currentUser) {
            try {
              const addressData = {
                flat: flat.trim(),
                building: building.trim(),
                society: society.trim(),
                area: area.trim(),
                city: city.trim(),
                pincode: pincode.trim()
              }
              await pb.collection('users').update(currentUser.id, {
                phone,
                address: JSON.stringify(addressData),
              })
            } catch (pErr) {
              console.warn('Failed to sync booking address to user profile:', pErr)
            }
          }

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
    const isInspection = successData.paymentMethod === 'home_inspection'

    return (
      <div className="rounded-2xl bg-white/10 p-4 sm:p-6 ring-1 ring-white/15 text-center reveal is-in">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-eco/20 text-3xl mb-4 text-eco animate-bounce">
          ✓
        </div>
        <h3 className="font-serif text-2xl font-semibold text-cream">
          {isInspection ? 'Inspection Scheduled!' : 'Booking Confirmed!'}
        </h3>
        <p className="mt-2 text-sm text-cream/80">
          {isInspection ? (
            <>Thank you, <strong>{fullName}</strong>. Your free home inspection request is registered successfully.</>
          ) : (
            <>Thank you, <strong>{fullName}</strong>. Your payment of <strong>₹{total.toLocaleString('en-IN')}/-</strong> was processed successfully.</>
          )}
        </p>

        <div className="my-6 rounded-xl bg-forest/30 border border-white/5 p-4 text-left text-xs space-y-2 text-cream/90">
          <div><span className="text-cream/50">Request ID:</span> {successData.id}</div>
          {!isInspection && successData.paymentId && (
            <div><span className="text-cream/50">Razorpay Payment ID:</span> {successData.paymentId}</div>
          )}
          <div><span className="text-cream/50">Service Selected:</span> {currentRate.label}</div>
          {service !== 'all' && (
            <div><span className="text-cream/50">Size:</span> {bhkSize} {extraRooms > 0 && `(+ ${extraRooms} extra room${extraRooms > 1 ? 's' : ''})`}</div>
          )}
          <div><span className="text-cream/50">Service Address:</span> {location}</div>
          <div><span className="text-cream/50">Contact:</span> {phone}</div>
          {isInspection && (
            <div><span className="text-cream/50">Estimated Cost:</span> ₹{total.toLocaleString('en-IN')} (to be verified post-inspection)</div>
          )}
        </div>

        <p className="text-xs text-eco/90 font-medium mb-5">
          {isInspection ? (
            <>* Our team will call you within 24 hours to schedule the inspection visit at your convenience.</>
          ) : (
            <>* A confirmation SMS & details have been sent. Our team will call you shortly to align the service slot.</>
          )}
        </p>
        <button onClick={handleReset} className="btnPrimary w-full py-3">
          {isInspection ? 'Book Another Inspection' : 'Book Another Service'}
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white/10 p-4 sm:p-6 ring-1 ring-white/15 reveal is-in">
      {/* Wizard Progress Header */}
      <div className="flex items-center justify-between text-xs font-semibold text-cream/60 mb-6 border-b border-white/10 pb-4">
        <span className={step === 1 ? 'text-amber font-bold' : ''}>1. Service</span>
        <span>→</span>
        <span className={step === 2 ? 'text-amber font-bold' : ''}>2. Contact</span>
        <span>→</span>
        <span className={step === 3 ? 'text-amber font-bold' : ''}>
          {needsInspection ? '3. Inspection' : '3. Payment'}
        </span>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-urgent/25 border border-urgent/40 px-4 py-3 text-xs font-semibold text-white">
          {error}
        </div>
      )}

      {/* STEP 1: CONFIGURE SERVICE */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <span className="text-sm font-semibold text-cream block mb-2">Service Plan Selection</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'one-time', label: 'One-Time Service' },
                { id: 'annual', label: 'Annual Service Plan' }
              ].map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => {
                    setDuration(plan.id)
                    setExtraRooms(0)
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    duration === plan.id
                      ? 'bg-amber text-forest border-amber shadow-md'
                      : 'bg-white/5 text-cream/80 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {plan.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-sm font-semibold text-cream block mb-2">Property Type</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'residential', label: '🏠 Residential' },
                { id: 'commercial', label: '🏢 Commercial' }
              ].map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => {
                    setPropertyType(type.id)
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    propertyType === type.id
                      ? 'bg-amber text-forest border-amber shadow-md'
                      : 'bg-white/5 text-cream/80 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <label className="grid gap-1.5 text-sm">
            <span className="font-semibold text-cream">Identify Your Pest Threat</span>
            <select
              value={pest}
              onChange={(e) => {
                const selectedPest = e.target.value
                setPest(selectedPest)
                setService(selectedPest)
                setExtraRooms(0)
              }}
              className="h-11 rounded-xl bg-forest px-3.5 text-sm text-cream ring-1 ring-white/15 focus:outline-none focus:ring-2 focus:ring-amber cursor-pointer"
            >
              {finalServices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} {['termite', 'bedbug', 'mosquito'].includes(s.id) || s.inspectionRequired ? ' (Inspection Required)' : ''}
                </option>
              ))}
            </select>
          </label>

          {pest && (
            <div className="bg-forest/30 border border-white/5 rounded-xl p-3 text-xs text-cream/95 space-y-1">
              <span className="font-bold text-amber">✓ Recommended Plan:</span>
              <p className="font-semibold text-sm text-white">{currentRate?.label} ({duration === 'annual' ? 'Annual Plan' : 'One-Time'})</p>
              {needsInspection && (
                <p className="text-[10px] text-amber font-medium mt-1">
                  ⚠️ This treatment requires a free site inspection before service booking. No upfront payment required.
                </p>
              )}
              {duration === 'annual' && (
                <p className="text-[10px] text-eco font-medium mt-1">
                  ⭐ Covers scheduled checkups and treatments with year-round assurance.
                </p>
              )}
            </div>
          )}

          {propertyType === 'residential' && (duration === 'annual' || service === 'all') ? (
            <div className="bg-forest/30 border border-white/5 rounded-xl p-3 text-xs text-cream/90">
              <span className="text-xs font-bold text-amber block mb-1">
                {duration === 'annual' ? 'Premium Annual Protection Plan' : 'Complete Protection (One-Time)'}
              </span>
              <p>
                {duration === 'annual'
                  ? `Annual services feature comprehensive coverage for your home for a rate of ₹${total.toLocaleString('en-IN')}, with no additional extra room fees.`
                  : `This comprehensive package covers cockroaches, ants, termites, bed bugs, and mosquitoes for a rate of ₹${total.toLocaleString('en-IN')}.`}
              </p>
            </div>
          ) : null}

          {propertyType === 'residential' && (
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
          )}

          {propertyType === 'residential' && duration !== 'annual' && service !== 'all' && (
            <div className="flex items-center justify-between bg-forest/30 border border-white/5 rounded-xl p-3">
              <div>
                <span className="text-xs font-bold text-cream">Extra Rooms</span>
                <p className="text-[10px] text-cream/60">
                  +₹{currentRate?.extraRoom?.toLocaleString('en-IN')} per room
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
          )}

          {/* Dynamic Summary Panel */}
          <div className="bg-forest/65 rounded-xl p-4 border border-white/10 space-y-2 text-xs text-cream/90">
            {propertyType === 'commercial' ? (
              <>
                <div className="flex justify-between font-bold text-sm text-cream">
                  <span>Service Rate:</span>
                  <span className="text-amber font-semibold">TBD Post-Inspection</span>
                </div>
                <div className="border-t border-white/10 pt-2 flex justify-between font-bold text-base text-amber">
                  <span>Inspection Fee:</span>
                  <span className="text-eco font-bold">FREE</span>
                </div>
              </>
            ) : duration === 'annual' || service === 'all' ? (
              <>
                <div className="flex justify-between font-bold text-sm text-cream">
                  <span>Package Rate ({duration === 'annual' ? 'Annual' : 'One-Time'}):</span>
                  <span>₹{total.toLocaleString('en-IN')}</span>
                </div>
                <div className="border-t border-white/10 pt-2 flex justify-between font-bold text-base text-amber">
                  <span>Estimated Price:</span>
                  <span>₹{total.toLocaleString('en-IN')}</span>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
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

          <div className="border-t border-white/10 pt-4 mt-2">
            <span className="text-xs font-bold text-cream/70 block mb-3 uppercase tracking-wider">Service Address</span>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-xs font-semibold text-cream col-span-2 sm:col-span-1">
                <span>Flat / Room Number</span>
                <input
                  type="text"
                  placeholder="e.g. Flat A/6"
                  value={flat}
                  onChange={(e) => setFlat(e.target.value)}
                  className="h-10 rounded-xl bg-white/10 px-3 text-cream placeholder:text-cream/40 ring-1 ring-white/15 focus:outline-none focus:ring-2 focus:ring-amber"
                />
              </label>
              
              <label className="grid gap-1 text-xs font-semibold text-cream col-span-2 sm:col-span-1">
                <span>Building Name</span>
                <input
                  type="text"
                  placeholder="e.g. Shripad Smruti"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  className="h-10 rounded-xl bg-white/10 px-3 text-cream placeholder:text-cream/40 ring-1 ring-white/15 focus:outline-none focus:ring-2 focus:ring-amber"
                />
              </label>

              <label className="grid gap-1 text-xs font-semibold text-cream col-span-2">
                <span>Society Name</span>
                <input
                  type="text"
                  placeholder="e.g. Star Colony / Shanti Dham"
                  value={society}
                  onChange={(e) => setSociety(e.target.value)}
                  className="h-10 rounded-xl bg-white/10 px-3 text-cream placeholder:text-cream/40 ring-1 ring-white/15 focus:outline-none focus:ring-2 focus:ring-amber"
                />
              </label>

              <label className="grid gap-1 text-xs font-semibold text-cream col-span-2">
                <span>Area Name / Street</span>
                <input
                  type="text"
                  placeholder="e.g. Manpada Road, Off Link Road"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="h-10 rounded-xl bg-white/10 px-3 text-cream placeholder:text-cream/40 ring-1 ring-white/15 focus:outline-none focus:ring-2 focus:ring-amber"
                />
              </label>

              <label className="grid gap-1 text-xs font-semibold text-cream col-span-2 sm:col-span-1">
                <span>City</span>
                <input
                  type="text"
                  placeholder="e.g. Dombivli"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-10 rounded-xl bg-white/10 px-3 text-cream placeholder:text-cream/40 ring-1 ring-white/15 focus:outline-none focus:ring-2 focus:ring-amber"
                />
              </label>

              <label className="grid gap-1 text-xs font-semibold text-cream col-span-2 sm:col-span-1">
                <span>Pincode</span>
                <input
                  type="text"
                  placeholder="e.g. 421201"
                  pattern="\d{6}"
                  maxLength="6"
                  required
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  className="h-10 rounded-xl bg-white/10 px-3 text-cream placeholder:text-cream/40 ring-1 ring-white/15 focus:outline-none focus:ring-2 focus:ring-amber"
                />
              </label>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 mt-2">
            <span className="text-xs font-bold text-cream/70 block mb-3 uppercase tracking-wider">Preferred Service Schedule</span>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-xs font-semibold text-cream col-span-2 sm:col-span-1">
                <span>Select Date</span>
                <input
                  type="date"
                  required
                  min={getTomorrowString()}
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="h-10 rounded-xl bg-white/10 px-3 text-cream placeholder:text-cream/40 ring-1 ring-white/15 focus:outline-none focus:ring-2 focus:ring-amber cursor-pointer text-xs"
                />
              </label>

              <label className="grid gap-1 text-xs font-semibold text-cream col-span-2 sm:col-span-1">
                <span>Preferred Time Slot</span>
                <select
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="h-10 rounded-xl bg-white/10 px-2 text-cream ring-1 ring-white/15 focus:outline-none focus:ring-2 focus:ring-amber cursor-pointer text-xs"
                  style={{ colorScheme: 'dark' }}
                >
                  <option className="bg-forest text-cream" value="09:00 AM - 12:00 PM">09:00 AM - 12:00 PM (Morning)</option>
                  <option className="bg-forest text-cream" value="12:00 PM - 03:00 PM">12:00 PM - 03:00 PM (Afternoon)</option>
                  <option className="bg-forest text-cream" value="03:00 PM - 06:00 PM">03:00 PM - 06:00 PM (Late Afternoon)</option>
                  <option className="bg-forest text-cream" value="06:00 PM - 09:00 PM">06:00 PM - 09:00 PM (Evening)</option>
                </select>
              </label>
            </div>
          </div>

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
            {service !== 'all' && <div className="flex justify-between"><span>BHK Size:</span> <span>{bhkSize}</span></div>}
            {extraRooms > 0 && <div className="flex justify-between"><span>Extra Rooms:</span> <span>{extraRooms}</span></div>}
            {!needsInspection && service !== 'all' && (
              <div className="flex justify-between text-eco font-medium"><span>Prepaid Discount (20%):</span> <span>-₹{discount.toLocaleString('en-IN')}</span></div>
            )}
            <div className="flex justify-between text-sm font-bold text-cream border-t border-white/10 pt-1.5">
              <span>{needsInspection ? 'Estimated Cost:' : 'Net Total:'}</span>
              <span>₹{total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="bg-forest/30 border border-white/5 rounded-xl p-3 text-xs text-cream/90 space-y-1.5">
            <h4 className="font-semibold text-cream/70 border-b border-white/10 pb-1 mb-1.5">Contact & Location</h4>
            <div><span className="text-cream/50">Name:</span> {fullName}</div>
            <div><span className="text-cream/50">Phone:</span> {phone}</div>
            <div><span className="text-cream/50">Location:</span> {location}</div>
          </div>

          {needsInspection ? (
            <div className="bg-forest/30 border border-white/5 rounded-xl p-3 text-xs text-cream/90 space-y-1.5">
              <h4 className="font-semibold text-amber border-b border-white/10 pb-1 mb-1.5 uppercase tracking-wider">Free Home Inspection Required</h4>
              <p className="leading-relaxed">
                Due to the type of pest threat (Termite, Bed Bug, or Mosquito), a **free home inspection** is required before treatment can begin. An expert will visit to evaluate the extent of infestation and provide the final treatment quote.
              </p>
              <p className="text-eco font-medium">No payment is required right now.</p>
            </div>
          ) : (
            <p className="text-[11px] text-cream/60 text-center leading-relaxed">
              Clicking the payment button below will open the secure **Razorpay checkout** to pay via UPI, cards, net banking, or wallets.
            </p>
          )}

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
              ) : needsInspection ? (
                'Book Free Inspection'
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
