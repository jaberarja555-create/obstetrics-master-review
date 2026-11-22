/* Library files (books, slides, covers) served from Cloudflare R2 (owner, 22 Nov 2026: «move everything to Cloudflare R2 … the goal is to
   reduce cost, the student feels everything is fast and does not lose a lot of internet»). R2 delivery is free, so a book opened again or by many
   students costs the platform nothing (Supabase charges for every download).
   - The files stay listed where they are (`files.path`, Supabase bucket `library`); this function only changes where the bytes come from.
   - Moving is gradual and needs no job: the first time a file is asked for, it is copied from Supabase into R2 (key `library/<path>`), then
     always served from R2. Every later reader, and every later reading, is free.
   - The permission is exactly the old one: the reader's own sign-in asks Supabase to sign the path. Supabase answers only when its storage
     rule (`ish_read`: published and free, the uploader, library staff, an approved purchase…) allows it. Signing costs no download.
   POST {paths:[…]}  (Authorization: the reader's token, or none for visitors) → {urls:{path: '/api/lib?f=…&e=…&s=…'}} valid 6 hours, only for
                     the paths the reader may open.
   GET  ?f=&e=&s=    the file, with range requests (the PDF reader asks only for the pages it shows: a quick look downloads little).
   Needs the R2 binding MEDIA (already used by api/audio.js) and the existing secrets SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY. */
const J = (o, s) => new Response(JSON.stringify(o), { status: s || 200, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const SAFE = /^[\w\-./]{3,300}$/;
function svc(env) { const k = env.SUPABASE_SERVICE_KEY || ''; return /^sb_/.test(k) ? { apikey: k } : { apikey: k, authorization: 'Bearer ' + k }; }
async function hmac(env, msg) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode('library:' + (env.MEDIA_SIGN_KEY || env.SUPABASE_SERVICE_KEY)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const s = new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(msg)));
  return btoa(String.fromCharCode(...s)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
const enc = (p) => p.split('/').map(encodeURIComponent).join('/');

export async function onRequestPost({ request, env }) {
  if (!env.MEDIA) return J({ error: 'storage not set up' }, 501);
  let body; try { body = await request.json(); } catch (e) { return J({ error: 'bad request' }, 400); }
  const paths = [...new Set((body.paths || []).filter(p => typeof p === 'string' && SAFE.test(p) && !p.includes('..')))].slice(0, 200);
  if (!paths.length) return J({ urls: {} });
  /* the reader's permission, checked by Supabase's own storage rule */
  const tok = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const r = await fetch(env.SUPABASE_URL + '/storage/v1/object/sign/library', {
    method: 'POST', headers: { 'content-type': 'application/json', apikey: env.SUPABASE_ANON_KEY, authorization: 'Bearer ' + (tok || env.SUPABASE_ANON_KEY) },
    body: JSON.stringify({ expiresIn: 60, paths }) });
  if (!r.ok) return J({ error: 'not allowed' }, r.status === 401 ? 401 : 403);
  const list = await r.json(), exp = Math.floor(Date.now() / 1000) + 6 * 3600, urls = {};
  for (const x of (Array.isArray(list) ? list : [])) {
    if (!x || x.error || !(x.signedURL || x.signedUrl) || !x.path) continue;
    urls[x.path] = '/api/lib?f=' + encodeURIComponent(x.path) + '&e=' + exp + '&s=' + await hmac(env, x.path + '|' + exp);
  }
  return J({ urls });
}

export async function onRequestGet({ request, env }) {
  if (!env.MEDIA) return new Response('storage not set up', { status: 501 });
  const q = new URL(request.url).searchParams, path = q.get('f') || '', exp = +q.get('e') || 0;
  if (!SAFE.test(path) || path.includes('..') || exp < Date.now() / 1000 || q.get('s') !== await hmac(env, path + '|' + exp)) return new Response('expired', { status: 403 });
  const key = 'library/' + path;
  /* first time: copy the file from Supabase into R2 (one Supabase download for the whole life of the file) */
  if (!(await env.MEDIA.head(key))) {
    const src = await fetch(env.SUPABASE_URL + '/storage/v1/object/library/' + enc(path), { headers: svc(env) });
    if (!src.ok) return new Response('not found', { status: 404 });
    const len = +(src.headers.get('content-length') || 0), type = src.headers.get('content-type') || 'application/octet-stream';
    if (len > 0) {
      const { readable, writable } = new FixedLengthStream(len);
      src.body.pipeTo(writable);
      await env.MEDIA.put(key, readable, { httpMetadata: { contentType: type } });
    } else {
      await env.MEDIA.put(key, await src.arrayBuffer(), { httpMetadata: { contentType: type } });
    }
  }
  const range = request.headers.get('range');
  const obj = await env.MEDIA.get(key, range ? { range: request.headers } : {});
  if (!obj) return new Response('not found', { status: 404 });
  const h = new Headers(); obj.writeHttpMetadata(h); h.set('etag', obj.httpEtag); h.set('accept-ranges', 'bytes');
  h.set('cache-control', 'private, max-age=21600'); h.set('content-disposition', 'inline'); h.set('x-content-type-options', 'nosniff');
  if (range && obj.range) {
    const off = obj.range.offset || 0, len = obj.range.length != null ? obj.range.length : obj.size - off;
    h.set('content-range', `bytes ${off}-${off + len - 1}/${obj.size}`); h.set('content-length', String(len));
    return new Response(obj.body, { status: 206, headers: h });
  }
  h.set('content-length', String(obj.size));
  return new Response(obj.body, { headers: h });
}
