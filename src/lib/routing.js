/** Homepage sections — each maps to a clean path (no hash) for analytics + SEO */
export const SITE_SECTIONS = [
  { id: 'top', label: 'Home' },
  { id: 'trusted', label: 'Trusted By' },
  { id: 'maintenance', label: 'Home Maintenance' },
  { id: 'why-us', label: 'Why Pestyfi' },
  { id: 'services', label: 'Services' },
  { id: 'early-signs', label: 'Early Signs' },
  { id: 'convenience', label: 'Convenience' },
  { id: 'health-risks', label: 'Health Risks' },
  { id: 'about', label: 'About' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'sustainability', label: 'Sustainability' },
  { id: 'faq', label: 'FAQ' },
  { id: 'protection-kit', label: 'Protection Kit' },
  { id: 'book', label: 'Book' },
]

/** Booking funnel steps — each maps to /book/{slug} */
export const BOOK_ROUTES = {
  service: { step: 1, label: 'Select Service' },
  contact: { step: 2, label: 'Contact Details' },
  checkout: { step: 3, label: 'Checkout' },
  payment: { step: 3, label: 'Payment' },
  'payment-processing': { step: 3, label: 'Payment Processing' },
  success: { step: 'success', label: 'Booking Confirmed' },
  'inspection-requested': { step: 'success', label: 'Inspection Requested' },
}

/** SEO-friendly service landing paths → internal service id */
export const SERVICE_SEO_ROUTES = {
  'general-pest-control': {
    id: 'general',
    title: 'General Pest Control in Mumbai',
    description:
      'Book general pest control in Mumbai for cockroaches, ants, spiders & silverfish. Odourless treatment, safe for kids & pets.',
  },
  'herbal-pest-control': {
    id: 'herbal',
    title: 'Herbal Pest Control in Mumbai',
    description:
      'Eco-friendly herbal pest control in Mumbai. Natural formulations, odourless, kid & pet conscious treatments.',
  },
  'cockroach-pest-control': {
    id: 'cockroach',
    title: 'Cockroach Pest Control in Mumbai',
    description:
      'Advanced cockroach control in Mumbai — gel baiting, colony treatment, 365-day support. No vacating required. Book online.',
  },
  'termite-pest-control': {
    id: 'termite',
    title: 'Termite Pest Control in Mumbai',
    description:
      'Anti-termite treatment for homes, offices & warehouses in Mumbai, Navi Mumbai & Thane. Book inspection online.',
  },
  'bed-bug-pest-control': {
    id: 'bedbug',
    title: 'Bed Bug Pest Control in Mumbai',
    description:
      'Complete bed bug elimination in Mumbai — adults and eggs. Odourless treatment for healthier sleep. Book online.',
  },
  'mosquito-pest-control': {
    id: 'mosquito',
    title: 'Mosquito Pest Control in Mumbai',
    description:
      'Indoor & outdoor mosquito pest control in Mumbai MMR. Protect your family — book Pestyfi online.',
  },
  'rodent-pest-control': {
    id: 'rodent',
    title: 'Rodent Pest Control in Mumbai',
    description:
      'Rodent inspection, trapping & exclusion for Mumbai homes and businesses. Book Pestyfi online.',
  },
  'ant-control': {
    id: 'ant',
    title: 'Ant Control in Mumbai',
    description:
      'Colony-focused ant control in Mumbai. Odourless, eco-friendly treatment. Book online with Pestyfi.',
  },
  'tick-pest-control': {
    id: 'tick',
    title: 'Tick Pest Control in Mumbai',
    description:
      'Tick pest control for homes with pets and gardens in Mumbai. Safe, odourless treatment. Book online.',
  },
}

const BOOK_SLUGS = Object.keys(BOOK_ROUTES)
const SERVICE_SEO_SLUGS = Object.keys(SERVICE_SEO_ROUTES)
const SECTION_IDS = new Set(SITE_SECTIONS.map((s) => s.id))
const RESERVED_ROOTS = new Set([
  'book',
  'privacy',
  'deletion',
  'deletion-status',
  'backend',
  'api',
  'oauth-callback.html',
])

/** Pause scroll→URL sync after programmatic section navigation */
let sectionTrackingUnlockAt = 0

export function lockSectionTracking(ms = 900) {
  sectionTrackingUnlockAt = Date.now() + ms
}

export function isSectionTrackingLocked() {
  return Date.now() < sectionTrackingUnlockAt
}

export function isBookPath(pathname = window.location.pathname) {
  return pathname === '/book' || pathname.startsWith('/book/')
}

/** True only for SEO service landings: /services/{slug} */
export function isServicePath(pathname = window.location.pathname) {
  return Boolean(getServiceSeoSlug(pathname))
}

