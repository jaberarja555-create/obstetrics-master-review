// Obstetrics Master Review · free trial (owner, 6 Nov 2026).
// POST /trial {dev} → {ok, start, key}: the key that opens the whole book for the trial hour (the app keeps it apart in
// orr-tk and drops it when the hour ends). The key is the Pages secret OBS_KEY, set by the deploy workflow from the
// GitHub secret of the same name; it is never in the repository.
export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const dev = String(body.dev || '');
  const h = { 'content-type': 'application/json', 'cache-control': 'no-store' };
  if (!/^[0-9a-f]{20}$/.test(dev)) return new Response(JSON.stringify({ ok: false, reason: 'dev' }), { status: 400, headers: h });
  if (!env.OBS_KEY) return new Response(JSON.stringify({ ok: false, reason: 'setup' }), { status: 503, headers: h });
  return new Response(JSON.stringify({ ok: true, start: Date.now(), key: env.OBS_KEY }), { headers: h });
}
export async function onRequest() { return new Response('Method not allowed', { status: 405 }) }
