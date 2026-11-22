// The three books inside SMRA at the same address (ishrah/PLAN-one-platform.md, stage 2; owner, 22 Nov 2026):
// https://studentmasterreview.com/books/<id>/… is served from that book's own deployment, so for the phone the book and the academy are one
// app (one storage, the books' saved copies and the academy's offline data together). The books keep deploying as before.
// Pictures, fonts and scripts are cached at Cloudflare's edge for an hour; the book page itself always comes fresh.
const HOSTS = {
  surgery: 'https://srg.studentmasterreview.com',
  pediatrics: 'https://ped.studentmasterreview.com',
  obstetrics: 'https://obs.studentmasterreview.com',
};
const PASS = ['accept', 'accept-language', 'content-type', 'range', 'if-none-match', 'if-modified-since', 'authorization'];

export async function onRequest({ request, params }) {
  const parts = [].concat(params.path || []);
  const id = parts[0], host = HOSTS[id];
  const url = new URL(request.url);
  if (!host) return new Response('Not found', { status: 404 });
  if (parts.length === 1 && !url.pathname.endsWith('/')) return Response.redirect(url.origin + '/books/' + id + '/' + url.search + url.hash, 301);
  const target = host + '/' + parts.slice(1).map(encodeURIComponent).join('/') + url.search;
  const headers = new Headers();
  for (const h of PASS) { const v = request.headers.get(h); if (v) headers.set(h, v); }
  const isGet = request.method === 'GET' || request.method === 'HEAD';
  const asset = isGet && /\.(?:jpe?g|png|webp|gif|svg|woff2?|css|js|json|bin|mp3|mp4)$/i.test(url.pathname) && !/\/sw\.js$/.test(url.pathname);
  const init = { method: request.method, headers, redirect: 'manual' };
  if (!isGet) init.body = await request.arrayBuffer();
  if (asset) init.cf = { cacheEverything: true, cacheTtl: 3600 };
  let res;
  try { res = await fetch(target, init); } catch (e) { return new Response('The book could not be reached. Try again.', { status: 502 }); }
  const out = new Headers(res.headers);
  out.delete('set-cookie');
  // a redirect from the book's own host is turned into the same path under /books/<id>/
  const loc = out.get('location');
  if (loc && loc.startsWith(host)) out.set('location', url.origin + '/books/' + id + loc.slice(host.length));
  if (!asset) out.set('cache-control', 'no-cache');
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: out });
}
