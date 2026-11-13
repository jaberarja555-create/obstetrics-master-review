/* Student Master Review service worker: makes the platform installable and FAST.
   Speed (owner, 12 Nov 2026: "the app is very slow"): every screen and file of the platform opens at once from the copy saved on the
   device; the same file is then asked from the internet in the background and the saved copy is renewed. When a page, style or script
   has changed, the open app is told ({smr:'new'}) and shows the new version (at once if it was only just opened, otherwise next opening).
   With nothing saved yet (first opening) or offline with no copy, the internet / the saved home page is used. The books are not cached here. */
var C = 'smr-v2';
self.addEventListener('install', function (e) { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return /^smr-v/.test(k) && k !== C; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
function core(u) { return /\.(html|css|js)$/.test(u.pathname) || /\/$/.test(u.pathname); }
function tell() { return self.clients.matchAll({ type: 'window' }).then(function (cs) { cs.forEach(function (c) { try { c.postMessage({ smr: 'new' }); } catch (e) {} }); }); }
self.addEventListener('fetch', function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== self.location.origin || r.headers.has('range')) return;
  if (/^\/admin(\/|$)/.test(u.pathname)) return;   // the admin (owner, 13 Nov 2026) is its own page, always from the internet
  var nav = r.mode === 'navigate', key = nav ? './' : r;   // every address of the platform is the same page
  e.respondWith(caches.open(C).then(function (c) {
    return c.match(key, { ignoreSearch: nav }).then(function (old) {
      var was = old && core(u) ? old.clone() : null;   // copied now: the saved answer itself goes to the page
      var net = fetch(r, nav || core(u) ? { cache: 'no-cache' } : undefined).then(function (res) {
        if (!res || !res.ok) return res;
        var cp = res.clone(), cmp = was ? res.clone() : null;
        var saved = c.put(key, cp), put = saved;
        if (cmp) put = Promise.all([was.text(), cmp.text()]).then(function (t) { return saved.then(function () { if (t[0] !== t[1]) return tell(); }); }).catch(function () {});
        e.waitUntil(put.catch(function () {}));
        return res;
      });
      if (old) { e.waitUntil(net.then(function () {}, function () {})); return old; }
      return net.catch(function () { return c.match('./').then(function (m) { return m || Response.error(); }); });
    });
  }));
});
