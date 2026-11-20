/* The app shell stays available offline. Database, video and API requests stay on the network. */
var SHELL = 'ish-v115', CDN = 'ish-cdn', MEDIA = 'ish-media';
var STATIC = /^\/(?:img|fonts|pdfjs)\/|\.(?:webp|png|jpe?g|svg|woff2?)$/i;
var VERSIONED = /^\/(?:js|css)\//;
var HOSTED_LIBRARIES = /^(cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com)$/;

async function saveShell(cache, response) {
  var html = await response.clone().text();
  var assets = Array.from(new Set(html.match(/(?:js|css)\/[\w-]+\.(?:js|css)\?v=\d+/g) || []));
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
    var html = await saveShell(await caches.open(SHELL), response);
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
    return Promise.all(keys.filter(function (key) { return /^ish-v/.test(key) && key !== SHELL; }).map(function (key) { return caches.delete(key); }));
  }).then(function () { return self.clients.claim(); }));
});

async function store(cache, key, response) {
  if (response.ok || response.type === 'opaque') await cache.put(key, response.clone()).catch(function () {});
  return response;
}

self.addEventListener('fetch', function (event) {
  var request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || request.headers.has('range')) return;
  if (HOSTED_LIBRARIES.test(url.hostname)) {
    event.respondWith(caches.open(CDN).then(async function (cache) {
      return await cache.match(request) || store(cache, request, await fetch(request));
    }));
    return;
  }
  /* pictures uploaded to the platform (covers, photos): kept on the phone by their file path (signed addresses change), shown at once */
  if (/\.supabase\.co$/.test(url.hostname) && /^\/storage\/v1\/object\/(public|sign)\//.test(url.pathname) && request.destination === 'image') {
    var key = url.origin + url.pathname.replace('/object/sign/', '/object/public/');
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
