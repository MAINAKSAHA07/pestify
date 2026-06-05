import { useEffect, useState } from 'react'
import { setupLeadForm, setupMobileNavToggle, setupRevealAnimations } from './hooks'
import { CONTACT } from './site'
import Logo from './components/Logo'
import Loader from './components/Loader'
import { pb } from './lib/pocketbase'
import AuthModal from './components/AuthModal'
import BookingWizard from './components/BookingWizard'
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
      <h2 className={`font-serif text-3xl font-semibold tracking-tight md:text-4xl ${light ? 'text-cream' : 'text-forest'}`}>
        {title}
      </h2>
      {subtitle && <p className={`mt-3 text-base leading-relaxed ${light ? 'text-cream/80' : 'text-ink/70'}`}>{subtitle}</p>}
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

  return (
    <div className="min-h-dvh bg-cream text-ink pb-20 md:pb-0">
      <Loader />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>

      {/* 1. Announcement Bar */}
      <div className="bg-amber px-4 py-2.5 text-center text-xs font-semibold text-forest sm:text-sm">
        {ANNOUNCEMENT}
      </div>

      {/* 2. Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-forest text-cream">
        <div className="containerX flex items-center justify-between gap-4 py-3">
          <Logo onDark size="md" />

          <div className="flex items-center gap-2">
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

            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/25 hover:bg-white/15 sm:text-sm transition-all focus:outline-none"
                >
                  <span className="h-2 w-2 rounded-full bg-eco animate-pulse" />
                  <span className="max-w-[100px] truncate sm:max-w-[150px]">
                    {currentUser.name || currentUser.email}
                  </span>
                  <svg className={`h-4 w-4 text-cream/70 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-white/90 hover:bg-white/10 transition-colors"
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
                className="rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 ring-white/20 hover:bg-white/10 sm:text-sm transition-all focus:outline-none"
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
            className="pointer-events-none absolute inset-0 opacity-30"
            aria-hidden="true"
            style={{
              backgroundImage:
                "linear-gradient(rgba(26,58,42,0.7), rgba(26,58,42,0.9)), url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=80')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="containerX relative py-16 md:py-24">
            <div className="reveal max-w-3xl">
              <h1 className="font-serif text-4xl font-semibold leading-[1.08] tracking-tight md:text-5xl lg:text-6xl">
                {HERO.headline}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-cream/85 md:text-lg">{HERO.subheadline}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Cta href="#book" className="px-6 py-3 text-base">{HERO.cta1}</Cta>
                <Cta href={CONTACT.waHref} variant="ghost" className="px-6 py-3 text-base">{HERO.cta2}</Cta>
              </div>
            </div>

            <div className="reveal mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {HERO.trust.map((t) => (
                <div key={t.title} className="rounded-xl bg-white/10 p-4 ring-1 ring-white/15">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-eco" aria-hidden="true">✓</span>
                    <div>
                      <div className="text-sm font-semibold">{t.title}</div>
                      {t.text && <div className="mt-1 text-xs text-cream/75">{t.text}</div>}
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
        </section>

        {/* 5. Home Maintenance */}
        <section className="py-16 md:py-20">
          <div className="containerX grid gap-10 md:grid-cols-2 md:items-center">
            <div className="reveal">
              <SectionHead
                title="In Mumbai, Pest Control Is Not a Reaction. It Is Home Maintenance."
                subtitle="You don't wait for your AC to stop working before servicing it. You don't wait for your water purifier to fail before changing the filter. So why wait for pests to show up before protecting your home?"
              />
              <p className="mt-5 text-sm leading-relaxed text-ink/70">
                Mumbai's humidity, coastal weather, drainage systems, high-rise apartments, food waste, and monsoon moisture make homes naturally attractive to pests. By the time you see them, they may already be hiding, breeding, or spreading inside your home.
              </p>
              <p className="mt-4 text-sm font-medium text-forest">
                Pestyfi helps you prevent the problem before it becomes visible, stressful, and expensive.
              </p>
              <Cta href="#book" className="mt-6">Book Preventive Pest Protection</Cta>
            </div>
            <div className="reveal cardX p-6">
              <ul className="space-y-4 text-sm text-ink/75">
                {['AC servicing before breakdown', 'Water filter before failure', 'Pest protection before infestation'].map((item, i) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-lime/60 font-display text-lg text-forest">{i + 1}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 6. Why Pestyfi */}
        <section id="why-us" className="bg-white/60 py-16 md:py-20">
          <div className="containerX">
            <div className="reveal">
              <SectionHead title="Protection you can trust, results you can see" subtitle="We don't just remove pests. We remove the stress that comes with them." />
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink/70">
                Most pest control services make the process feel complicated — move furniture, empty the kitchen, leave the house, deal with chemical smell. Pestyfi is built for homes that want protection without disruption.
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {WHY_CARDS.map((c) => (
                <article key={c.title} className="reveal cardX p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
                  <h3 className="text-sm font-semibold text-forest">{c.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/70">{c.text}</p>
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
              <article className="reveal mt-10 cardX overflow-hidden">
                <div className="border-b border-black/5 bg-forest p-6 text-cream md:p-8">
                  <span className="pillX bg-eco/20 text-eco ring-white/10">Featured Service</span>
                  <h3 className="mt-3 font-serif text-2xl font-semibold">{cockroach.title}</h3>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-cream/85">{cockroach.text}</p>
                </div>
                <div className="grid gap-6 p-6 md:grid-cols-2 md:p-8">
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
                <div className="border-t border-black/5 px-6 py-4 md:px-8">
                  <div className="flex flex-wrap gap-2">
                    {cockroach.benefits.map((b) => (
                      <span key={b} className="text-xs font-medium text-ink/70">✓ {b}</span>
                    ))}
                  </div>
                  <Cta href="#book" className="mt-4">Book Cockroach Control</Cta>
                </div>
              </article>
            )}

            {/* Other services */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {otherServices.map((s) => (
                <article key={s.id} className="reveal cardX p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
                  <h3 className="text-sm font-semibold text-forest">{s.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-ink/70">{s.text}</p>
                  <a href="#book" className="mt-3 inline-block text-xs font-semibold text-green hover:text-forest">Book Now →</a>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 8. Notice Pests Early */}
        <section className="bg-forest py-16 text-cream md:py-20">
          <div className="containerX reveal max-w-3xl text-center">
            <h2 className="font-serif text-3xl font-semibold md:text-4xl">You Don't Notice Pests Until They've Already Made Themselves Comfortable</h2>
            <div className="mt-6 space-y-2 text-sm text-cream/80">
              <p>One cockroach in the kitchen. One termite mark on the furniture. One bed bug bite at night. One rat sound behind the cabinet.</p>
              <p className="font-medium text-cream">Most pest problems start quietly. By the time they become visible, they may already be spreading, breeding, or damaging your home.</p>
            </div>
            <Cta href="#book" className="mt-8">Stop the Infestation Early</Cta>
          </div>
        </section>

        {/* 9. Fits Into Your Life */}
        <section className="py-16 md:py-20">
          <div className="containerX grid gap-10 md:grid-cols-2 md:items-center">
            <SectionHead title="Pest Control That Fits Into Your Life, Not the Other Way Around" subtitle="You should not have to rearrange your entire home for pest control." />
            <div className="reveal grid gap-3 sm:grid-cols-2">
              {['No need to vacate', 'No need to remove utensils', 'No harsh odour', 'No complicated preparation', 'No endless follow-ups', 'No confusion'].map((item) => (
                <div key={item} className="cardX flex items-center gap-2 p-4 text-sm font-medium text-forest">
                  <span className="text-eco" aria-hidden="true">✓</span> {item}
                </div>
              ))}
            </div>
            <p className="reveal text-sm text-ink/70 md:col-span-2">Just book, relax, and let certified hygiene experts handle the problem.</p>
            <Cta href="#book" className="reveal md:col-span-2">Book a Hassle-Free Service</Cta>
          </div>
        </section>

        {/* 10. Real Problem */}
        <section className="bg-white/60 py-16 md:py-20">
          <div className="containerX reveal max-w-3xl">
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
            <p className="mt-6 text-sm font-medium text-forest">
              Pestyfi gives your family a cleaner, safer, more comfortable home. Because hygiene is not a luxury — it is basic home care.
            </p>
            <Cta href="#book" className="mt-6">Protect My Family Today</Cta>
          </div>
        </section>

        {/* 11. About + Every Space */}
        <section id="about" className="py-16 md:py-20">
          <div className="containerX">
            <div className="reveal max-w-3xl">
              <SectionHead title="Built for People Who Want Pest Control Without Panic" />
              <p className="mt-4 text-sm leading-relaxed text-ink/70">
                Pestyfi is a new-age pest control brand launched by Hindustan Pest Control, a pioneer with over 30 years of experience. Pest control should not feel scary, toxic, confusing, or inconvenient.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-ink/70">
                We bring together the trust of Hindustan Pest Control with the speed, safety, and convenience today's homes expect. We do not just treat pests — we protect the feeling of comfort inside your home.
              </p>
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

        {/* 12. Reviews */}
        <section id="reviews" className="bg-white/60 py-16 md:py-20">
          <div className="containerX">
            <SectionHead
              title="When people trust you with their home, pest control cannot be careless."
              subtitle="That is why Pestyfi focuses on safety, hygiene, convenience, and long-term protection."
            />
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
            <BookingWizard currentUser={currentUser} />

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
            <div className="text-sm font-semibold">Areas</div>
            <p className="mt-3 text-sm text-cream/75">Mumbai · Navi Mumbai · Thane · Kalyan · Dombivli · Panvel · Bhiwandi</p>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="containerX py-4 text-xs text-cream/60">© 2026 Pestyfi Eco Solutions. All rights reserved.</div>
        </div>
      </footer>

      {/* Floating CTA */}
      <a
        href={CONTACT.waHref}
        rel="noreferrer"
        className="fixed bottom-20 right-4 z-50 btnX rounded-full bg-eco px-5 py-3 text-forest shadow-premium md:bottom-6"
        aria-label="WhatsApp Book Now"
      >
        WhatsApp
      </a>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => setCurrentUser(pb.authStore.model)}
      />
    </div>
  )
}

export default App
