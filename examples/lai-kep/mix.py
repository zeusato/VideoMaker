"""Lãi kép: score + material foley + narration -> out/mix.wav (and out/stems/).
Reads out/timeline.json (tools/export.mjs), out/cues.json (tools/voice.mjs) and events.json (core/render/events.mjs).
100 BPM, A minor turning to C major at the crossover. Samples: VCSL / VSCO 2 CE / FreePats (CC0); foley is synthesised.
Oak lands with a dry knock, copper rings; every 10th piece (the brass band) plays a pitched note on a pentatonic ladder:
glockenspiel for An, glass harp for Binh, so the count becomes an arpeggio.
"""
import os, sys, json
import numpy as np, soundfile as sf, soxr
from scipy.signal import butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ['LIB']
sys.path.insert(0, LIB)
from core.audio import sampler as S, sfx as X
SR = X.SR
TL = json.load(open(os.path.join(HERE, 'out/timeline.json'), encoding='utf-8'))
CU = json.load(open(os.path.join(HERE, 'out/cues.json'), encoding='utf-8'))
EV = json.load(open(os.path.join(HERE, 'events.json'), encoding='utf-8'))['ev']
DUR, BEAT, BAR, T = TL['DUR'], TL['BEAT'], TL['BAR'], TL['T']
N = int((DUR + 4) * SR)
rng = np.random.default_rng(23); S.seed(23)
MUS, PUL, HIT, FX, BED, VOX = (np.zeros((N, 2)) for _ in range(6))
USED = set()

def sos(kind, f, o=2): return butter(o, f, kind, fs=SR, output='sos')
def lpf(x, f, o=2): return sosfilt(sos('low', min(f, SR * .45), o), x, axis=0)
def hpf(x, f, o=2): return sosfilt(sos('high', f, o), x, axis=0)
def bpf(x, a, b, o=2): return sosfilt(sos('band', [a, min(b, SR * .45)], o), x, axis=0)
def tv(d): return np.arange(int(d * SR)) / SR
def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
NOTE = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}
def mi(n): return 12 * (int(n[-1]) + 1) + NOTE[n[:-1]]
def q(bar, beat=0): return bar * BAR + beat * BEAT
def put(buf, x, at, g=1.0, pan=0.0):
    x = np.asarray(x, np.float64)
    if x.ndim == 2:
        s = int(at * SR)
        if s >= len(buf): return
        if s < 0: x = x[-s:]; s = 0
        e = min(len(buf), s + len(x)); buf[s:e] += x[:e - s] * g
    else: X.add(buf, x, at, g, pan)
def inst(buf, t, name, pitch, dur, vel, g=1.0, pan=0.0, **kw):
    USED.add(name); I = S.load(name)
    x = S.hit(I, pitch, vel, dur) if I.kind == 'hit' else S.note(I, pitch, dur, vel, **kw)
    put(buf, x, t, g, pan)
def adsr(d, a=.005, r=.1):
    n = int(d * SR); e = np.ones(n); na = max(1, int(a * SR)); e[:na] = np.linspace(0, 1, na); nr = min(n, int(r * SR)); e[n - nr:] *= np.linspace(1, 0, nr) ** 1.5; return e
def saw(f, d, det=0.0, nh=30):
    t = tv(d); x = np.zeros_like(t)
    for k in range(1, nh):
        if f * k > 14000: break
        x += np.sin(2 * np.pi * f * (1 + det) * k * t) / k
    return x * .55
def stereo(x, w=.0006): d = int(w * SR); return np.stack([x, np.concatenate([np.zeros(d), x[:-d]]) if d else x], 1)
def bass(m, d, vel=.8, cut=420):
    f = hz(m); x = np.sin(2 * np.pi * f * tv(d)) * .9 + saw(f, d, nh=12) * .55
    x = lpf(x, cut) + .14 * np.tanh(3 * lpf(x, 900))            # 2nd/3rd harmonics so it speaks on phone speakers
    return x * adsr(d, .01, min(.2, d * .4)) * vel * .8
def pad(ms, d, vel=.25, cut=1500, a=.8, r=1.0):
    x = np.zeros(int(d * SR))
    for m in ms:
        for det in (-.003, 0, .0037): x += saw(hz(m), d, det, nh=20)
    return (lpf(x, cut) * .75 + lpf(x, cut * .5) * .25) * adsr(d, a, r) * vel / max(1, len(ms))
