/* اشرح لي: phone notifications (Web Push) — Cloudflare Pages Function, /api/push (owner, 19 Nov 2026: "admins should get a sound
   notification for every user request, better on the phone, so they respond on time").
   GET  ?key=1        → the public VAPID key (made once and kept in the database table push_cfg, readable only with the server key)
   GET  ?peek=<endp>  → the text of the latest notification for that phone (the push itself carries no data; the phone asks here)
   POST {id, secret}  → called by the database (trigger on notices, pg_net) for every new notification; sends a push to each phone of the
                        people it is for (database function ish_push_targets checks the shared secret) and forgets phones that left. */
function svc(env) { const k = env.SUPABASE_SERVICE_KEY || ''; return /^sb_/.test(k) ? { apikey: k } : { apikey: k, authorization: 'Bearer ' + k }; }
const J = (o, s) => new Response(JSON.stringify(o), { status: s || 200, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64uText = (s) => b64u(new TextEncoder().encode(s));

async function cfg(env) {
  const H = svc(env);
  const rows = await fetch(`${env.SUPABASE_URL}/rest/v1/push_cfg?select=k,v`, { headers: H }).then(r => r.ok ? r.json() : []);
  const o = {}; rows.forEach(x => { o[x.k] = x.v; }); return o;
}
async function vapid(env) {
  let c = await cfg(env);
  if (!c.vapid_pub || !c.vapid_priv) {
    const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const pub = b64u(await crypto.subtle.exportKey('raw', pair.publicKey));
    const priv = JSON.stringify(await crypto.subtle.exportKey('jwk', pair.privateKey));
    await fetch(`${env.SUPABASE_URL}/rest/v1/push_cfg`, { method: 'POST', headers: Object.assign(svc(env), { 'content-type': 'application/json', prefer: 'resolution=ignore-duplicates' }),
      body: JSON.stringify([{ k: 'vapid_pub', v: pub }, { k: 'vapid_priv', v: priv }]) });
    c = await cfg(env);   // another request may have made the pair first: always use what the database keeps
  }
  return c;
}
async function jwtFor(endpoint, c) {
  const aud = new URL(endpoint).origin;
  const key = await crypto.subtle.importKey('jwk', JSON.parse(c.vapid_priv), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const head = b64uText(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const body = b64uText(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: 'mailto:support@ishrahli.org' }));
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(head + '.' + body));
  return head + '.' + body + '.' + b64u(sig);
}

export async function onRequestGet({ request, env }) {
  const u = new URL(request.url);
  if (u.searchParams.get('key')) { const c = await vapid(env); return c.vapid_pub ? J({ key: c.vapid_pub }) : J({ error: 'no key' }, 503); }
  const ep = u.searchParams.get('peek');
  if (ep && /^https:\/\//.test(ep)) {
    const rows = await fetch(`${env.SUPABASE_URL}/rest/v1/push_subs?select=last_title,last_body,last_link&endpoint=eq.${encodeURIComponent(ep)}&limit=1`, { headers: svc(env) })
      .then(r => r.ok ? r.json() : []);
    const r = rows[0] || {};
    return J({ title: r.last_title || 'اشرح لي', body: r.last_body || '', link: r.last_link || '#notifications' });
  }
  return J({ error: 'bad request' }, 400);
}

export async function onRequestPost({ request, env, waitUntil }) {
  const b = await request.json().catch(() => ({}));
  if (!/^[0-9a-f-]{36}$/.test(b.id || '') || !b.secret) return J({ error: 'bad request' }, 400);
  const H = Object.assign(svc(env), { 'content-type': 'application/json' });
  const r = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/ish_push_targets`, { method: 'POST', headers: H, body: JSON.stringify({ p_notice: b.id, p_secret: b.secret }) });
  if (!r.ok) return J({ error: 'targets ' + r.status }, r.status === 401 || r.status === 403 ? 403 : 502);
  const targets = (await r.json()).map(x => x.endpoint).filter(Boolean).slice(0, 2000);
  if (!targets.length) return J({ sent: 0 });
  const c = await vapid(env), jwts = {}, gone = [];
  let sent = 0;
  const one = async (endpoint) => {
    try {
      const aud = new URL(endpoint).origin;
      jwts[aud] = jwts[aud] || await jwtFor(endpoint, c);
      const res = await fetch(endpoint, { method: 'POST', headers: { TTL: '86400', Urgency: 'high', Authorization: `vapid t=${jwts[aud]}, k=${c.vapid_pub}` } });
      if (res.status === 404 || res.status === 410) gone.push(endpoint); else if (res.ok) sent++;
    } catch (e) {}
  };
  for (let i = 0; i < targets.length; i += 50) await Promise.all(targets.slice(i, i + 50).map(one));
  if (gone.length) await fetch(`${env.SUPABASE_URL}/rest/v1/push_subs?endpoint=in.(${gone.map(e => '"' + e.replace(/"/g, '') + '"').join(',')})`, { method: 'DELETE', headers: H });
  return J({ sent, gone: gone.length });
}
