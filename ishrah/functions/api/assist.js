/* اشرح لي: the in-app guide assistant (owner, 21 Nov 2026: «personal guide like AI inside the app»; chose an app guide only, on Claude Haiku 5.5).
   POST { messages: [{role:'user'|'assistant', content:'…'}…], page: '#courses', lang: 'ar'|'en' } with the signed-in account's token.
   A signed-in account gets ASSIST_LIMIT messages a day (team members ASSIST_TEAM_LIMIT); counts and tokens are kept in Supabase
   (055_assistant.sql). Secrets (Cloudflare → Pages → ishrah → Settings → Variables): ANTHROPIC_API_KEY, plus the existing SUPABASE_URL,
   SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY. Optional: ASSIST_LIMIT (default 15), ASSIST_TEAM_LIMIT (default 60), ANTHROPIC_BASE_URL (tests). */
import Anthropic from '@anthropic-ai/sdk';
import { GUIDE } from './_guide.js';

const MODEL = 'claude-haiku-5-5';   // the owner's choice: cheapest current model, enough for an app guide
const J = (o, s) => new Response(JSON.stringify(o), { status: s || 200, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
function svc(env) { const k = env.SUPABASE_SERVICE_KEY || ''; return /^sb_/.test(k) ? { apikey: k } : { apikey: k, authorization: 'Bearer ' + k }; }
async function user(req, env) {
  const t = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, ''); if (!t) return null;
  const r = await fetch(env.SUPABASE_URL + '/auth/v1/user', { headers: { apikey: env.SUPABASE_ANON_KEY, authorization: 'Bearer ' + t } });
  return r.ok ? r.json() : null;
}
async function rpc(env, fn, args) {
  const r = await fetch(env.SUPABASE_URL + '/rest/v1/rpc/' + fn, { method: 'POST', headers: Object.assign({ 'content-type': 'application/json' }, svc(env)), body: JSON.stringify(args) });
  if (!r.ok) throw new Error('db ' + r.status); const t = await r.text(); return t ? JSON.parse(t) : null;
}
async function profile(env, uid) {
  const r = await fetch(env.SUPABASE_URL + '/rest/v1/profiles?select=name,team&id=eq.' + uid, { headers: svc(env) });
  return r.ok ? (await r.json())[0] || {} : {};
}

/* Everything the assistant knows about the app: written by tools/ishrah/guide.py from tools/ishrah/assistant_guide.md (the hand-written
   description) and the app's own menus and pages, at every release and in the deploy workflow, so new places reach the guide by themselves. */
export async function onRequestPost({ request, env }) {
  if (!env.ANTHROPIC_API_KEY) return J({ error: 'not set up' }, 501);
  const u = await user(request, env); if (!u) return J({ error: 'sign in' }, 401);
  const b = await request.json().catch(() => ({}));
  /* the conversation from the app: at most the last 12 turns, each cut to 1,500 characters, alternating and starting with the user */
  let msgs = (Array.isArray(b.messages) ? b.messages : []).filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-12).map(m => ({ role: m.role, content: m.content.trim().slice(0, 1500) }));
  while (msgs.length && msgs[0].role !== 'user') msgs.shift();
  if (!msgs.length || msgs[msgs.length - 1].role !== 'user') return J({ error: 'bad request' }, 400);
  const p = await profile(env, u.id), team = (p.team || []).length > 0;
  const limit = team ? +(env.ASSIST_TEAM_LIMIT || 60) : +(env.ASSIST_LIMIT || 15);
  const n = await rpc(env, 'ish_assist_take', { p_user: u.id, p_limit: limit }).catch(() => null);
  if (n === null) return J({ error: 'busy' }, 503);
  if (n < 0) return J({ error: 'limit', limit: limit }, 429);
  /* where the person is and which language the app shows: added to the last question, after the cached guide */
  const page = String(b.page || '').replace(/[^#\w/-]/g, '').slice(0, 60), lang = b.lang === 'en' ? 'English' : 'Arabic';
  msgs[msgs.length - 1] = { role: 'user', content: '[current page: ' + (page || '#home') + ' · app language: ' + lang + ']\n' + msgs[msgs.length - 1].content };
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, baseURL: env.ANTHROPIC_BASE_URL || undefined, maxRetries: 1, timeout: 25000 });
  let res;
  try {
    res = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,                       // thinking counts toward this on Haiku 5.5; the answers themselves are short
      output_config: { effort: 'low' },       // a short guide answer needs little thinking: fewer tokens, lower cost
      system: [{ type: 'text', text: GUIDE, cache_control: { type: 'ephemeral' } }],
      messages: msgs,
    });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return J({ error: 'busy' }, 503);
    if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) return J({ error: 'not set up' }, 501);
    if (e instanceof Anthropic.APIError) return J({ error: 'ai ' + (e.status || '') }, 502);
    return J({ error: 'net' }, 502);
  }
  const usage = res.usage || {};
  await rpc(env, 'ish_assist_log', { p_user: u.id, p_in: (usage.input_tokens || 0) + (usage.cache_creation_input_tokens || 0), p_out: usage.output_tokens || 0, p_cache: usage.cache_read_input_tokens || 0 }).catch(() => {});
  if (res.stop_reason === 'refusal') return J({ text: lang === 'English' ? 'I can only help with using the app. Try asking another way, or contact [Support](#support).' : 'أستطيع المساعدة في استعمال التطبيق فقط. جرّب السؤال بطريقة أخرى، أو راسل [الدعم](#support).', left: Math.max(0, limit - n) });
  const text = (res.content || []).filter(x => x.type === 'text').map(x => x.text).join('\n').trim();
  return J({ text: text || (lang === 'English' ? 'Sorry, I could not answer that. Please try again.' : 'عذرًا، لم أستطع الإجابة. حاول مرة أخرى.'), left: Math.max(0, limit - n) });
}
