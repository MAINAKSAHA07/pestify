import { useState, useEffect } from 'react'
import { pb } from '../lib/pocketbase'

export function parseStoredAddress(addressStr) {
  if (!addressStr) {
    return { flat: '', building: '', society: '', area: '', city: '', pincode: '' }
  }

  try {
    const trimmed = addressStr.trim()
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const parsed = JSON.parse(trimmed)
      if (parsed && typeof parsed === 'object') {
        return {
          flat: parsed.flat || '',
          building: parsed.building || '',
          society: parsed.society || '',
          area: parsed.area || '',
          city: parsed.city || '',
          pincode: parsed.pincode || ''
        }
      }
    }
  } catch (e) {
    console.warn("Failed to parse address as JSON, trying fallback", e)
  }

  // Fallback parsing for raw comma-separated strings
  const pincodeMatch = addressStr.match(/\b\d{6}\b/)
  const pincode = pincodeMatch ? pincodeMatch[0] : ''

  let cleanStr = addressStr
  if (pincode) {
    cleanStr = addressStr.replace(new RegExp(`\\s*-\\s*${pincode}.*|\\s*${pincode}.*`), '')
  }

  const parts = cleanStr.split(',').map(p => p.trim()).filter(Boolean)
  
  let flat = ''
  let building = ''
  let society = ''
  let area = ''
  let city = ''

  if (parts.length >= 5) {
    flat = parts[0]
    building = parts[1]
    society = parts[2]
    city = parts[parts.length - 1]
    area = parts.slice(3, parts.length - 1).join(', ')
  } else if (parts.length === 4) {
    flat = parts[0]
    building = parts[1]
    society = parts[2]
    city = parts[3]
  } else if (parts.length === 3) {
    flat = parts[0]
    building = parts[1]
    city = parts[2]
  } else if (parts.length === 2) {
    flat = parts[0]
    city = parts[1]
  } else if (parts.length === 1) {
    flat = parts[0]
  }

  return { flat, building, society, area, city, pincode }
}

export function formatAddress(parsed) {
  if (!parsed) return ''
  const { flat, building, society, area, city, pincode } = parsed
  const parts = [flat, building, society, area, city].map(s => s?.trim()).filter(Boolean)
  if (parts.length === 0 && !pincode) return ''
  
  return parts.join(', ') + (pincode ? ` - ${pincode}` : '')
}

