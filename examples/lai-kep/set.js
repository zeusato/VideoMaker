// The physical set: a walnut plank with an inlaid age ruler, two stacks of real pieces (oak = paid in,
// copper = interest, a brass band every 10th piece), a legend tray, a brass slider that marks the age,
// and the brass weight that lands last. Every pose is a pure function of t.
import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { clamp, seg, eo, hash, lerp } from '/core/lib.js';
import { AN_PIECES, BINH_PIECES } from './data.js';
import { T, DUR } from './timeline.js';

export const DECK = .12, CR = .16, TH = .0085, BAND_EVERY = 10;
export const PLANK = { w: 4.4, d: 1.7 };
export const SPOT = { an: new THREE.Vector3(-.5, 0, -.05), binh: new THREE.Vector3(.5, 0, -.05) };
export const LEGEND = { w: new THREE.Vector3(-1.62, 0, .38), c: new THREE.Vector3(-1.2, 0, .38) };
export const PUCK = { pos: new THREE.Vector3(0, 0, .3), r: .27, h: .055 };
const PUCK_TURN = +(new URLSearchParams(location.search).get('pt') ?? .45);
export const RULER = { z: .7, x0: -1.8, x1: 1.8, a0: 25, a1: 55 };
export const ageX = (age) => lerp(RULER.x0, RULER.x1, (age - RULER.a0) / (RULER.a1 - RULER.a0));

// age(t) through the keys, and its inverse for placing each piece in film time
export function makeAge(keys) {
  const age = (t) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      const [t0, a0] = keys[i - 1], [t1, a1] = keys[i];
      if (t <= t1) { const u = (t - t0) / Math.max(1e-6, t1 - t0); return lerp(a0, a1, u * u * (3 - 2 * u) * .35 + u * .65); }
    }
    return keys.at(-1)[1];
  };
  const timeOf = (a) => { let lo = 0, hi = DUR; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; age(m) < a ? lo = m : hi = m; } return hi; };
  return { age, timeOf };
}

// the landing schedule: every piece of both stacks, plus the two legend pieces
export function schedule(AGE, C) {
  const pieces = [];
  for (const [who, list] of [['an', AN_PIECES], ['binh', BINH_PIECES]]) {
    list.forEach((p, k) => {
      const land = AGE.timeOf(p.age);
      pieces.push({ who, k, mat: p.k, land, t0: land - .16, band: (k + 1) % BAND_EVERY === 0,
        jx: (hash(k * 7.3 + (who === 'an' ? 0 : 500)) - .5) * .006, jz: (hash(k * 3.1 + (who === 'an' ? 9 : 77)) - .5) * .006,
        shade: .9 + hash(k * 1.7 + (who === 'an' ? 3 : 41)) * .14 });
    });
  }
  const legend = [{ who: 'legend', k: 0, mat: 'w', land: T.legendWood, t0: T.legendWood - .5, heavy: true, at: LEGEND.w },
    { who: 'legend', k: 0, mat: 'c', land: C.copper, t0: C.copper - .5, heavy: true, at: LEGEND.c }];
  return { pieces, legend };
}
export const landedCount = (pieces, who, t, mat) => pieces.reduce((n, p) => n + (p.who === who && p.land <= t && (!mat || p.mat === mat)), 0);
export const topY = (pieces, who, t) => DECK + landedCount(pieces, who, t) * TH;

async function inlayTexture(AGE_FONT) {
  // 1 px = 1.075 mm across the plank; inlay colour comes from the material, this is the mask
  const W = 4096, H = Math.round(W * PLANK.d / PLANK.w), c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'), px = (v) => (v / PLANK.w + .5) * W, pz = (v) => (v / PLANK.d + .5) * H, mm = W / PLANK.w / 1000;
  x.fillStyle = x.strokeStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
  // the age ruler: a groove, a tick every year, labels every five
  x.lineWidth = 3 * mm; x.beginPath(); x.moveTo(px(RULER.x0 - .05), pz(RULER.z - .05)); x.lineTo(px(RULER.x1 + .05), pz(RULER.z - .05)); x.stroke();
  for (let a = RULER.a0; a <= RULER.a1; a++) {
    const big = a % 5 === 0; x.lineWidth = (big ? 4 : 2) * mm;
    x.beginPath(); x.moveTo(px(ageX(a)), pz(RULER.z - .05)); x.lineTo(px(ageX(a)), pz(RULER.z - .05 + (big ? .07 : .04))); x.stroke();
    if (big) { x.font = `500 ${Math.round(54 * mm)}px JBMono`; x.fillText(String(a), px(ageX(a)), pz(RULER.z + .1)); }
  }
  x.font = `500 ${Math.round(40 * mm)}px JBMono`; x.textAlign = 'left'; x.fillText(AGE_FONT.age.toUpperCase(), px(RULER.x1 + .12), pz(RULER.z + .1)); x.textAlign = 'center';
  // the two spots: a ring, the name, the starting age
  for (const [who, name, from] of [['an', AGE_FONT.an, AGE_FONT.from25], ['binh', AGE_FONT.binh, AGE_FONT.from35]]) {
    const s = SPOT[who]; x.lineWidth = 2.5 * mm; x.beginPath(); x.arc(px(s.x), pz(s.z), (CR + .03) * W / PLANK.w, 0, Math.PI * 2); x.stroke();
    x.font = `600 ${Math.round(70 * mm)}px BVP`; x.fillText(name, px(s.x), pz(s.z + .32));
    x.font = `500 ${Math.round(38 * mm)}px JBMono`; x.fillText(from, px(s.x), pz(s.z + .42));
  }
  // the legend tray
  x.lineWidth = 2 * mm; x.strokeRect(px(LEGEND.w.x - .22), pz(LEGEND.w.z - .2), (LEGEND.c.x - LEGEND.w.x + .44) * W / PLANK.w, .4 * H / PLANK.d);
  x.font = `500 ${Math.round(34 * mm)}px BVP`; x.fillText(AGE_FONT.unit, px((LEGEND.w.x + LEGEND.c.x) / 2), pz(LEGEND.w.z - .27));
  const t = new THREE.CanvasTexture(c); t.anisotropy = 16; return t;
}

