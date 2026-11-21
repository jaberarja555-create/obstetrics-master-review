/* اشرح لي: audio lectures kept in Cloudflare R2 (owner, 21 Nov 2026: "let us move to R2 and make the audio lecture feature").
   R2 has free delivery, so students may listen as often as they like at no cost to the platform.
   Needs the R2 bucket binding MEDIA on the Pages project (Settings → Bindings → R2 bucket, variable name MEDIA) and the
   existing secrets SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY.
   PUT  ?lesson=<id>   body = the audio file (≤ 95 MB): the lesson's lecturer or the review team; saved as lessons/<lesson>/<random>.<ext>,
                       the lesson becomes kind 'audio' with video_id 'au:<key>' (hidden from students who may not listen, like videos);
                       the previous file of that lesson is deleted.
   DELETE ?lesson=<id> the same people remove the lesson's audio.
   GET  ?lesson=<id>   someone who may listen (free preview of a published course, active enrolment, its lecturer, the review team) gets a
                       signed address valid 6 hours: ?f=<key>&e=<expiry>&s=<signature>.
   GET  ?f=…&e=…&s=…   streams the file (range requests, so the player can jump); no sign-in needed, the signature is the permission. */
function svc(env) { const k = env.SUPABASE_SERVICE_KEY || ''; return /^sb_/.test(k) ? { apikey: k } : { apikey: k, authorization: 'Bearer ' + k }; }
const J = (o, s) => new Response(JSON.stringify(o), { status: s || 200, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const ID = /^[0-9a-f-]{36}$/;
const TYPES = { 'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/aac': 'aac', 'audio/ogg': 'ogg', 'audio/opus': 'opus', 'audio/webm': 'webm', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/wave': 'wav' };
const MAX = 95 * 1024 * 1024;

async function user(req, env) {
  const t = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, ''); if (!t) return null;
  const r = await fetch(env.SUPABASE_URL + '/auth/v1/user', { headers: { apikey: env.SUPABASE_ANON_KEY, authorization: 'Bearer ' + t } });
  return r.ok ? r.json() : null;
}
async function sb(env, path, init) {
  const r = await fetch(env.SUPABASE_URL + '/rest/v1/' + path, Object.assign({}, init, { headers: Object.assign({ 'content-type': 'application/json' }, svc(env), (init || {}).headers) }));
  if (!r.ok) throw new Error('db ' + r.status); return r.status === 204 ? null : r.json();
}
async function canReview(env, uid) {
  const p = (await sb(env, 'profiles?select=team&id=eq.' + uid))[0]; const t = (p && p.team) || [];
  if (t.includes('owner') || t.includes('p:review')) return true;
  const rp = await sb(env, 'role_perms?select=role&perm=eq.review'); return rp.some(r => t.includes(r.role));
}
async function lesson(env, id) { return (await sb(env, 'lessons?select=id,kind,video_id,free,course_id,courses(lecturer_id,status)&id=eq.' + id))[0]; }
async function hmac(env, msg) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode('audio:' + (env.MEDIA_SIGN_KEY || env.SUPABASE_SERVICE_KEY)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const s = new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(msg)));
  return btoa(String.fromCharCode(...s)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function keyOf(l) { return l && /^au:lessons\//.test(l.video_id || '') ? l.video_id.slice(3) : ''; }
async function mayEdit(req, env, l) { const u = await user(req, env); return !!u && (l.courses.lecturer_id === u.id || await canReview(env, u.id)); }

export async function onRequestPut({ request, env }) {
  if (!env.MEDIA) return J({ error: 'storage not set up' }, 501);
  const id = new URL(request.url).searchParams.get('lesson') || ''; if (!ID.test(id)) return J({ error: 'bad request' }, 400);
  const l = await lesson(env, id); if (!l) return J({ error: 'no lesson' }, 404);
  if (!(await mayEdit(request, env, l))) return J({ error: 'not allowed' }, 403);
  const type = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase(), ext = TYPES[type];
  if (!ext) return J({ error: 'not audio' }, 415);
  const size = +request.headers.get('content-length') || 0; if (!size) return J({ error: 'length required' }, 411); if (size > MAX) return J({ error: 'too big' }, 413);
  const key = 'lessons/' + id + '/' + crypto.randomUUID() + '.' + ext;
  await env.MEDIA.put(key, request.body, { httpMetadata: { contentType: type === 'audio/mp3' ? 'audio/mpeg' : type, cacheControl: 'private, max-age=86400' } });
  const old = keyOf(l);
  await sb(env, 'lessons?id=eq.' + id, { method: 'PATCH', headers: { prefer: 'return=minimal' }, body: JSON.stringify({ kind: 'audio', video_id: 'au:' + key }) });
  if (old && old !== key) await env.MEDIA.delete(old).catch(() => {});
  return J({ key: key, ref: 'au:' + key });
}

export async function onRequestDelete({ request, env }) {
  if (!env.MEDIA) return J({ error: 'storage not set up' }, 501);
  const id = new URL(request.url).searchParams.get('lesson') || ''; if (!ID.test(id)) return J({ error: 'bad request' }, 400);
  const l = await lesson(env, id); if (!l) return J({ ok: true });
  if (!(await mayEdit(request, env, l))) return J({ error: 'not allowed' }, 403);
  const old = keyOf(l); if (old) await env.MEDIA.delete(old).catch(() => {});
  await sb(env, 'lessons?id=eq.' + id, { method: 'PATCH', headers: { prefer: 'return=minimal' }, body: JSON.stringify({ video_id: '' }) });
  return J({ ok: true });
}

export async function onRequestGet({ request, env }) {
  if (!env.MEDIA) return J({ error: 'storage not set up' }, 501);
  const q = new URL(request.url).searchParams;
  if (q.has('f')) {   // the file itself, by signed address
    const key = q.get('f') || '', exp = +q.get('e') || 0;
    if (!/^lessons\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.[a-z0-9]{2,5}$/.test(key) || exp < Date.now() / 1000 || q.get('s') !== await hmac(env, key + '|' + exp)) return new Response('expired', { status: 403 });
    const range = request.headers.get('range');
    const obj = await env.MEDIA.get(key, range ? { range: request.headers } : {});
    if (!obj) return new Response('not found', { status: 404 });
    const h = new Headers(); obj.writeHttpMetadata(h); h.set('etag', obj.httpEtag); h.set('accept-ranges', 'bytes'); h.set('cache-control', 'private, max-age=21600');
    h.set('content-disposition', 'inline'); h.set('x-content-type-options', 'nosniff');
    if (range && obj.range) {
      const off = obj.range.offset || 0, len = obj.range.length != null ? obj.range.length : obj.size - off;
      h.set('content-range', `bytes ${off}-${off + len - 1}/${obj.size}`); h.set('content-length', String(len));
      return new Response(obj.body, { status: 206, headers: h });
    }
    h.set('content-length', String(obj.size));
    return new Response(obj.body, { headers: h });
  }
  const id = q.get('lesson') || ''; if (!ID.test(id)) return J({ error: 'bad request' }, 400);
  const l = await lesson(env, id), key = keyOf(l); if (!key) return J({ error: 'no audio' }, 404);
  let ok = l.free && l.courses.status === 'published';
  if (!ok) {
    const u = await user(request, env); if (!u) return J({ error: 'sign in' }, 401);
    ok = l.courses.lecturer_id === u.id || (await sb(env, `enrollments?select=id&course_id=eq.${l.course_id}&user_id=eq.${u.id}&status=eq.active`)).length > 0 || await canReview(env, u.id);
  }
  if (!ok) return J({ error: 'not enrolled' }, 403);
  const exp = Math.floor(Date.now() / 1000) + 6 * 3600;
  return J({ kind: 'audio', src: '/api/audio?f=' + encodeURIComponent(key) + '&e=' + exp + '&s=' + await hmac(env, key + '|' + exp) });
}