def metal_ring(m, vel=.5, d=2.4):
    t = tv(d); f = hz(m)
    return sum(a * np.sin(2 * np.pi * f * r * t + rng.random() * 6) * np.exp(-t / tau) for r, a, tau in [(1, 1, 1.2), (2.76, .5, .7), (5.4, .3, .4), (8.93, .15, .25)]) * vel * .5
def punch(vel=1.0, d=.9):
    t = tv(d)
    b1 = np.sin(2 * np.pi * np.cumsum(66 * (1 + 1.2 * np.exp(-t / .025))) / SR) * np.exp(-t / .26)
    b2 = np.sin(2 * np.pi * np.cumsum(98 * (1 + .8 * np.exp(-t / .02))) / SR) * np.exp(-t / .14) * .6
    kn = bpf(rng.standard_normal(len(t)), 90, 400) * np.exp(-t / .045) * .7
    y = b1 + b2 + kn; return (y + .25 * np.tanh(2.5 * y)) * vel
def air(d, v=1.0, f0=500, f1=2600):
    n = rng.standard_normal(int(d * SR)); out = np.zeros_like(n); blk = 256
    for i in range(0, len(n), blk):
        u = i / len(n); f = f0 * (f1 / f0) ** np.sin(np.pi * u * .5)
        s = max(0, i - 3000); y = sosfilt(sos('band', [f * .7, min(f * 1.4, SR * .45)]), n[s:i + blk]); out[i:i + blk] = y[-(min(blk, len(n) - i)):]
    return out * np.sin(np.pi * np.clip(tv(d) / d, 0, 1)) ** 2 * v

# —— the sound of the materials ——
def knock_oak(v=1.0):
    """An oak disc landing on oak or copper: a short, dry, woody knock (300–900 Hz body, a soft click on top)"""
    d = .09; t = tv(d); p = .9 + rng.random() * .2
    tr = bpf(rng.standard_normal(len(t)), 1500, 6000) * np.exp(-t / .0015) * .5
    body = sum(a * np.sin(2 * np.pi * f * p * t + rng.random() * 6) * np.exp(-t / tau) for f, a, tau in [(420, 1, .028), (780, .55, .018), (1240, .3, .01)])
    return (tr + body) * v
def ring_copper(v=1.0):
    """A copper coin landing on a stack: a bright click and a short inharmonic ring (2–5 kHz)"""
    d = .32; t = tv(d); p = .94 + rng.random() * .12
    tr = hpf(rng.standard_normal(len(t)), 2500) * np.exp(-t / .0012) * .6
    res = sum(a * np.sin(2 * np.pi * f * p * t + rng.random() * 6) * np.exp(-t / tau) for f, a, tau in [(2210, .45, .09), (3480, .35, .07), (4920, .25, .05), (6830, .12, .03)])
    return (tr + res) * v

PENTA = ['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6', 'E6', 'G6', 'A6', 'C7', 'D7', 'E7']
GLASS = ['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6', 'E6']

