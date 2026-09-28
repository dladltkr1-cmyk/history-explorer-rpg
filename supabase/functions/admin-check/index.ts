import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});
const originAllowed = new Set((Deno.env.get('ALLOWED_ORIGINS') || 'https://dladltkr1-cmyk.github.io')
  .split(',').map(s => s.trim()).filter(Boolean));
const attempts = new Map<string, { time: number; count: number }>();
const json = (origin: string, body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store',
    ...(originAllowed.has(origin) ? { 'access-control-allow-origin': origin, vary: 'Origin' } : {}) },
});

Deno.serve(async req => {
  const origin = req.headers.get('origin') || '';
  if (!originAllowed.has(origin)) return json('', { error: '허용되지 않은 주소다.' }, 403);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: {
    'access-control-allow-origin': origin, 'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type', 'access-control-max-age': '600', vary: 'Origin',
  } });
  if (req.method !== 'POST') return json(origin, { error: '요청 형식이 올바르지 않아.' }, 405);
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const prior = attempts.get(ip), now = Date.now();
  const current = prior && now - prior.time < 600000 ? { time: prior.time, count: prior.count + 1 } : { time: now, count: 1 };
  attempts.set(ip, current);
  if (attempts.size > 3000) attempts.clear();
  if (current.count > 6) return json(origin, { error: '잠시 뒤에 다시 시도해 줘.' }, 429);
  let code = '';
  try { const raw = await req.text(); if (raw.length > 100) throw Error(); code = JSON.parse(raw).code; }
  catch { return json(origin, { ok: false }, 400); }
  if (typeof code !== 'string' || !/^\d{4,8}$/.test(code)) return json(origin, { ok: false });
  const { data, error } = await db.from('admin_auth').select('salt,digest').eq('key', 'admin').single();
  if (error || !data) return json(origin, { error: '관리자 확인 서버 오류' }, 503);
  const bytes = new TextEncoder().encode(`${data.salt}:${code}`);
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  const hex = Array.from(hash, v => v.toString(16).padStart(2, '0')).join('');
  // Compare all bytes; never return the stored verifier to the browser.
  let diff = 0;
  for (let i = 0; i < 64; i++) diff |= hex.charCodeAt(i) ^ data.digest.charCodeAt(i);
  return json(origin, { ok: diff === 0 });
});
