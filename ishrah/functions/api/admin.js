/* the server key: new Supabase secret keys (sb_secret_…) go in the apikey header only; older service_role JWTs also as Bearer */
function svc(env) { const k = env.SUPABASE_SERVICE_KEY || ''; return /^sb_/.test(k) ? { apikey: k } : { apikey: k, authorization: 'Bearer ' + k }; }
/* اشرح لي: account actions that need the database's service key (Cloudflare Pages Function, /api/admin).
   POST {act:'password', uid, pass}: student support (or the owner / general manager) sets a new password for a phone account
   that forgot it; the action is written to the activity log. The service key never leaves the server. */
const J = (o, s) => new Response(JSON.stringify(o), { status: s || 200, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
export async function onRequestPost({ request, env }) {
  const t = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const me = t && await fetch(env.SUPABASE_URL + '/auth/v1/user', { headers: { apikey: env.SUPABASE_ANON_KEY, authorization: 'Bearer ' + t } }).then(r => r.ok ? r.json() : null);
  if (!me) return J({ error: 'sign in' }, 401);
  const H = Object.assign(svc(env), { 'content-type': 'application/json' });
  const p = (await fetch(`${env.SUPABASE_URL}/rest/v1/profiles?select=name,team&id=eq.${me.id}`, { headers: H }).then(r => r.json()))[0] || {}, team = p.team || [];
  const rp = await fetch(`${env.SUPABASE_URL}/rest/v1/role_perms?select=role&perm=eq.students`, { headers: H }).then(r => r.json());
  if (!(team.includes('owner') || team.includes('p:students') || rp.some(x => team.includes(x.role)))) return J({ error: 'not allowed' }, 403);
  const b = await request.json().catch(() => ({}));
  if (b.act !== 'password' || !/^[0-9a-f-]{36}$/.test(b.uid || '') || String(b.pass || '').length < 6) return J({ error: 'bad request' }, 400);
  const r = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users/${b.uid}`, { method: 'PUT', headers: H, body: JSON.stringify({ password: String(b.pass) }) });
  if (!r.ok) return J({ error: 'auth ' + r.status }, 502);
  await fetch(`${env.SUPABASE_URL}/rest/v1/audit`, { method: 'POST', headers: H, body: JSON.stringify({ user_id: me.id, name: p.name || '', action: 'set password', target: b.uid }) });
  return J({ ok: true });
}
