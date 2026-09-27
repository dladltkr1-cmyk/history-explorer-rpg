import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import worker from "../dist/server/index.js";

// Exercise the actual production entrypoint, not the Vite file server.
// A stale embedded Worker must fail even when loose dist files look correct.
const root = fileURLToPath(new URL("../dist/", import.meta.url));
let checked = 0;
async function verify(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "server") continue;
    const file = join(directory, entry.name);
    if (entry.isDirectory()) { await verify(file); continue; }
    const route = "/" + relative(root, file).split("\\").join("/");
    const response = await worker.fetch(new Request("https://verify.invalid" + route), {});
    assert.equal(response.status, 200, route);
    assert.ok(Buffer.from(await response.arrayBuffer()).equals(await readFile(file)), `Stale embedded asset: ${route}; run npm run build`);
    if (/\.(html|js|css)$/.test(route)) assert.equal(response.headers.get("cache-control"), "no-cache", route);
    checked++;
  }
}
await verify(root);
const index = await worker.fetch(new Request("https://verify.invalid/"), {});
assert.ok(Buffer.from(await index.arrayBuffer()).equals(await readFile(join(root, "index.html"))), "Stale root document");
const missing = await worker.fetch(new Request("https://verify.invalid/missing-verification-file.png"), {});
assert.equal(missing.status, 404);
console.log(`Production Worker verified: ${checked} static files match byte-for-byte; root route and missing-file response passed.`);
