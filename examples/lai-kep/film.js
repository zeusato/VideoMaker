// "Lãi kép" — Data Physicalization. render(t): age → pieces → camera → depth of field → 2D overlay
// (readings, counters, verdicts, subtitles, end card). EV feeds mix.py, TEXTS feeds readcheck.
import * as THREE from 'three';
import { makePost } from '/core/three/post.js';
import { clamp, seg, eo, lerp, track } from '/core/lib.js';
import { AN, BINH } from './data.js';
import { DUR, BEAT, q, T, LABELS, AGE_KEYS } from './timeline.js';
import { buildSet, makeAge, landedCount, topY, ageX, SPOT, LEGEND, PUCK, RULER, DECK, CR, TH } from './set.js';

const W = 1920, H = 1080;
const BG = new THREE.Color('#c4beb4');
const INK = '#1c1d20', INK2 = 'rgba(28,29,32,.62)', ACC = '#d4521c';
const F = { num: '200 150px Inter', val: '300 56px Inter', unit: '500 24px JBMono', lab: '500 28px BVP', verdict: '500 44px BVP', sub: '500 36px BVP', src: '500 21px BVP' };

// word cues from the narration (out/cues.json, tools/voice.mjs)
const CUES = await (await fetch('out/cues.json')).json();
const C = CUES.cues;
await Promise.all(['500 28px BVP', '600 40px BVP', '200 150px Inter', '300 56px Inter', '400 26px Inter', '500 24px JBMono', '400 24px JBMono', '600 96px NSerif'].map((f) => document.fonts.load(f, 'Lãi kép tỷ')));
await document.fonts.ready;

const AGE = makeAge(AGE_KEYS(C));
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
// ?q=draft: no supersampling, no ambient occlusion, a smaller shadow map — for review passes, ~4× faster
const DRAFT = new URLSearchParams(location.search).get('q') === 'draft';
renderer.setPixelRatio(DRAFT ? 1 : 2); renderer.setSize(W, H);
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.06;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = BG.clone(); scene.fog = new THREE.Fog(BG.clone(), 14, 40);
const camera = new THREE.PerspectiveCamera(24, W / H, .03, 80);
const post = makePost(renderer, scene, camera, W, H, { ssaa: DRAFT ? 1 : 2, ao: !DRAFT, aoRadius: .08, aoThickness: .3, aoScale: 1.6, aoAmt: .7 });
post.bloom.strength = .06; post.bloom.threshold = 1.6;
post.vig.uniforms.amt.value = .26; post.vig.uniforms.warm.value = .2; post.vig.uniforms.contrast.value = .16;
const set = await buildSet(scene, LABELS, AGE, C);
if (DRAFT) set.key.shadow.mapSize.set(2048, 2048);
const PIECES = set.S.pieces;
const top = (who, t) => topY(PIECES, who, t);

