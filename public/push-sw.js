/* Manejo de Web Push. Se inyecta al service worker generado por Workbox
 * vía importScripts (ver vite.config.ts). */

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload = {}
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'CruzBet', body: event.data.text() }
  }

  const title = payload.title || 'CruzBet'
  const options = {
    body: payload.body || '',
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    tag: payload.tag || 'cruzbet',
    data: { url: payload.url || '/' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if ('focus' in client) {
            client.navigate(url)
            return client.focus()
          }
        }
        return clients.openWindow(url)
      }),
  )
})
