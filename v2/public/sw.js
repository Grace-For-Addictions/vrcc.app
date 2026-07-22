/* VRCC v2 service worker — offline-first app shell.
 *
 * Strategy:
 *  - Precache the app shell on install.
 *  - Network-first for navigations (so deploys roll out), falling back to the
 *    cached shell when offline.
 *  - Stale-while-revalidate for build assets (hashed filenames make this safe).
 *  - Never intercept Supabase API calls — the in-app IndexedDB sync queue owns
 *    offline writes so they stay idempotent and ordered.
 */
const CACHE = 'vrcc-v2-shell-v1'
const SHELL = ['/', '/manifest.webmanifest', '/icon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET') return
  if (url.origin !== self.location.origin) return // Supabase & friends: pass through

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put('/', copy))
          return res
        })
        .catch(() => caches.match('/'))
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fresh = fetch(event.request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(event.request, copy))
          }
          return res
        })
        .catch(() => cached)
      return cached || fresh
    })
  )
})