// ———————— camera: one continuous take. keys: [t, [pos xyz, target xyz, focus xyz, aperture]] ————————
const A = SPOT.an, B = SPOT.binh, Lw = LEGEND.w, Lc = LEGEND.c;
const crane = (t) => { const y = top('an', t); return [A.x + .55, y + .32, 1.75, A.x - .05, y - .12, A.z, A.x, y - .05, A.z, 16]; };
const CAMK = [
  // S1 macro on the legend tray: one oak disc lands, dolly right and rack focus to the copper coin
  [0, [Lw.x + .34, DECK + .1, Lw.z + .62, Lw.x - .04, DECK + .02, Lw.z, Lw.x, DECK + .01, Lw.z, 30]],
  [C.unit, [Lw.x + .40, DECK + .11, Lw.z + .64, Lw.x + .04, DECK + .02, Lw.z, Lw.x, DECK + .01, Lw.z, 30]],
  [C.copper, [Lc.x + .30, DECK + .13, Lc.z + .68, Lc.x - .12, DECK + .02, Lc.z, Lc.x, DECK + .01, Lc.z, 30]],
  [C.copper + .9, [Lc.x + .40, DECK + .16, Lc.z + .72, Lc.x - .1, DECK + .03, Lc.z, Lc.x, DECK + .01, Lc.z, 28]],
  // S2 pull back and up over ~2.4 s: the whole plank, both empty spots, the ruler at 25
  [C.an_start + .6, [.95, 1.25, 3.35, -.15, .32, .05, A.x, .2, A.z, 12]],
  // S3 low lateral track along the ruler, following the slider
  [C.binh_start, [ageX(35) + .35, .42, 2.25, ageX(35) - .45, .28, .25, A.x, .28, A.z, 14]],
  [T.turn - BEAT, [A.x + .7, top('an', T.turn) + .3, 1.95, A.x - .05, top('an', T.turn) - .1, A.z, A.x, top('an', T.turn), A.z, 16]],
  // S4 crane with An's rising top (track turns into crane: the signature move)
  [T.turn + 1.2, crane(T.turn + 1.2)], [T.turn + 2.4, crane(T.turn + 2.4)], [T.age55 - 1.6, crane(T.age55 - 1.6)],
  // S5 pull out over ~2.2 s through the drop-out and the impact, then a locked three-quarter on both stacks (2–3 % creep)
  [T.age55 + .6, [2.55, 1.7, 5.9, -.05, 1.08, -.05, 0, .9, -.05, 7]],
  [T.pushIn - .4, [2.68, 1.72, 5.8, -.05, 1.08, -.05, 0, .9, -.05, 7]],
  // S6 push in on the bottoms, where the oak is
  [T.pushIn + 1.6, [1.05, .55, 2.35, -.05, .32, -.05, 0, .3, -.05, 12]],
  [T.puck - .7, [1.0, .62, 2.45, -.05, .34, .05, 0, .3, .1, 12]],
  // S7 the weight lands; pull back wide and slow orbit for the end card (stacks right of centre)
  [T.puck + .9, [1.2, 1.45, 2.7, -.2, .3, .15, PUCK.pos.x, .15, PUCK.pos.z, 10]],
  [T.end + .4, [3.1, 2.3, 5.1, -1.35, .85, 0, 0, .9, 0, 7]],
  [DUR, [3.5, 2.4, 4.6, -1.35, .85, 0, 0, .9, 0, 7]],
];
const CAM = track(CAMK);
const fwd = new THREE.Vector3(), V = (x, y, z) => new THREE.Vector3(x, y, z);
const DEBUG_TOP = new URLSearchParams(location.search).get('cam') === 'top';
function setCamera(t) {
  const c = DEBUG_TOP ? [0, 7.5, .01, 0, 0, 0, 0, 0, 0, 0] : CAM(t);
  camera.position.set(c[0], c[1], c[2]); camera.lookAt(c[3], c[4], c[5]); camera.updateMatrixWorld();
  camera.getWorldDirection(fwd);
  post.dof.focus = Math.max(.12, V(c[6], c[7], c[8]).sub(camera.position).dot(fwd)); post.dof.aper = c[9]; post.dof.maxCoc = 16;
}
const proj = (v) => { const p = v.clone().project(camera); return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H, p.z]; };

// ———————— 2D overlay ————————
const ov = document.getElementById('ov'), g = ov.getContext('2d');
let TXT = [], REPORT = true;
function text(id, s, x, y, font, color, a = 1, align = 'left', report = s) {
  if (a <= .01) return 0;
  g.globalAlpha = a; g.font = font; g.fillStyle = color; g.textAlign = align; g.fillText(s, x, y);
  const w = g.measureText(s).width, sz = parseFloat(font.split(' ')[1]);
  const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
  if (REPORT && a > .5) TXT.push({ id, text: report, x0, y0: y - sz, x1: x0 + w, y1: y + sz * .25 });
  g.globalAlpha = 1; return w;
}
const width = (s, font) => { g.font = font; return g.measureText(s).width; };
function line(pts, a, color = INK, w = 1.4) { if (a <= .01) return; g.globalAlpha = a; g.strokeStyle = color; g.lineWidth = w; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); g.globalAlpha = 1; }
function dot(x, y, a, color = INK, r = 3.2) { if (a <= .01) return; g.globalAlpha = a; g.fillStyle = color; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; }
function plate(x, y, w, h, a) { if (a <= .01) return; g.globalAlpha = a * .84; g.fillStyle = '#efebe4'; g.beginPath(); g.roundRect(x, y, w, h, 4); g.fill(); g.globalAlpha = 1; }
const MAT = { w: '#d8b98a', c: '#b86b45', b: '#d2b07a' };
function swatch(x, y, mat, a) { if (a <= .01) return; g.globalAlpha = a; g.fillStyle = MAT[mat]; g.strokeStyle = INK; g.lineWidth = 1; g.fillRect(x, y - 16, 16, 16); g.strokeRect(x + .5, y - 15.5, 15, 15); g.globalAlpha = 1; }
const fade = (t, a, b, fi = .3, fo = .3) => Math.min(seg(t, a, a + fi), 1 - seg(t, b - fo, b));
const rise = (a) => 16 * (1 - eo(a));
const vnd = (v, d = 2) => v.toLocaleString('vi-VN', { minimumFractionDigits: d, maximumFractionDigits: d });

