const CACHE_NAME = 'silsilah-v1';
const assets = [
  './',
  './index.html',
  './manifest.json',
  './config.js', // Pastikan config juga masuk cache agar offline tetap jalan
  './statistik.html'
];

// 1. Install: Simpan aset dasar
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Paksa SW baru aktif tanpa nunggu tab ditutup
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(assets);
    })
  );
});

// 2. Fetch: Logika cerdas (Cache vs Network)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // --- JALUR KHUSUS: Jangan simpan data API Google Sheets ke Cache ---
  if (url.hostname.includes('script.google.com') || url.hostname.includes('googleusercontent.com')) {
    return event.respondWith(fetch(event.request));
  }

  // --- JALUR KHUSUS: Tailwind & Font (CORS Friendly) ---
  if (url.hostname.includes('tailwindcss.com') || url.hostname.includes('gstatic.com')) {
    return event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        }).catch(() => null); // Jika offline dan belum ada di cache, biarkan kosong
      })
    );
  }

  // --- ASET STANDAR: Cache First, then Network ---
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});