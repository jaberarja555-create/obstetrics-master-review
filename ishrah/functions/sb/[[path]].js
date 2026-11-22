// The database through our own address (owner, 22 Nov 2026: a student's reactions and downloads failed with «internet issue» while the
// pages showed). The app reached the database at <project>.supabase.co, which is served over HTTP/3 (QUIC); some Sudanese networks break
// QUIC (the reason the app moved to studentmasterreview.com, where HTTP/3 is switched off). Every database, sign-in, storage and live
// request of the app now goes to https://<this site>/sb/… and this function passes it on unchanged (method, headers, body, websocket);
// the app falls back to the direct address if this ever fails (js/db.js `pfetch`). Uses the existing Pages secret SUPABASE_URL.
const DROP = ['host', 'cf-connecting-ip', 'cf-ipcountry', 'cf-ray', 'cf-visitor', 'x-forwarded-proto', 'x-real-ip', 'cdn-loop', 'cookie'];

export async function onRequest({ request, env, params }) {
  if (!env.SUPABASE_URL) return new Response('not set up', { status: 501 });
  const url = new URL(request.url);
  const path = [].concat(params.path || []).map(encodeURIComponent).join('/');
  const target = env.SUPABASE_URL.replace(/\/+$/, '') + '/' + path + url.search;
  // live updates (Realtime) are a websocket: handed over as it is
  if ((request.headers.get('upgrade') || '').toLowerCase() === 'websocket') return fetch(target, request);
  const headers = new Headers(request.headers);
  for (const h of DROP) headers.delete(h);
  const init = { method: request.method, headers, redirect: 'manual' };
  if (request.method !== 'GET' && request.method !== 'HEAD') init.body = request.body;
  let res;
  try { res = await fetch(target, init); }
  catch (e) { return new Response(JSON.stringify({ message: 'relay_failed' }), { status: 502, headers: { 'content-type': 'application/json', 'x-sb-relay': 'failed' } }); }
  const out = new Headers(res.headers);
  out.set('x-sb-relay', '1');
  out.delete('set-cookie');
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: out });
}