function verdict(id, s, a) {
  if (a <= .01) return;
  const x = 120, y = 220, w = width(s, F.verdict);
  plate(x - 24, y - 62, w + 48, 94, a); line([[x, y + 16], [x + w * eo(a), y + 16]], a, ACC, 2);
  text(id, s, x, y + rise(a) * .4, F.verdict, ACC, a);
}
// a reading: dot on the object, leader, plate with swatch + label line, then the value line(s)
function reading(id, anchor, a, { side = 1, lift = 90, swatchMat, label, value, unit, extra, valueFont = F.val, minY = 160, maxY = 760 }) {
  if (a <= .01) return;
  const [ax, ay] = proj(anchor), k = eo(a);
  const wl = (swatchMat ? 26 : 0) + width(label, F.lab), wv = value ? width(value, valueFont) + (unit ? 10 + width(unit, F.unit) : 0) : 0, we = extra ? width(extra, F.lab) : 0;
  const tw = Math.max(wl, wv, we), vh = value ? parseFloat(valueFont.split(' ')[1]) : 0, h = 40 + (value ? vh + 8 : 0) + (extra ? 40 : 0);
  let ex = ax + side * 60 * k, ey = clamp(ay - lift * k, minY + h, maxY);
  const x0 = clamp(side < 0 ? ex - tw : ex, 90, W - 90 - tw), y0 = ey - h - rise(a);
  plate(x0 - 16, y0 - 10, tw + 32, h + 18, a);
  dot(ax, ay, a); line([[ax, ay], [side < 0 ? x0 + tw + 14 : x0 - 14, y0 + h / 2]], a * .85);
  let y = y0 + 30;
  if (swatchMat) swatch(x0, y - 2, swatchMat, a);
  text(id + 'l', label, x0 + (swatchMat ? 26 : 0), y, F.lab, INK2, a);
  if (value) { y += vh + 4; const w = text(id + 'v', value, x0 - 2, y, valueFont, INK, a); if (unit) text(id + 'u', unit, x0 + w + 8, y, F.unit, INK2, a); }
  if (extra) { y += 38; text(id + 'e', extra, x0, y, F.lab, INK2, a); }
}

// subtitles: bottom-left, one line each; a line wider than the safe width is split at a sentence
const FSUB = F.sub, SUB_X = 120, SUB_SAFE = 1180;
const SUBS = CUES.lines.flatMap((l) => {
  if (width(l.text, FSUB) <= SUB_SAFE) return [{ id: l.id, t0: l.t0, t1: l.t1, text: l.text }];
  const parts = l.text.split(/(?<=[.,:]) (?=\S)/), out = [];
  let cur = '';
  for (const p of parts) { if (cur && width(cur + ' ' + p, FSUB) > SUB_SAFE) { out.push(cur); cur = p; } else cur = cur ? cur + ' ' + p : p; }
  out.push(cur);
  const n = out.reduce((s, x) => s + x.length, 0); let t = l.t0;
  return out.map((x, i) => { const d = (l.t1 - l.t0) * x.length / n, r = { id: l.id + String.fromCharCode(97 + i), t0: t, t1: t + d, text: x }; t += d; return r; });
});
function subtitles(t) {
  SUBS.forEach((c, i) => {
    const t1 = Math.min(Math.max(c.t1 + .6, c.t0 + 1.8), (SUBS[i + 1]?.t0 ?? 1e9) - .05);
    const a = seg(t, c.t0 - .08, c.t0 + .1) * (1 - seg(t, t1 - .12, t1));
    if (a <= .01) return;
    const w = width(c.text, FSUB);
    g.globalAlpha = a * .8; const gr = g.createLinearGradient(SUB_X - 40, 0, SUB_X + w + 120, 0);
    gr.addColorStop(0, 'rgba(236,232,224,.94)'); gr.addColorStop(.75, 'rgba(236,232,224,.78)'); gr.addColorStop(1, 'rgba(236,232,224,0)');
    g.fillStyle = gr; g.fillRect(SUB_X - 40, 946, w + 160, 78); g.globalAlpha = 1;
    line([[SUB_X - 18, 958], [SUB_X - 18, 1012]], a, INK, 2);
    const save = REPORT; REPORT = false; text('sub', c.text, SUB_X, 997, FSUB, INK, a); REPORT = save;
  });
}
window.SUBCHECK = { safe: SUB_SAFE, cues: SUBS.map((c) => ({ id: c.id, text: c.text, w: Math.round(width(c.text, FSUB)) })) };

