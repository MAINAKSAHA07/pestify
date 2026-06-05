export function setupRevealAnimations() {
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
  const els = Array.from(document.querySelectorAll('.reveal'))
  if (els.length === 0) return

  if (reduceMotion) {
    for (const el of els) el.classList.add('is-in')
    return
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in')
          io.unobserve(entry.target)
        }
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
  )

  for (const el of els) io.observe(el)
}

export function setupMobileNavToggle() {
  const toggle = document.querySelector('.navToggle')
  const close = document.querySelector('.navClose')
  const drawer = document.getElementById('navDrawer')
  const overlay = document.getElementById('navOverlay')
  if (!toggle || !drawer || !overlay) return

  const openMenu = () => {
    toggle.setAttribute('aria-expanded', 'true')
    drawer.classList.remove('-translate-x-full')
    overlay.classList.remove('hidden')
    document.body.style.overflow = 'hidden'
  }

  const closeMenu = () => {
    toggle.setAttribute('aria-expanded', 'false')
    drawer.classList.add('-translate-x-full')
    overlay.classList.add('hidden')
    document.body.style.overflow = ''
  }

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true'
    if (expanded) closeMenu()
    else openMenu()
  })

  close?.addEventListener('click', closeMenu)
  overlay.addEventListener('click', closeMenu)

  drawer.addEventListener('click', (e) => {
    const a = e.target?.closest?.('a')
    if (a) closeMenu()
  })

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu()
  })
}

export function setupLeadForm() {
  const form = document.getElementById('leadForm')
  const success = document.getElementById('formSuccess')
  if (!form || !success) return

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    if (typeof form.reportValidity === 'function' && !form.reportValidity()) return
    form.reset()
    success.hidden = false
    window.setTimeout(() => {
      success.hidden = true
    }, 6000)
  })
}
