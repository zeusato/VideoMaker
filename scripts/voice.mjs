// Narration → per-line WAVs placed on the music grid + every word cue in film time.
// Usage: node voice.mjs <project> [--estimate]
//
// script.json "provider":
//   "file"            the user recorded narration.txt on the ElevenLabs website → audio/full.mp3;
//                     timed with ElevenLabs forced alignment (works on the free plan with the
//                     forced_alignment permission). The default.
//   "elevenlabs-api"  paid plan: the whole narration in one with-timestamps request (voice_id, model,
//                     voice_settings in script.json), saved to audio/full.mp3, timed by its own alignment.
// --estimate (or no audio yet): durations from syllables, so the picture can be built first.
// Each line is cut to voice/out/<id>.wav and placed at its VO grid time from timeline.js.
// Writes out/cues.json: { estimated, lines: [{ id, start, dur, t0, t1, text, wav }], cues: { name: t } }.
// Fails when the recording does not match the script, or when two placed lines overlap.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { normalize, loadLexicon } from './normalize.mjs';

const dir = path.resolve(process.argv[2] ?? '.');
process.env.VIDEO_PROJECT = dir;
const { VO, q } = await import(pathToFileURL(path.join(dir, 'timeline.js')));
const script = JSON.parse(readFileSync(path.join(dir, 'script.json'), 'utf8'));
const lexicon = { ...loadLexicon(fileURLToPath(new URL('./lexicon.json', import.meta.url))), ...loadLexicon(path.join(dir, 'lexicon.json')) };
const provider = script.provider ?? 'file';
const audio = path.join(dir, script.audio ?? 'audio/full.mp3');
const PAD_IN = .06, PAD_OUT = .14, SR = 48000;
const FFMPEG = process.env.FFMPEG ?? 'ffmpeg';

const letters = (s) => s.normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
// "Mỗi {unit}đồng xu" → spoken text and each cue's character offset in it
function parseLine(raw) {
  const parts = raw.split(/\{(\w+)\}/);
  let spoken = '';
  const cues = [];
  parts.forEach((part, i) => {
    if (i % 2) cues.push({ name: part, at: spoken.length });
    else spoken += normalize(part, lexicon) + (/\s$/.test(part) ? ' ' : '');
  });
  return { spoken: spoken.trimEnd(), cues, text: parts.filter((_, i) => i % 2 === 0).join('').replace(/\s+/g, ' ').trim() };
}
const spans = (s) => [...s.matchAll(/\S+/g)].map((m) => ({ from: m.index, to: m.index + m[0].length, text: m[0] })).filter((w) => letters(w.text));

const lines = script.scenes.flatMap((s) => s.lines).map(parseLine);
if (lines.length !== VO.length) throw new Error(`script has ${lines.length} lines, timeline VO has ${VO.length}`);
const fullText = lines.map((l) => l.spoken).join('\n\n');
const cacheDir = path.join(dir, 'voice');
mkdirSync(cacheDir, { recursive: true });
const cached = async (parts, make) => {
  const f = path.join(cacheDir, `${parts[0]}-${createHash('sha1').update(JSON.stringify(parts)).digest('hex').slice(0, 16)}.json`);
  if (existsSync(f)) return JSON.parse(readFileSync(f, 'utf8'));
  const r = await make(); writeFileSync(f, JSON.stringify(r)); return r;
};

// generate the narration through the API (paid plans); the response is cached, so reruns cost nothing
let tts = null;
if (provider === 'elevenlabs-api' && !process.argv.includes('--estimate')) {
  const { api } = await import('./eleven.mjs');
  const { voice_id, model = 'eleven_v3', voice_settings } = script;
  tts = await cached(['tts', voice_id, model, voice_settings, fullText], () => api(`/v1/text-to-speech/${voice_id}/with-timestamps`, {
    method: 'POST', query: { output_format: 'mp3_44100_128' },
    body: { text: fullText, model_id: model, language_code: 'vi', voice_settings, apply_text_normalization: 'off' },
  }));
  mkdirSync(path.dirname(audio), { recursive: true });
  writeFileSync(audio, Buffer.from(tts.audio_base64, 'base64'));
  if (tts.alignment.characters.join('') !== fullText) throw new Error('ElevenLabs alignment does not match the text sent');
}
const estimate = process.argv.includes('--estimate') || !existsSync(audio);

