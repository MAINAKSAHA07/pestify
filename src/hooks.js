import { pb } from './lib/pocketbase'

/**
 * Reveal-on-scroll for `.reveal` nodes.
 * Returns a cleanup that disconnects the observer (safe to re-run after SPA remounts).
 */
export function setupRevealAnimations() {
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
  const els = Array.from(document.querySelectorAll('.reveal:not(.is-in)'))
  if (els.length === 0) return () => {}

  if (reduceMotion) {
    for (const el of els) el.classList.add('is-in')
    return () => {}
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
  return () => io.disconnect()
}

/**
 * Mobile drawer toggle. Idempotent via AbortController cleanup.
 */
export function setupMobileNavToggle() {
  const toggle = document.querySelector('.navToggle')
  const close = document.querySelector('.navClose')
  const drawer = document.getElementById('navDrawer')
  const overlay = document.getElementById('navOverlay')
  if (!toggle || !drawer || !overlay) return () => {}

  const ac = new AbortController()
  const { signal } = ac

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

  toggle.addEventListener(
    'click',
    () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true'
      if (expanded) closeMenu()
      else openMenu()
    },
    { signal },
  )

  close?.addEventListener('click', closeMenu, { signal })
  overlay.addEventListener('click', closeMenu, { signal })

  drawer.addEventListener(
    'click',
    (e) => {
      const a = e.target?.closest?.('a')
      if (a) closeMenu()
    },
    { signal },
  )

  window.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape') closeMenu()
    },
    { signal },
  )

  return () => {
    ac.abort()
    document.body.style.overflow = ''
  }
}

export function setupLeadForm() {
  const form = document.getElementById('leadForm')
  const success = document.getElementById('formSuccess')
  if (!form || !success) return () => {}

  const ac = new AbortController()

  form.addEventListener(
    'submit',
    async (e) => {
      e.preventDefault()
      if (typeof form.reportValidity === 'function' && !form.reportValidity()) return

      const submitBtn = form.querySelector('button[type="submit"]')
      const originalText = submitBtn ? submitBtn.textContent : 'Get Free Inspection'

      if (submitBtn) {
        submitBtn.disabled = true
        submitBtn.textContent = 'Submitting...'
      }

      const formData = new FormData(form)
      const data = {
        fullName: formData.get('fullName'),
        phone: formData.get('phone'),
        location: formData.get('location'),
      }

      try {
        await pb.collection('leads').create(data)

        form.reset()
        success.hidden = false
        window.setTimeout(() => {
          success.hidden = true
        }, 6000)
      } catch (err) {
        console.error('Failed to submit lead request:', err)
        alert('Unable to submit the request. Please try again or contact us directly.')
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false
          submitBtn.textContent = originalText
        }
      }
    },
    { signal: ac.signal },
  )

  return () => ac.abort()
}
