/* The app shell stays available offline. Database, video and API requests stay on the network. */
var SHELL = 'ish-v268', CDN = 'ish-cdn', MEDIA = 'ish-media';
var STATIC = /^\/(?:img|fonts|pdfjs)\/|\.(?:webp|png|jpe?g|svg|woff2?)$/i;
var VERSIONED = /^\/(?:js|css)\//;
var HOSTED_LIBRARIES = /^(cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com)$/;

/* ishrahli.org moved to studentmasterreview.com (22 Nov 2026). A phone that installed the app on the old address opens its saved copy
   without asking the internet, so the address forward never runs. This file is the only one the old address still serves (the Cloudflare
   forward rule skips /sw.js): there it deletes every saved copy, removes itself and sends every open window to the same page on the new
   address. Its other handlers do nothing there. */
var MOVED = /(^|\.)ishrahli\.org$/.test(self.location.hostname);
if (MOVED) {
  self.addEventListener('install', function (event) { event.stopImmediatePropagation(); self.skipWaiting(); });
  self.addEventListener('activate', function (event) {
    event.stopImmediatePropagation();
    event.waitUntil((async function () {
      try { var ks = await caches.keys(); await Promise.all(ks.map(function (k) { return caches.delete(k); })); } catch (e) {}
      try { await self.clients.claim(); } catch (e) {}
      var cs = []; try { cs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true }); } catch (e) {}
      try { await self.registration.unregister(); } catch (e) {}
      cs.forEach(function (c) { try { var u = new URL(c.url); c.navigate('https://studentmasterreview.com' + u.pathname + u.search + u.hash); } catch (e) {} });
    })());
  });
  self.addEventListener('fetch', function (event) { event.stopImmediatePropagation(); });
}

