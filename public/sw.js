const CACHE_NAME = 'akb-v5'
const OFFLINE_URL = '/offline.html'

// Only precache the bare minimum
const PRECACHE = [
  '/offline.html',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET, chrome-extension, and cross-origin requests
  if (request.method !== 'GET') return
  if (request.url.startsWith('chrome-extension')) return
  if (url.origin !== self.location.origin) return

  // NEVER cache auth, API, or navigation routes — they must always hit the network
  if (url.pathname.startsWith('/auth/') ||
      url.pathname.startsWith('/api/') ||
      url.pathname.startsWith('/login') ||
      url.pathname.startsWith('/onboarding')) {
    return
  }

  // Don't cache HTML pages — let them always fetch fresh from the server
  // This ensures updates deploy immediately without stale cache issues
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL)
      )
    )
    return
  }

  // Cook view: cache-first for offline support (cook's spotty data)
  if (url.pathname.startsWith('/cook/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetched = fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
        return cached || fetched
      })
    )
    return
  }

  // Static assets only (images, icons, fonts, JS/CSS bundles): stale-while-revalidate
  const isStatic = /\.(js|css|woff2?|ttf|eot|png|jpg|jpeg|gif|svg|webp|ico)$/.test(url.pathname) ||
                   url.pathname.startsWith('/_next/static/')
  if (isStatic) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetched = fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
        return cached || fetched
      })
    )
    return
  }

  // Everything else: network only, no caching
})
