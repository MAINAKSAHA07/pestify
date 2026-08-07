import { useEffect } from 'react'
import {
  buildSectionUrl,
  isHomeSectionPath,
  navigateTo,
} from '../lib/routing'

/**
 * Homepage section deep-links use clean paths (/why-us, /faq).
 * We intentionally do NOT rewrite the URL while scrolling — that caused
 * /#services → /protection-kit races and thin duplicate paths for SEO.
 */
export function useSectionTracking(_enabled = true) {
  // No-op: scroll position is not reflected in the URL.
  useEffect(() => {}, [])
}

export function handleSiteLinkClick(e, href) {
  if (!href) return false

  if (href.startsWith('/book')) {
    e.preventDefault()
    navigateTo(href)
    return true
  }

  // Legacy hash links (#services) → clean paths (/services)
  if (href.startsWith('#')) {
    e.preventDefault()
    const id = href.slice(1)
    if (id === 'main') return false
    const next = buildSectionUrl(id)
    const onSubpage = !isHomeSectionPath(window.location.pathname)
    if (onSubpage) {
      window.history.pushState({}, '', next)
      window.dispatchEvent(new PopStateEvent('popstate'))
      setTimeout(() => {
        if (id && id !== 'top' && id !== 'book') {
          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } else if (id === 'book') {
          document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }, 80)
    } else {
      navigateTo(next)
      if (id === 'book') {
        requestAnimationFrame(() => {
          document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
      }
    }
    return true
  }

  // Clean section paths (/why-us, /faq, /services)
  if (href.startsWith('/') && isHomeSectionPath(href)) {
    e.preventDefault()
    navigateTo(href)
    return true
  }

  return false
}
