// Service Worker for Pestyfi PWA Notifications Support
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Listen to push events if you use Web Push protocol
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (e) {
    data = { message: event.data ? event.data.text() : '' }
  }

  const title = data.title || 'Pestyfi Notification'
  const options = {
    body: data.message || '',
    icon: '/apple-touch-icon.png',
    badge: '/favicon.svg',
    data: data.url || '/'
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

// Handle notification click to focus/open the PWA app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0]
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i]
            break
          }
        }
        return client.focus()
      }
      return self.clients.openWindow('/')
    })
  )
})
