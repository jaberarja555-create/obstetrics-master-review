/* the server key: new Supabase secret keys (sb_secret_…) go in the apikey header only; older service_role JWTs also as Bearer */
function svc(env) { const k = env.SUPABASE_SERVICE_KEY || ''; return /^sb_/.test(k) ? { apikey: k } : { apikey: k, authorization: 'Bearer ' + k }; }
/* اشرح لي: protected lesson videos on Bunny Stream (Cloudflare Pages Function, /api/video).
   POST {act:'create', lesson, title}: a lecturer (owner of the lesson's course) or the content team gets a one-time upload permission;
     the browser then uploads the file straight to Bunny (TUS), so large videos never pass through this server.
   GET ?lesson=<id>: a student who may watch the lesson (free preview, active enrolment, its lecturer, the review team) gets a signed
     player address valid for 3 hours; without it Bunny refuses to play (enable "Token authentication" on the library).
   GET ?lesson=<id>&dl=360|480|720: the same student, signed in, gets a signed address of the lesson's MP4 file (valid 1 hour) to save it
     INSIDE the platform for offline watching (owner, 18 Nov 2026). Needs "MP4 Fallback" on the Stream library, token authentication and CORS
     for .mp4 on its pull zone, and the secrets BUNNY_CDN_HOST (e.g. vz-xxxx.b-cdn.net) and BUNNY_CDN_KEY (the pull zone's token key).
   Secrets (Cloudflare → Pages → ishrah → Settings → Variables): SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY,
   BUNNY_LIBRARY, BUNNY_API_KEY, BUNNY_TOKEN_KEY, BUNNY_CDN_HOST, BUNNY_CDN_KEY. */
const J = (o, s) => new Response(JSON.stringify(o), { status: s || 200, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
async function sha256(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
async function b64sha(s) { const b = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))); return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
async function user(req, env) {
  const t = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, ''); if (!t) return null;
  const r = await fetch(env.SUPABASE_URL + '/auth/v1/user', { headers: { apikey: env.SUPABASE_ANON_KEY, authorization: 'Bearer ' + t } });
  return r.ok ? r.json() : null;
}
async function sb(env, path) {   // service-role read (server side only)
  const r = await fetch(env.SUPABASE_URL + '/rest/v1/' + path, { headers: svc(env) });
  if (!r.ok) throw new Error('db ' + r.status); return r.json();
}
async function canReview(env, uid) {
  const p = (await sb(env, 'profiles?select=team&id=eq.' + uid))[0]; const t = (p && p.team) || [];
  if (t.includes('owner') || t.includes('p:review')) return true;
  const rp = await sb(env, 'role_perms?select=role&perm=eq.review'); return rp.some(r => t.includes(r.role));
}
export async function onRequestPost({ request, env }) {
  const u = await user(request, env); if (!u) return J({ error: 'sign in' }, 401);
  const b = await request.json().catch(() => ({})); if (b.act !== 'create' || !/^[0-9a-f-]{36}$/.test(b.lesson || '')) return J({ error: 'bad request' }, 400);
  const l = (await sb(env, 'lessons?select=id,course_id,courses(lecturer_id)&id=eq.' + b.lesson))[0]; if (!l) return J({ error: 'no lesson' }, 404);
  if (l.courses.lecturer_id !== u.id && !(await canReview(env, u.id))) return J({ error: 'not allowed' }, 403);
  const r = await fetch(`https://video.bunnycdn.com/library/${env.BUNNY_LIBRARY}/videos`, { method: 'POST', headers: { AccessKey: env.BUNNY_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ title: String(b.title || 'lesson').slice(0, 200) }) });
  if (!r.ok) return J({ error: 'video server ' + r.status }, 502);
  const v = await r.json(), expire = Math.floor(Date.now() / 1000) + 6 * 3600;
  return J({ videoId: v.guid, libraryId: env.BUNNY_LIBRARY, expire, signature: await sha256(env.BUNNY_LIBRARY + env.BUNNY_API_KEY + expire + v.guid) });
}
export async function onRequestGet({ request, env }) {
  const q = new URL(request.url).searchParams, id = q.get('lesson') || '', dl = q.get('dl'); if (!/^[0-9a-f-]{36}$/.test(id)) return J({ error: 'bad request' }, 400);
  const l = (await sb(env, 'lessons?select=id,video_id,free,course_id,courses(lecturer_id,status)&id=eq.' + id))[0]; if (!l || !l.video_id) return J({ error: 'no video' }, 404);
  let ok = l.free && l.courses.status === 'published' && !dl;   // a download always needs a signed-in student
  if (!ok) {
    const u = await user(request, env); if (!u) return J({ error: 'sign in' }, 401);
    ok = l.courses.lecturer_id === u.id || (await sb(env, `enrollments?select=id&course_id=eq.${l.course_id}&user_id=eq.${u.id}&status=eq.active`)).length > 0 || await canReview(env, u.id);
  }
  if (!ok && dl && l.free && l.courses.status === 'published' && await user(request, env)) ok = true;
  if (!ok) return J({ error: 'not enrolled' }, 403);
  if (dl) {
    if (!env.BUNNY_CDN_HOST || !env.BUNNY_CDN_KEY) return J({ error: 'downloads are not set up' }, 501);
    const res = { '360': '360p', '480': '480p', '720': '720p' }[dl] || '480p', path = `/${l.video_id}/play_${res}.mp4`, e2 = Math.floor(Date.now() / 1000) + 3600;
    return J({ kind: 'mp4', src: `https://${env.BUNNY_CDN_HOST}${path}?token=${await b64sha(env.BUNNY_CDN_KEY + path + e2)}&expires=${e2}` });
  }
  const exp = Math.floor(Date.now() / 1000) + 3 * 3600, token = await sha256(env.BUNNY_TOKEN_KEY + l.video_id + exp);
  return J({ kind: 'iframe', src: `https://iframe.mediadelivery.net/embed/${env.BUNNY_LIBRARY}/${l.video_id}?token=${token}&expires=${exp}&autoplay=false&preload=true&responsive=true` });
}
