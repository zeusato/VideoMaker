// Downloads OFL font subsets (Google Fonts CSS2 API, &text=) holding exactly the characters the film
// shows (LABELS in timeline.js + the narration lines in out/cues.json) into fonts/, writes fonts.css.
// Families: fonts.json in the project ([[alias, "Google Family", [weights]], ...]) or the defaults below,
// all with full Vietnamese coverage. Re-run whenever LABELS or the narration change.
// Usage: node fonts.mjs <project>
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const dir = path.resolve(process.argv[2] ?? '.');
const { LABELS = {} } = await import(pathToFileURL(path.join(dir, 'timeline.js')));
const read = (f, d) => (existsSync(path.join(dir, f)) ? JSON.parse(readFileSync(path.join(dir, f), 'utf8')) : d);
const cues = read('out/cues.json', { lines: [] });
const flat = (v) => (typeof v === 'string' ? v : Object.values(v ?? {}).map(flat).join(''));
const chars = [...new Set([...flat(LABELS), ...cues.lines.map((l) => l.text).join(''),
  ...'0123456789.,:;%+−-–·/×=()[]?!"\' ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'])].sort().join('');

const FAMILIES = read('fonts.json', [
  ['BVP', 'Be Vietnam Pro', [500, 600]],   // labels, verdicts, subtitles
  ['Inter', 'Inter', [200, 300, 400]],     // numbers
  ['JBMono', 'JetBrains Mono', [400, 500]],// units, ages, source line
  ['NSerif', 'Noto Serif', [600]],         // title
]);
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
mkdirSync(path.join(dir, 'fonts'), { recursive: true });
let css = '';
for (const [alias, family, weights] of FAMILIES) {
  for (const w of weights) {
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${w}&text=${encodeURIComponent(chars)}`;
    const sheet = await (await fetch(url, { headers: { 'User-Agent': UA } })).text();
    const src = sheet.match(/url\((https:[^)]+)\)/)?.[1];
    if (!src) throw new Error(`no font file for ${family} ${w}: ${sheet.slice(0, 200)}`);
    const file = `fonts/${alias}-${w}.woff2`;
    writeFileSync(path.join(dir, file), Buffer.from(await (await fetch(src, { headers: { 'User-Agent': UA } })).arrayBuffer()));
    css += `@font-face{font-family:'${alias}';font-weight:${w};font-display:block;src:url(${file}) format('woff2')}\n`;
    console.log(`${file}  (${family} ${w})`);
  }
}
writeFileSync(path.join(dir, 'fonts.css'), css);
writeFileSync(path.join(dir, 'fonts/SOURCES.md'), `Fonts: ${FAMILIES.map((f) => f[1]).join(', ')}: Google Fonts, SIL Open Font License 1.1. Subsets of ${chars.length} characters.\n`);
