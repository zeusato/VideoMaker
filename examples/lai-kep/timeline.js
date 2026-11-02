// "Lãi kép" — the single source of timing. 100 BPM, 4/4: a beat is 0.6 s, a bar 2.4 s.
// Voice lines start on the grid (VO). Word-level cues inside a line come from out/cues.json,
// written by tools/voice.mjs from the forced alignment of the recorded narration.
export const BPM = 100, BEAT = 60 / BPM, BAR = BEAT * 4;
export const q = (bar, beat = 0) => +(bar * BAR + beat * BEAT).toFixed(4);

// where each narration line starts (bar, beat); tools/voice.mjs fails if two lines overlap
export const VO = [
  { id: 'l1', at: [0, 1] },
  { id: 'l2', at: [1, 2] },
  { id: 'l3', at: [4, 0] },
  { id: 'l4', at: [5, 3] },
  { id: 'l5', at: [8, 0] },   // "Nhưng" lands on the crossover downbeat
  { id: 'l6', at: [10, 2], pre: .15 },
  { id: 'l7', at: [12, 3] },
  { id: 'l8', at: [14, 3] },
];

// picture beats on the grid
export const T = {
  legendWood: q(0, 0) + .35,  // first frame: a wood piece lands in the legend tray
  pullBack: q(4, 0),          // S2 starts: pull back to the whole plank
  turn: q(8, 0),              // An's copper passes his wood; music goes to 16ths
  suck: q(10, 1.3),           // drop-out before age 55
  age55: q(10, 2),            // the age slider hits 55: first designed impact
  pushIn: q(12, 2),           // S6: push in on the wood-rich bottoms
  suck2: q(14, .3),
  puck: q(14, 1),             // the last object lands: the loudest moment
  end: q(16, 0),              // end card
};
export const DUR = q(18, 0);

// ages the brass slider passes through: [time, age]; the cue names come from the voice
export const AGE_KEYS = (C) => [
  [0, 25], [C.an_start, 25], [C.binh_start, 35], [T.turn, 37.83], [T.age55 - .05, 55], [DUR, 55],
];

// all fixed on-screen text (the font subset takes its characters from here and from the subtitles)
export const LABELS = {
  unit: '1 miếng = 20 triệu',
  wood: 'Gỗ · tiền tự góp', copper: 'Đồng đỏ · tiền lãi', ruler: 'Viền thau · mỗi 10 miếng',
  an: 'AN', binh: 'BÌNH', from25: 'từ 25 tuổi', from35: 'từ 35 tuổi',
  wait: 'Bình chờ đến 35 tuổi',
  rate: 'Lợi nhuận giả định 10%/năm',
  age: 'Tuổi', years: '',
  turnVerdict: '37 tuổi 9 tháng · tiền lãi vượt tiền tự góp',
  anTag: 'An · 55 tuổi', binhTag: 'Bình · 55 tuổi', ty: 'tỷ', pieces: 'miếng',
  paidAn: 'Tự góp 720 triệu', paidBinh: 'Tự góp 480 triệu',
  paidVerdict: 'Tự góp chỉ chênh 240 triệu',
  puckVerdict: 'Bắt đầu sớm 10 năm · hơn 3 tỷ',
  puckTop: '+3 tỷ', puckSub: 'An − Bình',
  title: 'Lãi kép', titleSub: 'Thứ nó cần nhất là thời gian',
  source: 'Ví dụ minh hoạ · góp 2 triệu/tháng, lợi nhuận giả định 10%/năm, lãi gộp hằng tháng · không phải khuyến nghị đầu tư',
};