def foley():
    lands = [e for e in EV if e['type'] == 'land']
    times = np.array([e['t'] for e in lands])
    for e in EV:
        t, ty = e['t'], e['type']
        if ty == 'land':
            # density: landings within ±0.25 s; the faster they come, the quieter each one
            dens = np.count_nonzero(np.abs(times - t) < .25) / .5
            g = .6 / np.sqrt(max(1.0, dens / 6))
            pan = -.28 if e['who'] == 'an' else .28
            put(FX, knock_oak(.9) if e['mat'] == 'w' else ring_copper(.8), t, g * (.8 + .2 * rng.random()), pan)
            if e['band']:
                h = (e['k'] + 1) // 10 - 1
                if e['who'] == 'an': inst(FX, t, 'glockenspiel', PENTA[h % len(PENTA)], .6, .42, .26, pan)
                else: inst(FX, t, 'glass', GLASS[h % len(GLASS)], .8, .5, .32, pan)
        elif ty == 'legend':
            # the two legend pieces: a heavy single landing with a small bounce (the first sound of the film)
            x = knock_oak(1.0) if e['mat'] == 'w' else ring_copper(1.0)
            put(FX, x, t, 1.0, -.1); put(FX, x * .3, t + .07, .6, -.1); put(FX, x * .1, t + .12, .5, -.1)
            put(HIT, stereo(lpf(punch(.25, .4), 300)), t, .3)
        elif ty == 'slide':
            # the brass slider in its groove: a faint felt-on-wood friction under the journey
            d = e['d']; n = bpf(rng.standard_normal(int(d * SR)), 300, 1800) * .05
            put(FX, stereo(n * np.sin(np.pi * np.clip(tv(d) / d, 0, 1)) ** .3), t, .5)
        elif ty == 'whoosh':
            put(FX, stereo(air(e['d'], e.get('v', .6), 380, 1800)), t, .32)
        elif ty == 'turn':
            # copper passes oak: horns swell to C major, the glockenspiel lights up, a timpani on C
            for m, p in (('C3', -.3), ('E3', 0), ('G3', .3)): inst(HIT, t, 'horn', m, 2.6, .7, .45, p, attack=.15)
            inst(HIT, t, 'timpani', 'C3', 1.8, .7, .6); inst(HIT, t + .02, 'glockenspiel', 'E6', 1.2, .55, .3, .4)
            put(HIT, metal_ring(mi('C5'), .4, 2.2), t, .2)
        elif ty == 'age55':
            # the slider hits 55: first designed impact
            put(HIT, stereo(punch(1.0)), t, .9)
            inst(HIT, t, 'bass_drum', None, None, .9, .8); inst(HIT, t, 'timpani', 'C3', 2.4, .9, .9)
            for m, p in (('C3', -.3), ('G3', 0), ('E4', .3)): inst(HIT, t, 'horn', m, 2.4, .8, .5, p)
            put(HIT, metal_ring(mi('C5'), .45, 2.4), t, .25)
        elif ty == 'verdict':
            inst(HIT, t, 'vibraphone_hard', 'E5', 1.2, .45, .45, .2); inst(HIT, t, 'vibraphone', 'C5', 1.6, .42, .42, -.2)
        elif ty == 'puck':
            # the last object: the brass weight — the heaviest hit in the film
            put(HIT, stereo(punch(1.2)), t, 1.0)
            inst(HIT, t, 'bass_drum', None, None, 1.0, .9); inst(HIT, t, 'gran_cassa', 'hit', None, .9, .6); inst(HIT, t, 'timpani', 'C3', 3.0, 1.0, .9)
            inst(HIT, t, 'tubular_bells', 'C5', 4.0, .8, .55, .15); inst(HIT, t, 'tubular_bells', 'G4', 4.0, .6, .4, -.2)
            put(HIT, metal_ring(mi('C4'), .9, 4.0), t, .35); put(HIT, metal_ring(mi('G4') + .1, .4, 3.0), t, .3)
            for k in range(5): put(FX, ring_copper(.6 / (k + 1)), t + .07 + k * .055 * (1 - k * .1), .4)
        elif ty == 'end':
            inst(HIT, t, 'harp', 'C4', 3, .45, .45, -.3)

