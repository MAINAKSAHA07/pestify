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
    { threshold: 0.14, rootMargin: '0px 0px -10% 0px' },
  )

  for (const el of els) io.observe(el)
}

export function setupMobileNavToggle() {
  const btn = document.querySelector('.navToggle')
  const menu = document.getElementById('navMenu')
  if (!btn || !menu) return

  const close = () => {
    btn.setAttribute('aria-expanded', 'false')
    menu.classList.add('hidden')
  }

  const open = () => {
    btn.setAttribute('aria-expanded', 'true')
    menu.classList.remove('hidden')
    menu.classList.add('flex')
  }

  close()

  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true'
    if (expanded) close()
    else open()
  })

  menu.addEventListener('click', (e) => {
    const a = e.target?.closest?.('a')
    if (a) close()
  })

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close()
  })
}

export function setupLeadForm() {
  const form = document.getElementById('leadForm')
  const success = document.getElementById('formSuccess')
  if (!form || !success) return

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    if (typeof form.reportValidity === 'function') {
      const ok = form.reportValidity()
      if (!ok) return
    }
    form.reset()
    success.hidden = false
    window.setTimeout(() => {
      success.hidden = true
    }, 6000)
  })
}

