// Service worker for the standalone "TOEFL Voca Trainer" app.
// Strategy: cache-first, refresh in the background, fall back to cache when offline.

const CACHE_NAME = 'toefl-voca-trainer-v1';

const CORE_ASSETS = [
  './',
  './voca_trainer.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) {
        return Promise.all(
          CORE_ASSETS.map(function (url) {
            return fetch(url).then(function (res) {
              if (res && res.ok) return cache.put(url, res);
            }).catch(function () { /* ignore, will be cached on first real visit */ });
          })
        );
      })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (names) {
        return Promise.all(
          names.filter(function (n) { return n !== CACHE_NAME; })
               .map(function (n) { return caches.delete(n); })
        );
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      var networkFetch = fetch(event.request)
        .then(function (response) {
          if (response && response.status === 200) {
            var copy = response.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(event.request, copy);
            });
          }
          return response;
        })
        .catch(function () {
          if (event.request.mode === 'navigate') {
            return caches.match('./voca_trainer.html');
          }
          return cached;
        });

      return cached || networkFetch;
    })
  );
});
