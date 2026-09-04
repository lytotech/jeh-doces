const CACHE = 'jeh-doces-shell-v2';
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(['/','/manifest.webmanifest','/confeiti-app-icon.png','/confeiti-app-icon-192.png']))); self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // Never proxy third-party assets (e.g. Cloudflare Insights) through this worker.
  if (url.origin !== self.location.origin || event.request.method !== 'GET' || url.pathname.startsWith('/api/')) return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
