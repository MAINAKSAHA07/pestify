import { useEffect, useState, useRef, useCallback } from 'react'
import { setupLeadForm, setupMobileNavToggle, setupRevealAnimations } from './hooks'
import { CONTACT } from './site'
import Logo from './components/Logo'
import Loader from './components/Loader'
import { pb } from './lib/pocketbase'
import AuthModal from './components/AuthModal'
import BookingWizard from './components/BookingWizard'
import LocationModal from './components/LocationModal'
import ScrollRevealText from './components/ScrollRevealText'
import ProfileModal, { normalizePhone } from './components/ProfileModal'
import BackendDashboard from './components/BackendDashboard'
import SalesNotifier from './components/SalesNotifier'
import IosInstallPrompt from './components/IosInstallPrompt'
import { triggerNativeNotification } from './lib/notifications'
import { syncPushSubscriptionIfGranted } from './lib/pushNotifications'
import {
  parseLocation,
  navigateTo,
  buildBookUrl,
  isBookPath,
  getBookSlug,
  getServiceSeoMeta,
  getSectionIdFromPath,
  isHomeSectionPath,
  migrateHashToPath,
  lockSectionTracking,
  trackRouteView,
} from './lib/routing'
import { useSectionTracking, handleSiteLinkClick } from './hooks/useSectionTracking'
import {
  ANNOUNCEMENT,
  NAV_LINKS,
  HERO,
  TRUSTED_LOGOS,
  WHY_CARDS,
  SERVICES,
  SPACES,
  REVIEWS,
  FAQS,
} from './data/content'

function SectionHead({ title, subtitle, light }) {
  return (
    <header className="reveal max-w-2xl">
      <h2 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">
        <ScrollRevealText text={title} activeClass={light ? 'text-cream' : 'text-forest'} />
      </h2>
      {subtitle && (
        <p className="mt-3 text-base leading-relaxed">
          <ScrollRevealText text={subtitle} activeClass={light ? 'text-cream/80' : 'text-ink/70'} />
        </p>
      )}
    </header>
  )
}

function Cta({ children, href = '/book/service', variant = 'primary', className = '' }) {
  const cls = variant === 'ghost' ? 'btnGhost' : variant === 'light' ? 'btnLight' : 'btnPrimary'
  return (
    <a href={href} className={`${cls} ${className}`}>
      {children}
    </a>
  )
}

const CREDENTIAL_LOGOS = [
  { src: '/trusted-logo-webp/indian-army-logo-two-swords-and-anchor-y8zzqnzoat79fdj7.webp', alt: 'Indian Army' },
  { src: '/trusted-logo-webp/70-708897_india-post-logo.webp', alt: 'India Post' },
  { src: '/trusted-logo-webp/peso-approval.webp', alt: 'PESO Approved' },
  { src: '/trusted-logo-webp/logos for pestyfi.webp', alt: 'Pestyfi Logos' },
  { src: '/trusted-logo-webp/IMG_7008.webp', alt: 'ISO Certified' },
  { src: '/trusted-logo-webp/IMG_7009.webp', alt: 'Government Certified' },
  { src: '/trusted-logo-webp/IMG_7010.webp', alt: 'Safety Approved' },
  { src: '/trusted-logo-webp/IMG_7015.webp', alt: 'HACCP Certified' },
  { src: '/trusted-logo-webp/IMG_7016.webp', alt: 'WHO Compliant' },
  { src: '/trusted-logo-webp/IMG_7017.webp', alt: 'Make In India' },
  { src: '/trusted-logo-webp/IMG_7018.webp', alt: 'Startup India' },
  { src: '/trusted-logo-webp/IMG_7019.webp', alt: 'MSME Registered' },
  { src: '/trusted-logo-webp/IMG_7020.webp', alt: 'Eco Friendly Certificate' },
  { src: '/trusted-logo-webp/IMG_7021.webp', alt: 'Organic Pest Association' },
  { src: '/trusted-logo-webp/IMG_7022.webp', alt: 'Chemical Safety Association' },
  { src: '/trusted-logo-webp/IMG_7023.webp', alt: 'NPOP Organic India' },
  { src: '/trusted-logo-webp/IMG_7024.webp', alt: 'Swachh Bharat partner' }
]

function PrivacyPolicy() {
  return (
    <article className="containerX max-w-4xl py-12 md:py-16 text-ink">
      <header className="mb-10 text-center">
        <span className="pillX bg-forest/10 text-forest border-forest/20 uppercase tracking-wider text-[11px] font-bold">
          Legal Policy
        </span>
        <h1 className="font-serif text-3xl font-bold text-forest mt-3 md:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-ink/60">
          Last Updated: June 14, 2026
        </p>
      </header>

      <div className="space-y-8 bg-white/60 p-6 md:p-10 rounded-2xl border border-black/5 backdrop-blur-sm shadow-premium">
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-forest">1. Introduction</h2>
          <p className="text-sm leading-relaxed text-ink/85">
            Welcome to Pestyfi Eco Solutions (<strong>"Pestyfi"</strong>, <strong>"we"</strong>, <strong>"us"</strong>, or <strong>"our"</strong>), launched by Hindustan Pest Control (with over 30 years of industry excellence). We respect your privacy and are committed to protecting the personal data you share with us.
          </p>
          <p className="text-sm leading-relaxed text-ink/85">
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website <a href="https://pestyfi.com" className="text-eco hover:underline font-semibold">https://pestyfi.com</a> (including associated domains like pestyfi.in) and use our pest control booking services. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-forest">2. Information We Collect</h2>
          <p className="text-sm leading-relaxed text-ink/85">
            We may collect information about you in a variety of ways. The information we may collect on the Site includes:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-ink/85">
            <li>
              <strong>Personal Data:</strong> Personally identifiable information, such as your name, shipping/service address, email address, and telephone number, that you voluntarily give to us when you register on our site or book a service.
            </li>
            <li>
              <strong>Booking and Location Data:</strong> Information regarding the location of the service, preferred service date, service rates, payment choices, and pin codes to determine serviceability.
            </li>
            <li>
              <strong>Usage Data:</strong> Information our servers automatically collect when you access the Site, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Site.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-forest">3. How We Use Your Information</h2>
          <p className="text-sm leading-relaxed text-ink/85">
            Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-ink/85">
            <li>Create and manage your user account and schedule pest control bookings.</li>
            <li>Assign certified hygiene experts or employees to your booking.</li>
            <li>Send you SMS, WhatsApp messages, or emails regarding your booking status, updates, and confirmations.</li>
            <li>Process payments and transactions securely (all payment info is handled by third-party processors).</li>
            <li>Provide customer support and resolve any service issues or inquiries.</li>
            <li>Monitor and analyze usage and trends to improve your experience with the Site.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-forest">4. Disclosure of Your Information</h2>
          <p className="text-sm leading-relaxed text-ink/85">
            We do not sell, trade, or rent your personal information to others. We may share information we have collected about you in certain situations:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-ink/85">
            <li>
              <strong>With Hindustan Pest Control (Parent/Affiliated Company):</strong> To assist in operations, service delivery, or corporate administration.
            </li>
            <li>
              <strong>With Assigned Staff/Technicians:</strong> To coordinate service visits, contact you on-site, and perform the pest control treatments.
            </li>
            <li>
              <strong>Third-Party Service Providers:</strong> We may share your information with third parties that perform services for us or on our behalf, including database hosting (PocketBase), SMS/WhatsApp notification systems, payment processing, email delivery, and analytics tools (like Google Analytics and Meta Pixel).
            </li>
            <li>
              <strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-forest">5. Security and Retention of Your Information</h2>
          <p className="text-sm leading-relaxed text-ink/85">
            We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
          </p>
          <p className="text-sm leading-relaxed text-ink/85">
            We retain your personal information only for as long as necessary to provide services to you, maintain account records, and comply with our legal and regulatory obligations.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-forest">6. Your Privacy Rights and Choices</h2>
          <p className="text-sm leading-relaxed text-ink/85">
            You may review, change, or terminate your account at any time. If you have an active account, you can access your profile directly on our website to see updates and past bookings. If you wish to delete your account or delete the personal data associated with your profile, you can contact our support team.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-forest">7. Contact Us</h2>
          <p className="text-sm leading-relaxed text-ink/85">
            If you have questions or comments about this Privacy Policy, please contact us at:
          </p>
          <div className="bg-cream/50 p-4 rounded-xl text-xs space-y-1.5 text-forest font-semibold">
            <div>Pestyfi Eco Solutions (Hindustan Pest Control)</div>
            <div>Address: Room No. A/6, Shripad Smruti, Manpada Road, Dombivali, Star Colony, Dombivli, Thane-421201, Maharashtra, India</div>
            <div>Phone: +91 88799 94442</div>
            <div>Email: privacy@pestyfi.com</div>
          </div>
        </section>
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={() => {
            window.history.pushState({}, '', '/')
            window.dispatchEvent(new PopStateEvent('popstate'))
            window.scrollTo(0, 0)
          }}
          className="btnPrimary inline-flex items-center gap-2"
        >
          ← Back to Homepage
        </button>
      </div>
    </article>
  )
}

