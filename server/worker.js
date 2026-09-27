// The build embeds the existing static game files below this module.
const files = __GAME_FILES__;
const types = { html: "text/html; charset=utf-8", js: "text/javascript; charset=utf-8", css: "text/css; charset=utf-8", png: "image/png", webp: "image/webp", ogg: "audio/ogg", svg: "image/svg+xml" };
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const codePattern = /^HE\d{4}$/;
const visitors = new Map();
function limited(request) {
  const key = request.headers.get("cf-connecting-ip") || "unknown";
  const now = Date.now();
  const current = visitors.get(key);
  const next = !current || now - current.since > 60000 ? { since: now, count: 1 } : { since: current.since, count: current.count + 1 };
  visitors.set(key, next);
  if (visitors.size > 3000) visitors.clear();
  return next.count > 40;
}
async function body(request) {
  if (Number(request.headers.get("content-length")) > 500000) throw Error("저장 기록이 너무 크다.");
  const text = await request.text();
  if (text.length > 500000) throw Error("저장 기록이 너무 크다.");
  const state = JSON.parse(text).state;
  if (!state || ![1, 2, 3].includes(state.saveVersion) || typeof state.nickname !== "string" || state.nickname.length > 12 || !Number.isFinite(state.coins) || !Array.isArray(state.artifacts)) throw Error("저장 기록이 올바르지 않다.");
  return state;
}
function rawFile(path) {
  const file = files[path];
  if (!file) return new Response("Not found", { status: 404 });
  const bytes = Uint8Array.from(atob(file), char => char.charCodeAt(0));
  const ext = path.split(".").pop();
  return new Response(bytes, { headers: { "content-type": types[ext] || "application/octet-stream", "cache-control": ["html", "js", "css"].includes(ext) ? "no-cache" : "public, max-age=3600" } });
}
export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (!pathname.startsWith("/api/saves")) return rawFile(pathname === "/" ? "/index.html" : pathname);
    if (!env.DB) return json({ error: "저장 서버를 사용할 수 없다." }, 503);
    if (limited(request)) return json({ error: "잠시 뒤에 다시 시도해 주세요." }, 429);
    try {
      if (pathname === "/api/saves" && request.method === "POST") {
        const state = await body(request);
        for (let attempt = 0; attempt < 30; attempt++) {
          const code = "HE" + String(crypto.getRandomValues(new Uint16Array(1))[0] % 10000).padStart(4, "0");
          const result = await env.DB.prepare("INSERT OR IGNORE INTO saves (code, data, updated_at) VALUES (?, ?, ?)").bind(code, JSON.stringify({ ...state, personalCode: code }), Date.now()).run();
          if (result.meta.changes === 1) return json({ code });
        }
        return json({ error: "코드를 만들 수 없다. 잠시 뒤에 다시 시도해 주세요." }, 503);
      }
      const code = pathname.slice("/api/saves/".length).trim().toUpperCase();
      if (!codePattern.test(code)) return json({ error: "코드 형식이 올바르지 않습니다." }, 400);
      if (request.method === "GET") {
        const row = await env.DB.prepare("SELECT data FROM saves WHERE code = ?").bind(code).first();
        return row ? json({ state: JSON.parse(row.data) }) : json({ error: "해당 코드를 찾지 못했습니다." }, 404);
      }
      if (request.method === "PUT") {
        const state = await body(request);
        if (state.personalCode !== code) return json({ error: "코드가 일치하지 않는다." }, 400);
        const result = await env.DB.prepare("UPDATE saves SET data = ?, updated_at = ? WHERE code = ? AND COALESCE(CAST(json_extract(data, '$.updatedAt') AS INTEGER), 0) <= ?").bind(JSON.stringify(state), Date.now(), code, state.updatedAt || 0).run();
        if (result.meta.changes) return json({ saved: true });
        const found = await env.DB.prepare("SELECT data FROM saves WHERE code = ?").bind(code).first();
        return found ? json({ saved: false, stale: true }) : json({ error: "해당 코드를 찾지 못했습니다." }, 404);
      }
      return json({ error: "허용되지 않은 요청이다." }, 405);
    } catch (error) {
      if (error instanceof SyntaxError || /저장 기록/.test(error.message)) return json({ error: "저장 기록이 올바르지 않다." }, 400);
      console.error("save API", error);
      return json({ error: "저장 서버에 연결할 수 없다." }, 503);
    }
  },
};
