/* HO Assistant offline copy: everything the app needs is small and saved at install; the network refreshes it when online. */
var C = 'ho-v7';
var FILES = ['./', 'index.html', 'css/ho.css', 'js/drugs.js', 'js/dx.js', 'js/engine.js', 'js/app.js', 'manifest.webmanifest', 'img/ho-192.png', 'img/ho-512.png', '../img/mr/logo-smra.webp', '../fonts/cairo-arabic-400-normal.woff2', '../fonts/cairo-arabic-600-normal.woff2', '../fonts/cairo-arabic-700-normal.woff2', '../fonts/poppins-latin-600-normal.woff2', '../fonts/poppins-latin-700-normal.woff2', '../fonts/poppins-latin-800-normal.woff2'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(C).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (k) { return Promise.all(k.filter(function (x) { return /^ho-v/.test(x) && x !== C; }).map(function (x) { return caches.delete(x); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  var u = new URL(e.request.url); if (!/^\/(ho|img\/mr|fonts)\//.test(u.pathname)) return;
  /* the network first (a new version shows at once), the saved copy when offline or after 3 s on a weak line */
  e.respondWith(caches.open(C).then(function (c) {
    var net = fetch(e.request, { cache: 'no-cache' }).then(function (r) { if (r.ok) c.put(e.request, r.clone()); return r; });
    var late = new Promise(function (res) { setTimeout(function () { c.match(e.request, { ignoreSearch: true }).then(function (h) { if (h) res(h); }); }, 3000); });
    return Promise.race([net, late]).catch(function () { return c.match(e.request, { ignoreSearch: true }).then(function (h) { return h || Response.error(); }); });
  }));
});
