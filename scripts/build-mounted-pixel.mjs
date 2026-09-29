// Build the reusable horse and seated outfit layers. Faces, eyes, and hair stay
// in the existing custom avatar atlases and are selected at run time.
import { spawnSync } from 'node:child_process';
const run = spawnSync('python3', ['scripts/art/mounted-pixel.py'], { stdio: 'inherit' });
if (run.status) process.exit(run.status || 1);