function DeletionInstructions() {
  return (
    <article className="containerX max-w-4xl py-12 md:py-16 text-ink">
      <header className="mb-10 text-center">
        <span className="pillX bg-forest/10 text-forest border-forest/20 uppercase tracking-wider text-[11px] font-bold">
          Account Compliance
        </span>
        <h1 className="font-serif text-3xl font-bold text-forest mt-3 md:text-5xl">
          Data Deletion Instructions
        </h1>
        <p className="mt-2 text-sm text-ink/60">
          How to request the removal of your account data
        </p>
      </header>

      <div className="space-y-8 bg-white/60 p-6 md:p-10 rounded-2xl border border-black/5 backdrop-blur-sm shadow-premium">
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-forest">Overview</h2>
          <p className="text-sm leading-relaxed text-ink/85">
            At Pestyfi Eco Solutions, we value your privacy and security. In compliance with Meta Platforms' Developer Policies and global data privacy standards, we provide all registered users with complete control over their personal data. You have the right to request the deletion of your account and all associated personal information at any time.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-forest">What Data Will Be Deleted?</h2>
          <p className="text-sm leading-relaxed text-ink/85">
            When you request data deletion, the following information is permanently and irreversibly removed from our active systems:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-ink/85">
            <li>Your user profile information (Name, Email address, Phone number).</li>
            <li>Your saved service and billing addresses.</li>
            <li>Your account search settings, preferences, and location pincode cache.</li>
            <li>Any third-party logins linked to your profile (such as Facebook or Google auth associations).</li>
          </ul>
          <p className="text-xs text-ink/60 mt-2 italic">
            Note: Standard financial transaction records and booking invoices may be retained separately for statutory accounting, tax, and legal compliance purposes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-forest">How to Submit a Deletion Request</h2>
          <p className="text-sm leading-relaxed text-ink/85">
            You can request deletion using one of the following simple methods:
          </p>
          <ol className="list-decimal pl-5 space-y-4 text-sm text-ink/85">
            <li>
              <strong>Direct In-App Deletion:</strong>
              <p className="mt-1">
                Log into your Pestyfi account using your registered phone/email. Open the <strong>My Profile & Bookings</strong> page from the top-right header menu, scroll to the bottom of the profile card, and click the red <strong>Request Data Deletion</strong> button.
              </p>
            </li>
            <li>
              <strong>Email Support Request:</strong>
              <p className="mt-1">
                Send an email to our data privacy officer at <a href="mailto:privacy@pestyfi.com" className="text-eco font-bold hover:underline">privacy@pestyfi.com</a>. Please write <strong>"Request for Data Deletion"</strong> in the subject line, and include the registered phone number or email address associated with your account.
              </p>
            </li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-forest">Processing Time</h2>
          <p className="text-sm leading-relaxed text-ink/85">
            Once a request is submitted via the profile dashboard or email, our team will verify ownership and process the deletion within <strong>48 hours</strong>. You will receive a confirmation message once the deletion is complete.
          </p>
        </section>
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={() => {
            window.history.pushState({}, '', '/')
            window.dispatchEvent(new PopStateEvent('popstate'))
            window.scrollTo(0, 0)
          }}
          className="btnPrimary inline-flex items-center gap-2"
        >
          ← Back to Homepage
        </button>
      </div>
    </article>
  )
}

function DeletionStatus() {
  const params = new URLSearchParams(window.location.search)
  const trackingId = params.get('id') || 'N/A'

  return (
    <article className="containerX max-w-2xl py-12 md:py-16 text-ink">
      <div className="text-center bg-white/60 p-8 md:p-12 rounded-2xl border border-black/5 backdrop-blur-sm shadow-premium space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-eco/10 text-eco text-3xl">
          ✓
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-2xl font-bold text-forest md:text-3xl">
            Deletion Request Received
          </h1>
          <p className="text-sm text-ink/70">
            Your request to delete personal account data has been successfully registered.
          </p>
        </div>

        <div className="bg-cream/50 p-4 rounded-xl text-left border border-black/5 space-y-2">
          <div className="text-xs font-semibold text-forest uppercase tracking-wider">
            Request Details
          </div>
          <div className="text-sm text-ink/85">
            <span className="font-semibold">Status:</span> In Progress (Pending Verification)
          </div>
          <div className="text-sm text-ink/85 truncate">
            <span className="font-semibold">Tracking ID:</span> <code className="bg-white px-1.5 py-0.5 rounded border text-eco font-mono">{trackingId}</code>
          </div>
          <div className="text-sm text-ink/85">
            <span className="font-semibold">Estimated Completion:</span> Within 48 hours
          </div>
        </div>

        <p className="text-xs text-ink/50 leading-relaxed">
          You can keep this tracking ID for reference. All associated user profiles, location settings, and third-party login linkings will be permanently removed from our databases.
        </p>

        <div className="pt-4">
          <button
            onClick={() => {
              window.history.pushState({}, '', '/')
              window.dispatchEvent(new PopStateEvent('popstate'))
              window.scrollTo(0, 0)
            }}
            className="btnPrimary w-full md:w-auto"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    </article>
  )
}

