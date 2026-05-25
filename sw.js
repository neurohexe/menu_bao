// ============================================
// SERVICE WORKER
// sw.js

const CACHE_NAME = 'menu-cache-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Установка — кэшируем статику
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Активация — чистим старый кэш
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k)   { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch — сначала сеть, при ошибке кэш
self.addEventListener('fetch', function(e) {
  // Запросы к Apps Script не кэшируем (живые данные)
  if (e.request.url.includes('script.google.com')) {
    e.respondWith(fetch(e.request));
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(function(response) {
        // Кэшируем свежий ответ
        const clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
        return response;
      })
      .catch(function() {
        // Сеть недоступна — берём из кэша
        return caches.match(e.request);
      })
  );
});
