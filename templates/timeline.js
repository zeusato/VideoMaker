// The single source of timing. BPM grid; narration lines start on it (VO); picture beats (T) sit on it.
// Word-level cues come from out/cues.json (scripts/voice.mjs). Never put absolute seconds in the picture code:
// use q(bar, beat), T.*, or the cues.
export const BPM = 100, BEAT = 60 / BPM, BAR = BEAT * 4;
export const q = (bar, beat = 0) => +(bar * BAR + beat * BEAT).toFixed(4);

// one entry per script line, in order; voice.mjs reports OVERLAP and which line to move
export const VO = [
  { id: 'l1', at: [0, 1] },
  { id: 'l2', at: [2, 0] },
];

// picture beats on the grid: the designed impacts, drop-outs (suck), camera turns, the end card
export const T = {
  suck: q(4, 1.3),
  impact: q(4, 2),
  end: q(6, 0),
};
export const DUR = q(8, 0);

// every fixed on-screen string (fonts.mjs subsets the fonts from these and the narration)
export const LABELS = {
  title: 'Tên phim',
  source: 'Nguồn: … · Giấy phép …',
};