function App() {
  const [currentUser, setCurrentUser] = useState(pb.authStore.model)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [currentPath, setCurrentPath] = useState(() => {
    migrateHashToPath()
    return window.location.pathname
  })
  const [bookSlug, setBookSlug] = useState(() => getBookSlug())
  const [preferredServiceId, setPreferredServiceId] = useState(() => parseLocation().serviceId)
  const [appNotification, setAppNotification] = useState(null)
  const audioCtxRef = useRef(null)

  useEffect(() => {
    if (!appNotification) return
    const timer = setTimeout(() => {
      setAppNotification(null)
    }, 5000)
    return () => clearTimeout(timer)
  }, [appNotification])

  // Re-register push subscription when user logs in (links device to account)
  useEffect(() => {
    if (!currentUser) return
    syncPushSubscriptionIfGranted().catch(() => {})
  }, [currentUser?.id])

  const playChime = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') {
        ctx.resume()
      }
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      osc.type = 'sine'
      const now = ctx.currentTime
      osc.frequency.setValueAtTime(587.33, now) // D5
      gain.gain.setValueAtTime(0.15, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)
      
      osc.frequency.setValueAtTime(880, now + 0.1) // A5
      gain.gain.setValueAtTime(0.15, now + 0.1)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)
      
      osc.start(now)
      osc.stop(now + 0.4)
    } catch (err) {
      console.error('Audio chime failed:', err)
    }
  }

  const triggerGlobalNotification = (title, message) => {
    playChime()
    setAppNotification({ title, message, id: String(Date.now()) })
    triggerNativeNotification(title, message)
  }

  const checkBookingStatusChanges = async () => {
    if (!currentUser) return
    const phoneClean = normalizePhone(currentUser.phone)
    if (!phoneClean) return

    try {
      const filter = `phone = "${phoneClean}"`
      
      const res = await pb.collection('bookings').getList(1, 100, {
        filter: filter,
        sort: '-created'
      })

      const storedStatuses = localStorage.getItem('pestyfi_booking_statuses')
      const statuses = storedStatuses ? JSON.parse(storedStatuses) : {}
      const hasPriorCache = Object.keys(statuses).length > 0

      res.items.forEach((b) => {
        const prevStatus = statuses[b.id]
        if (hasPriorCache && prevStatus && prevStatus !== b.status) {
          triggerGlobalNotification(
            '🔔 Booking Update',
            `Your booking for ${b.service} is now "${b.status}".`
          )
        }
        statuses[b.id] = b.status
      })

      localStorage.setItem('pestyfi_booking_statuses', JSON.stringify(statuses))
    } catch (err) {
      console.warn('[checkBookingStatusChanges failed]', err.message)
    }
  }

  const checkAdminNewItems = async () => {
    if (!currentUser) return
    const isStaff = currentUser.role === 'admin' || currentUser.role === 'employee' || currentUser.role === 'superadmin'
    if (!isStaff) return

    try {
      const storedTimestamps = localStorage.getItem('pestyfi_admin_timestamps')
      const cached = storedTimestamps ? JSON.parse(storedTimestamps) : null

      const [latestBkRes, latestLdRes, latestMsgRes] = await Promise.all([
        pb.collection('bookings').getList(1, 1, { sort: '-created' }),
        pb.collection('leads').getList(1, 1, { sort: '-created' }),
        pb.collection('whatsapp_messages').getList(1, 1, { filter: 'direction = "incoming"', sort: '-created' })
      ])

      const latestBk = latestBkRes.items?.[0]
      const latestLd = latestLdRes.items?.[0]
      const latestMsg = latestMsgRes.items?.[0]

      const nextCache = {
        bookingId: latestBk?.id || '',
        bookingCreated: latestBk?.created || '',
        leadId: latestLd?.id || '',
        leadCreated: latestLd?.created || '',
        messageId: latestMsg?.id || '',
        messageCreated: latestMsg?.created || ''
      }

      if (cached && window.location.pathname !== '/backend') {
        let alerts = []
        if (latestBk && latestBk.id !== cached.bookingId && new Date(latestBk.created) > new Date(cached.bookingCreated)) {
          const client = latestBk.fullName || 'Anonymous'
          alerts.push(`Booking from ${client}`)
        }
        if (latestLd && latestLd.id !== cached.leadId && new Date(latestLd.created) > new Date(cached.leadCreated)) {
          const client = latestLd.fullName || 'New Lead'
          alerts.push(`Lead from ${client}`)
        }
        if (latestMsg && latestMsg.id !== cached.messageId && new Date(latestMsg.created) > new Date(cached.messageCreated)) {
          const sender = latestMsg.senderName || 'WhatsApp User'
          alerts.push(`Message from ${sender}`)
        }

        if (alerts.length > 0) {
          triggerGlobalNotification(
            '🔔 Pestyfi Dashboard Alerts',
            `New activity: ${alerts.join(', ')}`
          )
        }
      }

      localStorage.setItem('pestyfi_admin_timestamps', JSON.stringify(nextCache))
    } catch (err) {
      console.warn('[checkAdminNewItems failed]', err.message)
    }
  }

  const updateAdminCache = (type, record) => {
    try {
      const stored = localStorage.getItem('pestyfi_admin_timestamps')
      const cache = stored ? JSON.parse(stored) : {
        bookingId: '', bookingCreated: '',
        leadId: '', leadCreated: '',
        messageId: '', messageCreated: ''
      }
      if (type === 'booking') {
        cache.bookingId = record.id
        cache.bookingCreated = record.created
      } else if (type === 'lead') {
        cache.leadId = record.id
        cache.leadCreated = record.created
      } else if (type === 'message') {
        cache.messageId = record.id
        cache.messageCreated = record.created
      }
      localStorage.setItem('pestyfi_admin_timestamps', JSON.stringify(cache))
    } catch (e) {}
  }

  // Focus and Active Window Resume Sync Effect
  useEffect(() => {
    if (!currentUser) return

    const isStaff = currentUser.role === 'admin' || currentUser.role === 'employee' || currentUser.role === 'superadmin'
    if (isStaff) {
      checkAdminNewItems()
    } else {
      checkBookingStatusChanges()
    }

    const handleFocus = () => {
      if (isStaff) {
        checkAdminNewItems()
      } else {
        checkBookingStatusChanges()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [currentUser?.id, currentUser?.role])

  // Stable Live Notifications Listener (subscribes/unsubscribes only on login session state change)
  useEffect(() => {
    if (!currentUser) return

    const isStaff = currentUser.role === 'admin' || currentUser.role === 'employee' || currentUser.role === 'superadmin'

    let pbUnsubscribe = () => {}

    if (isStaff) {
      // Admin/Employee subscriptions on the main site (only triggers if we are not on the /backend route)
      pb.collection('bookings').subscribe('*', (e) => {
        if (window.location.pathname === '/backend') return
        if (e.action === 'create') {
          const client = e.record.fullName || 'Anonymous Client'
          const srv = e.record.service || 'Pest Treatment'
          const dt = e.record.preferredDate ? new Date(e.record.preferredDate).toLocaleDateString() : 'unscheduled'
          triggerGlobalNotification(
            '🔔 New Booking',
            `${client} booked ${srv} for ${dt}`
          )
          updateAdminCache('booking', e.record)
        }
      }).catch(err => console.error('[Global realtime bookings error]', err.message))

      pb.collection('leads').subscribe('*', (e) => {
        if (window.location.pathname === '/backend') return
        if (e.action === 'create') {
          const leadName = e.record.fullName || 'New Lead'
          const topic = e.record.subject || 'Inquiry'
          triggerGlobalNotification(
            '✉️ New Lead Received',
            `${leadName} - "${topic}"`
          )
          updateAdminCache('lead', e.record)
        }
      }).catch(err => console.error('[Global realtime leads error]', err.message))

      pb.collection('whatsapp_messages').subscribe('*', (e) => {
        if (window.location.pathname === '/backend') return
        if (e.action === 'create' && e.record.direction === 'incoming') {
          const sender = e.record.senderName || 'WhatsApp User'
          const text = e.record.body ? e.record.body.replace(/<[^>]*>/g, '') : '[Attachment/Media]'
          triggerGlobalNotification(
            '💬 WhatsApp Message',
            `${sender}: "${text.slice(0, 45)}${text.length > 45 ? '...' : ''}"`
          )
          updateAdminCache('message', e.record)
        }
      }).catch(err => console.error('[Global realtime whatsapp error]', err.message))

      pbUnsubscribe = () => {
        pb.collection('bookings').unsubscribe('*').catch(() => {})
        pb.collection('leads').unsubscribe('*').catch(() => {})
        pb.collection('whatsapp_messages').unsubscribe('*').catch(() => {})
      }
    } else {
      // Customer subscription (anywhere they are logged in on the app)
      const phoneClean = normalizePhone(currentUser.phone)
      
      pb.collection('bookings').subscribe('*', (e) => {
        const isOwnBooking = e.record.phone === phoneClean
        if (!isOwnBooking) return

        if (e.action === 'create') {
          triggerGlobalNotification(
            '📅 Booking Confirmed',
            `Your booking for ${e.record.service} has been successfully placed.`
          )
        } else if (e.action === 'update') {
          triggerGlobalNotification(
            '🔔 Booking Update',
            `Your booking for ${e.record.service} is now "${e.record.status}".`
          )
        }

        // Keep local cache in sync
        try {
          const stored = localStorage.getItem('pestyfi_booking_statuses')
          const cache = stored ? JSON.parse(stored) : {}
          cache[e.record.id] = e.record.status
          localStorage.setItem('pestyfi_booking_statuses', JSON.stringify(cache))
        } catch (err) {}
      }).catch(err => console.error('[Customer booking realtime error]', err.message))

      pb.collection('whatsapp_messages').subscribe('*', (e) => {
        const isOwnMessage = e.record.phone === phoneClean
        if (!isOwnMessage) return

        if (e.action === 'create' && e.record.direction === 'outgoing') {
          const text = e.record.body ? e.record.body.replace(/<[^>]*>/g, '') : '[Attachment/Media]'
          triggerGlobalNotification(
            '💬 Message from Pestyfi Support',
            text
          )
        }
      }).catch(err => console.error('[Customer whatsapp realtime error]', err.message))

      pbUnsubscribe = () => {
        pb.collection('bookings').unsubscribe('*').catch(() => {})
        pb.collection('whatsapp_messages').unsubscribe('*').catch(() => {})
      }
    }

    return () => {
      pbUnsubscribe()
    }
  }, [currentUser?.id, currentUser?.role])

  const syncLocationState = useCallback(() => {
    migrateHashToPath()
    const route = parseLocation()
    const isPublicShell =
      isBookPath(route.pathname) || Boolean(route.serviceId)
    setCurrentPath(isPublicShell ? (route.serviceId ? route.pathname : '/') : route.pathname)
    setPreferredServiceId(route.serviceId || null)

    if (route.bookSlug) {
      setBookSlug(route.bookSlug)
      if (window.innerWidth < 1024) {
        setIsBookingOpen(true)
      }
      requestAnimationFrame(() => {
        document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    } else if (route.serviceId) {
      setBookSlug('service')
      // Mobile: open book sheet. Desktop: scroll to inline wizard only (no double jump).
      if (window.innerWidth < 1024) {
        setIsBookingOpen(true)
      }
      requestAnimationFrame(() => {
        document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    } else if (route.section && route.section !== 'top') {
      lockSectionTracking()
      requestAnimationFrame(() => {
        document.getElementById(route.section)?.scrollIntoView({ behavior: 'auto', block: 'start' })
      })
    }
  }, [])

  const handleBookRouteChange = useCallback((slug) => {
    setBookSlug(slug)
    navigateTo(buildBookUrl(slug), {
      replace: slug === 'payment-processing',
      scroll: false,
    })
  }, [])

  const closeBookingModal = useCallback(() => {
    setIsBookingOpen(false)
    navigateTo('/', { replace: true, scroll: false })
    lockSectionTracking()
    requestAnimationFrame(() => {
      document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

  const openBookingFlow = useCallback((slug = 'service') => {
    setBookSlug(slug)
    if (window.innerWidth < 1024) {
      setIsBookingOpen(true)
    }
    navigateTo(buildBookUrl(slug))
  }, [])

  useEffect(() => {
    syncLocationState()
    trackRouteView(parseLocation().trackingPath)
  }, [syncLocationState])

  useSectionTracking(isHomeSectionPath() && !isBookPath())
  const [locationInfo, setLocationInfo] = useState(() => {
    const saved = localStorage.getItem('pestyfi_location')
    return saved ? JSON.parse(saved) : null
  })
  const [isLocationOpen, setIsLocationOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isBookingOpen, setIsBookingOpen] = useState(() => isBookPath() && window.innerWidth < 1024)

  const handleNavigate = (path) => {
    navigateTo(path)
    setCurrentPath(path)
  }

  useEffect(() => {
    const onPopState = () => syncLocationState()
    const onHashChange = () => syncLocationState()
    window.addEventListener('popstate', onPopState)
    window.addEventListener('hashchange', onHashChange)
    return () => {
      window.removeEventListener('popstate', onPopState)
      window.removeEventListener('hashchange', onHashChange)
    }
  }, [syncLocationState])

  // Global link handler for section + booking URLs
  useEffect(() => {
    const handleGlobalClick = (e) => {
      const anchor = e.target.closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href) return

      if (href === '/privacy' || href === '/deletion' || href.startsWith('/deletion-status')) {
        e.preventDefault()
        handleNavigate(href)
        return
      }

      if (href === '#book' || href === '/book' || href.startsWith('/book/')) {
        e.preventDefault()
        const slug = href.replace(/^#book\/?/, '').replace(/^\/book\/?/, '') || 'service'
        openBookingFlow(slug === 'book' ? 'service' : slug)
        if (window.innerWidth < 1024) {
          document.querySelector('.navClose')?.click()
        }
        return
      }

      // Skip-to-content remains a true in-page fragment (not indexed)
      if (href === '#main') return

      if (href.startsWith('#') || (href.startsWith('/') && isHomeSectionPath(href))) {
        handleSiteLinkClick(e, href)
        document.querySelector('.navClose')?.click()
        return
      }

      if (handleSiteLinkClick(e, href) && href.startsWith('/book') && window.innerWidth < 1024) {
        setIsBookingOpen(true)
        document.querySelector('.navClose')?.click()
      }
    }

    document.addEventListener('click', handleGlobalClick)
    return () => document.removeEventListener('click', handleGlobalClick)
  }, [openBookingFlow])

  useEffect(() => {
    if (!locationInfo) {
      const timer = setTimeout(() => {
        setIsLocationOpen(true)
      }, 2100)
      return () => clearTimeout(timer)
    }
  }, [locationInfo])

  useEffect(() => {
    setupRevealAnimations()
    setupMobileNavToggle()
    setupLeadForm()

    const unsubscribe = pb.authStore.onChange((token, model) => {
      setCurrentUser(model)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  // Handle dynamic titles, canonical tags, and Open Graph tags for SEO
  useEffect(() => {
    let title = "Pest Control Services in Mumbai with Odourless Treatments & 365 Day Support"
    let description = "Professional pest control services in Mumbai at 20% off. Book online in minutes. Cockroaches, bedbugs, termite, rodents, mosquito odourless, child and pet safe treatments"
    let canonical = "https://pestyfi.com"
    let robotsContent = 'index, follow'

    const serviceMeta = getServiceSeoMeta(currentPath)

    if (currentPath === '/privacy') {
      title = "Privacy Policy - Pestyfi Eco Solutions"
      description = "Read Pestyfi's privacy policy to understand how we collect, use, and protect your personal information."
      canonical = "https://pestyfi.com/privacy"
    } else if (currentPath === '/deletion') {
      title = "Data Deletion Policy - Pestyfi Eco Solutions"
      description = "Request data deletion. Learn how to remove your profile, addresses, and third-party links from Pestyfi."
      canonical = "https://pestyfi.com/deletion"
    } else if (currentPath === '/deletion-status' || currentPath.startsWith('/deletion-status')) {
      title = "Data Deletion Status - Pestyfi Eco Solutions"
      description = "Check the status of your data deletion request."
      canonical = "https://pestyfi.com/deletion-status"
      robotsContent = 'noindex, nofollow'
    } else if (currentPath === '/backend') {
      title = "Admin Dashboard - Pestyfi"
      description = "Internal administrator panel for managing bookings and communications."
      canonical = "https://pestyfi.com/backend"
      robotsContent = 'noindex, nofollow'
    } else if (serviceMeta) {
      title = `${serviceMeta.title} | Pestyfi`
      description = serviceMeta.description
      canonical = `https://pestyfi.com${currentPath}`
    } else if (isBookPath()) {
      const slug = getBookSlug()
      const bookTitles = {
        service: 'Book Pest Control — Select Service',
        contact: 'Book Pest Control — Contact Details',
        checkout: 'Book Pest Control — Checkout',
        payment: 'Book Pest Control — Payment',
        'payment-processing': 'Book Pest Control — Processing Payment',
        success: 'Booking Confirmed — Pestyfi',
        'inspection-requested': 'Inspection Requested — Pestyfi',
      }
      title = `${bookTitles[slug] || 'Book Pest Control'} | Pestyfi`
      description = 'Complete your Pestyfi pest control booking online with secure checkout.'
      canonical = `https://pestyfi.com/book/${slug}`
      if (slug === 'payment' || slug === 'payment-processing' || slug === 'success' || slug === 'inspection-requested') {
        robotsContent = 'noindex, follow'
      }
    } else if (getSectionIdFromPath(currentPath) && currentPath !== '/') {
      // Homepage section deep-links share one canonical homepage URL (no hash, no thin duplicates)
      canonical = 'https://pestyfi.com'
    }

    document.title = title

    // Update Meta Description
    let descMeta = document.querySelector('meta[name="description"]')
    if (descMeta) {
      descMeta.setAttribute('content', description)
    } else {
      descMeta = document.createElement('meta')
      descMeta.name = "description"
      descMeta.content = description
      document.head.appendChild(descMeta)
    }

    // Robots directive (private routes stay out of search / AI indexes)
    let robotsMeta = document.querySelector('meta[name="robots"]')
    if (robotsMeta) {
      robotsMeta.setAttribute('content', robotsContent)
    } else {
      robotsMeta = document.createElement('meta')
      robotsMeta.name = 'robots'
      robotsMeta.content = robotsContent
      document.head.appendChild(robotsMeta)
    }

    // Update Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]')
    if (canonicalLink) {
      canonicalLink.setAttribute('href', canonical)
    } else {
      canonicalLink = document.createElement('link')
      canonicalLink.rel = "canonical"
      canonicalLink.href = canonical
      document.head.appendChild(canonicalLink)
    }

    // Update Open Graph URL
    let ogUrl = document.querySelector('meta[property="og:url"]')
    if (ogUrl) {
      ogUrl.setAttribute('content', canonical)
    } else {
      ogUrl = document.createElement('meta')
      ogUrl.setAttribute('property', 'og:url')
      ogUrl.content = canonical
      document.head.appendChild(ogUrl)
    }

    // Update Open Graph Title
    let ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle) {
      ogTitle.setAttribute('content', title)
    } else {
      ogTitle = document.createElement('meta')
      ogTitle.setAttribute('property', 'og:title')
      ogTitle.content = title
      document.head.appendChild(ogTitle)
    }

    // Update Open Graph Description
    let ogDesc = document.querySelector('meta[property="og:description"]')
    if (ogDesc) {
      ogDesc.setAttribute('content', description)
    } else {
      ogDesc = document.createElement('meta')
      ogDesc.setAttribute('property', 'og:description')
      ogDesc.content = description
      document.head.appendChild(ogDesc)
    }

    // Update Twitter Title
    let twitterTitle = document.querySelector('meta[name="twitter:title"]')
    if (twitterTitle) {
      twitterTitle.setAttribute('content', title)
    }

    // Update Twitter Description
    let twitterDesc = document.querySelector('meta[name="twitter:description"]')
    if (twitterDesc) {
      twitterDesc.setAttribute('content', description)
    }
  }, [currentPath, bookSlug])

  const handleSignOut = () => {
    pb.authStore.clear()
    localStorage.removeItem('pestyfi_profile_phone')
    localStorage.removeItem('pestyfi_profile_address')
    localStorage.removeItem('pestyfi_booking_statuses')
    setIsDropdownOpen(false)
  }

  const [dynamicServices, setDynamicServices] = useState(SERVICES)
  const [dynamicRates, setDynamicRates] = useState(null)

  useEffect(() => {
    async function loadDbServices() {
      try {
        const records = await pb.collection('services').getFullList({ sort: 'created' })
        if (records.length > 0) {
          const loadedServices = records.map(r => ({
            id: r.key,
            title: r.title,
            text: r.text,
            image: r.image,
            bestFor: r.bestFor || undefined,
            includes: r.includes || undefined,
            plans: r.plans || undefined,
            amc: r.amc || undefined,
            steps: r.steps || undefined,
            benefits: r.benefits || undefined,
            featured: r.featured || false
          }))
          const loadedRates = {}
          records.forEach(r => {
            if (r.rates) {
              loadedRates[r.key] = r.rates
            }
          })
          setDynamicServices(loadedServices)
          setDynamicRates(loadedRates)
        }
      } catch (err) {
        console.warn('Failed to load services from PocketBase, using static rates:', err.message)
      }
    }
    loadDbServices()
  }, [])

  const cockroach = dynamicServices.find((s) => s.id === 'cockroach')
  const otherServices = dynamicServices.filter((s) => s.id !== 'cockroach')

  if (currentPath === '/backend') {
    return <BackendDashboard />
  }

  return (
    <div className="min-h-dvh bg-cream text-ink pb-20 md:pb-0 overflow-x-hidden">
      <Loader />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>

      {/* 1. Announcement Bar */}
      <div className="bg-amber px-4 py-2 flex flex-col sm:flex-row items-center justify-center gap-2 text-center text-xs font-semibold text-forest sm:text-sm">
        <span className="shrink-0 rounded-md bg-urgent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cream shadow-sm">
          Limited Time Offer
        </span>
        <span>{ANNOUNCEMENT}</span>
      </div>

      {/* 2. Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-forest text-cream">
        <div className="containerX relative flex items-center justify-between gap-2 py-3">
          {/* Left: Hamburger Menu & Mobile Logo */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="navToggle rounded-lg p-2 hover:bg-white/10"
              aria-expanded="false"
              aria-controls="navDrawer"
              aria-label="Open menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <div className="flex items-center md:hidden ml-1">
              <Logo onDark size="md" />
            </div>
          </div>

          {/* Center: Pestyfi Logo (Tablet/Desktop Only) */}
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center">
            <Logo onDark size="md" />
          </div>

          {/* Right: Location & Profile */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Location Selector */}
            <button
              onClick={() => setIsLocationOpen(true)}
              className="flex items-center gap-1 rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-[11px] sm:px-2.5 sm:py-1.5 sm:text-xs font-semibold hover:bg-white/10 transition-all text-cream focus:outline-none ring-1 ring-white/5"
            >
              <span>📍</span>
              <span className="max-w-[70px] sm:max-w-none truncate">
                {locationInfo ? (
                  locationInfo.serviceable ? (
                    <>
                      <span className="hidden sm:inline">{locationInfo.area} </span>
                      <span>({locationInfo.pincode})</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">No Service </span>
                      <span>({locationInfo.pincode})</span>
                    </>
                  )
                ) : (
                  'Location'
                )}
              </span>
              <svg className="h-3.5 w-3.5 text-cream/70 hidden sm:inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-[11px] sm:px-3 sm:py-1.5 sm:text-xs font-semibold ring-1 ring-white/25 hover:bg-white/15 transition-all focus:outline-none"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-eco animate-pulse" />
                  <span className="max-w-[50px] sm:max-w-[150px] truncate">
                    {currentUser.name || currentUser.email}
                  </span>
                  <svg className={`h-3.5 w-3.5 text-cream/70 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 z-20 w-48 origin-top-right rounded-xl border border-white/10 bg-forest p-1 shadow-premium ring-1 ring-black/5">
                      <div className="px-3 py-2 text-xs text-cream/50 border-b border-white/10 select-none">
                        Logged in as:
                        <div className="font-semibold text-cream truncate mt-0.5">{currentUser.email}</div>
                      </div>
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false)
                          setIsProfileOpen(true)
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-white/90 hover:bg-white/10 transition-colors"
                      >
                        <svg className="h-4 w-4 text-eco" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        My Profile & Bookings
                      </button>
                      {currentUser && (currentUser.role === 'admin' || currentUser.role === 'employee' || currentUser.role === 'superadmin') && (
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false)
                            window.history.pushState({}, '', '/backend')
                            window.dispatchEvent(new PopStateEvent('popstate'))
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-white/90 hover:bg-white/10 transition-colors"
                        >
                          <svg className="h-4 w-4 text-eco" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Administrative Panel
                        </button>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-white/90 hover:bg-white/10 transition-colors border-t border-white/5"
                      >
                        <svg className="h-4 w-4 text-urgent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="rounded-lg px-2 py-1 text-[11px] font-semibold ring-1 ring-white/20 hover:bg-white/10 sm:px-3 sm:py-1.5 sm:text-sm transition-all focus:outline-none"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Drawer */}
      <div id="navOverlay" className="navOverlay fixed inset-0 z-[60] hidden bg-black/50" aria-hidden="true" />
      <nav
        id="navDrawer"
        className="navDrawer fixed left-0 top-0 z-[70] flex h-full w-72 -translate-x-full flex-col bg-forest text-cream shadow-lift transition-transform duration-300"
        aria-label="Mobile menu"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <Logo onDark size="md" />
          <button type="button" className="navClose rounded-lg p-2 hover:bg-white/10" aria-label="Close menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <ul className="flex flex-1 flex-col gap-1 px-3 py-4">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className={`block rounded-xl px-4 py-3 text-sm font-semibold hover:bg-white/10 ${
                  link.cta ? 'bg-urgent text-white hover:bg-urgent/90' : link.expert ? 'text-eco' : ''
                }`}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <main id="main">
        {currentPath === '/privacy' ? (
          <PrivacyPolicy />
        ) : currentPath === '/deletion' ? (
          <DeletionInstructions />
        ) : currentPath.startsWith('/deletion-status') ? (
          <DeletionStatus />
        ) : (
          <>
            {/* 3. Hero */}
            <section id="top" className="relative overflow-hidden bg-forest text-cream">
          <div className="pointer-events-none absolute inset-0 bg-grain opacity-90" aria-hidden="true" />
          <div
            className="pointer-events-none absolute inset-0 opacity-15"
            aria-hidden="true"
            style={{
              backgroundImage: "url('/hero/hero_image/final/1.webp')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="containerX relative py-16 md:py-24">
            <div className="grid md:grid-cols-12 gap-10 items-center">
              <div className="reveal md:col-span-7 max-w-xl">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-amber ring-1 ring-white/15 mb-4">
                  🛡️ Govt. Lic No: LAIDO2070267
                </div>
                <h1 className="font-serif text-4xl font-semibold leading-[1.08] tracking-tight md:text-5xl lg:text-6xl">
                  {HERO.headline}
                </h1>
                <p className="mt-5 text-base leading-relaxed md:text-lg">
                  <ScrollRevealText text={HERO.subheadline} activeClass="text-cream" />
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Cta href="/book/service" className="px-6 py-3 text-base">{HERO.cta1}</Cta>
                  {/* <Cta href={CONTACT.waHref} variant="ghost" className="px-6 py-3 text-base">{HERO.cta2}</Cta> */}
                </div>
              </div>
              <div className="reveal hidden md:block md:col-span-5">
                <div className="relative p-2 rounded-2xl bg-white/5 ring-1 ring-white/10 shadow-premium overflow-hidden">
                  <img
                    src="/hero/hero_image/final/1.webp"
                    alt="Pestyfi Eco-friendly Protective Shield"
                    className="w-full rounded-xl shadow-lift border border-white/5 object-cover aspect-[4/3] transition-transform duration-500 hover:scale-[1.02]"
                  />
                </div>
              </div>
            </div>

            <div className="reveal mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {HERO.trust.map((t) => (
                <div key={t.title} className="rounded-xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-sm transition-all duration-300 hover:bg-white/15">
                  <div className="flex items-center gap-3">
                    {t.icon ? (
                      <img src={t.icon} alt="" className="h-10 w-10 shrink-0 object-contain" />
                    ) : (
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-eco/10 text-eco text-lg" aria-hidden="true">✓</span>
                    )}
                    <div>
                      <div className="text-sm font-semibold">{t.title}</div>
                      {t.text && <div className="mt-0.5 text-xs text-cream/70">{t.text}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 15b. Free Home Protection Kit Section */}
        <section id="protection-kit" className="py-16 md:py-24 bg-cream overflow-hidden border-b border-black/5">
          <div className="containerX">
            <div className="grid md:grid-cols-12 gap-10 items-center">
              {/* Left Column: Image */}
              <div className="reveal md:col-span-6 order-2 md:order-1">
                <div className="relative p-2 rounded-2xl bg-forest/5 ring-1 ring-forest/10 shadow-premium overflow-hidden">
                  <img
                    src="/products.webp"
                    alt="FREE Pestyfi Home Protection Kit"
                    className="w-full rounded-xl border border-black/5 object-cover aspect-square transition-transform duration-500 hover:scale-[1.02]"
                  />
                  <div className="absolute top-4 left-4 bg-urgent text-white font-bold text-xs px-3 py-1.5 rounded-full shadow-md uppercase tracking-wider">
                    Worth ₹1,499 Free
                  </div>
                </div>
              </div>

              {/* Right Column: Text & Benefits */}
              <div className="reveal md:col-span-6 space-y-6 order-1 md:order-2">
                <div>
                  <span className="pillX bg-amber/25 text-urgent border-amber/30 uppercase tracking-wider text-[11px] font-bold">
                    Exclusive Bonus Offer
                  </span>
                  <h2 className="mt-4 font-serif text-3xl font-semibold leading-tight text-forest md:text-4xl">
                    FREE Pestyfi Home Protection Kit With Your First Service
                  </h2>
                  <p className="mt-4 text-base leading-relaxed text-ink/75">
                    We don't just protect your home during our visits. Every first-time prepaid booking includes our professional DIY Protection Kit absolutely free, helping you maintain complete hygiene between services.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-3.5">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-eco/25 text-eco text-sm font-semibold">✓</span>
                    <div>
                      <h4 className="text-sm font-bold text-forest">Professional-Grade Formulations</h4>
                      <p className="text-xs text-ink/70 mt-1">Custom-designed sprays for bedbugs, mosquitoes, crawling insects, termites, and cockroach gel baiting.</p>
                    </div>
                  </div>

                  <div className="flex gap-3.5">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-eco/25 text-eco text-sm font-semibold">✓</span>
                    <div>
                      <h4 className="text-sm font-bold text-forest">Safe for Kids & Pets</h4>
                      <p className="text-xs text-ink/70 mt-1">100% herbal & eco-friendly ingredients that provide absolute safety for your family.</p>
                    </div>
                  </div>

                  <div className="flex gap-3.5">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-eco/25 text-eco text-sm font-semibold">✓</span>
                    <div>
                      <h4 className="text-sm font-bold text-forest">365-Day Home Defense</h4>
                      <p className="text-xs text-ink/70 mt-1">Extend the life of your professional pest control service with quick-action touch-up applications.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Cta href="/book/service" className="px-6 py-3 text-sm font-bold shadow-premium">
                    Claim Your Free Kit Now
                  </Cta>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Trusted By */}
        <section className="border-y border-black/5 bg-white py-12" id="trusted">
          <div className="containerX mb-8 text-center">
            <h2 className="font-serif text-2xl font-semibold text-forest md:text-3xl">
              Trusted By Families, Businesses And Institutions Across Mumbai
            </h2>
          </div>
          <div className="logoMarquee overflow-hidden">
            <div className="logoTrack flex items-center gap-12">
              {[...CREDENTIAL_LOGOS, ...CREDENTIAL_LOGOS].map((badge, idx) => (
                <div key={idx} className="h-10 md:h-12 flex items-center justify-center shrink-0">
                  <img
                    src={badge.src}
                    alt={badge.alt}
                    className="h-full w-auto object-contain max-w-[120px]"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Home Maintenance */}
        <section id="maintenance" className="py-16 md:py-20">
          <div className="containerX grid gap-10 md:grid-cols-2 md:items-center">
            <div className="reveal">
              <SectionHead
                title="In Mumbai, Pest Control Is Not a Reaction. It Is Home Maintenance."
                subtitle="You do not wait for your AC to stop working before servicing it. You do not wait for your water purifier to fail before changing the filter. So why wait for cockroaches, termites, ants, mosquitoes, or rodents to show up before protecting your home?"
              />
              <p className="mt-5 text-sm leading-relaxed">
                <ScrollRevealText
                  text="Mumbai’s humidity, coastal weather, drainage systems, high-rise apartments, food waste, and monsoon moisture make homes naturally attractive to pests. The problem is simple. By the time you see pests, they may already be hiding, breeding, or spreading inside your home."
                  activeClass="text-ink"
                />
              </p>
              <p className="mt-4 text-sm font-medium">
                <ScrollRevealText
                  text="Pestyfi helps you prevent the problem before it becomes visible."
                  activeClass="text-forest"
                />
              </p>
              <Cta href="/book/service" className="mt-6">Book Preventive Pest Protection</Cta>
            </div>
            <div className="reveal flex flex-col gap-6">
              <img
                src="/hero/sec 5/final/2.webp"
                alt="House cross-section showing typical pest infestations"
                className="w-full rounded-2xl shadow-premium border border-black/5 object-cover"
              />
            </div>
          </div>
        </section>

        {/* 6. Why Pestyfi */}
        <section id="why-us" className="bg-white/60 py-16 md:py-20">
          <div className="containerX">
            <div className="reveal">
              <SectionHead title="Protection you can trust, results you can see" subtitle="We don't just remove pests. We remove the stress that comes with them." />
              <p className="mt-4 max-w-3xl text-sm leading-relaxed">
                <ScrollRevealText
                  text="Most pest control services make the process feel complicated — move furniture, empty the kitchen, leave the house, deal with chemical smell. Pestyfi is built for homes that want protection without disruption."
                  activeClass="text-ink"
                />
              </p>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {WHY_CARDS.map((c) => (
                <article key={c.title} className="reveal cardX overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lift flex flex-col bg-white">
                  {c.image && (
                    <div className="h-44 w-full overflow-hidden border-b border-black/5 relative bg-forest/5">
                      <img src={c.image} alt={c.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                      {c.icon && (
                        <img src={c.icon} alt="" className="absolute top-3 right-3 w-10 h-10 rounded-lg bg-forest/80 p-1.5 ring-1 ring-white/10 object-contain" />
                      )}
                    </div>
                  )}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-forest">{c.title}</h3>
                      <p className="mt-2 text-xs leading-relaxed text-ink/70">{c.text}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="reveal mt-10 text-center">
              <Cta href="/book/service">Protect My Home Today</Cta>
            </div>
          </div>
        </section>

        {/* 7. Services */}
        <section id="services" className="py-16 md:py-20">
          <div className="containerX">
            <SectionHead title="Complete Pest Control Solutions" subtitle="Professional treatments for every pest — safe, odourless, and designed for modern homes." />

            {/* Featured Cockroach */}
            {cockroach && (
              <article className="reveal mt-10 cardX overflow-hidden grid md:grid-cols-2 bg-white">
                <div className="bg-forest p-6 text-cream md:p-8 flex flex-col justify-between">
                  <div>
                    <span className="pillX bg-eco/20 text-eco ring-white/10">Featured Service</span>
                    <h3 className="mt-3 font-serif text-2xl font-semibold">{cockroach.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed">
                      <ScrollRevealText text={cockroach.text} activeClass="text-cream" />
                    </p>
                  </div>
                  <Cta href="/book/service" className="mt-6 w-fit">Book Cockroach Control</Cta>
                </div>
                <div className="relative h-64 md:h-auto min-h-[250px]">
                  <img
                    src={cockroach.image || "/hero/services sec 7/9.webp"}
                    alt="Cockroach gel baiting treatment"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <div className="grid gap-6 p-6 md:grid-cols-2 md:p-8 md:col-span-2 border-t border-black/5 bg-white">
                  <div>
                    <h4 className="text-sm font-semibold text-forest">Service Plans</h4>
                    <ul className="mt-3 space-y-2">
                      {cockroach.amc.map((p) => (
                        <li key={p.name} className="rounded-lg bg-cream px-3 py-2 text-sm">
                          <span className="font-semibold text-forest">{p.name}</span>
                          <span className="text-ink/70"> — {p.detail}</span>
                        </li>
                      ))}
                    </ul>
                    <h4 className="mt-6 text-sm font-semibold text-forest">What's Included</h4>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {cockroach.plans.map((p) => (
                        <span key={p} className="pillX bg-lime/50 text-forest">{p}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-forest">4-Step Method</h4>
                    <ol className="mt-3 space-y-3">
                      {cockroach.steps.map((s) => (
                        <li key={s.n} className="flex gap-3 text-sm">
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-eco/15 font-display text-forest">{s.n}</span>
                          <div>
                            <div className="font-semibold text-forest">{s.title}</div>
                            <div className="text-ink/70">{s.text}</div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
                <div className="border-t border-black/5 px-6 py-4 md:px-8 md:col-span-2 bg-cream/40">
                  <div className="flex flex-wrap gap-2">
                    {cockroach.benefits.map((b) => (
                      <span key={b} className="text-xs font-medium text-ink/70">✓ {b}</span>
                    ))}
                  </div>
                </div>
              </article>
            )}

            {/* Other services */}
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {otherServices.map((s) => (
                <article key={s.id} className="reveal cardX overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lift flex flex-col bg-white">
                  {s.image && (
                    <div className="h-40 w-full overflow-hidden bg-forest/5 relative">
                      <img src={s.image} alt={s.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                    </div>
                  )}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-forest">{s.title}</h3>
                      <p className="mt-2 text-xs leading-relaxed text-ink/70">{s.text}</p>
                      {s.bestFor && (
                        <p className="mt-2.5 text-[11px] font-semibold text-forest/90">
                          Best for: <span className="font-normal text-ink/70">{s.bestFor}</span>
                        </p>
                      )}
                      {s.includes && s.includes.length > 0 && (
                        <div className="mt-3">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-forest/50">Includes</div>
                          <ul className="mt-1 space-y-0.5">
                            {s.includes.map((inc) => (
                              <li key={inc} className="text-[11px] text-ink/70 flex items-center gap-1.5">
                                <span className="text-eco font-bold" aria-hidden="true">✓</span> {inc}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <a href="/book/service" className="mt-4 inline-block text-xs font-semibold text-green hover:text-forest">Book Now →</a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 8. Notice Pests Early */}
        <section id="early-signs" className="bg-forest py-16 text-cream md:py-20">
          <div className="containerX grid gap-10 md:grid-cols-2 md:items-center">
            <div className="reveal space-y-4">
              <h2 className="font-serif text-3xl font-semibold md:text-4xl">You Don't Notice Pests Until They've Already Made Themselves Comfortable</h2>
              <div className="space-y-3 text-sm">
                <p>
                  <ScrollRevealText
                    text="One cockroach in the kitchen. One termite mark on the furniture. One bed bug bite at night. One rat sound behind the cabinet."
                    activeClass="text-cream"
                  />
                </p>
                <p className="font-medium">
                  <ScrollRevealText
                    text="Most pest problems start quietly. By the time they become visible, they may already be spreading, breeding, or damaging your home."
                    activeClass="text-white"
                  />
                </p>
              </div>
              <Cta href="/book/service" className="mt-8 inline-block">Stop the Infestation Early</Cta>
            </div>
            <div className="reveal">
              <img
                src="/hero/sec 8-11/sec8.webp"
                alt="Early pest infestation signs"
                className="w-full rounded-2xl shadow-premium border border-white/10 object-cover"
              />
            </div>
          </div>
        </section>

        <section id="convenience" className="py-16 md:py-20">
          <div className="containerX grid gap-10 md:grid-cols-2 md:items-center">
            <div className="reveal">
              <SectionHead title="Pest Control That Fits Into Your Life, Not the Other Way Around" subtitle="You should not have to rearrange your entire home for pest control." />
              <div className="reveal grid gap-3 sm:grid-cols-2 mt-6">
                {['No need to vacate', 'No need to remove utensils', 'No harsh odour', 'No complicated preparation', 'No endless follow-ups', 'No confusion'].map((item) => (
                  <div key={item} className="cardX flex items-center gap-2 p-3 text-xs font-semibold text-forest">
                    <span className="text-eco font-bold" aria-hidden="true">✓</span> {item}
                  </div>
                ))}
              </div>
              <p className="reveal text-sm mt-6">
                <ScrollRevealText
                  text="Just book, relax, and let certified hygiene experts handle the problem."
                  activeClass="text-ink"
                />
              </p>
              <Cta href="/book/service" className="reveal mt-4">Book a Hassle-Free Service</Cta>
            </div>
            <div className="reveal">
              <img
                src="/hero/sec 8-11/sec9.webp"
                alt="Pest control that doesn't disrupt family life"
                className="w-full rounded-2xl shadow-premium border border-black/5 object-cover"
              />
            </div>
          </div>
        </section>

        <section id="health-risks" className="bg-white/60 py-16 md:py-20">
          <div className="containerX grid gap-10 md:grid-cols-2 md:items-center">
            <div className="reveal">
              <img
                src="/hero/sec 8-11/sec10.webp"
                alt="Family protected from health risks and pest hazards"
                className="w-full rounded-2xl shadow-premium border border-black/5 object-cover"
              />
            </div>
            <div className="reveal">
              <SectionHead title="The Real Problem Isn't Just Pests. It's What They Bring Into Your Home." />
              <ul className="mt-6 space-y-3 text-sm text-ink/75">
                {[
                  'Cockroaches crawl across drains and food surfaces.',
                  'Rodents contaminate storage areas.',
                  'Mosquitoes affect sleep and health.',
                  'Bed bugs disturb your peace.',
                  'Termites silently damage your furniture.',
                ].map((item) => (
                  <li key={item} className="flex gap-2"><span className="text-urgent" aria-hidden="true">•</span>{item}</li>
                ))}
              </ul>
              <p className="mt-6 text-sm font-medium">
                <ScrollRevealText
                  text="Pestyfi gives your family a cleaner, safer, more comfortable home. Because hygiene is not a luxury — it is basic home care."
                  activeClass="text-forest"
                />
              </p>
              <Cta href="/book/service" className="mt-6">Protect My Family Today</Cta>
            </div>
          </div>
        </section>

        {/* 11. About + Every Space */}
        <section id="about" className="py-16 md:py-20">
          <div className="containerX">
            <div className="grid gap-10 md:grid-cols-2 md:items-center">
              <div className="reveal">
                <SectionHead title="Built for People Who Want Pest Control Without Panic" />
                <p className="mt-5 text-sm leading-relaxed">
                  <ScrollRevealText
                    text="Pestyfi is a new-age pest control brand launched by Hindustan Pest Control, a pioneer with over 30 years of experience. Pest control should not feel scary, toxic, confusing, or inconvenient."
                    activeClass="text-ink"
                  />
                </p>
                <p className="mt-4 text-sm leading-relaxed">
                  <ScrollRevealText
                    text="We bring together the trust of Hindustan Pest Control with the speed, safety, and convenience today's homes expect. We do not just treat pests — we protect the feeling of comfort inside your home."
                    activeClass="text-ink"
                  />
                </p>
                <p className="mt-4 text-sm leading-relaxed">
                  <ScrollRevealText
                    text="Most families delay pest control because they think it will disturb their home. They worry about chemical smells, children, pets, utensils, furniture, and whether the pests will actually stay away. So we built Pestyfi differently."
                    activeClass="text-ink"
                  />
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {[
                    'Safe for kids and pets',
                    'Odourless and eco-friendly',
                    'Handled by certified hygiene experts',
                    'Backed by 365-day support',
                    'Convenient enough for busy homes',
                    'Strong enough to actually work',
                  ].map((feat) => (
                    <div key={feat} className="flex items-center gap-2 text-xs font-semibold text-forest">
                      <span className="text-eco font-bold" aria-hidden="true">✓</span> {feat}
                    </div>
                  ))}
                </div>
              </div>
              <div className="reveal">
                <img
                  src="/hero/sec 8-11/sec 11.webp"
                  alt="Certified Pestyfi technician and happy family on home lawn"
                  className="w-full rounded-2xl shadow-premium border border-black/5 object-cover"
                />
              </div>
            </div>

            <div className="reveal mt-10">
              <h3 className="font-serif text-xl font-semibold text-forest">Pest Control for Every Space</h3>
              <div className="mt-6 grid gap-5 md:grid-cols-3">
                {SPACES.map((space) => (
                  <article key={space.title} className="cardX p-5">
                    <h4 className="font-semibold text-forest">{space.title}</h4>
                    <ul className="mt-3 space-y-1.5 text-sm text-ink/70">
                      {space.items.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="text-eco" aria-hidden="true">•</span>{item}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 12. Reviews & Trust Credentials */}
        <section id="reviews" className="bg-white/60 py-16 md:py-20">
          <div className="containerX">
            <SectionHead
              title="When people trust you with their home, pest control cannot be careless."
              subtitle="That is why Pestyfi focuses on safety, hygiene, convenience, and long-term protection."
            />

            {/* Trusted Credentials & Approvals (Restored) */}
            <div className="reveal mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-4 px-4 py-6 border-b border-black/5">
              {[
                { src: '/trusted-logo-webp/indian-army-logo-two-swords-and-anchor-y8zzqnzoat79fdj7.webp', alt: 'Indian Army' },
                { src: '/trusted-logo-webp/70-708897_india-post-logo.webp', alt: 'India Post' },
                { src: '/trusted-logo-webp/peso-approval.webp', alt: 'PESO Approved' },
                { src: '/trusted-logo-webp/logos for pestyfi.webp', alt: 'Pestyfi Logos' },
                { src: '/trusted-logo-webp/IMG_7008.webp', alt: 'ISO Certified' },
                { src: '/trusted-logo-webp/IMG_7009.webp', alt: 'Government Certified' },
                { src: '/trusted-logo-webp/IMG_7010.webp', alt: 'Safety Approved' },
                { src: '/trusted-logo-webp/IMG_7015.webp', alt: 'HACCP Certified' },
                { src: '/trusted-logo-webp/IMG_7016.webp', alt: 'WHO Compliant' },
                { src: '/trusted-logo-webp/IMG_7017.webp', alt: 'Make In India' },
                { src: '/trusted-logo-webp/IMG_7018.webp', alt: 'Startup India' },
                { src: '/trusted-logo-webp/IMG_7019.webp', alt: 'MSME Registered' },
                { src: '/trusted-logo-webp/IMG_7020.webp', alt: 'Eco Friendly Certificate' },
                { src: '/trusted-logo-webp/IMG_7021.webp', alt: 'Organic Pest Association' },
                { src: '/trusted-logo-webp/IMG_7022.webp', alt: 'Chemical Safety Association' },
                { src: '/trusted-logo-webp/IMG_7023.webp', alt: 'NPOP Organic India' },
                { src: '/trusted-logo-webp/IMG_7024.webp', alt: 'Swachh Bharat partner' }
              ].map((badge, idx) => (
                <div key={idx} className="h-8 md:h-10 flex items-center justify-center grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                  <img
                    src={badge.src}
                    alt={badge.alt}
                    className="h-full w-auto object-contain max-w-[100px]"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {REVIEWS.map((r) => (
                <figure key={r.n} className="reveal cardX p-5">
                  <blockquote className="text-sm leading-relaxed text-ink/80">"{r.q}"</blockquote>
                  <figcaption className="mt-4 text-sm">
                    <span className="font-semibold text-forest">{r.n}</span>
                    <span className="text-ink/60"> · {r.l}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
            <div className="reveal mt-10 text-center">
              <Cta href="/book/service">Join Thousands of Pest-Free Homes</Cta>
            </div>
          </div>
        </section>

        {/* 13. Tree Planting */}
        <section id="sustainability" className="bg-green py-14 text-cream">
          <div className="containerX reveal flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
            <div>
              <h2 className="font-serif text-2xl font-semibold md:text-3xl">We protect your home, family and the planet</h2>
              <p className="mt-2 text-sm text-cream/85">Every home protected by Pestyfi also leads us to plant a tree.</p>
            </div>
          </div>
        </section>

        {/* 14. FAQ */}
        <section id="faq" className="py-16 md:py-20">
          <div className="containerX max-w-3xl">
            <SectionHead title="Everything You Want to Ask Before Letting Us Into Your Home" />
            <div className="reveal mt-8 space-y-2">
              {FAQS.map((f) => (
                <details key={f.q} className="cardX group overflow-hidden">
                  <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-forest">
                    <span className="flex items-center justify-between gap-3">
                      {f.q}
                      <span className="text-eco transition group-open:rotate-45" aria-hidden="true">+</span>
                    </span>
                  </summary>
                  <div className="px-5 pb-4 text-sm leading-relaxed text-ink/75">{f.a}</div>
                </details>
              ))}
            </div>
            {/* <div className="reveal mt-8 text-center">
              <Cta href={CONTACT.waHref} variant="light">Still Have Questions? Talk to an Expert</Cta>
            </div> */}
          </div>
        </section>

        {/* 15. Mumbai Tagline */}
        <section className="border-y border-black/5 bg-amber py-10">
          <div className="containerX reveal text-center">
            <p className="font-serif text-xl font-semibold text-forest md:text-2xl">
              If you live in Mumbai and you don't have a mosquito problem, we've probably been there.
            </p>
          </div>
        </section>



        {/* Book CTA */}
        <section id="book" className="bg-forest py-16 text-cream md:py-20">
          <div className="containerX grid gap-10 md:grid-cols-2">
            <div className="reveal">
              <h2 className="font-serif text-3xl font-semibold md:text-4xl">Book Your Pest Protection Today</h2>
              <p className="mt-4 text-sm text-cream/85">
                Get 20% OFF on prepaid bookings + free Pestyfi Home Protection Kit worth ₹1,499. Serving Mumbai, Navi Mumbai & Thane.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Cta href={CONTACT.waHref}>Talk to Agent</Cta>
                {/* <a href={CONTACT.telHref} className="btnGhost">Talk to Expert</a> */}
              </div>
            </div>
            <div className="block lg:hidden w-full mt-6">
              <button
                onClick={() => openBookingFlow('service')}
                className="btnLight w-full py-4 text-base font-bold shadow-premium"
              >
                📅 Choose Plan & Book Now
              </button>
            </div>
            <div className="hidden lg:block w-full">
              <BookingWizard
                currentUser={currentUser}
                locationInfo={locationInfo}
                services={dynamicServices}
                rates={dynamicRates}
                bookSlug={bookSlug}
                initialServiceId={preferredServiceId}
                onBookRouteChange={handleBookRouteChange}
              />
            </div>

          </div>
        </section>
        </>
        )}
      </main>

      {/* 16. Footer */}
      <footer className="bg-forest text-cream pb-24 lg:pb-0">
        <div className="containerX grid gap-8 py-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo size="lg" />
            <p className="mt-3 max-w-sm text-sm text-cream/75">
              Safe, odourless, eco-friendly pest control for homes and businesses across Mumbai, Navi Mumbai & Thane. Backed by 30+ years of Hindustan Pest Control expertise.
            </p>
            <div className="mt-6 text-xs text-cream/60 max-w-sm space-y-1">
              <span className="font-semibold text-cream text-sm block">Office Address</span>
              <p className="leading-relaxed">
                Room No. A/6, Shripad Smruti, Manpada Road, Dombivali, Star Colony, Dombivli, Thane-421201, Maharashtra, India
              </p>
              <p className="mt-2">
                <span className="font-semibold text-cream">GST Number:</span> 27AAOCP8447K1ZL
              </p>
              <p className="mt-1">
                <span className="font-semibold text-cream">Lic Number:</span> LAIDO2070267
              </p>
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold">Quick Links</div>
            <ul className="mt-3 space-y-2 text-sm text-cream/75">
              {[
                { label: 'Services', href: '/services' },
                { label: 'Why Pestyfi', href: '/why-us' },
                { label: 'About Us', href: '/about' },
                { label: 'FAQs', href: '/faq' },
                { label: 'Book Now', href: '/book/service' },
                { label: 'Privacy Policy', href: '/privacy' },
              ].map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="hover:text-cream">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold">Service Areas</div>
            <p className="mt-3 text-sm text-cream/75 leading-relaxed">
              Pest Control Service in Mumbai · Pest Control Service in Navi Mumbai · Pest Control Service in Thane · Pest Control Service in Kalyan · Pest Control Service in Dombivli · Pest Control Service in Panvel · Pest Control Service in Bhiwandi
            </p>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="containerX py-4 text-xs text-cream/60 flex flex-col sm:flex-row justify-between items-center gap-2">
            <span>© 2026 Pestyfi Eco Solutions. All rights reserved.</span>
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <a href="/privacy" className="hover:text-cream">Privacy Policy</a>
              <span>·</span>
              <span>Developed with ❤️ by WHNL group</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          setCurrentUser(pb.authStore.model)
          setIsProfileOpen(true)
        }}
      />

      {/* Location Modal */}
      <LocationModal
        isOpen={isLocationOpen}
        onClose={() => setIsLocationOpen(false)}
        onSelect={(loc) => setLocationInfo(loc)}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onUserUpdate={setCurrentUser}
      />

      {/* Social Proof Sales Notifications */}
      <SalesNotifier />

      {/* Booking Wizard Modal (Mobile Only) */}
      {isBookingOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-forest/80 backdrop-blur-sm" onClick={closeBookingModal} />

          {/* Modal Content Card */}
          <div className="relative w-full max-w-lg overflow-y-auto max-h-[90vh] rounded-2xl border border-white/10 bg-forest shadow-premium ring-1 ring-black/5">
            {/* Close Button overlay */}
            <button
              type="button"
              onClick={closeBookingModal}
              className="absolute top-4 right-4 z-[100] rounded-lg p-1.5 text-cream/60 hover:bg-white/10 transition-colors focus:outline-none bg-black/20"
              aria-label="Close booking modal"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <div className="p-1">
              <BookingWizard
                currentUser={currentUser}
                locationInfo={locationInfo}
                services={dynamicServices}
                rates={dynamicRates}
                bookSlug={bookSlug}
                initialServiceId={preferredServiceId}
                onBookRouteChange={handleBookRouteChange}
              />
            </div>
          </div>
        </div>
      )}

      {/* Sticky Mobile/Tablet CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-black/5 px-4 pt-4 pb-[calc(12px+env(safe-area-inset-bottom))] flex flex-col gap-2.5 lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex gap-3">
          <a
            href={CONTACT.waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 h-[52px] rounded-xl bg-cream/30 hover:bg-cream/50 border border-black/5 flex items-center justify-center gap-2 text-xs font-bold text-forest transition"
          >
            <span className="text-sm">💬</span>
            Talk to Agent
          </a>
          <a
            href="/book/service"
            className="flex-1 h-[52px] rounded-xl bg-forest hover:bg-forest/95 flex items-center justify-center gap-2 text-xs font-bold text-white transition shadow-sm"
          >
            <span className="text-sm">📅</span>
            Book Now
          </a>
        </div>
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-ink/50 font-medium">
          <span>🔒 All payments are secured by</span>
          <svg className="h-3.5 w-auto" fill="#3395FF" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <title>Razorpay</title>
            <path d="M22.436 0l-11.91 7.773-1.174 4.276 6.625-4.297L11.65 24h4.391l6.395-24zM14.26 10.098L3.389 17.166 1.564 24h9.008l3.688-13.902Z"/>
          </svg>
          <span className="font-bold text-[#3395FF]">Razorpay</span>
        </div>
      </div>

      <IosInstallPrompt />

      {/* Floating App Notification Toast CSS & Component */}
      {appNotification && (
        <>
          <style>{`
            @keyframes toastSlideIn {
              from { transform: translateY(-20px) scale(0.95); opacity: 0; }
              to { transform: translateY(0) scale(1); opacity: 1; }
            }
            .toast-animate {
              animation: toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}</style>
          <div 
            className="fixed top-4 right-4 z-[9999] max-w-sm w-full bg-white/95 border border-forest/10 rounded-2xl shadow-premium p-4 pointer-events-auto transition-all duration-300 toast-animate cursor-pointer flex gap-3 backdrop-blur-md ring-1 ring-black/5"
            onClick={() => setAppNotification(null)}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-forest/10 text-forest text-lg">
              🔔
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-forest leading-tight truncate">{appNotification.title}</div>
              <div className="text-[11px] text-ink/75 leading-normal mt-1 break-words">{appNotification.message}</div>
            </div>
            <button 
              type="button" 
              className="text-ink/30 hover:text-ink/65 h-6 w-6 shrink-0 flex items-center justify-center rounded-lg hover:bg-black/5"
              onClick={(e) => {
                e.stopPropagation()
                setAppNotification(null)
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default App
