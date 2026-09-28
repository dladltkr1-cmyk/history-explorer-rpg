// The existing hosted game keeps its same-origin API. Pages supplies an
// independent endpoint before loading this module.
const endpoint = globalThis.HISTORY_SAVE_API || "/api/saves";
export const cloudSaveUrl = (code) => `${endpoint}/${encodeURIComponent(normalizedCode(code))}`;
const adminEndpoint = endpoint.replace(/\/history-save\/?$/, '/admin-check');
export const normalizedCode = (value) => String(value || "").trim().toUpperCase().replace(/\s+/g, "");
async function request(url, options) {
  const response = await fetch(url, { cache: "no-store", ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Error(data.error || "저장 서버에 연결할 수 없다.");
  return data;
}
export async function issueCode(state) {
  return request(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ state }) });
}
export async function loadCode(code) {
  return request(cloudSaveUrl(code));
}
export async function pushCode(code, state) {
  return request(cloudSaveUrl(code), { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ state }) });
}
export async function verifyAdminCode(code) {
  if (adminEndpoint === endpoint) throw Error('관리자 확인 서버에 연결할 수 없다.');
  const result = await request(adminEndpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code }) });
  return result.ok === true;
}
