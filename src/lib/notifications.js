/**
 * Unified notification helper that supports standard desktop browser alerts 
 * and iOS standalone PWA push alerts via the registered service worker.
 * Races the service worker ready status with a 600ms timeout to ensure robust alerts.
 */
export function triggerNativeNotification(title, body) {
  if (typeof window === 'undefined') return

  if ('Notification' in window && Notification.permission === 'granted') {
    const directFallback = () => {
      try {
        new Notification(title, { 
          body: body, 
          icon: '/apple-touch-icon.png' 
        })
      } catch (e) {
        console.error('Direct notification constructor failed:', e)
      }
    }

    if ('serviceWorker' in navigator) {
      // Create a timeout promise to reject after 600ms
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('SW ready timeout')), 600)
      )

      Promise.race([navigator.serviceWorker.ready, timeoutPromise])
        .then((registration) => {
          return registration.showNotification(title, {
            body: body,
            icon: '/apple-touch-icon.png',
            badge: '/favicon.svg',
            vibrate: [100, 50, 100],
          })
        })
        .catch((err) => {
          console.warn('Service Worker notification failed or timed out, falling back:', err.message)
          directFallback()
        })
    } else {
      directFallback()
    }
  }
}
