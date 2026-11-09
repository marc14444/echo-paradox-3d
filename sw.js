// ECHO-PARADOX 3D — Service Worker PWA
const CACHE_NAME = 'echo-paradox-v2.1';
const CORE_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/game.js',
  './manifest.json',
  './favicon.ico',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

// Third-party CDN scripts to pre-cache if online
const CDN_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://cdn.tailwindcss.com'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Always cache local assets
      await cache.addAll(CORE_ASSETS);
      // Attempt CDN assets caching (tolerant to offline during install)
      try {
        await Promise.allSettled(
          CDN_ASSETS.map((url) =>
            fetch(url, { mode: 'cors' })
              .then((res) => {
                if (res.ok) return cache.put(url, res);
              })
              .catch(() => {})
          )
        );
      } catch (e) {
        // Ignored in offline dev
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle GET requests
  if (req.method !== 'GET') return;

  // HTML Navigation: Network first, fallback to cache (offline)
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, clone));
          }
          return networkRes;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          return caches.match('./index.html') || caches.match('./');
        })
    );
    return;
  }

  // Assets (scripts, styles, icons, fonts, CDN)
  event.respondWith(
    caches.match(req).then((cachedRes) => {
      if (cachedRes) {
        // Return cached immediately, fetch update in background (Stale-While-Revalidate)
        fetch(req)
          .then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              caches.open(CACHE_NAME).then((c) => c.put(req, networkRes));
            }
          })
          .catch(() => {});
        return cachedRes;
      }

      // If not in cache, fetch from network and cache
      return fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, clone));
          }
          return networkRes;
        })
        .catch(() => {
          // Offline fallback
          if (req.destination === 'image') {
            return caches.match('./icons/icon-192.png');
          }
        });
    })
  );
});

