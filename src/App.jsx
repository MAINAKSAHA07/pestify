import { useEffect, useState } from 'react'
import { setupLeadForm, setupMobileNavToggle, setupRevealAnimations } from './hooks'
import { CONTACT } from './site'
import Logo from './components/Logo'
import Loader from './components/Loader'
import { pb } from './lib/pocketbase'
import AuthModal from './components/AuthModal'
import BookingWizard from './components/BookingWizard'
import LocationModal from './components/LocationModal'
import ScrollRevealText from './components/ScrollRevealText'
import ProfileModal from './components/ProfileModal'
import BackendDashboard from './components/BackendDashboard'
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

function Cta({ children, href = '#book', variant = 'primary', className = '' }) {
  const cls = variant === 'ghost' ? 'btnGhost' : variant === 'light' ? 'btnLight' : 'btnPrimary'
  return (
    <a href={href} className={`${cls} ${className}`}>
      {children}
    </a>
  )
}

function App() {
  const [currentUser, setCurrentUser] = useState(pb.authStore.model)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [currentPath, setCurrentPath] = useState(window.location.pathname)

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])
  const [locationInfo, setLocationInfo] = useState(() => {
    const saved = localStorage.getItem('pestyfi_location')
    return saved ? JSON.parse(saved) : null
  })
  const [isLocationOpen, setIsLocationOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

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

  const handleSignOut = () => {
    pb.authStore.clear()
    setIsDropdownOpen(false)
  }

  const cockroach = SERVICES.find((s) => s.id === 'cockroach')
  const otherServices = SERVICES.filter((s) => s.id !== 'cockroach')

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
        {/* 3. Hero */}
        <section id="top" className="relative overflow-hidden bg-forest text-cream">
          <div className="pointer-events-none absolute inset-0 bg-grain opacity-90" aria-hidden="true" />
          <div
            className="pointer-events-none absolute inset-0 opacity-15"
            aria-hidden="true"
            style={{
              backgroundImage: "url('/hero/hero image /final/1.webp')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="containerX relative py-16 md:py-24">
            <div className="grid md:grid-cols-12 gap-10 items-center">
              <div className="reveal md:col-span-7 max-w-xl">
                <h1 className="font-serif text-4xl font-semibold leading-[1.08] tracking-tight md:text-5xl lg:text-6xl">
                  {HERO.headline}
                </h1>
                <p className="mt-5 text-base leading-relaxed md:text-lg">
                  <ScrollRevealText text={HERO.subheadline} activeClass="text-cream" />
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Cta href="#book" className="px-6 py-3 text-base">{HERO.cta1}</Cta>
                  <Cta href={CONTACT.waHref} variant="ghost" className="px-6 py-3 text-base">{HERO.cta2}</Cta>
                </div>
              </div>
              <div className="reveal hidden md:block md:col-span-5">
                <div className="relative p-2 rounded-2xl bg-white/5 ring-1 ring-white/10 shadow-premium overflow-hidden">
                  <img
                    src="/hero/hero image /final/1.webp"
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

        {/* 4. Trusted By */}
        <section className="border-y border-black/5 bg-white py-10">
          <div className="containerX reveal mb-6 text-center">
            <h2 className="font-serif text-2xl font-semibold text-forest md:text-3xl">
              Trusted By Families, Businesses And Institutions Across Mumbai
            </h2>
          </div>
          <div className="logoMarquee overflow-hidden">
            <div className="logoTrack flex gap-8">
              {[...TRUSTED_LOGOS, ...TRUSTED_LOGOS].map((name, i) => (
                <span
                  key={`${name}-${i}`}
                  className="inline-flex shrink-0 items-center rounded-xl bg-cream px-5 py-3 text-sm font-semibold text-forest/70 ring-1 ring-black/5"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>

          {/* Government & MSME Credentials */}
          <div className="reveal mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-4 px-4 py-6 border-t border-black/5 bg-cream/10">
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
        </section>

        {/* 5. Home Maintenance */}
        <section className="py-16 md:py-20">
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
              <Cta href="#book" className="mt-6">Book Preventive Pest Protection</Cta>
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
              <Cta href="#book">Protect My Home Today</Cta>
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
                  <Cta href="#book" className="mt-6 w-fit">Book Cockroach Control</Cta>
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
                    <a href="#book" className="mt-4 inline-block text-xs font-semibold text-green hover:text-forest">Book Now →</a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 8. Notice Pests Early */}
        <section className="bg-forest py-16 text-cream md:py-20">
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
              <Cta href="#book" className="mt-8 inline-block">Stop the Infestation Early</Cta>
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

        {/* 9. Fits Into Your Life */}
        <section className="py-16 md:py-20">
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
              <Cta href="#book" className="reveal mt-4">Book a Hassle-Free Service</Cta>
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

        {/* 10. Real Problem */}
        <section className="bg-white/60 py-16 md:py-20">
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
              <Cta href="#book" className="mt-6">Protect My Family Today</Cta>
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
              <Cta href="#book">Join Thousands of Pest-Free Homes</Cta>
            </div>
          </div>
        </section>

        {/* 13. Tree Planting */}
        <section className="bg-green py-14 text-cream">
          <div className="containerX reveal flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-eco/20 text-3xl" aria-hidden="true">🌳</div>
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
            <div className="reveal mt-8 text-center">
              <Cta href={CONTACT.waHref} variant="light">Still Have Questions? Talk to an Expert</Cta>
            </div>
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

        {/* 15b. Free Home Protection Kit Section */}
        <section className="py-16 md:py-24 bg-white overflow-hidden border-b border-black/5">
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
                  <Cta href="#book" className="px-6 py-3 text-sm font-bold shadow-premium">
                    Claim Your Free Kit Now
                  </Cta>
                </div>
              </div>
            </div>
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
                <Cta href={CONTACT.waHref}>Book Now & Get 20% OFF</Cta>
                <a href={CONTACT.telHref} className="btnGhost">Talk to Expert</a>
              </div>
            </div>
            <BookingWizard currentUser={currentUser} locationInfo={locationInfo} />

          </div>
        </section>
      </main>

      {/* 16. Footer */}
      <footer className="bg-forest text-cream">
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
                <span className="font-semibold text-cream">GST Number:</span> LAIDO2070267
              </p>
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold">Quick Links</div>
            <ul className="mt-3 space-y-2 text-sm text-cream/75">
              {[
                { label: 'Services', href: '#services' },
                { label: 'Why Pestyfi', href: '#why-us' },
                { label: 'About Us', href: '#about' },
                { label: 'FAQs', href: '#faq' },
                { label: 'Book Now', href: '#book' },
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
            <span>Developed with ❤️ by WHNL group</span>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => setCurrentUser(pb.authStore.model)}
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
        onUserUpdate={(updatedUser) => setCurrentUser(updatedUser)}
      />
    </div>
  )
}

export default App
