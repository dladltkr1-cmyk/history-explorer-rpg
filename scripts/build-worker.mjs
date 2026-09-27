import { readdir, readFile, mkdir, writeFile, cp } from "node:fs/promises";
import { join, relative } from "node:path";
const root = new URL("..", import.meta.url).pathname;
const files = {};
async function collect(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!["server", ".openai"].includes(entry.name)) await collect(path);
    } else if (!entry.name.startsWith(".")) files["/" + relative(join(root, "dist"), path)] = (await readFile(path)).toString("base64");
  }
}
await collect(join(root, "dist"));
const template = await readFile(join(root, "server/worker.js"), "utf8");
await mkdir(join(root, "dist/server"), { recursive: true });
await mkdir(join(root, "dist/.openai/drizzle"), { recursive: true });
await cp(join(root, "drizzle"), join(root, "dist/.openai/drizzle"), { recursive: true });
await writeFile(join(root, "dist/server/index.js"), template.replace("__GAME_FILES__", JSON.stringify(files)));
await writeFile(join(root, "dist/.openai/hosting.json"), JSON.stringify({ project_id: "appgprj_6aae482467088191bf7470630ab88399", d1: "DB", r2: null }));
console.log(`Worker includes ${Object.keys(files).length} game files.`);
