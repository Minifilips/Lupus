// Cache offline: l'app funziona anche senza connessione.
// Aggiorna VERSION a ogni rilascio per forzare il download dei file nuovi.
const VERSION = 'lupus-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/app.js',
  './js/audio.js',
  './js/roles.js',
  './js/rules.js',
  './js/storage.js',
  './js/ui.js',
  './js/voice.js',
  './js/screens/day.js',
  './js/screens/night.js',
  './js/screens/reveal.js',
  './js/screens/roles-info.js',
  './js/screens/settings.js',
  './js/screens/setup.js',
  './js/screens/soundbar.js',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Risponde subito dalla cache e intanto aggiorna in background (stale-while-revalidate).
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  const network = fetch(e.request).then((res) => {
    if (res.ok) {
      const copy = res.clone();
      caches.open(VERSION).then((c) => c.put(e.request, copy));
    }
    return res;
  });
  e.waitUntil(network.catch(() => {}));
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true })
      .then((cached) => cached || network)
      .catch(() => caches.match('./index.html')),
  );
});
