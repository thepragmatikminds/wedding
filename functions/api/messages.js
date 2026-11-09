// Cloudflare Pages Function: /api/messages  (D1 binding: DB, optional secret: ADMIN_KEY)
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

const clean = (s, max) => String(s ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);

export async function onRequestGet({ env, request }) {
  const url = new URL(request.url);
  const before = parseInt(url.searchParams.get('before') || '0', 10);
  const limit = 20;
  const q = before
    ? env.DB.prepare('SELECT id,name,message,created_at FROM messages WHERE id < ? ORDER BY id DESC LIMIT ?').bind(before, limit + 1)
    : env.DB.prepare('SELECT id,name,message,created_at FROM messages ORDER BY id DESC LIMIT ?').bind(limit + 1);
  const { results } = await q.all();
  return json({ messages: results.slice(0, limit), hasMore: results.length > limit });
}

export async function onRequestPost({ env, request }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
  if (body.site) return json({ ok: true }); // honeypot: bots fill this in

  const name = clean(body.name, 60);
  const message = clean(body.message, 600);
  if (!name || !message) return json({ error: 'Please enter your name and a message.' }, 400);
  if ((message.match(/https?:\/\//gi) || []).length > 1) return json({ error: 'Please remove extra links from your message.' }, 400);

  // simple rate limit: 5 posts per IP per 10 minutes
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip + (env.ADMIN_KEY || 'salt')));
  const ipHash = [...new Uint8Array(buf)].slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
  const now = Date.now();
  const { n } = await env.DB.prepare('SELECT COUNT(*) AS n FROM messages WHERE ip_hash = ? AND created_at > ?').bind(ipHash, now - 600000).first();
  if (n >= 5) return json({ error: 'You have posted a few messages already. Please try again in a little while.' }, 429);

  await env.DB.prepare('INSERT INTO messages (name,message,created_at,ip_hash) VALUES (?,?,?,?)').bind(name, message, now, ipHash).run();
  return json({ ok: true }, 201);
}

// Moderation: curl -X DELETE "https://YOUR-SITE/api/messages?id=12" -H "x-admin-key: YOUR_KEY"
export async function onRequestDelete({ env, request }) {
  if (!env.ADMIN_KEY || request.headers.get('x-admin-key') !== env.ADMIN_KEY) return json({ error: 'Not allowed.' }, 403);
  const id = parseInt(new URL(request.url).searchParams.get('id') || '', 10);
  if (!id) return json({ error: 'Missing id.' }, 400);
  await env.DB.prepare('DELETE FROM messages WHERE id = ?').bind(id).run();
  return json({ ok: true });
}
