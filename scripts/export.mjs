// Writes out/timeline.json (grid, picture beats, duration) for mix.py, from timeline.js.
// Usage: node tools/export.mjs <project>
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const dir = path.resolve(process.argv[2] ?? '.');
const { BPM, BEAT, BAR, DUR, T } = await import(pathToFileURL(path.join(dir, 'timeline.js')));
mkdirSync(path.join(dir, 'out'), { recursive: true });
writeFileSync(path.join(dir, 'out/timeline.json'), JSON.stringify({ BPM, BEAT, BAR, DUR, T }, null, 1));
