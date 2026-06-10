import { useState, useEffect } from 'react'

const NAMES = [
  'Amit S.', 'Sneha K.', 'Rajesh M.', 'Pooja R.',
  'Vikram G.', 'Priya D.', 'Rohit P.', 'Ananya V.',
  'Sanjay T.', 'Neha S.', 'Rahul N.', 'Kiran B.',
  'Aditya P.', 'Divya G.', 'Manish R.', 'Kavita K.'
]

const LOCATIONS = [
  'Thane', 'Dombivli', 'Kalyan', 'Vashi',
  'Nerul', 'Panvel', 'Andheri', 'Borivali',
  'Dadar', 'Powai', 'Ghatkopar', 'Mulund',
  'Airoli', 'Kharghar', 'Belapur', 'Chembur'
]

const SERVICES = [
  'Advance Golden Gel (Cockroaches)',
  'Anti Termite Treatment (Termites)',
  'BedBug Treatment (Bedbugs)',
  'General Disinfection (General Pests)',
  'Mosquito Treatment (Mosquitoes)',
  'All-in-One Protection (All Pests)'
]

const TIMES = ['3 hrs ago', '6 mins ago', '9 hrs ago', '12 mins ago', 'just now']

export default function SalesNotifier() {
  const [notification, setNotification] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Helper to generate a random notification
    const generateNotification = () => {
      const name = NAMES[Math.floor(Math.random() * NAMES.length)]
      const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)]
      const service = SERVICES[Math.floor(Math.random() * SERVICES.length)]
      const time = TIMES[Math.floor(Math.random() * TIMES.length)]
      return { name, location, service, time }
    }

    let showTimeout
    let hideTimeout
    let cycleInterval

    const triggerCycle = () => {
      const nextNotif = generateNotification()
      setNotification(nextNotif)
      setVisible(true)

      // Hide after 8 seconds
      hideTimeout = setTimeout(() => {
        setVisible(false)
      }, 8000)
    }

    // First popup appears 15 seconds after page loads
    showTimeout = setTimeout(() => {
      triggerCycle()

      // Subsequently, show one notification every 2 to 3 minutes (120,000ms to 180,000ms)
      const setupNextCycle = () => {
        const randomDelay = Math.floor(Math.random() * (180000 - 120000 + 1)) + 120000
        cycleInterval = setTimeout(() => {
          triggerCycle()
          setupNextCycle()
        }, randomDelay)
      }
      setupNextCycle()

    }, 15000)

    return () => {
      clearTimeout(showTimeout)
      clearTimeout(hideTimeout)
      clearTimeout(cycleInterval)
    }
  }, [])

  if (!notification) return null

  return (
    <div
      className={`fixed z-50 transition-all duration-500 ease-out transform
        bottom-28 left-4 right-4 sm:left-6 sm:bottom-6 sm:right-auto sm:max-w-sm w-auto
        ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'}
      `}
    >
      <div className="bg-white/95 backdrop-blur-md border border-black/5 rounded-2xl p-4 shadow-premium flex items-center gap-3.5 relative ring-1 ring-black/5">
        {/* Close Button */}
        <button
          onClick={() => setVisible(false)}
          className="absolute top-2.5 right-2.5 text-ink/35 hover:text-ink/60 p-0.5 rounded-lg hover:bg-black/5 transition"
          aria-label="Close notification"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-forest/5 flex items-center justify-center text-xl shrink-0">
          🏡
        </div>

        {/* Text Details */}
        <div className="pr-4 flex-1">
          <div className="text-xs font-semibold text-ink/50 leading-none">
            Recent Activity
          </div>
          <div className="text-xs text-ink mt-1.5 font-medium leading-relaxed">
            <span className="font-bold text-forest">{notification.name}</span> from{' '}
            <span className="font-semibold text-ink">{notification.location}</span> booked{' '}
            <span className="font-bold text-forest">{notification.service}</span>
          </div>
          <div className="text-[10px] text-ink/40 font-semibold mt-1 flex items-center gap-1">
            <span>⏱️</span> {notification.time}
          </div>
        </div>
      </div>
    </div>
  )
}
