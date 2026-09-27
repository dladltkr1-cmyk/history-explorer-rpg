import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = join(root, 'dist');
const target = join(root, '.pages-build');
const api = process.env.HISTORY_SAVE_API;
if (!api || !/^https:\/\/[^/]+\/functions\/v1\/history-save\/?$/.test(api))
  throw Error('HISTORY_SAVE_API must be the HTTPS Supabase history-save function URL.');
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true, filter: path =>
  !/(?:^|\/)(?:server|\.openai)(?:\/|$)/.test(path) });

async function rewrite(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) { await rewrite(path); continue; }
    if (!/\.(?:html|css|js)$/.test(entry.name)) continue;
    let content = await readFile(path, 'utf8');
    // Document relative URLs work under /repository/ as well as a local preview.
    // Only root-relative asset URLs need rewriting. Replacing the slash inside
    // ./assets/ would turn the avatar atlas URL into ../assets/ on Pages.
    content = content.replace(/(?<!\.)\/assets\//g, './assets/');
    if (entry.name === 'index.html') {
      content = content.replace(/(href|src)="\/(style\.css|revision\.css|game\.js)/g, '$1="./$2');
      content = content.replace('<script type="module"', '<script src="./pages-config.js"></script>\n    <script type="module"');
    }
    await writeFile(path, content);
  }
}
await rewrite(target);
await writeFile(join(target, 'pages-config.js'), `globalThis.HISTORY_SAVE_API = ${JSON.stringify(api.replace(/\/$/, ''))};\n`);
await writeFile(join(target, '.nojekyll'), '');
console.log('Pages artifact ready (static game only; save endpoint configured).');