function puckTexture(L) {
  const c = document.createElement('canvas'); c.width = c.height = 1024; const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, 1024, 1024); g.strokeStyle = g.fillStyle = '#241605';
  g.lineWidth = 6; g.beginPath(); g.arc(512, 512, 470, 0, Math.PI * 2); g.stroke();
  for (let a = 0; a < 120; a++) { const ang = a / 120 * Math.PI * 2, r1 = a % 10 === 0 ? 412 : 430; g.lineWidth = a % 10 === 0 ? 4 : 2; g.beginPath(); g.moveTo(512 + 446 * Math.sin(ang), 512 + 446 * Math.cos(ang)); g.lineTo(512 + r1 * Math.sin(ang), 512 + r1 * Math.cos(ang)); g.stroke(); }
  g.textAlign = 'center'; g.font = '300 230px Inter'; g.fillText(L.puckTop, 512, 590);
  g.font = '500 64px BVP'; g.fillText(L.puckSub, 512, 720);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; return t;
}

export async function buildSet(scene, LABELS, AGE, C) {
  const hdr = await new RGBELoader().loadAsync('/core/assets/polyhaven/photo_studio_loft_hall_2k.hdr');
  hdr.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = hdr; scene.environmentIntensity = .75; scene.environmentRotation = new THREE.Euler(0, 2.1, 0);

  // a warm key low from the left (long shadows), two cool rims so copper separates from the walnut
  const key = new THREE.DirectionalLight('#fff1dc', 3.2);
  key.position.set(-6.0, 3.6, 2.4); key.castShadow = true; key.shadow.mapSize.set(4096, 4096);
  Object.assign(key.shadow.camera, { left: -3.2, right: 3.2, top: 3.2, bottom: -3.2, near: .5, far: 20 });
  key.shadow.bias = -.00012; key.shadow.normalBias = .003; key.shadow.radius = 3;
  const rim = new THREE.DirectionalLight('#b9d2ff', 2.0); rim.position.set(5.2, 3.0, -5.0);
  const rim2 = new THREE.DirectionalLight('#c6dbff', 1.1); rim2.position.set(4.2, 2.4, 6.0);
  const topL = new THREE.DirectionalLight('#eef2f8', .45); topL.position.set(1.5, 8, 3);
  scene.add(key, key.target, rim, rim2, topL);

  const TL = new THREE.TextureLoader();
  const tex = async (u, srgb, rep) => { const t = await TL.loadAsync(u); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 16; t.repeat.set(...rep); if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  const [wD, wN, wR] = await Promise.all([tex('/core/assets/polyhaven/walnut_diff.jpg', true, [2.4, .9]), tex('/core/assets/polyhaven/walnut_nor.jpg', false, [2.4, .9]), tex('/core/assets/polyhaven/walnut_rough.jpg', false, [2.4, .9])]);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ color: '#bfb8ad', roughness: .94 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const walnut = new THREE.MeshStandardMaterial({ map: wD, normalMap: wN, roughnessMap: wR, roughness: 1, color: '#9c8270', normalScale: new THREE.Vector2(.6, .6) });
  const plank = new THREE.Mesh(new THREE.BoxGeometry(PLANK.w, DECK, PLANK.d), walnut);
  plank.position.y = DECK / 2; plank.castShadow = plank.receiveShadow = true; scene.add(plank);
  const inlay = new THREE.Mesh(new THREE.PlaneGeometry(PLANK.w, PLANK.d), new THREE.MeshStandardMaterial({ color: '#efe4cf', alphaMap: await inlayTexture(LABELS),
    transparent: true, roughness: .55, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false }));
  inlay.rotation.x = -Math.PI / 2; inlay.position.y = DECK + .0005; inlay.receiveShadow = true; scene.add(inlay);

  // —— pieces: oak discs (paid in), copper coins (interest), brass bands every 10th piece ——
  const S = schedule(AGE, C);
  const geo = new THREE.CylinderGeometry(CR, CR, TH * .97, 96);
  // oak pale and matte, copper deep and satin: the two must separate at thumbnail size, from the side too
  const oak = new THREE.MeshStandardMaterial({ color: '#ecd6ae', roughness: .78, metalness: 0 });
  const copper = new THREE.MeshStandardMaterial({ color: '#a4532f', metalness: 1, roughness: .44 });
  const brass = new THREE.MeshStandardMaterial({ color: '#d2b07a', metalness: 1, roughness: .26 });
  const all = [...S.pieces, ...S.legend];
  const groups = { w: all.filter((p) => p.mat === 'w'), c: all.filter((p) => p.mat === 'c') };
  const meshes = {};
  for (const [g, mat] of [['w', oak], ['c', copper]]) {
    const m = new THREE.InstancedMesh(geo, mat, groups[g].length); m.castShadow = m.receiveShadow = true; m.frustumCulled = false;
    groups[g].forEach((p, i) => { p.idx = i; const v = p.shade ?? 1; m.setColorAt(i, new THREE.Color(v, v, v)); });
    m.instanceColor.needsUpdate = true; scene.add(m); meshes[g] = m;
  }
  const bands = S.pieces.filter((p) => p.band);
  const bandMesh = new THREE.InstancedMesh(new THREE.TorusGeometry(CR + .001, .0021, 8, 96), brass, bands.length);
  bandMesh.castShadow = true; bandMesh.frustumCulled = false; scene.add(bandMesh);

  // the brass slider in the ruler groove
  const slider = new THREE.Mesh(new THREE.BoxGeometry(.05, .035, .11), brass); slider.castShadow = true; scene.add(slider);
  // the last object: a brass weight engraved "+3 tỷ"
  const puckTop = new THREE.MeshStandardMaterial({ color: '#dcbd86', map: puckTexture(LABELS), metalness: 1, roughness: .26 });
  const puck = new THREE.Mesh(new THREE.CylinderGeometry(PUCK.r, PUCK.r, PUCK.h, 160), [brass, puckTop, brass]);
  puck.castShadow = puck.receiveShadow = true; scene.add(puck);

  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), ONE = new THREE.Vector3(1, 1, 1), ZERO = new THREE.Vector3();
  const height = {};
  function pose(p, t) {
    if (t < p.t0) return M.compose(P.set(0, -5, 0), Q.identity(), ZERO);
    const base = p.who === 'legend' ? p.at : SPOT[p.who];
    let y = DECK + TH * (p.k + .5), tilt = 0;
    const u = seg(t, p.t0, p.land);
    if (p.heavy) { y += .5 * (1 - u * u); if (t > p.land) y += .004 * Math.exp(-(t - p.land) * 10) * Math.abs(Math.sin((t - p.land) * 30)); tilt = (1 - u) * .25; }
    else y += .05 * (1 - eo(u));
    P.set(base.x + (p.jx ?? 0), y, base.z + (p.jz ?? 0));
    Q.setFromEuler(E.set(tilt, (p.k * 2.399) % (Math.PI * 2), tilt * .5)); return M.compose(P, Q, ONE);
  }
  function update(t, age) {
    for (const g in groups) { for (const p of groups[g]) meshes[g].setMatrixAt(p.idx, pose(p, t)); meshes[g].instanceMatrix.needsUpdate = true; }
    bands.forEach((p, i) => {
      if (t < p.land) { bandMesh.setMatrixAt(i, M.compose(P.set(0, -5, 0), Q.identity(), ZERO)); return; }
      const s = SPOT[p.who]; bandMesh.setMatrixAt(i, M.compose(P.set(s.x + p.jx, DECK + TH * (p.k + .5), s.z + p.jz), Q.setFromEuler(E.set(Math.PI / 2, 0, 0)), ONE));
    });
    bandMesh.instanceMatrix.needsUpdate = true;
    slider.position.set(ageX(age), DECK + .0175, RULER.z - .05);
    // the weight drops from out of frame under gravity, one small bounce
    const t0 = T.puck - .55, u = seg(t, t0, T.puck);
    puck.visible = t > t0;
    let y = DECK + PUCK.h / 2 + 2.4 * (1 - u * u);
    if (t > T.puck) { const b = t - T.puck; y += .01 * Math.exp(-b * 9) * Math.abs(Math.sin(b * 26)); }
    // yaw π/2 puts the engraving upright for a camera in front; turned a little towards the camera on its right
    puck.position.set(PUCK.pos.x, y, PUCK.pos.z); puck.rotation.set(0, Math.PI / 2 + PUCK_TURN + (1 - eo(u)) * .8, 0);
  }
  return { update, S, key };
}
