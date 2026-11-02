// Writes narration.txt: the exact, normalized text to record (one paragraph per script line,
// cue markers removed). The recording must match it word for word: voice.mjs checks.
// Usage: node narration.mjs <project>
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalize, loadLexicon } from './normalize.mjs';

const dir = path.resolve(process.argv[2] ?? '.');
const script = JSON.parse(readFileSync(path.join(dir, 'script.json'), 'utf8'));
const lexicon = { ...loadLexicon(fileURLToPath(new URL('./lexicon.json', import.meta.url))), ...loadLexicon(path.join(dir, 'lexicon.json')) };
const text = script.scenes.flatMap((s) => s.lines).map((l) => normalize(l.replace(/\{\w+\}/g, ''), lexicon)).join('\n\n');
writeFileSync(path.join(dir, 'narration.txt'), text + '\n');
console.log(text);
console.log(`\n${text.length} characters → ${path.join(dir, 'narration.txt')}`);