const stackAt = (who, t, dy = 0) => V(SPOT[who].x, top(who, t) + dy, SPOT[who].z);
function overlay(t, age) {
  g.clearRect(0, 0, W, H); TXT = [];
  const P = PIECES;
  // ① legend: the unit rule on the oak disc, then the two materials
  {
    const end = Math.max(T.pullBack + .5, C.an_start + .5);
    reading('unit', V(Lw.x, DECK + .01, Lw.z - .02), fade(t, C.unit, end), { side: 1, lift: 240, label: LABELS.unit, value: null, minY: 120 });
    reading('wood', V(Lw.x - .1, DECK + .01, Lw.z + .05), fade(t, C.wood, end), { side: -1, lift: -150, swatchMat: 'w', label: LABELS.wood, minY: 520, maxY: 860 });
    reading('copper', V(Lc.x + .1, DECK + .01, Lc.z + .05), fade(t, C.copper + .1, end), { side: 1, lift: -150, swatchMat: 'c', label: LABELS.copper, minY: 520, maxY: 860 });
  }
  // ② the age: a counter pinned to the slider, rolling with it
  {
    const a = fade(t, C.an_start - .4, T.pushIn - .2);
    if (a > .01) {
      const [sx, sy] = proj(V(ageX(age), DECK + .03, RULER.z - .05)), x = clamp(sx, 140, W - 260), y = clamp(sy - 70, 300, 860);
      line([[sx, sy], [x, y + 6]], a * .8); dot(sx, sy, a);
      plate(x - 16, y - 98, 210, 112, a);
      text('ageL', LABELS.age, x, y - 64, F.lab, INK2, a);
      text('ageV', String(Math.floor(age + 1e-6)), x - 2, y, F.val, INK, a, 'left', 'age');
    }
    // Bình waits until 35
    // up from when An starts, so it holds long enough to read before Bình starts
    reading('wait', V(B.x, DECK + .01, B.z), fade(t, C.an_start + .3, C.binh_start + 1.0), { side: 1, lift: 120, label: LABELS.wait, minY: 300 });
    // the assumed return
    const ra = fade(t, C.rate, T.turn - .3);
    if (ra > .01) { const w = width(LABELS.rate, F.lab); plate(104, 128, w + 32, 52, ra); text('rate', LABELS.rate, 120, 164, F.lab, INK, ra); }
  }
  // ③ An's counters: oak vs copper, rolling with the pieces landed (the crossover is a count)
  {
    const a = fade(t, C.early - .3, T.age55 - .3);
    if (a > .01) {
      const nw = landedCount(P, 'an', t, 'w'), nc = landedCount(P, 'an', t, 'c');
      // kept below the verdict plate (which ends at y ≈ 252)
      const [ax, ay] = proj(stackAt('an', t)), x = clamp(ax - 330, 100, W - 400), y = clamp(ay - 40, 380, 760);
      plate(x - 16, y - 112, 236, 132, a); line([[ax - 4, ay], [x + 222, y - 46]], a * .8); dot(ax, ay, a);
      swatch(x, y - 66, 'w', a); text('nw', `${nw}`, x + 28, y - 64, '300 40px Inter', INK, a, 'left', 'oak count');
      text('nwl', LABELS.pieces + ' gỗ', x + 100, y - 66, F.unit, INK2, a);
      swatch(x, y - 6, 'c', a); text('nc', `${nc}`, x + 28, y - 4, '300 40px Inter', nc > nw ? ACC : INK, a, 'left', 'copper count');
      text('ncl', LABELS.pieces + ' đồng', x + 100, y - 6, F.unit, INK2, a);
    }
    verdict('vturn', LABELS.turnVerdict, fade(t, T.turn, T.suck - .1, .25, .3));
  }
  // ④ at 55: both readings in one column, larger value on top
  {
    reading('an55', stackAt('an', t), fade(t, C.an_total - .05, T.puck - .5), { side: -1, lift: 40, label: LABELS.anTag, value: vnd(AN.final / 1e9), unit: LABELS.ty,
      extra: `${LABELS.paidAn} · ${AN.wood} gỗ`, valueFont: '200 110px Inter', minY: 130, maxY: 560 });
    reading('binh55', stackAt('binh', t), fade(t, C.binh_total - .05, T.puck - .5), { side: 1, lift: 120, label: LABELS.binhTag, value: vnd(BINH.final / 1e9), unit: LABELS.ty,
      extra: `${LABELS.paidBinh} · ${BINH.wood} gỗ`, valueFont: '200 110px Inter', minY: 300, maxY: 820 });
  }
  // ⑤ the weight: an accent line with a leader to it
  {
    const a = fade(t, T.puck + .25, T.end - .3);
    if (a > .01) {
      const [px, py] = proj(V(PUCK.pos.x, DECK + PUCK.h, PUCK.pos.z)), x = 120, y = 220, w = width(LABELS.puckVerdict, F.verdict);
      plate(x - 24, y - 62, w + 48, 94, a);
      line([[x + w + 22, y - 14], [lerp(x + w + 22, px, eo(a)), lerp(y - 14, py, eo(a))]], a, ACC, 1.6); dot(px, py, a * seg(t, T.puck + .5, T.puck + .7), ACC, 4);
      text('pk', LABELS.puckVerdict, x, y, F.verdict, ACC, a);
    }
  }
  // ⑥ source line: in frame with the data, top right
  text('src', LABELS.source, W - 90, 72, F.src, INK2, fade(t, T.pullBack + .5, DUR + 1), 'right');
  // ⑦ end card, left third
  {
    const a = seg(t, T.end, T.end + .35), b = seg(t, T.end + .2, T.end + .55);
    text('t1', LABELS.title, 120, 560 + rise(a), '600 96px NSerif', INK, a);
    line([[122, 600], [122 + 420 * eo(b), 600]], b, INK, 1.2);
    text('t2', LABELS.titleSub, 120, 652 + rise(b), '500 38px BVP', INK2, b);
  }
  subtitles(t);
}

