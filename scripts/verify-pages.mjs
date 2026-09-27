import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('../.pages-build/', import.meta.url).pathname;
const html = await readFile(join(root, 'index.html'), 'utf8');
assert.match(html, /src="\.\/pages-config\.js"/);
assert.match(html, /src="\.\/game\.js/);
const config = await readFile(join(root, 'pages-config.js'), 'utf8');
assert.match(config, /https:\/\/.*\/functions\/v1\/history-save/);
const avatar = await readFile(join(root, 'avatar.js'), 'utf8');
assert.match(avatar, /new URL\(`\.\/assets\/player\/custom\/\$\{name\}\.png/);
assert.doesNotMatch(avatar, /\.\.\/assets\/player\/custom\//);
let count = 0;
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) { assert.notEqual(entry.name, 'server'); await walk(path); continue; }
    if (/\.(html|js|css)$/.test(entry.name)) {
      const content = await readFile(path, 'utf8');
      assert.doesNotMatch(content, /(?:src|href)="\/(?:assets|game\.js|style\.css|revision\.css)/, path);
      assert.doesNotMatch(content, /['"]\/assets\//, path);
    }
    count++;
  }
}
await walk(root);
for (const asset of ['assets/ui/nations-original.png', 'assets/audio/exploration.ogg', 'assets/audio/battle.ogg', 'assets/maps/horse-front-idle.png']) {
  assert.ok((await stat(join(root, asset))).size > 1000, asset);
}
console.log(`Pages artifact verified: ${count} static files; key map, audio and horse assets present; no root asset URLs.`);