def score():
    # one chord per bar: A minor while the interest is invisible, C major from the crossover (bar 8)
    CH = {0: ['A2', 'E3', 'B3'], 1: ['F2', 'C3', 'A3'], 2: ['C3', 'G3', 'E4'], 3: ['G2', 'D3', 'B3'],
          4: ['A2', 'E3', 'C4'], 5: ['F2', 'C3', 'A3'], 6: ['C3', 'G3', 'E4'], 7: ['G2', 'D3', 'B3'],
          8: ['C3', 'G3', 'E4'], 9: ['G2', 'D3', 'B3'], 10: ['C3', 'G3', 'E4'], 11: ['A2', 'E3', 'C4'], 12: ['F2', 'C3', 'A3'],
          13: ['G2', 'D3', 'B3'], 14: ['C3', 'G3', 'E4'], 15: ['F2', 'C3', 'A3'], 16: ['C3', 'G3', 'E4'], 17: ['C3', 'G3', 'E4'], 18: ['C3', 'G3', 'E4'], 19: ['C3', 'G3', 'E4']}
    ROOT = {b: ch[0] for b, ch in CH.items()}
    nbars = int(DUR / BAR) + 1
    # 1) the bed: synth pad + bowed vibraphone (A3 and above only)
    for b in range(nbars):
        t = q(b); d = BAR + .4
        if b == 10: d = BAR * .5                                   # leave the drop-out before age 55
        put(MUS, stereo(pad([mi(n) for n in CH[b]], d, .28 if b < 4 else .34, 1200 if b < 8 else 1900)), t, .9)
        for n in [n for n in CH[b] if mi(n) >= mi('A3')]: inst(MUS, t, 'vibraphone_bowed', n, d, .38, .33, rng.uniform(-.4, .4), attack=.3)
    # 2) the legend bars: a sparse harp + glass motif, the pieces' own knocks carry the rhythm
    for i, (b, bt, n) in enumerate([(0, 2, 'E5'), (1, 0, 'C5'), (1, 2, 'A4'), (2, 0, 'G4'), (2, 2, 'C5'), (3, 0, 'D5'), (3, 2, 'B4')]):
        inst(MUS, q(b, bt), 'glass', n, 1.4, .42, .36, -.3 + .1 * i)
        inst(MUS, q(b, bt), 'harp', n[:-1] + str(int(n[-1]) - 1), 1.4, .34, .25, .3)
    # 3) the journey: pulse bass + marimba; 8ths while the interest is small, 16ths from the crossover
    for b in range(4, 14):
        if b == 10: continue                                       # the age-55 bar starts with the drop-out
        sub = .5 if 8 <= b < 10 else 1
        k = 0
        while k * sub < 4:
            if not (b == 13 and k * sub >= 2):
                put(PUL, stereo(bass(mi(ROOT[b]) - 12, BEAT * sub * .9, .55 if (k * sub) % 1 == 0 else .4)), q(b, k * sub), 1.0)
            k += 1
        arp = [mi(n) + 12 for n in CH[b]] + [mi(CH[b][1]) + 24]
        div = .25 if 8 <= b < 10 else .5
        k = 0
        while k * div < 4:
            if b == 13 and k * div >= 2: break
            m = arp[(k * 3) % len(arp)] if b >= 11 else arp[k % len(arp)]
            inst(PUL, q(b, k * div), 'marimba', int(m), .4, .42 if k % 2 == 0 else .3, .5, .35 if k % 2 else -.35)
            k += 1
    # 4) "lúc đầu, lãi gần như không thấy": a held horn A3 under the slow years
    inst(MUS, q(6, 0), 'horn', 'A3', BAR * 1.8, .32, .28, -.2, attack=.5)
    # 5) after 55: wide chord on horns and cellos under the comparison
    for n, p in (('C3', -.3), ('G3', 0), ('E4', .3)): inst(MUS, q(11, 0), 'horn', n, BAR * 1.5, .45, .3, p, attack=.5)
    inst(MUS, q(11, 0), 'cellos', 'C3', BAR * 2.5, .42, .28, -.2, attack=.6)
    # 6) the end: harp arpeggio after the weight, bowed vibraphone under the end card
    for i, n in enumerate(['C4', 'E4', 'G4', 'C5', 'D5', 'E5', 'G5', 'C6']):
        inst(MUS, T['puck'] + .9 + i * BEAT * .5, 'harp', n, 2.4, .45, .45, -.3 + .08 * i)
    inst(MUS, T['end'], 'vibraphone_bowed', 'E5', 4.0, .42, .38, 0, attack=.4)
    inst(MUS, T['end'], 'vibraphone_bowed', 'C5', 4.0, .38, .34, 0, attack=.4)

def bed():
    n = rng.standard_normal(N); b = lpf(np.cumsum(n) / 200, 300)
    a = lpf(hpf(n, 200), 3000)
    BED[:] += stereo(b / (np.abs(b).max() + 1e-9) * .4 + a / (np.abs(a).max() + 1e-9) * .25)[:N] * .5

def voice():
    for l in CU['lines']:
        f = os.path.join(HERE, l['wav'])
        if CU.get('estimated') or not os.path.exists(f): continue
        x, sr = sf.read(f)
        if x.ndim > 1: x = x.mean(1)
        x = soxr.resample(x, sr, SR); x = hpf(x, 90)
        x = X.compress(x / (np.abs(x).max() + 1e-9) * .9, thr=.22, ratio=3.2, att=.003, rel=.09)
        put(VOX, stereo(x, .0002), l['start'])

def lufs(x):
    import subprocess, tempfile, re
    f = os.path.join(tempfile.mkdtemp(), 'm.wav'); sf.write(f, x.astype(np.float32), SR)
    out = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', f, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(re.findall(r'I:\s+(-?[\d.]+) LUFS', out)[-1])
def true_peak(x): return float(np.abs(soxr.resample(x, SR, 4 * SR)).max())
def tp_limit(x, ceil):
    from scipy.ndimage import maximum_filter1d, uniform_filter1d
    up = np.abs(soxr.resample(x, SR, 4 * SR)).max(1); n = len(x)
    pk = np.pad(up, (0, max(0, n * 4 - len(up))))[:n * 4].reshape(-1, 4).max(1)
    g0 = np.minimum(1.0, ceil / np.maximum(pk, 1e-9)); look = int(.004 * SR)
    g = uniform_filter1d(-maximum_filter1d(-g0, 2 * look + 1), look); g = np.minimum(g, -maximum_filter1d(-g0, 3))
    return x * g[:, None]
def rms(x): return float(np.sqrt(np.mean(x ** 2) + 1e-12))