// ———————— frame ————————
window.DUR = DUR;
window.render = (t) => {
  const age = AGE.age(t);
  set.update(t, age);
  setCamera(t);
  post.composer.render();
  overlay(t, age);
};
// readcheck only needs where the texts are: camera + overlay, no 3D frame
window.TEXTS = (t) => { setCamera(t); overlay(t, AGE.age(t)); return TXT; };
// sound events for mix.py: every landing, the ruler bands, the slider, verdicts, drop-outs, impacts, camera moves
const EV = [
  ...PIECES.map((p) => ({ t: +p.land.toFixed(3), type: 'land', who: p.who, mat: p.mat, band: p.band, k: p.k })),
  ...set.S.legend.map((p) => ({ t: +p.land.toFixed(3), type: 'legend', mat: p.mat })),
  { t: C.an_start, type: 'slide', d: T.age55 - C.an_start },
  { t: T.turn, type: 'turn' }, { t: T.suck, type: 'suck', d: T.age55 - T.suck }, { t: T.age55, type: 'age55' },
  { t: C.gap240 + .3, type: 'verdict' }, { t: T.suck2, type: 'suck', d: T.puck - T.suck2 }, { t: T.puck, type: 'puck' }, { t: T.end, type: 'end' },
  { t: T.pullBack, type: 'whoosh', d: 1.6, v: .5 }, { t: T.turn, type: 'whoosh', d: 2.2, v: .6 }, { t: T.age55 - .2, type: 'whoosh', d: 1.2, v: .5 },
  { t: T.pushIn, type: 'whoosh', d: 1.4, v: .4 }, { t: T.puck + .6, type: 'whoosh', d: 3.0, v: .6 },
].sort((a, b) => a.t - b.t);
window.EV = EV;
window.render(0);
window.READY = true;
