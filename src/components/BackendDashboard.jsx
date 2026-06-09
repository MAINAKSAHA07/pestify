import { useState, useEffect } from 'react'
import { pb } from '../lib/pocketbase'

const displayAddress = (addressStr) => {
  if (!addressStr) return 'Not set'
  try {
    const trimmed = addressStr.trim()
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const parsed = JSON.parse(trimmed)
      const parts = [parsed.flat, parsed.building, parsed.society, parsed.area, parsed.city].map(s => s?.trim()).filter(Boolean)
      return parts.join(', ') + (parsed.pincode ? ` - ${parsed.pincode}` : '')
    }
  } catch (e) {}
  return addressStr
}

export default function BackendDashboard() {
  const [currentUser, setCurrentUser] = useState(pb.authStore.model)
  const [bookings, setBookings] = useState([])
  const [usersList, setUsersList] = useState([])
  const [customersList, setCustomersList] = useState([])
  const [leadsList, setLeadsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Authentication states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  // Edit Booking Modal/State
  const [editingBooking, setEditingBooking] = useState(null)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editServices, setEditServices] = useState([])
  const [editBhkSize, setEditBhkSize] = useState('1BHK')
  const [editExtraRooms, setEditExtraRooms] = useState(0)
  const [editPrice, setEditPrice] = useState(0)
  const [editPaymentMethod, setEditPaymentMethod] = useState('razorpay')
  const [editStatus, setEditStatus] = useState('pending')

  // Active Panel Tab: 'bookings' or 'users'
  const [activeTab, setActiveTab] = useState('bookings')

  // Staff creation form states
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserPhone, setNewUserPhone] = useState('')
  const [newUserRole, setNewUserRole] = useState('customer')
  const [createUserLoading, setCreateUserLoading] = useState(false)

  // Manual booking states
  const [isManualBookingOpen, setIsManualBookingOpen] = useState(false)
  const [manualBookingLoading, setManualBookingLoading] = useState(false)
  const [manualName, setManualName] = useState('')
  const [manualPhone, setManualPhone] = useState('')
  const [manualFlat, setManualFlat] = useState('')
  const [manualBuilding, setManualBuilding] = useState('')
  const [manualSociety, setManualSociety] = useState('')
  const [manualArea, setManualArea] = useState('')
  const [manualCity, setManualCity] = useState('')
  const [manualPincode, setManualPincode] = useState('')
  const [manualServices, setManualServices] = useState(['cockroach'])
  const [manualBhkSize, setManualBhkSize] = useState('1BHK')
  const [manualExtraRooms, setManualExtraRooms] = useState(0)
  const [manualPrice, setManualPrice] = useState(0)
  const [manualPaymentMethod, setManualPaymentMethod] = useState('cash')
  const [manualStatus, setManualStatus] = useState('pending')

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((token, model) => {
      setCurrentUser(model)
    })
    return () => unsubscribe()
  }, [])

  // Fetch data
  useEffect(() => {
    if (!currentUser) return
    const isStaff = currentUser.role === 'admin' || currentUser.role === 'employee' || currentUser.role === 'superadmin'
    if (!isStaff) return

    setLoading(true)
    setError('')

    // Fetch Bookings
    const fetchBookings = pb.collection('bookings')
      .getFullList({ sort: '-created' })
      .then((res) => setBookings(res))
      .catch((err) => {
        console.error('Failed to fetch bookings:', err)
        setError('Could not retrieve bookings database.')
      })

    // Fetch Users if Admin or Superadmin
    const fetchUsers = currentUser.role === 'admin' || currentUser.role === 'superadmin'
      ? pb.collection('users')
          .getFullList({ sort: '-created' })
          .then((res) => setUsersList(res))
          .catch((err) => {
            console.error('Failed to fetch users:', err)
            // Silently log or handle rule limits
          })
      : Promise.resolve()

    // Fetch Customers if Admin or Superadmin
    const fetchCustomers = currentUser.role === 'admin' || currentUser.role === 'superadmin'
      ? pb.collection('customers')
          .getFullList({ sort: '-created' })
          .then((res) => setCustomersList(res))
          .catch((err) => {
            console.error('Failed to fetch customers:', err)
          })
      : Promise.resolve()

    // Fetch Leads (All authenticated staff can view leads)
    const fetchLeads = pb.collection('leads')
      .getFullList({ sort: '-created' })
      .then((res) => setLeadsList(res))
      .catch((err) => {
        console.error('Failed to fetch leads:', err)
      })

    Promise.all([fetchBookings, fetchUsers, fetchCustomers, fetchLeads]).finally(() => {
      setLoading(false)
    })
  }, [currentUser])

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setAuthLoading(true)

    try {
      const authData = await pb.collection('users').authWithPassword(email, password)
      setCurrentUser(authData.record)
    } catch (err) {
      setError(err?.message || 'Authentication failed. Please check your credentials.')
    } finally {
      setAuthLoading(false)
    }
  }

  // Logout handler
  const handleLogout = () => {
    pb.authStore.clear()
    setCurrentUser(null)
    setBookings([])
    setUsersList([])
  }

  // Update booking status
  const handleStatusChange = async (bookingId, newStatus) => {
    setError('')
    setSuccess('')
    try {
      const updated = await pb.collection('bookings').update(bookingId, { status: newStatus })
      setBookings(prev => prev.map(b => b.id === bookingId ? updated : b))
      showToast('Status updated successfully!')
    } catch (err) {
      setError(err?.message || 'Failed to update status.')
    }
  }

  // Start editing booking
  const startEditing = (booking) => {
    setEditingBooking(booking)
    setEditName(booking.fullName || '')
    setEditPhone(booking.phone || '')
    setEditLocation(booking.location || '')
    setEditBhkSize(booking.bhkSize || '1BHK')
    setEditExtraRooms(booking.extraRooms || 0)
    setEditPrice(booking.price || 0)
    setEditPaymentMethod(booking.paymentMethod || 'razorpay')
    setEditStatus(booking.status || 'pending')
    
    // Parse selected services from booking.service
    const servicesList = booking.service ? booking.service.split(',').map(s => s.trim().toLowerCase()) : []
    const activeKeys = []
    if (servicesList.some(s => s.includes('cockroach') || s.includes('gel'))) activeKeys.push('cockroach')
    if (servicesList.some(s => s.includes('termite'))) activeKeys.push('termite')
    if (servicesList.some(s => s.includes('bedbug') || s.includes('bed bug') || s.includes('bedbug'))) activeKeys.push('bedbug')
    if (servicesList.some(s => s.includes('mosquito'))) activeKeys.push('mosquito')
    if (servicesList.some(s => s.includes('disinfection') || s.includes('general') || s.includes('crawling'))) activeKeys.push('general')
    if (servicesList.some(s => s.includes('all-in-one') || s.includes('all pests') || s.includes('all-pests') || s.includes('protection (all'))) activeKeys.push('all')
    
    setEditServices(activeKeys.length > 0 ? activeKeys : ['cockroach'])
  }

  // Save edited booking details
  const saveBookingEdits = async (e) => {
    e.preventDefault()
    if (!editingBooking) return
    setError('')
    setSuccess('')

    if (editServices.length === 0) {
      setError('Please select at least one service.')
      return
    }

    try {
      // Reconstruct the service label(s) from editServices
      const labels = editServices.map(key => {
        if (key === 'cockroach') return 'Advance Golden Gel (Cockroaches)'
        if (key === 'termite') return 'Anti Termite Treatment (Termites)'
        if (key === 'bedbug') return 'BedBug Treatment (Bedbugs)'
        if (key === 'general') return 'General Disinfection (Crawling Insects)'
        if (key === 'mosquito') return 'Mosquito Treatment (Mosquitoes)'
        if (key === 'all') return 'All-in-One Protection (All Pests)'
        return key
      }).join(', ')

      const updated = await pb.collection('bookings').update(editingBooking.id, {
        fullName: editName,
        phone: editPhone,
        location: editLocation,
        service: labels,
        bhkSize: editBhkSize,
        extraRooms: Number(editExtraRooms) || 0,
        price: Number(editPrice) || 0,
        paymentMethod: editPaymentMethod,
        status: editStatus,
      })
      setBookings(prev => prev.map(b => b.id === editingBooking.id ? updated : b))
      setEditingBooking(null)
      showToast('Booking updated successfully!')
    } catch (err) {
      setError(err?.message || 'Failed to save booking updates.')
    }
  }

  // Delete booking (Admin Only)
  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Are you absolutely sure you want to delete this booking record? This action cannot be undone.')) return
    setError('')
    setSuccess('')

    try {
      await pb.collection('bookings').delete(bookingId)
      setBookings(prev => prev.filter(b => b.id !== bookingId))
      showToast('Booking deleted successfully.')
    } catch (err) {
      setError(err?.message || 'Failed to delete booking.')
    }
  }

  // Delete lead (Admin/Superadmin Only)
  const handleDeleteLead = async (leadId) => {
    if (!window.confirm('Are you absolutely sure you want to delete this lead record? This action cannot be undone.')) return
    setError('')
    setSuccess('')

    try {
      await pb.collection('leads').delete(leadId)
      setLeadsList(prev => prev.filter(l => l.id !== leadId))
      showToast('Lead deleted successfully.')
    } catch (err) {
      setError(err?.message || 'Failed to delete lead.')
    }
  }

  // Update user role (Admin/Superadmin Only)
  const handleRoleChange = async (userId, newRole) => {
    if (userId === currentUser.id) {
      alert('You cannot modify your own administrative role.');
      return
    }

    // Find the target user in either usersList or customersList
    let targetUser = usersList.find(u => u.id === userId)
    if (!targetUser) {
      targetUser = customersList.find(c => c.id === userId)
    }

    if (!targetUser) return

    // Guard: Only superadmins can assign or modify roles involving superadmin
    const currentRole = targetUser.role || 'customer'
    if ((currentRole === 'superadmin' || newRole === 'superadmin') && currentUser.role !== 'superadmin') {
      alert('Only a Super Administrator can assign or modify the Super Administrator role.');
      return
    }

    setError('')
    setSuccess('')

    try {
      // Step 1: Update user role in 'users' collection
      const updated = await pb.collection('users').update(userId, { role: newRole })
      
      // Update local state for usersList
      setUsersList(prev => {
        const exists = prev.some(u => u.id === userId)
        if (exists) {
          return prev.map(u => u.id === userId ? updated : u)
        } else if (newRole !== 'customer') {
          return [updated, ...prev]
        }
        return prev
      })

      // Step 2: Handle synchronizing with the 'customers' collection
      if (newRole === 'customer') {
        // Demoted/changed to customer: insert/update in customers collection
        try {
          const addr = targetUser.address || ''
          const customerData = {
            id: userId,
            name: targetUser.name || '',
            email: targetUser.email || '',
            phone: targetUser.phone || '',
            address: typeof addr === 'object' ? JSON.stringify(addr) : addr
          }
          const newCustomer = await pb.collection('customers').create(customerData)
          setCustomersList(prev => [newCustomer, ...prev])
        } catch (e) {
          // If already exists, update it
          const addr = targetUser.address || ''
          await pb.collection('customers').update(userId, {
            name: targetUser.name || '',
            email: targetUser.email || '',
            phone: targetUser.phone || '',
            address: typeof addr === 'object' ? JSON.stringify(addr) : addr
          })
        }
      } else {
        // Promoted/changed to staff: delete from customers collection
        try {
          await pb.collection('customers').delete(userId)
          setCustomersList(prev => prev.filter(c => c.id !== userId))
        } catch (e) {
          // Ignore if it wasn't in customers collection
        }
      }

      showToast(`Role updated successfully to ${newRole}!`)
    } catch (err) {
      console.error('Failed to update user role:', err)
      setError(err?.message || 'Failed to update user role.')
    }
  }

  // Create new user/staff account (Super Admin Only)
  const handleCreateUser = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const phoneDigitCount = newUserPhone.replace(/\D/g, '').length
    if (phoneDigitCount < 10) {
      setError('Contact number must have at least 10 digits.')
      return
    }

    if (newUserPassword.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    setCreateUserLoading(true)

    try {
      const data = {
        email: newUserEmail.trim(),
        emailVisibility: true,
        password: newUserPassword,
        passwordConfirm: newUserPassword,
        name: newUserName.trim(),
        phone: newUserPhone.trim(),
        role: newUserRole,
      }

      const created = await pb.collection('users').create(data)
      setUsersList(prev => [created, ...prev])
      showToast(`User ${created.email} created successfully with role ${created.role}!`)
      
      // Reset form fields
      setNewUserName('')
      setNewUserEmail('')
      setNewUserPassword('')
      setNewUserPhone('')
      setNewUserRole('customer')
    } catch (err) {
      console.error('Failed to create user:', err)
      setError(err?.message || 'Failed to create user account. Check if email already exists.')
    } finally {
      setCreateUserLoading(false)
    }
  }

  // Create manual booking (Admin/Superadmin Only)
  const handleCreateManualBooking = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const phoneDigitCount = manualPhone.replace(/\D/g, '').length
    if (phoneDigitCount < 10) {
      setError('Contact phone must have at least 10 digits.')
      return
    }

    if (manualServices.length === 0) {
      setError('Please select at least one service.')
      return
    }

    setManualBookingLoading(true)

    const addressData = {
      flat: manualFlat.trim(),
      building: manualBuilding.trim(),
      society: manualSociety.trim(),
      area: manualArea.trim(),
      city: manualCity.trim(),
      pincode: manualPincode.trim()
    }
    const serializedAddress = JSON.stringify(addressData)

    try {
      // Reconstruct the service label(s) from manualServices
      const labels = manualServices.map(key => {
        if (key === 'cockroach') return 'Advance Golden Gel (Cockroaches)'
        if (key === 'termite') return 'Anti Termite Treatment (Termites)'
        if (key === 'bedbug') return 'BedBug Treatment (Bedbugs)'
        if (key === 'general') return 'General Disinfection (Crawling Insects)'
        if (key === 'mosquito') return 'Mosquito Treatment (Mosquitoes)'
        if (key === 'all') return 'All-in-One Protection (All Pests)'
        return key
      }).join(', ')

      const data = {
        fullName: manualName.trim(),
        phone: manualPhone.trim(),
        location: serializedAddress,
        service: labels,
        bhkSize: manualBhkSize,
        extraRooms: Number(manualExtraRooms) || 0,
        price: Number(manualPrice) || 0,
        paymentMethod: manualPaymentMethod,
        status: manualStatus,
        paymentId: 'OFFLINE-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      }

      const created = await pb.collection('bookings').create(data)
      setBookings(prev => [created, ...prev])
      setIsManualBookingOpen(false)
      showToast(`Offline booking created successfully for ${created.fullName}!`)

      // Reset form fields
      setManualName('')
      setManualPhone('')
      setManualFlat('')
      setManualBuilding('')
      setManualSociety('')
      setManualArea('')
      setManualCity('')
      setManualPincode('')
      setManualServices(['cockroach'])
      setManualBhkSize('1BHK')
      setManualExtraRooms(0)
      setManualPrice(0)
      setManualPaymentMethod('cash')
      setManualStatus('pending')
    } catch (err) {
      console.error('Failed to create manual booking:', err)
      setError(err?.message || 'Failed to create manual booking.')
    } finally {
      setManualBookingLoading(false)
    }
  }

  // Helper to show temporary success message
  const showToast = (msg) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(''), 4000)
  }

  // Filter & Search computation
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.fullName && b.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.phone && b.phone.includes(searchQuery)) ||
      (b.location && b.location.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = statusFilter === 'All' || String(b.status).toLowerCase() === statusFilter.toLowerCase()

    return matchesSearch && matchesStatus
  })

  // Calculate statistics
  const stats = {
    total: bookings.length,
    revenue: bookings.reduce((sum, b) => sum + (Number(b.price) || 0), 0),
    pending: bookings.filter(b => ['pending', 'unpaid', ''].includes(String(b.status).toLowerCase())).length,
    scheduled: bookings.filter(b => String(b.status).toLowerCase() === 'scheduled').length,
    completed: bookings.filter(b => String(b.status).toLowerCase() === 'completed').length,
  }

  // Render Login view if unauthenticated
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-forest flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-premium border border-black/5 flex flex-col">
          <div className="h-1.5 w-full bg-gradient-to-r from-eco via-amber to-urgent shrink-0" />
          <div className="p-8">
            <div className="flex flex-col items-center mb-6">
              <span className="text-3xl">🛡️</span>
              <h1 className="font-serif text-2xl font-bold text-forest mt-2">Pestyfi Control Center</h1>
              <p className="text-xs text-ink/50 mt-1 font-medium">Restricted Staff Access Only</p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-urgent/20 bg-urgent/10 px-4 py-3 text-xs font-semibold text-urgent">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-forest/70">
                <span>Staff Email</span>
                <input
                  type="email"
                  required
                  placeholder="name@pestyfi.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-lg border border-black/10 bg-cream/10 px-3.5 text-sm outline-none focus:ring-1 focus:ring-forest text-ink font-sans"
                />
              </label>

              <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-forest/70">
                <span>Password</span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-lg border border-black/10 bg-cream/10 px-3.5 text-sm outline-none focus:ring-1 focus:ring-forest text-ink"
                />
              </label>

              <button
                type="submit"
                disabled={authLoading}
                className="btnPrimary w-full py-3 text-sm font-bold disabled:opacity-75"
              >
                {authLoading ? 'Verifying...' : 'Authenticate'}
              </button>
            </form>

            <div className="mt-6 border-t border-black/5 pt-4 text-center">
              <a href="/" className="text-xs text-forest font-bold hover:underline">
                ← Return to Public Website
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render Access Denied if not admin, employee, or superadmin
  const isStaff = currentUser.role === 'admin' || currentUser.role === 'employee' || currentUser.role === 'superadmin'
  if (!isStaff) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-premium border border-urgent/10 flex flex-col text-center">
          <div className="h-1.5 w-full bg-urgent shrink-0" />
          <div className="p-8 space-y-4">
            <span className="text-5xl block animate-bounce">⚠️</span>
            <h1 className="font-serif text-2xl font-bold text-urgent">Access Denied</h1>
            <p className="text-sm text-ink/75 leading-relaxed">
              Your account <strong>{currentUser.email}</strong> is not registered as Pestyfi administrative staff or field employee.
            </p>
            <div className="bg-urgent/5 border border-urgent/10 p-3 rounded-lg text-xs text-urgent font-medium">
              Required Roles: Admin, Employee or Superadmin | Current Role: {currentUser.role || 'customer'}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleLogout} className="btnGhost flex-1 py-2 text-xs">
                Sign Out
              </button>
              <a href="/" className="btnPrimary flex-1 py-2 text-xs block text-center">
                Home Page
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream/30 text-ink">
      {/* Top Banner Header */}
      <header className="sticky top-0 z-50 bg-forest text-cream border-b border-white/5 py-4 px-6 shadow-md flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🛡️</span>
          <div>
            <h1 className="font-serif text-lg font-bold text-cream">Pestyfi Control Center</h1>
            <p className="text-[10px] text-cream/60">Manage client requests & bookings database</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-cream">{currentUser.name || 'Staff User'}</div>
            <div className="text-[10px] text-cream/50">{currentUser.email}</div>
          </div>
          
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase ${
            currentUser.role === 'superadmin'
              ? 'bg-purple-500/20 border-purple-500/30 text-purple-400'
              : currentUser.role === 'admin' 
                ? 'bg-eco/20 border-eco/30 text-eco' 
                : 'bg-amber/20 border-amber/30 text-amber'
          }`}>
            {currentUser.role}
          </span>

          <a href="/" className="text-xs text-cream/70 hover:text-cream border border-white/10 rounded-lg px-2.5 py-1.5 transition">
            Home Site
          </a>

          <button onClick={handleLogout} className="text-xs text-urgent border border-urgent/20 bg-urgent/5 rounded-lg px-2.5 py-1.5 hover:bg-urgent/10 transition font-bold">
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Body Grid */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        
        {/* Success/Error Toasts */}
        {error && (
          <div className="rounded-xl border border-urgent/20 bg-urgent/10 px-4 py-3 text-xs font-semibold text-urgent">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl border border-eco/20 bg-eco/10 px-4 py-3 text-xs font-semibold text-green animate-pulse">
            {success}
          </div>
        )}

        {/* Admin/Employee/Superadmin Navigation Tabs */}
        <div className="flex border-b border-black/5 flex-wrap">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
              activeTab === 'bookings' 
                ? 'border-forest text-forest' 
                : 'border-transparent text-ink/40 hover:text-ink/65'
            }`}
          >
            📋 Booking Operations ({filteredBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
              activeTab === 'leads' 
                ? 'border-forest text-forest' 
                : 'border-transparent text-ink/40 hover:text-ink/65'
            }`}
          >
            📍 Service Leads ({leadsList.length})
          </button>
          {(currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
            <>
              <button
                onClick={() => setActiveTab('staff')}
                className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
                  activeTab === 'staff' 
                    ? 'border-forest text-forest' 
                    : 'border-transparent text-ink/40 hover:text-ink/65'
                }`}
              >
                👥 Staff Accounts ({usersList.filter(u => u.role === 'admin' || u.role === 'employee' || u.role === 'superadmin').length})
              </button>
              <button
                onClick={() => setActiveTab('customers')}
                className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
                  activeTab === 'customers' 
                    ? 'border-forest text-forest' 
                    : 'border-transparent text-ink/40 hover:text-ink/65'
                }`}
              >
                👤 Customer Accounts ({customersList.length})
              </button>
            </>
          )}
        </div>

        {activeTab === 'bookings' ? (
          <>
            {/* Summary metrics row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-white rounded-xl border border-black/5 p-4 flex flex-col">
                <span className="text-[10px] uppercase font-bold text-ink/40">Total Bookings</span>
                <span className="text-2xl font-bold text-forest mt-1">{stats.total}</span>
              </div>
              <div className="bg-white rounded-xl border border-black/5 p-4 flex flex-col">
                <span className="text-[10px] uppercase font-bold text-ink/40">Est. Booking Value</span>
                <span className="text-2xl font-bold text-eco mt-1">₹{stats.revenue.toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-white rounded-xl border border-black/5 p-4 flex flex-col">
                <span className="text-[10px] uppercase font-bold text-ink/40">Pending / Unpaid</span>
                <span className="text-2xl font-bold text-urgent mt-1">{stats.pending}</span>
              </div>
              <div className="bg-white rounded-xl border border-black/5 p-4 flex flex-col">
                <span className="text-[10px] uppercase font-bold text-ink/40">Scheduled Services</span>
                <span className="text-2xl font-bold text-amber mt-1">{stats.scheduled}</span>
              </div>
              <div className="bg-white rounded-xl border border-black/5 p-4 flex flex-col col-span-2 md:col-span-1">
                <span className="text-[10px] uppercase font-bold text-ink/40">Completed Audits</span>
                <span className="text-2xl font-bold text-green mt-1">{stats.completed}</span>
              </div>
            </div>

            {/* Filter controls panel */}
            <div className="bg-white rounded-xl border border-black/5 p-4 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex-1 min-w-[260px] relative">
                <input
                  type="text"
                  placeholder="Search bookings by ID, name, phone, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 rounded-lg border border-black/10 bg-cream/10 px-4 text-xs outline-none focus:ring-1 focus:ring-forest text-ink"
                />
              </div>

              {/* Status pills selector & Manual booking creator */}
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex flex-wrap gap-1.5">
                  {['All', 'Paid', 'Scheduled', 'Completed', 'Cancelled'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        statusFilter === status 
                          ? 'bg-forest text-cream' 
                          : 'bg-cream/40 text-ink/60 border border-black/5 hover:bg-cream/60'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
                {(currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
                  <button
                    onClick={() => setIsManualBookingOpen(true)}
                    className="h-9 px-4 rounded-lg bg-eco border border-eco/30 hover:bg-eco/90 text-forest text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <span>➕</span> Create Manual Booking
                  </button>
                )}
              </div>
            </div>

            {/* Bookings operational table */}
            <div className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-sm">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <svg className="animate-spin h-8 w-8 text-eco" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="mt-3 text-xs text-ink/50 font-medium">Syncing database changes...</span>
                </div>
              ) : filteredBookings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-sans text-xs">
                    <thead>
                      <tr className="bg-cream/45 border-b border-black/5 text-[10px] font-bold text-forest uppercase tracking-wider">
                        <th className="py-3 px-4">Booking Details</th>
                        <th className="py-3 px-4">Client Contact</th>
                        <th className="py-3 px-4">Pest Service</th>
                        <th className="py-3 px-4">Price</th>
                        <th className="py-3 px-4">Address / Visit Location</th>
                        <th className="py-3 px-4">Workflow Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {filteredBookings.map((b) => (
                        <tr key={b.id} className="hover:bg-cream/10 transition">
                          {/* Booking Details */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="font-bold text-forest">{b.id}</div>
                            <div className="text-[10px] text-ink/40 mt-0.5">
                              {new Date(b.created).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                            {b.paymentId && (
                              <div className="text-[9px] font-mono text-ink/50 mt-1 bg-black/[0.03] px-1 py-0.5 rounded inline-block max-w-[130px] truncate">
                                PAY: {b.paymentId}
                              </div>
                            )}
                          </td>

                          {/* Client Contact */}
                          <td className="py-4 px-4">
                            <div className="font-semibold text-ink">{b.fullName || 'Guest Client'}</div>
                            <div className="text-ink/60 mt-0.5">{b.phone}</div>
                          </td>

                          {/* Service Details */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="font-semibold text-forest">{b.service}</div>
                            <div className="text-[10px] text-ink/50 mt-0.5">
                              Size: {b.bhkSize} {b.extraRooms > 0 && `(+${b.extraRooms} rooms)`}
                            </div>
                          </td>

                          {/* Price */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className="font-bold text-forest">₹{b.price?.toLocaleString('en-IN')}</span>
                            <span className="block text-[9px] text-ink/40">{b.paymentMethod || 'Razorpay'}</span>
                          </td>

                          {/* Location */}
                          <td className="py-4 px-4 max-w-xs truncate" title={b.location}>
                            <div className="text-ink/75 leading-relaxed line-clamp-2">{b.location}</div>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <select
                              value={String(b.status).toLowerCase()}
                              onChange={(e) => handleStatusChange(b.id, e.target.value)}
                              className="h-8 rounded border border-black/10 bg-white px-2 py-1 text-xs font-semibold text-forest focus:outline-none focus:ring-1 focus:ring-forest cursor-pointer"
                            >
                              <option value="pending">Pending</option>
                              <option value="paid">Paid (Unscheduled)</option>
                              <option value="scheduled">Scheduled</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => startEditing(b)}
                              className="inline-flex items-center justify-center h-8 px-2.5 rounded bg-forest/5 hover:bg-forest/10 text-forest font-bold transition"
                            >
                              Edit
                            </button>
                            {(currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
                              <button
                                onClick={() => handleDeleteBooking(b.id)}
                                className="inline-flex items-center justify-center h-8 px-2.5 rounded bg-urgent/5 hover:bg-urgent/10 text-urgent font-bold transition"
                              >
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-16 text-center text-ink/45 font-medium">
                  No bookings found matching filters or search queries.
                </div>
              )}
            </div>
          </>
        ) : activeTab === 'leads' ? (
          /* Out-of-Service Leads View */
          <div className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-sm">
            <div className="bg-cream/45 border-b border-black/5 py-4 px-6">
              <h2 className="font-serif text-base font-bold text-forest">Out-of-Service Leads</h2>
              <p className="text-xs text-ink/50 mt-0.5">Prospects who requested service in unserviceable PIN codes</p>
            </div>

            {leadsList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-cream/15 border-b border-black/5 text-[10px] font-bold text-forest uppercase tracking-wider">
                      <th className="py-3 px-6">Lead ID</th>
                      <th className="py-3 px-6">Full Name</th>
                      <th className="py-3 px-6">Contact Phone</th>
                      <th className="py-3 px-6">Requested Location / PIN</th>
                      <th className="py-3 px-6">Date Registered</th>
                      {(currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
                        <th className="py-3 px-6 text-right">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {leadsList.map((lead) => (
                      <tr key={lead.id} className="hover:bg-cream/10 transition">
                        <td className="py-4 px-6 font-mono text-[10px] text-ink/50">{lead.id}</td>
                        <td className="py-4 px-6 font-semibold text-forest">{lead.fullName}</td>
                        <td className="py-4 px-6 font-semibold">{lead.phone}</td>
                        <td className="py-4 px-6">{lead.location}</td>
                        <td className="py-4 px-6">
                          {new Date(lead.created).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        {(currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => handleDeleteLead(lead.id)}
                              className="inline-flex items-center justify-center h-8 px-2.5 rounded bg-urgent/5 hover:bg-urgent/10 text-urgent font-bold transition"
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-16 text-center text-ink/45 font-medium">
                No out-of-service leads registered at the moment.
              </div>
            )}
          </div>
        ) : activeTab === 'staff' && (currentUser.role === 'admin' || currentUser.role === 'superadmin') ? (
          /* System User Roles Manager (Admin/Superadmin Only) */
          <div className="space-y-8 font-sans">
            {currentUser.role === 'superadmin' && (
              <div className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm">
                <h3 className="font-serif text-base font-bold text-forest mb-4">Add Staff / User Account</h3>
                <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                  <label className="grid gap-1 text-xs font-semibold text-forest">
                    <span>Name</span>
                    <input
                      type="text"
                      required
                      placeholder="Full Name"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="rounded-lg border border-black/10 bg-white px-3 py-1.5 outline-none focus:ring-1 focus:ring-forest text-ink text-xs h-9"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-semibold text-forest">
                    <span>Email</span>
                    <input
                      type="email"
                      required
                      placeholder="staff@pestyfi.com"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="rounded-lg border border-black/10 bg-white px-3 py-1.5 outline-none focus:ring-1 focus:ring-forest text-ink text-xs h-9"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-semibold text-forest">
                    <span>Password</span>
                    <input
                      type="password"
                      required
                      placeholder="Min 8 characters"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      className="rounded-lg border border-black/10 bg-white px-3 py-1.5 outline-none focus:ring-1 focus:ring-forest text-ink text-xs h-9"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-semibold text-forest">
                    <span>Contact Phone</span>
                    <input
                      type="tel"
                      required
                      placeholder="Min 10 digits"
                      value={newUserPhone}
                      onChange={(e) => setNewUserPhone(e.target.value)}
                      className="rounded-lg border border-black/10 bg-white px-3 py-1.5 outline-none focus:ring-1 focus:ring-forest text-ink text-xs h-9"
                    />
                  </label>
                  <div className="flex gap-2 items-end md:h-9">
                    <label className="grid gap-1 text-xs font-semibold text-forest flex-1">
                      <span>Role</span>
                      <select
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value)}
                        className="rounded-lg border border-black/10 bg-white px-2 py-1 outline-none focus:ring-1 focus:ring-forest text-ink text-xs h-9 cursor-pointer"
                      >
                        <option value="customer">Customer</option>
                        <option value="employee">Employee</option>
                        <option value="admin">Admin</option>
                        <option value="superadmin">Super Admin</option>
                      </select>
                    </label>
                    <button
                      type="submit"
                      disabled={createUserLoading}
                      className="btnPrimary h-9 text-xs font-bold px-4 rounded-lg flex-shrink-0"
                    >
                      {createUserLoading ? 'Creating...' : 'Create User'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Staff & Administrative Accounts Table */}
            <div className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-sm">
              <div className="bg-cream/45 border-b border-black/5 py-4 px-6">
                <h2 className="font-serif text-base font-bold text-forest">Staff & Administrative Accounts</h2>
                <p className="text-xs text-ink/50 mt-0.5">Control employee roles, edit systems backend access profiles</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-cream/15 border-b border-black/5 text-[10px] font-bold text-forest uppercase tracking-wider">
                      <th className="py-3 px-6">User Identification</th>
                      <th className="py-3 px-6">Display Name</th>
                      <th className="py-3 px-6">Account Email</th>
                      <th className="py-3 px-6">Contact Phone</th>
                      <th className="py-3 px-6">Backend Role Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {usersList
                      .filter(user => user.role === 'admin' || user.role === 'employee' || user.role === 'superadmin')
                      .map((user) => {
                        const isOwnAccount = user.id === currentUser.id;
                        const isTargetSuperadmin = user.role === 'superadmin';
                        const isCurrentSuperadmin = currentUser.role === 'superadmin';
                        // Restrict editing role: cannot edit own, and only superadmin can edit role of another superadmin
                        const canEditRole = !isOwnAccount && (!isTargetSuperadmin || isCurrentSuperadmin);

                        return (
                          <tr key={user.id} className="hover:bg-cream/10 transition">
                            <td className="py-4 px-6 font-mono text-[10px] text-ink/50">{user.id}</td>
                            <td className="py-4 px-6 font-semibold text-forest">{user.name || 'Not set'}</td>
                            <td className="py-4 px-6 font-semibold">{user.email}</td>
                            <td className="py-4 px-6 text-ink/60">{user.phone || 'Not set'}</td>
                            <td className="py-4 px-6">
                              <select
                                value={user.role || 'customer'}
                                disabled={!canEditRole}
                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                className="h-8 rounded border border-black/10 bg-white px-2 py-1 text-xs font-semibold text-forest focus:outline-none focus:ring-1 focus:ring-forest cursor-pointer disabled:opacity-50"
                              >
                                <option value="customer">Customer (Public No-Access)</option>
                                <option value="employee">Employee (View Bookings, Update Status)</option>
                                <option value="admin">Administrator (Full Access & Controls)</option>
                                {(isCurrentSuperadmin || isTargetSuperadmin) && (
                                  <option value="superadmin">Super Administrator (All Privileges)</option>
                                )}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeTab === 'customers' && (currentUser.role === 'admin' || currentUser.role === 'superadmin') ? (
          /* Registered Customer Accounts Table (Customers Tab Only) */
          <div className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-sm">
            <div className="bg-cream/45 border-b border-black/5 py-4 px-6">
              <h2 className="font-serif text-base font-bold text-forest">Registered Customer Accounts</h2>
              <p className="text-xs text-ink/50 mt-0.5">List of registered clients and their service addresses</p>
            </div>

            {customersList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-cream/15 border-b border-black/5 text-[10px] font-bold text-forest uppercase tracking-wider">
                      <th className="py-3 px-6">Customer ID</th>
                      <th className="py-3 px-6">Full Name</th>
                      <th className="py-3 px-6">Email Address</th>
                      <th className="py-3 px-6">Contact Phone</th>
                      <th className="py-3 px-6">Home / Service Address</th>
                      <th className="py-3 px-6">Promote Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {customersList.map((user) => {
                      const isCurrentSuperadmin = currentUser.role === 'superadmin';
                      const isCurrentAdmin = currentUser.role === 'admin';
                      const canPromote = isCurrentSuperadmin || isCurrentAdmin;

                      return (
                        <tr key={user.id} className="hover:bg-cream/10 transition">
                          <td className="py-4 px-6 font-mono text-[10px] text-ink/50">{user.id}</td>
                          <td className="py-4 px-6 font-semibold text-forest">{user.name || 'Not set'}</td>
                          <td className="py-4 px-6 font-semibold">{user.email}</td>
                          <td className="py-4 px-6 text-ink/60">{user.phone || 'Not set'}</td>
                          <td className="py-4 px-6 max-w-xs truncate" title={displayAddress(user.address)}>
                            {displayAddress(user.address)}
                          </td>
                          <td className="py-4 px-6">
                            <select
                              value={user.role || 'customer'}
                              disabled={!canPromote}
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                              className="h-8 rounded border border-black/10 bg-white px-2 py-1 text-xs font-semibold text-forest focus:outline-none focus:ring-1 focus:ring-forest cursor-pointer disabled:opacity-50"
                            >
                              <option value="customer">Customer</option>
                              <option value="employee">Employee</option>
                              <option value="admin">Admin</option>
                              {isCurrentSuperadmin && (
                                <option value="superadmin">Super Admin</option>
                              )}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-16 text-center text-ink/45 font-medium">
                No registered customers found.
              </div>
            )}
          </div>
        ) : (
          <div className="py-16 text-center text-ink/45 font-medium bg-white rounded-2xl border border-black/5 p-6 shadow-sm">
            Please select a valid tab to view details.
          </div>
        )}
      </main>

      {/* Edit Booking Inline/Overlay Modal Form */}
      {editingBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-forest/80 backdrop-blur-sm" onClick={() => setEditingBooking(null)} />
          
          <form onSubmit={saveBookingEdits} className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-premium ring-1 ring-black/5 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="h-1.5 w-full bg-forest shrink-0" />
            <div className="p-6 sm:p-8 space-y-4 overflow-y-auto">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-serif text-lg font-bold text-forest">Edit Booking #{editingBooking.id}</h3>
                <button type="button" onClick={() => setEditingBooking(null)} className="rounded-lg p-1.5 text-ink/40 hover:bg-black/5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-2 gap-4">
                <label className="grid gap-1 text-xs font-semibold text-forest col-span-2 sm:col-span-1">
                  <span>Customer Name</span>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="rounded-lg border border-black/10 bg-white px-3 py-1.5 outline-none focus:ring-1 focus:ring-forest text-ink"
                  />
                </label>

                <label className="grid gap-1 text-xs font-semibold text-forest col-span-2 sm:col-span-1">
                  <span>Customer Contact Phone</span>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="rounded-lg border border-black/10 bg-white px-3 py-1.5 outline-none focus:ring-1 focus:ring-forest text-ink"
                  />
                </label>
              </div>

              <label className="grid gap-1 text-xs font-semibold text-forest">
                <span>Service Visit Location Address</span>
                <textarea
                  required
                  rows="2"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="rounded-lg border border-black/10 bg-white px-3 py-1.5 outline-none focus:ring-1 focus:ring-forest text-ink resize-none text-xs"
                />
              </label>

              {/* Services selection grid */}
              <div className="grid gap-1.5 text-xs font-semibold text-forest">
                <span>Services Included (Add / Subtract)</span>
                <div className="grid grid-cols-2 gap-2 bg-cream/25 border border-black/10 rounded-lg p-3">
                  {[
                    { key: 'cockroach', label: 'Cockroach Control' },
                    { key: 'termite', label: 'Termite Control' },
                    { key: 'bedbug', label: 'Bed Bug Control' },
                    { key: 'mosquito', label: 'Mosquito Control' },
                    { key: 'general', label: 'General Pest Control' },
                    { key: 'all', label: 'All-in-One Protection' },
                  ].map((s) => {
                    const checked = editServices.includes(s.key)
                    return (
                      <label key={s.key} className="flex items-center gap-2 font-medium cursor-pointer text-forest">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditServices([...editServices, s.key])
                            } else {
                              setEditServices(editServices.filter(k => k !== s.key))
                            }
                          }}
                          className="rounded text-forest focus:ring-forest h-4 w-4"
                        />
                        <span>{s.label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* BHK, Extra Rooms, Price, Status */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <label className="grid gap-1 text-xs font-semibold text-forest col-span-1">
                  <span>BHK Size</span>
                  <select
                    value={editBhkSize}
                    onChange={(e) => setEditBhkSize(e.target.value)}
                    className="rounded-lg border border-black/10 bg-white px-2 py-1.5 outline-none focus:ring-1 focus:ring-forest text-ink cursor-pointer"
                  >
                    <option value="1BHK">1 BHK</option>
                    <option value="2BHK">2 BHK</option>
                    <option value="3BHK">3 BHK</option>
                    <option value="4BHK+">4 BHK+</option>
                  </select>
                </label>

                <label className="grid gap-1 text-xs font-semibold text-forest col-span-1">
                  <span>Extra Rooms</span>
                  <input
                    type="number"
                    min="0"
                    value={editExtraRooms}
                    onChange={(e) => setEditExtraRooms(Math.max(0, parseInt(e.target.value) || 0))}
                    className="rounded-lg border border-black/10 bg-white px-3 py-1.5 outline-none focus:ring-1 focus:ring-forest text-ink"
                  />
                </label>

                <label className="grid gap-1 text-xs font-semibold text-forest col-span-1">
                  <span>Price (₹)</span>
                  <input
                    type="number"
                    min="0"
                    value={editPrice}
                    onChange={(e) => setEditPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="rounded-lg border border-black/10 bg-white px-3 py-1.5 outline-none focus:ring-1 focus:ring-forest text-ink"
                  />
                </label>

                <label className="grid gap-1 text-xs font-semibold text-forest col-span-1">
                  <span>Status</span>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="rounded-lg border border-black/10 bg-white px-2 py-1.5 outline-none focus:ring-1 focus:ring-forest text-ink cursor-pointer"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </label>
              </div>

              {/* Payment Method */}
              <label className="grid gap-1 text-xs font-semibold text-forest">
                <span>Payment Method</span>
                <select
                  value={editPaymentMethod}
                  onChange={(e) => setEditPaymentMethod(e.target.value)}
                  className="rounded-lg border border-black/10 bg-white px-2 py-1.5 outline-none focus:ring-1 focus:ring-forest text-ink cursor-pointer"
                >
                  <option value="razorpay">Razorpay</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="check">Cheque</option>
                  <option value="card">Card Payment</option>
                  <option value="home_inspection">Home Inspection</option>
                </select>
              </label>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="flex-1 py-2 text-xs font-bold text-forest border border-black/10 rounded-lg hover:bg-black/5 bg-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btnPrimary flex-1 py-2 text-xs font-bold"
                >
                  Save Updates
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Create Manual Booking Modal Form */}
      {isManualBookingOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-forest/80 backdrop-blur-sm" onClick={() => setIsManualBookingOpen(false)} />
          
          <form onSubmit={handleCreateManualBooking} className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-premium ring-1 ring-black/5 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="h-1.5 w-full bg-eco shrink-0" />
            <div className="p-6 sm:p-8 flex flex-col overflow-y-auto space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-serif text-lg font-bold text-forest">Create Manual Offline Booking</h3>
                <button type="button" onClick={() => setIsManualBookingOpen(false)} className="rounded-lg p-1.5 text-ink/40 hover:bg-black/5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <label className="grid gap-1 text-xs font-semibold text-forest col-span-2 sm:col-span-1">
                  <span>Customer Name</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="rounded-lg border border-black/10 bg-white px-3 py-1.5 outline-none focus:ring-1 focus:ring-forest text-ink"
                  />
                </label>

                <label className="grid gap-1 text-xs font-semibold text-forest col-span-2 sm:col-span-1">
                  <span>Contact Phone (Min 10 digits)</span>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    className="rounded-lg border border-black/10 bg-white px-3 py-1.5 outline-none focus:ring-1 focus:ring-forest text-ink"
                  />
                </label>
              </div>

              {/* Service & Pricing Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="grid gap-1.5 text-xs font-semibold text-forest col-span-2">
                  <span>Services Included (Add / Subtract)</span>
                  <div className="grid grid-cols-2 gap-2 bg-cream/10 border border-black/10 rounded-lg p-3">
                    {[
                      { key: 'cockroach', label: 'Cockroach Control' },
                      { key: 'termite', label: 'Termite Control' },
                      { key: 'bedbug', label: 'Bed Bug Control' },
                      { key: 'mosquito', label: 'Mosquito Control' },
                      { key: 'general', label: 'General Pest Control' },
                      { key: 'all', label: 'All-in-One Protection' },
                    ].map((s) => {
                      const checked = manualServices.includes(s.key)
                      return (
                        <label key={s.key} className="flex items-center gap-2 font-medium cursor-pointer text-forest">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setManualServices([...manualServices, s.key])
                              } else {
                                setManualServices(manualServices.filter(k => k !== s.key))
                              }
                            }}
                            className="rounded text-forest focus:ring-forest h-4 w-4"
                          />
                          <span>{s.label}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                <label className="grid gap-1 text-xs font-semibold text-forest col-span-1">
                  <span>BHK Size</span>
                  <select
                    value={manualBhkSize}
                    onChange={(e) => setManualBhkSize(e.target.value)}
                    className="rounded-lg border border-black/10 bg-white px-2 py-1.5 outline-none focus:ring-1 focus:ring-forest text-ink cursor-pointer"
                  >
                    <option value="1BHK">1 BHK</option>
                    <option value="2BHK">2 BHK</option>
                    <option value="3BHK">3 BHK</option>
                    <option value="4BHK+">4 BHK+</option>
                  </select>
                </label>

                <label className="grid gap-1 text-xs font-semibold text-forest col-span-1">
                  <span>Extra Rooms</span>
                  <input
                    type="number"
                    min="0"
                    value={manualExtraRooms}
                    onChange={(e) => setManualExtraRooms(Math.max(0, parseInt(e.target.value) || 0))}
                    className="rounded-lg border border-black/10 bg-white px-3 py-1.5 outline-none focus:ring-1 focus:ring-forest text-ink"
                  />
                </label>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="grid gap-1 text-xs font-semibold text-forest col-span-1">
                  <span>Price Paid (₹)</span>
                  <input
                    type="number"
                    min="0"
                    value={manualPrice}
                    onChange={(e) => setManualPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="rounded-lg border border-black/10 bg-white px-3 py-1.5 outline-none focus:ring-1 focus:ring-forest text-ink"
                  />
                </label>

                <label className="grid gap-1 text-xs font-semibold text-forest col-span-1">
                  <span>Payment Method</span>
                  <select
                    value={manualPaymentMethod}
                    onChange={(e) => setManualPaymentMethod(e.target.value)}
                    className="rounded-lg border border-black/10 bg-white px-2 py-1.5 outline-none focus:ring-1 focus:ring-forest text-ink cursor-pointer"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="check">Cheque</option>
                    <option value="card">Card Payment</option>
                    <option value="razorpay">Razorpay</option>
                  </select>
                </label>

                <label className="grid gap-1 text-xs font-semibold text-forest col-span-1">
                  <span>Workflow Status</span>
                  <select
                    value={manualStatus}
                    onChange={(e) => setManualStatus(e.target.value)}
                    className="rounded-lg border border-black/10 bg-white px-2 py-1.5 outline-none focus:ring-1 focus:ring-forest text-ink cursor-pointer"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                  </select>
                </label>
              </div>

              {/* Address Fields */}
              <div className="border-t border-black/5 pt-3 mt-2">
                <span className="text-xs font-bold text-forest block mb-2 uppercase tracking-wider">Service Address</span>
                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-1 text-xs font-semibold text-forest col-span-1">
                    <span>Flat / Room Number</span>
                    <input
                      type="text"
                      placeholder="e.g. Flat A/6"
                      required
                      value={manualFlat}
                      onChange={(e) => setManualFlat(e.target.value)}
                      className="rounded-lg border border-black/10 bg-white px-3 py-1.5 outline-none focus:ring-1 focus:ring-forest text-ink"
                    />
                  </label>
                  
                  <label className="grid gap-1 text-xs font-semibold text-forest col-span-1">
                    <span>Building Name</span>
                    <input
                      type="text"
                      placeholder="e.g. Shripad Smruti"
                      required
                      value={manualBuilding}
                      onChange={(e) => setManualBuilding(e.target.value)}
                      className="rounded-lg border border-black/10 bg-white px-3 py-1.5 outline-none focus:ring-1 focus:ring-forest text-ink"
                    />
                  </label>

                  <label className="grid gap-1 text-xs font-semibold text-forest col-span-2">
                    <span>Society Name</span>
                    <input
                      type="text"
                      placeholder="e.g. Star Colony / Shanti Dham"
                      required
                      value={manualSociety}
                      onChange={(e) => setManualSociety(e.target.value)}
                      className="rounded-lg border border-black/10 bg-white px-3 py-1.5 outline-none focus:ring-1 focus:ring-forest text-ink"
                    />
                  </label>

                  <label className="grid gap-1 text-xs font-semibold text-forest col-span-2">
                    <span>Area Name / Street</span>
                    <input
                      type="text"
                      placeholder="e.g. Manpada Road, Off Link Road"
                      required
                      value={manualArea}
                      onChange={(e) => setManualArea(e.target.value)}
                      className="rounded-lg border border-black/10 bg-white px-3 py-1.5 outline-none focus:ring-1 focus:ring-forest text-ink"
                    />
                  </label>

                  <label className="grid gap-1 text-xs font-semibold text-forest col-span-1">
                    <span>City</span>
                    <input
                      type="text"
                      placeholder="e.g. Dombivli"
                      required
                      value={manualCity}
                      onChange={(e) => setManualCity(e.target.value)}
                      className="rounded-lg border border-black/10 bg-white px-3 py-1.5 outline-none focus:ring-1 focus:ring-forest text-ink"
                    />
                  </label>

                  <label className="grid gap-1 text-xs font-semibold text-forest col-span-1">
                    <span>Pincode</span>
                    <input
                      type="text"
                      placeholder="e.g. 421201"
                      required
                      pattern="\d{6}"
                      maxLength="6"
                      value={manualPincode}
                      onChange={(e) => setManualPincode(e.target.value.replace(/\D/g, ''))}
                      className="rounded-lg border border-black/10 bg-white px-3 py-1.5 outline-none focus:ring-1 focus:ring-forest text-ink"
                    />
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsManualBookingOpen(false)}
                  disabled={manualBookingLoading}
                  className="flex-1 py-2 text-xs font-bold text-forest border border-black/10 rounded-lg hover:bg-black/5 bg-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={manualBookingLoading}
                  className="btnPrimary flex-1 py-2 text-xs font-bold disabled:opacity-50"
                >
                  {manualBookingLoading ? 'Creating...' : 'Record Booking'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