def main():
    score(); foley(); bed(); voice()
    from scipy.ndimage import uniform_filter1d, maximum_filter1d
    mus = S.room(MUS, .6, .24); pul = S.room(PUL, .35, .15); hit = S.room(HIT, .7, .26); fx = S.room(FX, .25, .1)
    v = np.abs(VOX).mean(1)
    has_voice = v.max() > 0
    env = uniform_filter1d(maximum_filter1d(v, int(.12 * SR)), int(.15 * SR)); env = np.clip(env / (env.max() + 1e-9) * 3, 0, 1)
    # drop-outs: music and foley fall away together before age 55 and before the weight lands
    for a_, b_ in ((T['suck'], T['age55'] - .01), (T['suck2'], T['puck'] - .01)):
        i0, i1 = int(a_ * SR), int(b_ * SR); f = int(.08 * SR)
        g = np.ones(N); g[i0:i0 + f] = np.linspace(1, .03, f); g[i0 + f:i1] = .03
        for buf in (mus, pul, fx): buf *= g[:, None]
        hit *= np.where(np.arange(N)[:, None] < i1, np.maximum(g, .2)[:, None], 1)
    def act(x):
        m = x.mean(1); w = int(.05 * SR); n_ = len(m) // w; r = np.sqrt((m[:n_ * w].reshape(n_, w) ** 2).mean(1)); on = r > r.max() * .03
        return float(np.sqrt((r[on] ** 2).mean()))
    vr = rms(VOX[env > .5]) if has_voice else act(mus) * 10 ** (9.5 / 20)
    # levels: music ~10 dB under the voice, foley ~ -8 dB, impacts ~ -3 dB, studio air far under
    g_mus = vr / act(mus) * 10 ** (-9.5 / 20); g_pul = vr / act(pul) * 10 ** (-10.5 / 20)
    g_fx = vr / act(fx) * 10 ** (-8 / 20); g_hit = vr / act(hit) * 10 ** (-3 / 20); g_bed = vr / act(BED) * 10 ** (-27 / 20)
    duck = lambda k: (1 - k * env)[:, None]
    stems = {'music': mus * g_mus * duck(.4), 'pulse': pul * g_pul * duck(.3), 'fx': fx * g_fx * duck(.15), 'hits': hit * g_hit, 'beds': BED * g_bed, 'voice': VOX}
    shelf = 10 ** (-5 / 20)
    for k in ('music', 'pulse', 'hits', 'beds', 'fx'):
        x = hpf(stems[k], 44 if k == 'hits' else 36, 4 if k == 'hits' else 2); stems[k] = x - (1 - shelf) * lpf(x, 62, 2)
    bus = stems['music'] + stems['pulse'] + stems['fx'] + stems['beds']
    lvl = np.sqrt(uniform_filter1d((bus ** 2).max(1), int(.012 * SR))); thr = 10 ** (-12 / 20) * np.percentile(lvl, 99.9)
    g = np.where(lvl > thr, (thr + (lvl - thr) / 2.5) / np.maximum(lvl, 1e-9), 1.0); g = uniform_filter1d(-maximum_filter1d(-g, int(.008 * SR)), int(.03 * SR))
    mix = (bus * g[:, None] + stems['hits'] + stems['voice'])[:int(DUR * SR)]
    fade = int(.8 * SR); mix[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 1.5
    for _ in range(3):
        I = lufs(mix); mix = mix * 10 ** ((-14.4 - I) / 20); mix = tp_limit(mix, 10 ** (-4.6 / 20))
    print(f'master: {lufs(mix):.2f} LUFS, true peak {20 * np.log10(true_peak(mix)):.2f} dBTP' + ('' if has_voice else '  (no voice yet: estimated timeline)'))
    os.makedirs(os.path.join(HERE, 'out/stems'), exist_ok=True)
    sf.write(os.path.join(HERE, 'out/mix.wav'), mix.astype(np.float32), SR)
    for name, b in stems.items(): sf.write(os.path.join(HERE, 'out/stems', name + '.wav'), b[:int(DUR * SR)].astype(np.float32), SR)
    for k in ('music', 'pulse', 'fx', 'hits', 'beds'):
        print(f'  {k:6s} {20 * np.log10(act(stems[k][:int(DUR * SR)]) / vr):+.1f} dB vs voice')
    json.dump(sorted(USED), open(os.path.join(HERE, 'out/instruments.json'), 'w'))
    for line in S.credits(sorted(USED)): print('  credit:', line)

if __name__ == '__main__':
    main()