// per line: word times in the source audio (seconds)
let words;
if (estimate) {
  // ElevenLabs v3 reads Vietnamese at ~3.4 syllables per second, with a pause after each sentence
  words = lines.map((l) => {
    let t = 0;
    return spans(l.spoken).map((w) => { const s = { start: t, end: t + .22 }; t += 1 / 3.4 + (/[.,:]$/.test(w.text) ? .25 : 0); return s; });
  });
} else if (tts) {
  // character-level alignment of exactly the text sent: word times by character offset
  const a = tts.alignment;
  let off = 0;
  words = lines.map((l, i) => {
    if (i) off += 2;                      // the "\n\n" between lines
    const ws = spans(l.spoken).map((w) => ({ start: a.character_start_times_seconds[off + w.from], end: a.character_end_times_seconds[off + w.to - 1] }));
    off += l.spoken.length; return ws;
  });
} else {
  const { apiForm } = await import('./eleven.mjs');
  const buf = readFileSync(audio);
  const res = await cached(['align', createHash('sha1').update(buf).digest('hex'), fullText], () => {
    const form = new FormData();
    form.append('file', new Blob([buf]), path.basename(audio));
    form.append('text', fullText);
    return apiForm('/v1/forced-alignment', form);
  });
  const aligned = res.words.filter((w) => letters(w.text));
  const expected = lines.reduce((n, l) => n + spans(l.spoken).length, 0);
  if (aligned.length !== expected) throw new Error(`aligner found ${aligned.length} words, the script has ${expected}: the recording does not match narration.txt`);
  let k = 0;
  words = lines.map((l) => spans(l.spoken).map(() => aligned[k++]));
}

const out = { estimated: estimate, lines: [], cues: {} };
mkdirSync(path.join(dir, 'voice', 'out'), { recursive: true });
lines.forEach((l, i) => {
  const ws = words[i], sp = spans(l.spoken);
  const cut0 = Math.max(0, ws[0].start - PAD_IN), cut1 = ws.at(-1).end + PAD_OUT;
  const t0 = q(...VO[i].at) + (VO[i].pre ?? 0);
  const at = (srcTime) => +(t0 + srcTime - cut0).toFixed(3);
  const wav = `voice/out/${VO[i].id}.wav`;
  if (!estimate) {
    const r = spawnSync(FFMPEG, ['-v', 'error', '-y', '-ss', String(cut0), '-to', String(cut1), '-i', audio, '-ac', '1', '-ar', String(SR),
      '-af', `afade=t=in:d=0.02,afade=t=out:st=${(cut1 - cut0 - .04).toFixed(3)}:d=0.04`, path.join(dir, wav)]);
    if (r.status !== 0) throw new Error(`ffmpeg cut failed for ${VO[i].id}: ${r.stderr}`);
  }
  for (const c of l.cues) {
    const wi = sp.findIndex((w) => w.to > c.at);
    out.cues[c.name] = at(ws[wi < 0 ? ws.length - 1 : wi].start);
  }
  out.lines.push({ id: VO[i].id, start: +t0.toFixed(3), dur: +(cut1 - cut0).toFixed(3), t0: at(ws[0].start), t1: at(ws.at(-1).end), text: l.text, wav });
});

// lines must not overlap, and need a breath between them
const problems = [];
for (let i = 1; i < out.lines.length; i++) {
  const a = out.lines[i - 1], b = out.lines[i];
  if (a.start + a.dur > b.start - .12) problems.push(`${a.id} ends at ${(a.start + a.dur).toFixed(2)}s but ${b.id} starts at ${b.start.toFixed(2)}s: move ${b.id} later (or ${a.id} earlier) in timeline.js VO`);
}
mkdirSync(path.join(dir, 'out'), { recursive: true });
writeFileSync(path.join(dir, 'out', 'cues.json'), JSON.stringify(out, null, 1));
for (const l of out.lines) console.log(`${l.id} ${l.start.toFixed(2)} → ${(l.start + l.dur).toFixed(2)}  ${l.text}`);
console.log(estimate ? '(estimated durations: no audio yet)' : `(from ${path.relative(dir, audio)})`);
// with estimated durations an overlap is only a warning: the real recording decides
if (problems.length) { console.error((estimate ? 'OVERLAP (estimate, check again with the recording)\n ' : 'OVERLAP\n ') + problems.join('\n ')); if (!estimate) process.exit(1); }
