import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const url = Deno.env.get('SUPABASE_URL')!;
const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(url, key, { auth: { persistSession: false } });
const allowedOrigins = new Set((Deno.env.get('ALLOWED_ORIGINS') || 'https://dladltkr1-cmyk.github.io').split(',').map(v => v.trim()).filter(Boolean));
const legacyUrl = (Deno.env.get('LEGACY_SAVE_URL') || 'https://history-explorer-rpg.dladltkr1.chatgpt.site').replace(/\/$/, '');
const codePattern = /^HE(?:\d{4}|\d{6})$/;
const requests = new Map<string, { since: number; count: number }>();

function response(origin: string, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: {
    'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store',
    ...(origin && allowedOrigins.has(origin) ? { 'access-control-allow-origin': origin, vary: 'Origin' } : {}),
  } });
}
function limited(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const now = Date.now();
  const prior = requests.get(ip);
  const next = prior && now - prior.since < 60000 ? { since: prior.since, count: prior.count + 1 } : { since: now, count: 1 };
  requests.set(ip, next);
  if (requests.size > 3000) requests.clear();
  return next.count > 40;
}
async function stateFrom(request: Request) {
  const raw = await request.text();
  if (raw.length > 500000) throw Error('bad-state');
  const state = JSON.parse(raw).state;
  if (!state || ![1, 2, 3].includes(state.saveVersion) ||
      typeof state.nickname !== 'string' || !state.nickname.trim() || state.nickname.length > 12 ||
      !Number.isFinite(state.coins) || !Array.isArray(state.artifacts) ||
      !Number.isSafeInteger(state.updatedAt) || state.updatedAt <= 0 ||
      JSON.stringify(state).length > 500000) throw Error('bad-state');
  return state;
}
async function find(code: string) {
  const { data, error } = await db.from('game_saves').select('state').eq('code', code).maybeSingle();
  if (error) throw error;
  return data?.state;
}
async function findOrImportLegacy(code: string) {
  const current = await find(code);
  if (current || code.length !== 6 || !legacyUrl) return current;
  const result = await fetch(`${legacyUrl}/api/saves/${code}`, { signal: AbortSignal.timeout(5000) });
  if (result.status === 404) return null;
  if (!result.ok) throw Error('legacy-unavailable');
  const state = (await result.json()).state;
  if (!state || state.personalCode !== code || !Number.isSafeInteger(state.updatedAt)) throw Error('legacy-invalid');
  const { error } = await db.from('game_saves').insert({ code, state, updated_at: state.updatedAt });
  if (error && error.code !== '23505') throw error;
  return find(code);
}

Deno.serve(async request => {
  const origin = request.headers.get('origin') || '';
  if (request.method === 'OPTIONS') {
    if (!allowedOrigins.has(origin)) return response('', { error: '허용되지 않은 주소다.' }, 403);
    return new Response(null, { status: 204, headers: {
      'access-control-allow-origin': origin, 'access-control-allow-methods': 'GET, POST, PUT, OPTIONS',
      'access-control-allow-headers': 'content-type', 'access-control-max-age': '600', vary: 'Origin',
    } });
  }
  if (origin && !allowedOrigins.has(origin)) return response('', { error: '허용되지 않은 주소다.' }, 403);
  if (limited(request)) return response(origin, { error: '잠시 뒤에 다시 시도해 줘.' }, 429);
  const pathname = new URL(request.url).pathname;
  const match = pathname.match(/\/history-save\/?(?:([^/]+))?$/);
  if (!match) return response(origin, { error: '경로를 찾을 수 없다.' }, 404);
  const code = match[1]?.toUpperCase();
  try {
    if (!code && request.method === 'POST') {
      const state = await stateFrom(request);
      for (let n = 0; n < 30; n++) {
        const random = crypto.getRandomValues(new Uint32Array(1))[0];
        const issued = 'HE' + String(random % 1000000).padStart(6, '0');
        const { error } = await db.from('game_saves').insert({ code: issued, state: { ...state, personalCode: issued }, updated_at: state.updatedAt });
        if (!error) return response(origin, { code: issued });
        if (error.code !== '23505') throw error;
      }
      return response(origin, { error: '코드를 만들 수 없다. 잠시 뒤에 다시 시도해 줘.' }, 503);
    }
    if (!codePattern.test(code || '')) return response(origin, { error: '코드 형식이 올바르지 않아.' }, 400);
    if (request.method === 'GET') {
      const state = await findOrImportLegacy(code!);
      return state ? response(origin, { state }) : response(origin, { error: '저장 데이터를 찾지 못했어. 개인 코드를 다시 확인해 줘.' }, 404);
    }
    if (request.method === 'PUT') {
      const state = await stateFrom(request);
      if (state.personalCode !== code) return response(origin, { error: '코드가 일치하지 않아.' }, 400);
      if (code!.length === 6) await findOrImportLegacy(code!);
      const { data, error } = await db.rpc('put_game_save', { p_code: code, p_state: state, p_updated_at: state.updatedAt });
      if (error) throw error;
      if (data === 'saved') return response(origin, { saved: true });
      if (data === 'stale') return response(origin, { saved: false, stale: true });
      return response(origin, { error: '저장 데이터를 찾지 못했어. 개인 코드를 다시 확인해 줘.' }, 404);
    }
    return response(origin, { error: '허용되지 않은 요청이다.' }, 405);
  } catch (error) {
    if (error instanceof SyntaxError || (error instanceof Error && error.message === 'bad-state'))
      return response(origin, { error: '저장 기록이 올바르지 않아.' }, 400);
    console.error('save API', error);
    return response(origin, { error: '저장 서버에 연결할 수 없어.' }, 503);
  }
});
