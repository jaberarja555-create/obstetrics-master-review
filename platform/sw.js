/* Student Master Review service worker: makes the platform installable and opens its own screens without a
   connection (network first, the saved copy only when offline). The books inside are not cached here. */
var C = 'smr-v1';
self.addEventListener('install', function (e) { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== C; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== self.location.origin) return;
  e.respondWith(fetch(r).then(function (res) {
    if (res && res.ok) { var cp = res.clone(); caches.open(C).then(function (c) { c.put(r, cp); }); }
    return res;
  }).catch(function () {
    return caches.match(r, { ignoreSearch: true }).then(function (m) { return m || caches.match('./', { ignoreSearch: true }); });
  }));
});
