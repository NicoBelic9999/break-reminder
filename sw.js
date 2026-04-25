const CACHE = 'break-reminder-v1';
const ASSETS = [
  './',
  './break-reminder.html',
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Cache-first with network fallback (works offline)
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(resp => {
      // Update cache for known assets only
      if (ASSETS.some(a => e.request.url.endsWith(a.replace('./', '')))) {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return resp;
    }).catch(() => cached))
  );
});

// Click on notification: focus or open the app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const c of clients) {
        if (c.url.includes('break-reminder.html') && 'focus' in c) return c.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('./break-reminder.html');
    })
  );
});