export function getServiceSeoSlug(pathname = window.location.pathname) {
  if (!pathname.startsWith('/services/')) return null
  const slug = pathname.replace(/^\/services\//, '').split('/')[0]
  return slug && SERVICE_SEO_SLUGS.includes(slug) ? slug : null
}

export function getServiceSeoMeta(pathname = window.location.pathname) {
  const slug = getServiceSeoSlug(pathname)
  return slug ? SERVICE_SEO_ROUTES[slug] : null
}

export function getBookSlug(pathname = window.location.pathname) {
  if (!isBookPath(pathname)) return null
  const slug = pathname.replace(/^\/book\/?/, '').split('/')[0]
  return slug && BOOK_SLUGS.includes(slug) ? slug : 'service'
}

export function bookStepFromSlug(slug) {
  return BOOK_ROUTES[slug]?.step ?? 1
}

export function slugFromBookStep(step, { needsInspection = false, isSuccess = false, paymentPhase = null } = {}) {
  if (isSuccess) {
    return needsInspection ? 'inspection-requested' : 'success'
  }
  if (paymentPhase === 'processing') return 'payment-processing'
  if (paymentPhase === 'ready') return 'payment'
  if (step === 1) return 'service'
  if (step === 2) return 'contact'
  return 'checkout'
}

export function buildBookUrl(slug = 'service') {
  return `/book/${slug}`
}

/** Clean path for a homepage section. `top` and `book` stay on `/` (book funnel owns /book/*). */
export function buildSectionUrl(sectionId) {
  if (!sectionId || sectionId === 'top' || sectionId === 'book') return '/'
  return `/${sectionId}`
}

export function getSectionIdFromPath(pathname = window.location.pathname) {
  if (pathname === '/' || pathname === '') return 'top'
  if (isBookPath(pathname) || getServiceSeoSlug(pathname)) return null

  const id = pathname.replace(/^\//, '').split('/')[0]
  if (!id || RESERVED_ROOTS.has(id)) return null
  // `/services` alone = homepage services band (not a service SEO landing)
  if (id === 'services' && pathname.replace(/\/+$/, '') === '/services') return 'services'
  if (SECTION_IDS.has(id) && id !== 'book') return id
  return null
}

export function isHomeSectionPath(pathname = window.location.pathname) {
  if (pathname === '/' || pathname === '') return true
  return Boolean(getSectionIdFromPath(pathname))
}

/** One-time: convert legacy /#section URLs to /section (or /). */
export function migrateHashToPath() {
  if (typeof window === 'undefined') return false
  const raw = window.location.hash?.replace(/^#/, '') || ''
  if (!raw || raw === 'main') return false

  const sectionId = SECTION_IDS.has(raw) ? raw : null
  const next = sectionId ? buildSectionUrl(sectionId) : `${window.location.pathname}${window.location.search}`
  lockSectionTracking()
  window.history.replaceState(sectionId ? { section: sectionId } : {}, '', next)
  return true
}

export function parseLocation(loc = window.location) {
  const { pathname, hash } = loc
  const bookSlug = isBookPath(pathname) ? getBookSlug(pathname) : null
  const serviceSeo = getServiceSeoMeta(pathname)
  const hashSection = hash?.replace(/^#/, '') || null
  const pathSection = getSectionIdFromPath(pathname)
  const section = bookSlug || serviceSeo ? 'book' : pathSection || (SECTION_IDS.has(hashSection) ? hashSection : null)

  return {
    pathname,
    hash,
    section,
    bookSlug,
    bookStep: bookSlug ? bookStepFromSlug(bookSlug) : null,
    serviceSeoSlug: serviceSeo ? getServiceSeoSlug(pathname) : null,
    serviceId: serviceSeo?.id || null,
    trackingPath: bookSlug
      ? buildBookUrl(bookSlug)
      : serviceSeo
        ? `/services/${getServiceSeoSlug(pathname)}`
        : buildSectionUrl(section || 'top'),
  }
}

export function navigateTo(url, { replace = false, scroll = true } = {}) {
  if (replace) {
    window.history.replaceState({ url }, '', url)
  } else {
    window.history.pushState({ url }, '', url)
  }

  trackRouteView(url)

  window.dispatchEvent(new PopStateEvent('popstate'))

  if (!scroll) return

  if (url.startsWith('/book') || url.startsWith('/services/')) {
    lockSectionTracking()
    const el = document.getElementById('book')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    return
  }

  if (url === '/') {
    lockSectionTracking()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }

  const sectionId = getSectionIdFromPath(url)
  if (sectionId && sectionId !== 'top') {
    lockSectionTracking()
    const el = document.getElementById(sectionId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
}

export function trackRouteView(path) {
  if (typeof window === 'undefined') return

  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', { page_path: path, page_location: `${window.location.origin}${path}` })
  }

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({
      event: 'virtual_page_view',
      page_path: path,
      page_location: `${window.location.origin}${path}`,
    })
  }
}

export function openBookFlow(slug = 'service') {
  const url = buildBookUrl(slug)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024
  navigateTo(url, { replace: isMobile && window.location.pathname.startsWith('/book') })
  return url
}
