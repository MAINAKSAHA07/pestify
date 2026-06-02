import { useEffect } from 'react'
import { setupLeadForm, setupMobileNavToggle, setupRevealAnimations } from './hooks'
import { CONTACT } from './site'

function App() {
  useEffect(() => {
    setupRevealAnimations()
    setupMobileNavToggle()
    setupLeadForm()
  }, [])

  return (
    <div className="min-h-dvh bg-cream text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:shadow-premium"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-forest/95 text-cream backdrop-blur">
        <nav className="containerX flex items-center justify-between py-3" aria-label="Primary">
          <a href="#top" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-eco/15 ring-1 ring-white/15">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 2c4.7 3.8 8.7 6.2 8.7 11.6S16.9 22 12 22 3.3 18.4 3.3 13.6C3.3 8.2 7.3 5.8 12 2Z"
                  fill="#52B788"
                  opacity="0.95"
                />
                <path
                  d="M12 7.2c-2.6 2.6-4.3 4.4-4.3 6.9 0 3.2 2.6 6.2 4.3 6.2s4.3-3 4.3-6.2c0-2.5-1.7-4.3-4.3-6.9Z"
                  fill="#F5F0E8"
                  opacity="0.95"
                />
              </svg>
            </span>
            <span className="leading-tight">
              <span className="block font-serif text-lg font-semibold tracking-tight">Pestyfi</span>
              <span className="block text-xs text-cream/80">Eco Solutions</span>
            </span>
          </a>

          <button type="button" className="navToggle btnGhost md:hidden" aria-expanded="false" aria-controls="navMenu">
            Menu
          </button>

          <div id="navMenu" className="navMenu hidden items-center gap-6 md:flex">
            <ul className="flex items-center gap-6 text-sm font-semibold text-cream/90">
              <li>
                <a className="hover:text-cream" href="#services">
                  Services
                </a>
              </li>
              <li>
                <a className="hover:text-cream" href="#why-us">
                  Why Us
                </a>
              </li>
              <li>
                <a className="hover:text-cream" href="#pricing">
                  Pricing
                </a>
              </li>
              <li>
                <a className="hover:text-cream" href="#areas">
                  Areas
                </a>
              </li>
              <li>
                <a className="hover:text-cream" href="#faq">
                  FAQ
                </a>
              </li>
              <li>
                <a className="hover:text-cream" href="#contact">
                  Contact
                </a>
              </li>
            </ul>
            <div className="flex items-center gap-3">
              <a className="btnGhost" href="#services">
                View Services
              </a>
              <a className="btnPrimary" href="#contact">
                Book Now
              </a>
            </div>
          </div>
        </nav>

        <div className="border-t border-white/10 bg-forest md:hidden">
          <div className="containerX flex items-center justify-between gap-2 py-2">
            <a className="btnX w-full bg-white/10 text-cream ring-1 ring-white/20" href={CONTACT.telHref}>
              Call Now
            </a>
            <a className="btnX w-full bg-eco text-forest" href={CONTACT.waHref} rel="noreferrer">
              WhatsApp
            </a>
            <a className="btnX w-full bg-amber text-forest" href="#pricing">
              Get Quote
            </a>
          </div>
        </div>
      </header>

      <main id="main" className="relative">
        <section id="top" className="relative overflow-hidden bg-forest text-cream">
          <div className="pointer-events-none absolute inset-0 bg-grain opacity-95" aria-hidden="true" />
          <div
            className="pointer-events-none absolute inset-0 opacity-35"
            aria-hidden="true"
            style={{
              backgroundImage:
                "linear-gradient(rgba(26,58,42,0.65), rgba(26,58,42,0.85)), url('https://images.unsplash.com/photo-1581579186913-45ac2b9b51b6?auto=format&fit=crop&w=1800&q=80')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />

          <div className="containerX relative grid gap-10 py-14 md:grid-cols-12 md:py-20">
            <div className="reveal md:col-span-7">
              <div className="flex flex-wrap items-center gap-2">
                <span className="pillX bg-amber text-forest">
                  <span className="inline-block h-2 w-2 rounded-full bg-urgent" aria-hidden="true" /> 20% OFF on First Service Booking
                </span>
                <span className="pillX bg-white/10 text-cream">Plans starting from <strong>₹1999</strong></span>
              </div>

              <h1 className="mt-5 font-serif text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
                Mumbai’s Most Trusted Pest Control Experts
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-cream/90 md:text-lg">
                Eco-friendly, odourless pest control treatments for homes, offices, restaurants, hotels, warehouses, and industrial spaces across Mumbai,
                Navi Mumbai &amp; Thane. Safe for children, pets, and your property.
              </p>

              <ul className="mt-6 grid gap-2 text-sm text-cream/90 sm:grid-cols-2">
                {[
                  '30+ Years Experience',
                  '5+ Lakh Customers Served',
                  '365 Days Assured Service Guarantee',
                  'Safe for Kids & Pets',
                  'No Need to Vacate Home',
                ].map((x) => (
                  <li key={x} className="flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-lg bg-eco/15 ring-1 ring-white/15" aria-hidden="true">
                      ✓
                    </span>
                    <span>{x}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap gap-3">
                <a className="btnPrimary px-5 py-3 text-base" href="#contact">
                  Book Free Inspection
                </a>
                <a className="btnGhost px-5 py-3 text-base" href="#services">
                  View Services
                </a>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-2 text-xs text-cream/80">
                <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">Mumbai’s Trusted Pest Control Experts</span>
                <span aria-hidden="true">•</span>
                <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">
                  Safe, Eco-Friendly Pest Control for Homes & Businesses
                </span>
              </div>
            </div>

            <aside className="reveal md:col-span-5">
              <div className="cardX overflow-hidden bg-white/10 p-6 text-cream ring-1 ring-white/15">
                <div className="flex items-center justify-between">
                  <span className="pillX bg-white/10 text-cream ring-white/15">Trusted since 30+ years</span>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-eco/20 ring-1 ring-white/15" aria-hidden="true">
                    ✓
                  </span>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {[
                    { num: '30+', label: 'Years Experience' },
                    { num: '5L+', label: 'Happy Customers' },
                    { num: '365', label: 'Days Guarantee' },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl bg-black/10 p-4 ring-1 ring-white/10">
                      <div className="font-display text-4xl tracking-wide text-amber">{s.num}</div>
                      <div className="mt-1 text-xs text-cream/85">{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 text-sm text-cream/85">
                  Fast doorstep service across <strong>Mumbai</strong>, <strong>Navi Mumbai</strong> &amp; <strong>Thane</strong>.
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="bg-amber text-forest">
          <div className="ticker relative overflow-hidden py-3">
            <div className="tickerTrack flex gap-10 whitespace-nowrap text-sm font-semibold">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex gap-10 pr-10">
                  {[
                    '100% Pest Removal Guarantee',
                    'Odourless & Eco-Friendly Treatments',
                    'Safe for Children and Pets',
                    'No Need to Vacate Your Home',
                    'No Need to Remove Utensils or Furniture',
                    'No Property Damage Guaranteed',
                    'Fast Doorstep Service',
                    'Affordable Plans Starting ₹1999',
                  ].map((t) => (
                    <span key={`${i}-${t}`} className="inline-flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full bg-urgent" aria-hidden="true" /> {t}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Us */}
        <section id="why-us" className="py-14 md:py-20">
          <div className="containerX">
            <header className="reveal">
              <h2 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">Why Customers Trust Pestyfi Eco Solutions</h2>
              <p className="mt-3 max-w-2xl text-ink/70">
                Professional pest control backed by experience, modern methods, and customer-first service.
              </p>
            </header>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {[
                {
                  icon: '🛡️',
                  title: '30+ Years of Expertise',
                  text: 'Our trained technicians bring decades of hands-on pest management experience for homes, commercial spaces, and industrial facilities.',
                },
                {
                  icon: '🏡',
                  title: '5+ Lakh Customers Served',
                  text: 'We have protected more than 5 lakh households and businesses with safe, effective, and long-lasting pest control solutions.',
                },
                {
                  icon: '🌿',
                  title: 'Eco-Friendly & Odourless',
                  text: 'We use environmentally responsible treatments that are safe for children, pets, and sensitive indoor spaces.',
                },
                {
                  icon: '🧼',
                  title: 'No Home Disruption',
                  text: 'No need to vacate your home, remove utensils, or shift furniture during treatment.',
                },
                {
                  icon: '📆',
                  title: '365 Days Service Guarantee',
                  text: 'Our assured service support gives you confidence even after the first treatment is complete.',
                },
                {
                  icon: '💰',
                  title: 'Affordable Custom Plans',
                  text: 'Every property is different, so we offer treatment plans based on pest type, infestation level, and property size.',
                },
              ].map((c) => (
                <article
                  key={c.title}
                  className="reveal cardX group p-6 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lift"
                >
                  <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-lime/70 text-xl ring-1 ring-black/5">
                    <span aria-hidden="true">{c.icon}</span>
                  </div>
                  <h3 className="text-lg font-semibold">{c.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/70">{c.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="bg-white/50 py-14 md:py-20">
          <div className="containerX">
            <header className="reveal">
              <h2 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">Complete Pest Control Services</h2>
              <p className="mt-3 max-w-2xl text-ink/70">
                From cockroaches to termites, bed bugs, rodents, mosquitoes, ants, ticks, and crawling insects, we handle it all.
              </p>
            </header>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {[
                {
                  icon: '🏠',
                  title: 'General Pest Control',
                  text: 'Eliminates common household pests including cockroaches, ants, spiders, silverfish, lizards, and crawling insects using safe long-lasting treatment methods.',
                  cta: 'Book General Treatment',
                },
                {
                  icon: '🍃',
                  title: 'Herbal Pest Control',
                  text: 'Natural and eco-friendly pest control treatments that reduce chemical exposure while delivering effective pest management.',
                  cta: 'Choose Herbal Treatment',
                },
                {
                  icon: '🪳',
                  title: 'Cockroach Pest Control',
                  text: 'Targets hidden cockroach infestations including German, American, and household cockroaches with advanced gel-based and long-lasting solutions.',
                  cta: 'Remove Cockroaches',
                },
                {
                  icon: '🪵',
                  title: 'Termite Pest Control',
                  text: 'Protect your home, office, shop, warehouse, or industrial property from costly termite damage with advanced anti-termite treatment.',
                  cta: 'Stop Termites',
                },
                {
                  icon: '🛏️',
                  title: 'Bed Bug Treatment',
                  text: 'Professional bed bug treatment designed to eliminate adult bed bugs and eggs for healthier, peaceful sleep.',
                  cta: 'Treat Bed Bugs',
                },
                {
                  icon: '🦟',
                  title: 'Mosquito Control',
                  text: 'Indoor and outdoor mosquito management to reduce breeding and protect families from mosquito-borne diseases.',
                  cta: 'Control Mosquitoes',
                },
                {
                  icon: '🐭',
                  title: 'Rodent Control',
                  text: 'Inspection, trapping, exclusion, and preventive solutions to keep rats and mice away from your property.',
                  cta: 'Remove Rodents',
                },
                {
                  icon: '🐜',
                  title: 'Ant Control',
                  text: 'Colony-focused ant treatment that eliminates infestations at the source and helps prevent future spread.',
                  cta: 'Stop Ants',
                },
                {
                  icon: '🐾',
                  title: 'Tick Control',
                  text: 'Specialized tick control treatment for homes with pets, gardens, balconies, and family spaces.',
                  cta: 'Treat Ticks',
                },
              ].map((s) => (
                <article key={s.title} className="reveal cardX p-6 transition hover:-translate-y-0.5 hover:shadow-lift">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="grid h-12 w-12 place-items-center rounded-xl bg-eco/15 text-xl ring-1 ring-black/5">
                        <span aria-hidden="true">{s.icon}</span>
                      </div>
                      <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                    </div>
                    <span className="pillX bg-lime/70 text-forest">Safe</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-ink/70">{s.text}</p>
                  <a className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-green hover:text-forest" href="#contact">
                    {s.cta} <span aria-hidden="true">→</span>
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Sectors */}
        <section id="sectors" className="py-14 md:py-20">
          <div className="containerX">
            <header className="reveal">
              <h2 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">Pest Control for Every Space</h2>
              <p className="mt-3 max-w-2xl text-ink/70">
                Residential, commercial, and industrial services with safe, odourless treatment and minimal disruption.
              </p>
            </header>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {[
                {
                  title: 'Residential Pest Control',
                  text: 'Protect your home with customized pest control based on infestation level, property size, and pest type. Our treatments are safe, odourless, and designed to avoid disrupting your daily routine.',
                  items: [
                    'Apartment Pest Control',
                    'Villa Pest Control',
                    'Bungalow Pest Control',
                    'Society Pest Control',
                    'Kitchen Pest Control',
                    'Bedroom Pest Control',
                    'Balcony & Garden Pest Control',
                  ],
                },
                {
                  title: 'Commercial Pest Control',
                  text: 'Reliable pest management programs for businesses that need to protect employees, customers, inventory, and brand reputation.',
                  items: [
                    'Restaurants & Cafes',
                    'Hotels & Hospitality',
                    'Offices & Corporate Buildings',
                    'Retail Stores',
                    'Schools & Colleges',
                    'Hospitals & Clinics',
                    'Warehouses & Storage Facilities',
                  ],
                },
                {
                  title: 'Industrial Pest Control',
                  text: 'Advanced pest monitoring and industry-approved treatment methods for factories, logistics hubs, processing units, and manufacturing spaces without interrupting operations.',
                  items: ['Factories', 'Warehouses', 'Manufacturing Units', 'Logistics Hubs', 'Processing Facilities', 'Storage Facilities'],
                },
              ].map((c) => (
                <article key={c.title} className="reveal cardX p-6">
                  <h3 className="text-lg font-semibold">{c.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/70">{c.text}</p>
                  <ul className="mt-4 space-y-2 text-sm text-ink/80">
                    {c.items.map((x) => (
                      <li key={x} className="flex items-start gap-2">
                        <span className="mt-1 inline-block h-2 w-2 rounded-full bg-eco" aria-hidden="true" />
                        <span>{x}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Areas */}
        <section id="areas" className="relative overflow-hidden py-14 md:py-20">
          <div className="pointer-events-none absolute inset-0 bg-city bg-city opacity-60" aria-hidden="true" />
          <div className="containerX relative">
            <header className="reveal">
              <h2 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">Serving Mumbai, Navi Mumbai &amp; Thane</h2>
              <p className="mt-3 max-w-2xl text-ink/70">Fast doorstep pest control across major residential, commercial, and industrial areas.</p>
            </header>

            <div className="reveal mt-8 flex flex-wrap gap-2">
              {[
                'Mumbai',
                'Navi Mumbai',
                'Thane',
                'Kalyan',
                'Dombivli',
                'Mira Bhayandar',
                'Panvel',
                'Bhiwandi',
                'Ambernath',
                'Badlapur',
                'And nearby areas',
              ].map((a) => (
                <span
                  key={a}
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                    a === 'And nearby areas' ? 'bg-lime/60 text-forest ring-black/10' : 'bg-white/70 text-forest ring-black/10'
                  }`}
                >
                  {a}
                </span>
              ))}
            </div>

            <div className="reveal mt-10 cardX flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-base font-semibold text-forest">Doorstep Service</div>
                <div className="mt-1 text-sm text-ink/70">
                  Book an inspection today. We’ll share a clear plan + exact quotation after assessment.
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <a className="btnPrimary" href="#contact">
                  Book Free Inspection
                </a>
                <a className="btnX bg-forest text-cream ring-1 ring-black/10 hover:bg-green" href={CONTACT.telHref}>
                  Call {CONTACT.phoneE164}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="bg-white/50 py-14 md:py-20">
          <div className="containerX">
            <header className="reveal">
              <h2 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">Affordable Pest Control Plans</h2>
              <p className="mt-3 max-w-2xl text-ink/70">
                Clear pricing for Mumbai homes. Final quotation may depend on property size, infestation level, and inspection.
              </p>
              <p className="mt-4 inline-flex rounded-xl bg-amber px-4 py-2 text-sm font-semibold text-forest ring-1 ring-black/10">
                First service booking gets 20% OFF.
              </p>
            </header>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {[
                {
                  title: 'Advance Golden Gel / Cockroach Treatment',
                  desc: 'Long-lasting gel-based control for hidden infestations.',
                  rows: [
                    ['1BHK', '₹2500'],
                    ['2BHK', '₹4000'],
                    ['3BHK', '₹5500'],
                    ['4BHK and above', '₹6500'],
                    ['Extra room', '+₹700'],
                  ],
                },
                {
                  title: 'Anti-Termite Treatment',
                  desc: 'Protect property from costly termite damage.',
                  rows: [
                    ['1BHK', '₹4500'],
                    ['2BHK', '₹6000'],
                    ['3BHK', '₹7500'],
                    ['4BHK and above', '₹10500'],
                    ['Extra room', '+₹1000'],
                  ],
                },
                {
                  title: 'Bed Bug Treatment',
                  desc: 'Eliminates adult bed bugs + eggs for peaceful sleep.',
                  rows: [
                    ['1BHK', '₹3500'],
                    ['2BHK', '₹5000'],
                    ['3BHK', '₹6500'],
                    ['4BHK and above', '₹8500'],
                    ['Extra room', '+₹800'],
                  ],
                },
                {
                  title: 'General Disinfection / Crawling Insects',
                  desc: 'For ants, spiders, lizards, and crawling insects.',
                  rows: [
                    ['1BHK', '₹3000'],
                    ['2BHK', '₹4000'],
                    ['3BHK', '₹5000'],
                    ['4BHK and above', '₹6500'],
                    ['Extra room', '+₹500'],
                  ],
                },
                {
                  title: 'Mosquito Treatment',
                  desc: 'Indoor + outdoor mosquito management.',
                  rows: [
                    ['1BHK', '₹3000'],
                    ['2BHK', '₹4000'],
                    ['3BHK', '₹5000'],
                    ['4BHK and above', '₹6500'],
                    ['Extra room', '+₹500'],
                  ],
                },
              ].map((p) => (
                <article key={p.title} className="reveal cardX p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-forest">{p.title}</h3>
                    <p className="mt-1 text-sm text-ink/70">{p.desc}</p>
                    <ul className="mt-5 space-y-2 text-sm">
                      {p.rows.map(([k, v]) => (
                        <li key={k} className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2 ring-1 ring-black/5">
                          <span className="text-ink/80">{k}</span>
                          <span className="font-semibold text-forest">{v}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <a className="btnPrimary mt-6 w-full" href="#contact">
                    Get Exact Quote
                  </a>
                </article>
              ))}

              <aside className="reveal rounded-xl2 bg-forest p-6 text-cream shadow-premium lg:col-span-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Get a precise quote in minutes</h3>
                  <p className="mt-2 text-sm text-cream/85 leading-relaxed">
                    Share your area, property type and pest issue — our team will recommend the best plan after a quick assessment.
                  </p>
                </div>
                <div>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <a className="btnPrimary" href="#contact">
                      Get Exact Quote
                    </a>
                    <a className="btnX bg-white/10 text-cream ring-1 ring-white/20 hover:bg-white/15" href={CONTACT.waHref} rel="noreferrer">
                      WhatsApp
                    </a>
                  </div>
                  <div className="mt-4 text-xs text-cream/70">No spam. One call to confirm your booking.</div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* Process */}
        <section id="process" className="py-14 md:py-20">
          <div className="containerX">
            <header className="reveal">
              <h2 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">Simple 4-Step Pest Control Process</h2>
              <p className="mt-3 max-w-2xl text-ink/70">From inspection to follow-up support — clear, fast and professional.</p>
            </header>

            <ol className="mt-10 grid gap-5 md:grid-cols-4">
              {[
                { n: '1', t: 'Book Inspection', d: 'Submit your details or call us to schedule a doorstep inspection.' },
                { n: '2', t: 'Pest Assessment', d: 'Our technician checks the pest type, infestation level, and affected areas.' },
                { n: '3', t: 'Safe Treatment', d: 'We apply safe, odourless, and effective treatment using modern pest control methods.' },
                { n: '4', t: 'Follow-Up Support', d: 'We provide service support and prevention guidance for long-term protection.' },
              ].map((s) => (
                <li key={s.t} className="reveal cardX p-6">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-eco/15 font-display text-2xl text-forest ring-1 ring-black/5">
                      {s.n}
                    </div>
                    <h3 className="text-base font-semibold">{s.t}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-ink/70">{s.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="bg-white/50 py-14 md:py-20">
          <div className="containerX">
            <header className="reveal">
              <h2 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">What Customers Say</h2>
              <p className="mt-3 max-w-2xl text-ink/70">Real experiences from homes and businesses across Mumbai, Navi Mumbai &amp; Thane.</p>
            </header>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {[
                {
                  q: 'Very professional team. The cockroach issue in our kitchen was handled without smell or mess. We did not even need to leave the house.',
                  n: 'Priya M.',
                  l: 'Mumbai',
                },
                {
                  q: 'We booked termite treatment for our office. The inspection was clear, pricing was transparent, and the team completed the work on time.',
                  n: 'Rahul S.',
                  l: 'Thane',
                },
                { q: 'Good doorstep service and polite technicians. The mosquito problem reduced noticeably after the treatment.', n: 'Amit K.', l: 'Navi Mumbai' },
              ].map((t) => (
                <figure key={t.n} className="reveal cardX p-6">
                  <blockquote className="text-sm leading-relaxed text-ink/80">“{t.q}”</blockquote>
                  <figcaption className="mt-5 text-sm">
                    <span className="font-semibold text-forest">{t.n}</span> <span className="text-ink/60">• {t.l}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-14 md:py-20">
          <div className="containerX">
            <header className="reveal">
              <h2 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">FAQ</h2>
              <p className="mt-3 max-w-2xl text-ink/70">Quick answers to common questions about safety, disruption, pricing and coverage.</p>
            </header>

            <div className="reveal mt-10 space-y-3">
              {[
                {
                  q: 'Is the treatment safe for children and pets?',
                  a: 'Yes. Pestyfi Eco Solutions uses safe and eco-friendly treatments suitable for homes with children and pets when applied as recommended by trained technicians.',
                },
                { q: 'Do I need to vacate my home?', a: 'No. For most services, there is no need to vacate your home during treatment.' },
                {
                  q: 'Do I need to remove utensils or furniture?',
                  a: 'No. Our treatments are designed to reduce disruption, so you generally do not need to remove utensils or shift furniture.',
                },
                {
                  q: 'How much does pest control start from?',
                  a: 'Plans start from ₹1999, with detailed pricing depending on pest type, property size, and treatment requirement.',
                },
                {
                  q: 'Which areas do you serve?',
                  a: 'We serve Mumbai, Navi Mumbai, Thane, and nearby areas including Kalyan, Dombivli, Panvel, Mira Bhayandar, Bhiwandi, Ambernath, and Badlapur.',
                },
                {
                  q: 'Do you offer commercial pest control?',
                  a: 'Yes. We serve restaurants, hotels, offices, retail stores, hospitals, schools, warehouses, and industrial facilities.',
                },
                {
                  q: 'What pests do you treat?',
                  a: 'We treat cockroaches, termites, bed bugs, mosquitoes, rodents, ants, ticks, spiders, silverfish, lizards, and other common pests.',
                },
              ].map((x) => (
                <details key={x.q} className="cardX group overflow-hidden p-0">
                  <summary className="cursor-pointer list-none px-6 py-4 font-semibold text-forest">
                    <span className="flex items-center justify-between gap-3">
                      <span>{x.q}</span>
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-eco/15 text-forest ring-1 ring-black/5 transition group-open:rotate-45" aria-hidden="true">
                        +
                      </span>
                    </span>
                  </summary>
                  <div className="px-6 pb-5 text-sm leading-relaxed text-ink/75">{x.a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="bg-forest py-14 text-cream md:py-20">
          <div className="containerX grid gap-10 md:grid-cols-12">
            <div className="reveal md:col-span-5">
              <h2 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">Book a Free Inspection Today</h2>
              <p className="mt-3 text-cream/85">Protect your home or business with Mumbai’s trusted pest control experts.</p>

              <div className="mt-8 grid gap-4">
                {[
                  { i: '⚡', t: 'Fast Doorstep Service', d: 'Quick scheduling across Mumbai, Navi Mumbai & Thane.' },
                  { i: '🧪', t: 'Odourless & Eco-Friendly', d: 'Safe for kids, pets and sensitive indoor spaces.' },
                  { i: '✅', t: 'Guaranteed Results', d: '365 days assured service support.' },
                ].map((m) => (
                  <div key={m.t} className="rounded-xl bg-white/10 p-4 ring-1 ring-white/15">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-eco/20 ring-1 ring-white/15" aria-hidden="true">
                        {m.i}
                      </div>
                      <div className="font-semibold">{m.t}</div>
                    </div>
                    <div className="mt-2 text-sm text-cream/80">{m.d}</div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <a className="btnPrimary" href={CONTACT.telHref}>
                  Call {CONTACT.phoneE164}
                </a>
                <a className="btnX bg-white/10 text-cream ring-1 ring-white/20 hover:bg-white/15" href={CONTACT.waHref} rel="noreferrer">
                  WhatsApp
                </a>
              </div>
            </div>

            <div className="reveal md:col-span-7">
              <form id="leadForm" className="rounded-2xl bg-white/10 p-6 ring-1 ring-white/15 backdrop-blur" noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm">
                    <span className="font-semibold">Full Name</span>
                    <input
                      name="fullName"
                      required
                      autoComplete="name"
                      placeholder="Your full name"
                      className="h-11 rounded-xl bg-white/10 px-3 text-cream placeholder:text-cream/55 ring-1 ring-white/15 focus:outline-none focus:ring-2 focus:ring-amber"
                    />
                  </label>

                  <label className="grid gap-2 text-sm">
                    <span className="font-semibold">Phone Number</span>
                    <input
                      name="phone"
                      required
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="+91 XXXXX XXXXX"
                      pattern="^[0-9+\\s-]{8,}$"
                      className="h-11 rounded-xl bg-white/10 px-3 text-cream placeholder:text-cream/55 ring-1 ring-white/15 focus:outline-none focus:ring-2 focus:ring-amber"
                    />
                  </label>

                  <label className="grid gap-2 text-sm">
                    <span className="font-semibold">
                      Email Address <span className="text-cream/70">(optional)</span>
                    </span>
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="name@email.com"
                      className="h-11 rounded-xl bg-white/10 px-3 text-cream placeholder:text-cream/55 ring-1 ring-white/15 focus:outline-none focus:ring-2 focus:ring-amber"
                    />
                  </label>

                  <label className="grid gap-2 text-sm">
                    <span className="font-semibold">Location / Area</span>
                    <input
                      name="location"
                      required
                      autoComplete="address-level2"
                      placeholder="e.g., Andheri, Vashi, Thane West"
                      className="h-11 rounded-xl bg-white/10 px-3 text-cream placeholder:text-cream/55 ring-1 ring-white/15 focus:outline-none focus:ring-2 focus:ring-amber"
                    />
                  </label>

                  <label className="grid gap-2 text-sm">
                    <span className="font-semibold">Property Type</span>
                    <select
                      name="propertyType"
                      required
                      className="h-11 rounded-xl bg-white/10 px-3 text-cream ring-1 ring-white/15 focus:outline-none focus:ring-2 focus:ring-amber"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Select
                      </option>
                      {['Home', 'Office', 'Restaurant', 'Hotel', 'Warehouse', 'Industrial', 'Other'].map((o) => (
                        <option key={o} value={o} className="text-ink">
                          {o}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2 text-sm">
                    <span className="font-semibold">Service Required</span>
                    <select
                      name="serviceRequired"
                      required
                      className="h-11 rounded-xl bg-white/10 px-3 text-cream ring-1 ring-white/15 focus:outline-none focus:ring-2 focus:ring-amber"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Select
                      </option>
                      {[
                        'General Pest Control',
                        'Cockroach Control',
                        'Termite Treatment',
                        'Bed Bug Treatment',
                        'Mosquito Control',
                        'Rodent Control',
                        'Herbal Pest Control',
                        'Commercial Pest Control',
                        'Industrial Pest Control',
                      ].map((o) => (
                        <option key={o} value={o} className="text-ink">
                          {o}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2 text-sm">
                    <span className="font-semibold">Property Size</span>
                    <select
                      name="propertySize"
                      required
                      className="h-11 rounded-xl bg-white/10 px-3 text-cream ring-1 ring-white/15 focus:outline-none focus:ring-2 focus:ring-amber"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Select
                      </option>
                      {['1BHK', '2BHK', '3BHK', '4BHK+', 'Commercial Space', 'Industrial Space'].map((o) => (
                        <option key={o} value={o} className="text-ink">
                          {o}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2 text-sm">
                    <span className="font-semibold">Preferred Date</span>
                    <input
                      name="preferredDate"
                      type="date"
                      className="h-11 rounded-xl bg-white/10 px-3 text-cream ring-1 ring-white/15 focus:outline-none focus:ring-2 focus:ring-amber"
                    />
                  </label>

                  <label className="grid gap-2 text-sm sm:col-span-2">
                    <span className="font-semibold">Message</span>
                    <textarea
                      name="message"
                      rows={4}
                      placeholder="Tell us about the pest issue, urgency, and any notes."
                      className="rounded-xl bg-white/10 px-3 py-3 text-cream placeholder:text-cream/55 ring-1 ring-white/15 focus:outline-none focus:ring-2 focus:ring-amber"
                    />
                  </label>
                </div>

                <div className="mt-6">
                  <button type="submit" className="btnPrimary w-full py-3 text-base">
                    Get Free Inspection
                  </button>
                  <p className="mt-3 text-xs text-cream/70">
                    By submitting, you agree to be contacted for booking confirmation. We respect your privacy.
                  </p>
                  <div id="formSuccess" className="mt-4 rounded-xl bg-eco/20 px-4 py-3 text-sm ring-1 ring-white/15" hidden role="status" aria-live="polite">
                    <strong>Thank you!</strong> Our team will call you shortly to confirm your booking.
                  </div>
                </div>
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-forest text-cream">
        <div className="containerX grid gap-10 py-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="font-serif text-2xl font-semibold">Pestyfi Eco Solutions</div>
            <p className="mt-3 text-sm text-cream/80">
              Creating pest-free homes and businesses across Mumbai, Navi Mumbai, and Thane with safe, effective, and eco-friendly pest control solutions.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a className="btnPrimary" href="#contact">
                Book Now
              </a>
              <a className="btnX bg-white/10 text-cream ring-1 ring-white/20 hover:bg-white/15" href={CONTACT.waHref} rel="noreferrer">
                WhatsApp
              </a>
            </div>
          </div>

          {[
            { title: 'Services', items: ['Cockroach Control', 'Termite Treatment', 'Bed Bug Treatment', 'Mosquito Control', 'Rodent Control', 'Herbal Pest Control', 'General Pest Control'] },
            { title: 'Sectors', items: ['Residential', 'Commercial', 'Industrial', 'Hotels', 'Restaurants', 'Hospitals', 'Warehouses'] },
            { title: 'Areas', items: ['Mumbai', 'Navi Mumbai', 'Thane', 'Kalyan', 'Dombivli', 'Panvel', 'Bhiwandi'] },
          ].map((col) => (
            <div key={col.title} className="md:col-span-2">
              <div className="text-sm font-semibold text-cream/90">{col.title}</div>
              <ul className="mt-4 space-y-2 text-sm text-cream/80">
                {col.items.map((x) => (
                  <li key={x}>
                    <a href={col.title === 'Areas' ? '#areas' : col.title === 'Sectors' ? '#sectors' : '#services'} className="hover:text-cream">
                      {x}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10">
          <div className="containerX flex flex-col gap-2 py-4 text-xs text-cream/70 md:flex-row md:items-center md:justify-between">
            <span>© 2026 Pestyfi Eco Solutions. All rights reserved.</span>
            <span className="flex items-center gap-2">
              <a className="hover:text-cream" href="#faq">
                FAQ
              </a>
              <span aria-hidden="true">·</span>
              <a className="hover:text-cream" href="#contact">
                Contact
              </a>
            </span>
          </div>
        </div>
      </footer>

      {/* Floating CTAs */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
        <a
          href={CONTACT.waHref}
          rel="noreferrer"
          className="btnX rounded-full bg-eco px-4 py-3 text-forest shadow-premium hover:-translate-y-0.5"
          aria-label="WhatsApp / Book Now"
        >
          WhatsApp / Book Now
        </a>
        <a
          href={CONTACT.telHref}
          className="btnX rounded-full bg-forest px-4 py-3 text-cream shadow-premium ring-1 ring-black/10 hover:-translate-y-0.5"
          aria-label="Call now"
        >
          Call Now
        </a>
      </div>

      {/* Mobile sticky bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-cream/95 backdrop-blur md:hidden">
        <div className="containerX grid grid-cols-3 gap-2 py-2">
          <a className="btnX bg-forest text-cream" href={CONTACT.telHref}>
            Call Now
          </a>
          <a className="btnX bg-eco text-forest" href={CONTACT.waHref} rel="noreferrer">
            WhatsApp
          </a>
          <a className="btnX bg-amber text-forest" href="#pricing">
            Get Quote
          </a>
        </div>
      </div>
    </div>
  )
}

export default App