async function saveShell(cache, response) {
  var html = await response.clone().text();
  var assets = html.match(/(?:js|css)\/[\w.-]+\.(?:js|css)\?v=\w+/g) || [];   /* also app.pv.css, mr.pv.css, pv.css */
  /* the two stylesheets are written by a script in the page head ('css/' + name + '.css?v=…'), so the pattern above does not see them; without
     them the app opened offline with no styles at all (found 22 Nov 2026). Save the default ones; a chosen colour falls back to them offline. */
  var cv = html.match(/\+'\.css\?v=(\w+)/);
  if (cv) assets.push('css/app.css?v=' + cv[1], 'css/mr.css?v=' + cv[1]);
  assets = Array.from(new Set(assets));
  var missing = await Promise.all(assets.map(async function (path) {
    var key = '/' + path;
    return await cache.match(key) ? null : key;
  }));
  await cache.addAll(missing.filter(Boolean));
  await cache.put('/', response);
  return html;
}

self.addEventListener('install', function (event) {
  event.waitUntil((async function () {
    var response = await fetch('/', { cache: 'no-cache' });
    if (!response.ok) throw new Error('Could not save the app shell');
    var shell = await caches.open(SHELL);
    /* keep what the phone already has (pictures, fonts, scripts that did not change): a new version downloads only what changed
       (owner, 21 Nov 2026: slow loading on weak networks after each update) */
    try {
      var keys = (await caches.keys()).filter(function (k) { return /^ish-v/.test(k) && k !== SHELL; });
      for (var i = 0; i < keys.length; i++) {
        var old = await caches.open(keys[i]), reqs = await old.keys();
        for (var j = 0; j < reqs.length; j++) {
          var u = new URL(reqs[j].url);
          if (u.pathname === '/' || u.pathname === '/index.html') continue;
          if (!(await shell.match(reqs[j]))) { var r = await old.match(reqs[j]); if (r) await shell.put(reqs[j], r); }
        }
      }
    } catch (e) {}
    var html = await saveShell(shell, response);
    var cdn = await caches.open(CDN);
    var libraries = html.match(/https:\/\/cdn\.jsdelivr\.net\/[^"']+\/supabase\.js/g) || [];
    await Promise.all(libraries.map(function (url) {
      return cdn.match(url).then(function (saved) { if (!saved) return cdn.add(url); }).catch(function () {});
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) { return (/^ish-v/.test(key) && key !== SHELL) || /^smr-v/.test(key); /* the old book platform's saved copy (22 Nov 2026) */ }).map(function (key) { return caches.delete(key); }));
  }).then(function () { return self.clients.claim(); }));
});

async function store(cache, key, response) {
  if (response.ok || response.type === 'opaque') await cache.put(key, response.clone()).catch(function () {});
  return response;
}

self.addEventListener('fetch', function (event) {
  var request = event.request, url = new URL(request.url);
  /* the books (/books/<id>/) have their own saved copies and service workers: the academy's worker leaves them alone (stage 2) */
  if (url.origin === self.location.origin && /^\/books\//.test(url.pathname)) return;
  /* recordings shared from Telegram or any app on Android ("Share → اشرح لي", owner 21 Nov 2026): kept on the phone, then the Studio opens */
  if (request.method === 'POST' && url.origin === self.location.origin && url.pathname === '/share-target') {
    event.respondWith((async function () {
      var n = 0;
      try {
        var form = await request.formData(), files = form.getAll('audio').filter(function (f) { return f && f.size; });
        var db = await new Promise(function (ok, no) { var r = indexedDB.open('ish-share', 1); r.onupgradeneeded = function () { r.result.createObjectStore('f', { keyPath: 'id', autoIncrement: true }); }; r.onsuccess = function () { ok(r.result); }; r.onerror = function () { no(r.error); }; });
        await new Promise(function (ok, no) { var t = db.transaction('f', 'readwrite'); files.forEach(function (f) { t.objectStore('f').add({ name: f.name || 'recording', type: f.type || '', size: f.size, blob: f, at: Date.now() }); n++; }); t.oncomplete = ok; t.onerror = function () { no(t.error); }; });
      } catch (e) {}
      return Response.redirect('/#studio-share' + (n ? '' : '/none'), 303);
    })());
    return;
  }
  if (request.method !== 'GET' || request.headers.has('range')) return;
  if (HOSTED_LIBRARIES.test(url.hostname)) {
    event.respondWith(caches.open(CDN).then(async function (cache) {
      return await cache.match(request) || store(cache, request, await fetch(request));
    }));
    return;
  }
  /* covers and pictures of library files served from R2 (/api/lib?f=<path>…): kept on the phone by their file path, shown at once */
  if (url.origin === self.location.origin && url.pathname === '/api/lib' && url.searchParams.has('f') && request.destination === 'image') {
    var rkey = self.location.origin + '/r2-library/' + url.searchParams.get('f');
    event.respondWith(caches.open(MEDIA).then(async function (cache) {
      var hit = await cache.match(rkey); if (hit) return hit;
      var response = await fetch(request);
      if (response.ok) cache.put(rkey, response.clone()).catch(function () {});
      return response;
    }));
    return;
  }
  /* pictures uploaded to the platform (covers, photos): kept on the phone by their file path (signed addresses change), shown at once */
  var relayed = url.origin === self.location.origin && /^\/sb\//.test(url.pathname);
  if (relayed && !(/^\/sb\/storage\/v1\/object\/(public|sign)\//.test(url.pathname) && request.destination === 'image')) return;   /* database requests through the relay: always the network */
  if ((relayed || /\.supabase\.co$/.test(url.hostname)) && /^(\/sb)?\/storage\/v1\/object\/(public|sign)\//.test(url.pathname) && request.destination === 'image') {
    var key = 'https://media.smra' + url.pathname.replace(/^\/sb/, '').replace('/object/sign/', '/object/public/');
    event.respondWith(caches.open(MEDIA).then(async function (cache) {
      var saved = await cache.match(key);
      if (saved) return saved;
      var response = await fetch(request);
      if (response.ok) cache.put(key, response.clone()).catch(function () {});
      return response;
    }));
    return;
  }
  if (url.origin !== self.location.origin || /^\/api\//.test(url.pathname)) return;
  /* the app's own pictures and fonts: from the phone at once, refreshed in the background (owner, 19 Nov 2026: "pictures appear slowly") */
  if (STATIC.test(url.pathname)) {
    event.respondWith(caches.open(SHELL).then(async function (cache) {
      var saved = await cache.match(request);
      if (saved && url.pathname.startsWith('/img/collection/') && /^\d+$/.test(url.searchParams.get('v') || '')) return saved;
      var fresh = fetch(request).then(function (response) { return store(cache, request, response); });
      if (saved) { event.waitUntil(fresh.catch(function () {})); return saved; }
      return fresh;
    }));
    return;
  }

  if (request.mode === 'navigate' && ['/', '/index.html'].includes(url.pathname)) {
    var cached = caches.open(SHELL);
    var fetched = fetch(request, { cache: 'no-cache' }).then(function (response) {
      if (!response.ok) throw new Error('The app could not be loaded');
      return { response: response, copy: response.clone() };
    });
    event.waitUntil(Promise.all([cached, fetched]).then(function (parts) {
      return saveShell(parts[0], parts[1].copy);
    }).catch(function () {}));
    var update = fetched.then(function (result) { return result.response; });
    event.respondWith(cached.then(async function (cache) {
      var saved = await cache.match('/');
      if (!saved) return update;
      var timer;
      try {
        /* the saved app opens at once; the newer copy is saved in the background for the next opening */
        return await Promise.race([update.catch(function () { return saved; }),
          new Promise(function (resolve) { timer = setTimeout(function () { resolve(saved); }, 250); })]);
      } finally { clearTimeout(timer); }
    }));
    return;
  }

  event.respondWith(caches.open(SHELL).then(async function (cache) {
    var saved = await cache.match(request);
    if (saved && VERSIONED.test(url.pathname) && /^\d+$/.test(url.searchParams.get('v') || '')) return saved;
    try {
      return await store(cache, request, await fetch(request));
    } catch (error) {
      if (saved) return saved;
      if (/^\/css\/pal-[\w-]+\.css$/.test(url.pathname) && url.searchParams.has('v')) {
        var fallback = await cache.match('/css/app.css' + url.search);
        if (fallback) return fallback;
      }
      if (/^\/css\/mr-pal-[\w-]+\.css$/.test(url.pathname) && url.searchParams.has('v')) {
        var fallback2 = await cache.match('/css/mr.css' + url.search);
        if (fallback2) return fallback2;
      }
      return Response.error();
    }
  }));
});

/* phone notifications (owner, 19 Nov 2026): the push carries no data; the phone asks /api/push for the text of its latest notification,
   shows it with sound and vibration, and a tap opens that page in the app */
self.addEventListener('push', function (event) {
  event.waitUntil((async function () {
    var d = { title: 'اشرح لي', body: '', link: '#notifications' };
    try {
      var sub = await self.registration.pushManager.getSubscription();
      if (sub) { var r = await fetch('/api/push?peek=' + encodeURIComponent(sub.endpoint), { cache: 'no-store' }); if (r.ok) d = Object.assign(d, await r.json()); }
    } catch (e) {}
    var open = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    open.forEach(function (c) { c.postMessage({ ishPush: d }); });
    await self.registration.showNotification(d.title, { body: d.body, icon: 'icon-192.png', badge: 'badge-96.png', lang: 'ar', dir: 'auto',
      data: { link: d.link }, tag: 'ish-' + Date.now(), renotify: true, vibrate: [180, 90, 180] });
  })());
});
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var link = (event.notification.data && event.notification.data.link) || '#notifications', url = new URL('./' + link, self.registration.scope).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) { var c = list[i]; if ('focus' in c) { c.postMessage({ ishGo: link }); return c.focus(); } }
    return self.clients.openWindow(url);
  }));
});
