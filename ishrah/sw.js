/* The app shell stays available offline. Database, video and API requests stay on the network. */
var SHELL = 'ish-v44', CDN = 'ish-cdn';
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
  if (url.origin !== self.location.origin || /^\/api\//.test(url.pathname)) return;

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
        return await Promise.race([update.catch(function () { return saved; }),
          new Promise(function (resolve) { timer = setTimeout(function () { resolve(saved); }, 1500); })]);
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
