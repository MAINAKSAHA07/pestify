import { useState, useEffect } from 'react'
import { pb } from '../lib/pocketbase'

export default function BackendDashboard() {
  const [currentUser, setCurrentUser] = useState(pb.authStore.model)
  const [bookings, setBookings] = useState([])
  const [usersList, setUsersList] = useState([])
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

  // Active Panel Tab: 'bookings' or 'users'
  const [activeTab, setActiveTab] = useState('bookings')

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
    const isStaff = currentUser.role === 'admin' || currentUser.role === 'employee'
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

    // Fetch Users if Admin
    const fetchUsers = currentUser.role === 'admin'
      ? pb.collection('users')
          .getFullList({ sort: '-created' })
          .then((res) => setUsersList(res))
          .catch((err) => {
            console.error('Failed to fetch users:', err)
            // Silently log or handle rule limits
          })
      : Promise.resolve()

    Promise.all([fetchBookings, fetchUsers]).finally(() => {
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
  }

  // Save edited booking details
  const saveBookingEdits = async (e) => {
    e.preventDefault()
    if (!editingBooking) return
    setError('')
    setSuccess('')

    try {
      const updated = await pb.collection('bookings').update(editingBooking.id, {
        fullName: editName,
        phone: editPhone,
        location: editLocation,
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

  // Update user role (Admin Only)
  const handleRoleChange = async (userId, newRole) => {
    if (userId === currentUser.id) {
      alert('You cannot modify your own administrative role.');
      return
    }
    setError('')
    setSuccess('')

    try {
      const updated = await pb.collection('users').update(userId, { role: newRole })
      setUsersList(prev => prev.map(u => u.id === userId ? updated : u))
      showToast(`Role updated to ${newRole}!`)
    } catch (err) {
      setError(err?.message || 'Failed to update user role.')
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

  // Render Access Denied if not admin or employee
  const isStaff = currentUser.role === 'admin' || currentUser.role === 'employee'
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
              Required Roles: Admin or Employee | Current Role: {currentUser.role || 'customer'}
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
            currentUser.role === 'admin' 
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

        {/* Admin/Employee Navigation Tabs */}
        {currentUser.role === 'admin' && (
          <div className="flex border-b border-black/5">
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
              onClick={() => setActiveTab('users')}
              className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
                activeTab === 'users' 
                  ? 'border-forest text-forest' 
                  : 'border-transparent text-ink/40 hover:text-ink/65'
              }`}
            >
              👥 User Accounts ({usersList.length})
            </button>
          </div>
        )}

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

              {/* Status pills selector */}
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
                            {currentUser.role === 'admin' && (
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
        ) : (
          /* System User Roles Manager (Admin Only) */
          <div className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-sm">
            <div className="bg-cream/45 border-b border-black/5 py-4 px-6">
              <h2 className="font-serif text-base font-bold text-forest">Staff Roles & Access Permissions</h2>
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
                  {usersList.map((user) => (
                    <tr key={user.id} className="hover:bg-cream/10 transition">
                      <td className="py-4 px-6 font-mono text-[10px] text-ink/50">{user.id}</td>
                      <td className="py-4 px-6 font-semibold text-forest">{user.name || 'Not set'}</td>
                      <td className="py-4 px-6 font-semibold">{user.email}</td>
                      <td className="py-4 px-6 text-ink/60">{user.phone || 'Not set'}</td>
                      <td className="py-4 px-6">
                        <select
                          value={user.role || 'customer'}
                          disabled={user.id === currentUser.id}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="h-8 rounded border border-black/10 bg-white px-2 py-1 text-xs font-semibold text-forest focus:outline-none focus:ring-1 focus:ring-forest cursor-pointer disabled:opacity-50"
                        >
                          <option value="customer">Customer (Public No-Access)</option>
                          <option value="employee">Employee (View Bookings, Update Status)</option>
                          <option value="admin">Administrator (Full Access & Controls)</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Edit Booking Inline/Overlay Modal Form */}
      {editingBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-forest/80 backdrop-blur-sm" onClick={() => setEditingBooking(null)} />
          
          <form onSubmit={saveBookingEdits} className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-premium ring-1 ring-black/5 flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="h-1.5 w-full bg-forest shrink-0" />
            <div className="p-6 sm:p-8 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-serif text-lg font-bold text-forest">Edit Booking #{editingBooking.id}</h3>
                <button type="button" onClick={() => setEditingBooking(null)} className="rounded-lg p-1.5 text-ink/40 hover:bg-black/5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <label className="grid gap-1 text-xs font-semibold text-forest">
                <span>Customer Name</span>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="rounded-lg border border-black/10 bg-white px-3 py-1.5 outline-none focus:ring-1 focus:ring-forest text-ink"
                />
              </label>

              <label className="grid gap-1 text-xs font-semibold text-forest">
                <span>Customer Contact Phone</span>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="rounded-lg border border-black/10 bg-white px-3 py-1.5 outline-none focus:ring-1 focus:ring-forest text-ink"
                />
              </label>

              <label className="grid gap-1 text-xs font-semibold text-forest">
                <span>Service Visit Location Address</span>
                <textarea
                  required
                  rows="3"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="rounded-lg border border-black/10 bg-white px-3 py-1.5 outline-none focus:ring-1 focus:ring-forest text-ink resize-none"
                />
              </label>

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
    </div>
  )
}