export default function ProfileModal({ isOpen, onClose, currentUser, onUserUpdate }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchPhone, setSearchPhone] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchResult, setSearchResult] = useState(null)

  // Profile Edit States
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editFlat, setEditFlat] = useState('')
  const [editBuilding, setEditBuilding] = useState('')
  const [editSociety, setEditSociety] = useState('')
  const [editArea, setEditArea] = useState('')
  const [editCity, setEditCity] = useState('')
  const [editPincode, setEditPincode] = useState('')
  const [saveLoading, setSaveLoading] = useState(false)

  // Fetch user bookings when modal opens and currentUser is available
  useEffect(() => {
    if (!isOpen) return
    setError('')
    setBookings([])
    setSearchResult(null)
    setSearchPhone('')
    setIsEditing(false)

    if (!currentUser) return

    setEditName(currentUser.name || '')
    setEditPhone(currentUser.phone || localStorage.getItem('pestyfi_profile_phone') || '')
    
    const addrStr = currentUser.address || localStorage.getItem('pestyfi_profile_address') || ''
    const parsed = parseStoredAddress(addrStr)
    setEditFlat(parsed.flat)
    setEditBuilding(parsed.building)
    setEditSociety(parsed.society)
    setEditArea(parsed.area)
    setEditCity(parsed.city)
    setEditPincode(parsed.pincode)

    // Retrieve bookings: search by phone number from profile or local storage cache
    const userPhone = currentUser.phone || localStorage.getItem('pestyfi_profile_phone')
    if (!userPhone) {
      setLoading(false)
      return
    }

    setLoading(true)

    pb.collection('bookings')
      .getList(1, 50, {
        filter: `phone = "${userPhone.trim()}"`,
        sort: '-created',
      })
      .then((res) => {
        setBookings(res.items)
      })
      .catch((err) => {
        console.error('Failed to retrieve bookings directly:', err)
        setError('Booking retrieval via phone search failed. Please use the lookup tool below if needed.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [isOpen, currentUser])

  if (!isOpen) return null

  const handlePhoneLookup = async (e) => {
    e.preventDefault()
    if (!searchPhone.trim()) return

    setSearchLoading(true)
    setError('')
    setSearchResult([])

    try {
      const res = await pb.collection('bookings').getList(1, 50, {
        filter: `phone = "${searchPhone.trim()}"`,
        sort: '-created',
      })
      setSearchResult(res.items)
      if (res.items.length === 0) {
        setError('No bookings found for this phone number.')
      }
    } catch (err) {
      console.error('Failed to lookup bookings:', err)
      setError(err?.message || 'Failed to search bookings. Please try again.')
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!currentUser) return

    setSaveLoading(true)
    setError('')

    const phoneDigitCount = editPhone.replace(/\D/g, '').length
    if (editPhone && phoneDigitCount < 10) {
      setError('Please enter a valid contact number with at least 10 digits.')
      setSaveLoading(false)
      return
    }

    const addressData = {
      flat: editFlat.trim(),
      building: editBuilding.trim(),
      society: editSociety.trim(),
      area: editArea.trim(),
      city: editCity.trim(),
      pincode: editPincode.trim()
    }
    const serializedAddress = JSON.stringify(addressData)

    // Save locally immediately to guarantee availability in the Booking Wizard prefill
    localStorage.setItem('pestyfi_profile_address', serializedAddress)
    localStorage.setItem('pestyfi_profile_phone', editPhone)

    try {
      // Step 1: Try saving name, phone, and address to PocketBase
      const updatedRecord = await pb.collection('users').update(currentUser.id, {
        name: editName,
        phone: editPhone,
        address: serializedAddress,
      })
      onUserUpdate?.(updatedRecord)
      setIsEditing(false)
    } catch (err) {
      console.warn("PocketBase update failed with address/phone, trying fallback...", err)

      try {
        // Step 2: Try saving name and phone to PocketBase
        const updatedRecord = await pb.collection('users').update(currentUser.id, {
          name: editName,
          phone: editPhone,
        })
        onUserUpdate?.(updatedRecord)
        setIsEditing(false)
      } catch (err2) {
        console.warn("Name/phone update failed, trying name-only fallback...", err2)
        try {
          // Step 3: Try saving only name
          const updatedRecord = await pb.collection('users').update(currentUser.id, {
            name: editName,
          })
          onUserUpdate?.(updatedRecord)
          setIsEditing(false)
        } catch (err3) {
          setError(err3?.message || "Failed to save profile changes to server.")
        }
      }
    } finally {
      setSaveLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (String(status).toLowerCase()) {
      case 'paid':
        return <span className="inline-flex items-center rounded-md bg-green/10 px-2.5 py-0.5 text-xs font-semibold text-green border border-green/20">Paid</span>
      case 'scheduled':
        return <span className="inline-flex items-center rounded-md bg-amber/10 px-2.5 py-0.5 text-xs font-semibold text-amber border border-amber/20">Scheduled</span>
      case 'completed':
        return <span className="inline-flex items-center rounded-md bg-forest/10 px-2.5 py-0.5 text-xs font-semibold text-forest border border-forest/20">Completed</span>
      default:
        return <span className="inline-flex items-center rounded-md bg-black/5 px-2.5 py-0.5 text-xs font-semibold text-ink/70 border border-black/10">{status || 'Pending'}</span>
    }
  }

  const displayBookings = searchResult !== null ? searchResult : bookings

  const storedAddressStr = currentUser?.address || localStorage.getItem('pestyfi_profile_address') || ''
  const displayAddress = formatAddress(parseStoredAddress(storedAddressStr)) || 'Not set'
  const displayPhone = currentUser?.phone || editPhone || localStorage.getItem('pestyfi_profile_phone') || 'Not set'

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      {/* Background Overlay */}
      <div className="fixed inset-0 bg-forest/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl2 border border-black/5 bg-white shadow-premium ring-1 ring-black/5 flex flex-col max-h-[90vh]">
        <div className="h-1.5 w-full bg-gradient-to-r from-eco via-amber to-urgent shrink-0" />

        <div className="p-6 sm:p-8 flex flex-col overflow-y-auto">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between shrink-0">
            <h3 className="font-serif text-2xl font-bold text-forest">My Profile & Bookings</h3>
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-ink/40 hover:bg-black/5" aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* User Profile Info Card (View Mode vs Edit Mode) */}
          {currentUser && !isEditing ? (
            <div className="mb-6 rounded-xl bg-cream/50 border border-black/5 p-4 shrink-0">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-forest/70">Account Profile</h4>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-xs font-bold text-green hover:underline cursor-pointer"
                >
                  Edit Details
                </button>
              </div>
              <div className="grid gap-2 text-sm">
                <div><span className="font-medium text-ink/50">Name:</span> <span className="font-semibold text-forest">{currentUser.name || 'Not set'}</span></div>
                <div><span className="font-medium text-ink/50">Email:</span> <span className="font-semibold text-forest">{currentUser.email}</span></div>
                {currentUser.role && currentUser.role !== 'customer' && (
                  <div>
                    <span className="font-medium text-ink/50">Account Role:</span>{' '}
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold uppercase border ${
                      currentUser.role === 'superadmin'
                        ? 'bg-purple-500/10 border-purple-500/20 text-purple-600'
                        : currentUser.role === 'admin' 
                          ? 'bg-eco/10 border-eco/20 text-green' 
                          : 'bg-amber/10 border-amber/20 text-amber'
                    }`}>
                      {currentUser.role}
                    </span>
                  </div>
                )}
                <div><span className="font-medium text-ink/50">Phone:</span> <span className="font-semibold text-forest">{displayPhone}</span></div>
                <div><span className="font-medium text-ink/50">Home Address:</span> <span className="font-semibold text-forest block mt-1 whitespace-pre-wrap">{displayAddress}</span></div>
              </div>
            </div>
          ) : currentUser && isEditing ? (
            <form onSubmit={handleSaveProfile} className="mb-6 rounded-xl bg-cream/50 border border-black/5 p-4 shrink-0 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-forest/70">Edit Profile Details</h4>
              
              <label className="grid gap-1 text-xs font-semibold text-forest">
                <span>Full Name</span>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="rounded-lg border border-black/10 bg-white px-3 py-1.5 outline-none focus:ring-1 focus:ring-forest text-ink"
                />
              </label>

              <label className="grid gap-1 text-xs font-semibold text-forest">
                <span>Contact Phone (Minimum 10 digits)</span>
                <input
                  type="tel"
                  placeholder="Enter contact phone"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="rounded-lg border border-black/10 bg-white px-3 py-1.5 outline-none focus:ring-1 focus:ring-forest text-ink"
                />
              </label>

              <div className="border-t border-black/5 pt-3 mt-2">
                <span className="text-xs font-bold text-forest/70 block mb-2 uppercase tracking-wider">Service Address</span>
                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-1 text-xs font-semibold text-forest col-span-2 sm:col-span-1">
                    <span>Flat / Room Number</span>
                    <input
                      type="text"
                      placeholder="e.g. Flat A/6"
                      value={editFlat}
                      onChange={(e) => setEditFlat(e.target.value)}
                      className="rounded-lg border border-black/10 bg-white px-3 py-1.5 outline-none focus:ring-1 focus:ring-forest text-ink"
                    />
                  </label>
                  
                  <label className="grid gap-1 text-xs font-semibold text-forest col-span-2 sm:col-span-1">
                    <span>Building Name</span>
                    <input
                      type="text"
                      placeholder="e.g. Shripad Smruti"
                      value={editBuilding}
                      onChange={(e) => setEditBuilding(e.target.value)}
                      className="rounded-lg border border-black/10 bg-white px-3 py-1.5 outline-none focus:ring-1 focus:ring-forest text-ink"
                    />
                  </label>

                  <label className="grid gap-1 text-xs font-semibold text-forest col-span-2">
                    <span>Society Name</span>
                    <input
                      type="text"
                      placeholder="e.g. Star Colony / Shanti Dham"
                      value={editSociety}
                      onChange={(e) => setEditSociety(e.target.value)}
                      className="rounded-lg border border-black/10 bg-white px-3 py-1.5 outline-none focus:ring-1 focus:ring-forest text-ink"
                    />
                  </label>

                  <label className="grid gap-1 text-xs font-semibold text-forest col-span-2">
                    <span>Area Name / Street</span>
                    <input
                      type="text"
                      placeholder="e.g. Manpada Road, Off Link Road"
                      value={editArea}
                      onChange={(e) => setEditArea(e.target.value)}
                      className="rounded-lg border border-black/10 bg-white px-3 py-1.5 outline-none focus:ring-1 focus:ring-forest text-ink"
                    />
                  </label>

                  <label className="grid gap-1 text-xs font-semibold text-forest col-span-2 sm:col-span-1">
                    <span>City</span>
                    <input
                      type="text"
                      placeholder="e.g. Dombivli"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="rounded-lg border border-black/10 bg-white px-3 py-1.5 outline-none focus:ring-1 focus:ring-forest text-ink"
                    />
                  </label>

                  <label className="grid gap-1 text-xs font-semibold text-forest col-span-2 sm:col-span-1">
                    <span>Pincode</span>
                    <input
                      type="text"
                      placeholder="e.g. 421201"
                      pattern="\d{6}"
                      maxLength="6"
                      value={editPincode}
                      onChange={(e) => setEditPincode(e.target.value.replace(/\D/g, ''))}
                      className="rounded-lg border border-black/10 bg-white px-3 py-1.5 outline-none focus:ring-1 focus:ring-forest text-ink"
                    />
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={saveLoading}
                  className="flex-1 py-1.5 text-xs font-bold text-forest border border-black/10 rounded-lg hover:bg-black/5 bg-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="btnPrimary flex-1 py-1.5 text-xs font-bold disabled:opacity-50"
                >
                  {saveLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : null}

          {/* Error display */}
          {error && (
            <div className="mb-4 rounded-xl border border-urgent/20 bg-urgent/10 px-4 py-3 text-xs font-semibold text-urgent shrink-0">
              {error}
            </div>
          )}

          {/* Bookings Title */}
          <h4 className="text-xs font-bold uppercase tracking-wider text-forest/70 mb-3 shrink-0">Service Bookings & Status</h4>

          {/* Bookings list wrapper */}
          <div className="flex-1 min-h-[150px] overflow-y-auto space-y-3 mb-6 pr-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <svg className="animate-spin h-6 w-6 text-eco" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="mt-2 text-xs text-ink/50 font-medium">Checking bookings database...</span>
              </div>
            ) : displayBookings.length > 0 ? (
              displayBookings.map((item) => (
                <div key={item.id} className="rounded-xl border border-black/5 bg-cream/20 p-4 transition hover:bg-cream/35">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h5 className="font-bold text-forest text-sm">{item.service}</h5>
                      <p className="text-xs text-ink/65 mt-0.5">Size: {item.bhkSize} {item.extraRooms > 0 && `(+ ${item.extraRooms} extra room${item.extraRooms > 1 ? 's' : ''})`}</p>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>
                  
                  <div className="mt-3 grid gap-1 text-[11px] text-ink/75 border-t border-black/5 pt-2">
                    <div><span className="text-ink/45">Booking ID:</span> {item.id}</div>
                    {item.paymentId && <div><span className="text-ink/45">Payment ID:</span> {item.paymentId}</div>}
                    <div><span className="text-ink/45">Location:</span> {item.location}</div>
                    <div><span className="text-ink/45">Price Paid:</span> <span className="font-semibold text-forest">₹{item.price?.toLocaleString('en-IN')}</span></div>
                    <div><span className="text-ink/45">Date Booked:</span> {new Date(item.created).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-black/10 bg-black/[0.01] py-8 text-center text-xs text-ink/50 font-medium">
                No active bookings detected for this account profile.
              </div>
            )}
          </div>

          {/* Fallback Order Lookup */}
          <form onSubmit={handlePhoneLookup} className="border-t border-black/5 pt-4 shrink-0">
            <h5 className="text-xs font-bold uppercase tracking-wider text-forest/70 mb-2">Manual Booking Search</h5>
            <p className="text-[11px] text-ink/55 leading-relaxed mb-3">
              Booked under a different phone number or can't see your order? Enter the booking phone number below to fetch it.
            </p>
            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="Enter booking phone number"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                className="flex-1 rounded-xl border border-black/10 bg-cream/10 px-3.5 py-2 text-xs font-semibold text-forest outline-none ring-offset-white transition focus:ring-2 focus:ring-forest focus:border-transparent placeholder:text-ink/30"
              />
              <button
                type="submit"
                disabled={searchLoading || !searchPhone.trim()}
                className="btnPrimary px-4 py-2 text-xs font-bold disabled:opacity-50 shrink-0"
              >
                {searchLoading ? 'Searching...' : 'Find Order'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  )
}
