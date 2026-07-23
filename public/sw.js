// public/sw.js — offline-first service worker for rural access.
// App shell is precached; navigation falls back to cached shell offline.
// Check-in writes are handled by the IndexedDB queue (src/lib/offlineQueue.js).

const CACHE = 'gfa-vrcc-v3-purple';
const SHELL = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;

  // Never intercept Supabase API/realtime traffic
  if (request.url.includes('supabase.co')) return;

  // Navigations: network-first, shell fallback
  if (request.mode === 'navigate') {
    e.respondWith(fetch(request).catch(() => caches.match('/index.html')));
    return;
  }

  // Static assets: stale-while-revalidate
  e.respondWith(
    caches.match(request).then((cached) => {
      const fresh = fetch(request).then((res) => {
        if (res.ok) caches.open(CACHE).then((c) => c.put(request, res.clone()));
        return res;
      }).catch(() => cached);
      return cached || fresh;
    })
  );
});
