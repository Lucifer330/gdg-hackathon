/**
 * sw.js - Service Worker for Generic Dawa
 * Enables full offline-first PWA functionality in airplane mode.
 */

const CACHE_NAME = 'generic-dawa-v1';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './css/print.css',
  './js/config.js',
  './js/i18n.js',
  './js/data.js',
  './js/search.js',
  './js/cart.js',
  './js/vision.js',
  './js/app.js',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
  './data/drugs.sample.csv'
];

// Optional assets that may or may not exist at install time
const OPTIONAL_ASSETS = [
  './data/drugs.csv'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // 1. Cache mandatory core assets
      await cache.addAll(PRECACHE_ASSETS);

      // 2. Cache optional assets gracefully
      for (const optUrl of OPTIONAL_ASSETS) {
        try {
          const res = await fetch(optUrl);
          if (res.ok) {
            await cache.put(optUrl, res);
          }
        } catch (_) {
          // Ignored if optional file not created yet
        }
      }
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version immediately (offline first)
        // Background fetch to keep cache fresh if online
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          })
          .catch(() => {
            // Offline - ignore background refresh failure
          });

        return cachedResponse;
      }

      // Not in cache: fetch from network and store for offline use
      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Fallback for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return new Response('Network offline and resource not cached.', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      });
    })
  );
});
