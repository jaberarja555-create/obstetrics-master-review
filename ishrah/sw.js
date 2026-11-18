/* اشرح لي service worker: the app's own files open from the device and are renewed in the background.
   Database calls, videos and the site's /api functions always go to the internet (never cached here). */
var C = 'ish-v26';
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return /^ish-v/.test(k) && k !== C && k !== 'ish-cdn'; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method === 'GET' && /^(cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com)$/.test(u.hostname)) {   // versioned libraries: saved copy first
    e.respondWith(caches.open('ish-cdn').then(function (c) { return c.match(r).then(function (m) { return m || fetch(r).then(function (res) { if (res && (res.ok || res.type === 'opaque')) c.put(r, res.clone()); return res; }); }); }));
    return;
  }
  if (r.method !== 'GET' || u.origin !== self.location.origin || /^\/api\//.test(u.pathname) || r.headers.has('range')) return;
  /* newest version first when online (owner saw one version behind); the saved copy only when there is no connection */
  e.respondWith(caches.open(C).then(function (c) {
    return fetch(r, { cache: 'no-cache' }).then(function (res) { if (res && res.ok) c.put(r, res.clone()); return res; })
      .catch(function () { return c.match(r, { ignoreSearch: r.mode === 'navigate' }); });
  }));
});
