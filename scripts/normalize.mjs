// Vietnamese text normalization for TTS: turns written forms (numbers, %, dates,
// tickers) into the words a news reader would say.
import { readFileSync, existsSync } from 'node:fs';

const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
const GROUPS = ['', 'nghìn', 'triệu', 'tỷ'];
// Letter names as read in Vietnamese news (HPG → "hát pê giê").
const LETTERS = {
  A: 'a', B: 'bê', C: 'xê', D: 'đê', Đ: 'đê', E: 'e', F: 'ép', G: 'giê', H: 'hát', I: 'i', J: 'giây',
  K: 'ca', L: 'lờ', M: 'mờ', N: 'nờ', O: 'o', P: 'pê', Q: 'quy', R: 'rờ', S: 'ét', T: 'tê', U: 'u',
  V: 'vê', W: 'vê kép', X: 'ích', Y: 'i', Z: 'dét',
};

// Reads 0..999. `full` forces "không trăm" / "linh" inside a larger number (1.050 → "một nghìn không trăm năm mươi").
function readTriple(n, full) {
  const h = Math.floor(n / 100), t = Math.floor((n % 100) / 10), u = n % 10;
  const out = [];
  if (h > 0 || full) out.push(DIGITS[h], 'trăm');
  if (t === 0) {
    if (u > 0 && (h > 0 || full)) out.push('linh');
    if (u > 0 || out.length === 0) out.push(DIGITS[u]);
  } else if (t === 1) {
    out.push('mười');
    if (u === 5) out.push('lăm'); else if (u > 0) out.push(DIGITS[u]);
  } else {
    out.push(DIGITS[t], 'mươi');
    if (u === 1) out.push('mốt');
    else if (u === 4) out.push('tư');
    else if (u === 5) out.push('lăm');
    else if (u > 0) out.push(DIGITS[u]);
  }
  return out.join(' ');
}

export function readInteger(n) {
  if (n === 0) return 'không';
  const triples = [];
  for (let x = n; x > 0; x = Math.floor(x / 1000)) triples.push(x % 1000);
  const parts = [];
  for (let i = triples.length - 1; i >= 0; i--) {
    const v = triples[i];
    if (v === 0) continue;
    // Beyond "tỷ", groups repeat: 1.000.000.000.000 = "một nghìn tỷ".
    const unit = i < GROUPS.length ? GROUPS[i] : `${GROUPS[i % 3 || 3]} tỷ`;
    parts.push(readTriple(v, i < triples.length - 1) + (unit ? ` ${unit}` : ''));
  }
  return parts.join(' ');
}

// "1.284,56" → "một nghìn hai trăm tám mươi tư phẩy năm mươi sáu"; "0,05" → "không phẩy không năm".
export function readNumber(s) {
  const [intPart, decPart] = s.split(',');
  let out = readInteger(Number(intPart.replace(/\./g, '')));
  if (decPart) {
    const dec = decPart.startsWith('0') ? [...decPart].map((d) => DIGITS[d]).join(' ') : readInteger(Number(decPart));
    out += ` phẩy ${dec}`;
  }
  return out;
}

const spell = (word) => [...word].map((c) => LETTERS[c] ?? c).join(' ');

export function loadLexicon(file) {
  return file && existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
}

export function normalize(text, lexicon = {}) {
  let s = text;
  // Lexicon first: exact terms the reader should say a specific way.
  for (const [term, spoken] of Object.entries(lexicon)) {
    s = s.replace(new RegExp(`(?<![\\p{L}\\d])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\d])`, 'gu'), spoken);
  }
  // Dates dd/mm/yyyy and dd/mm.
  s = s.replace(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g, (_, d, m, y) => `ngày ${readInteger(+d)} tháng ${readInteger(+m)} năm ${readInteger(+y)}`);
  s = s.replace(/\b(\d{1,2})\/(\d{1,2})\b/g, (_, d, m) => `ngày ${readInteger(+d)} tháng ${readInteger(+m)}`);
  // Numbers in Vietnamese format, optional percent.
  s = s.replace(/(\d{1,3}(?:\.\d{3})+|\d+)(,\d+)?\s?%/g, (_, i, d = '') => `${readNumber(i + d)} phần trăm`);
  s = s.replace(/(\d{1,3}(?:\.\d{3})+|\d+)(,\d+)?/g, (_, i, d = '') => readNumber(i + d));
  // All-caps tokens of 2–4 letters (tickers, acronyms) are spelled out.
  s = s.replace(/(?<![\p{L}])([A-ZĐ]{2,4})(?![\p{L}])/gu, (_, w) => spell(w));
  // A sentence that began with a number now begins with a lowercase word.
  return s.replace(/\s+/g, ' ').trim()
    .replace(/^\p{Ll}/u, (c) => c.toUpperCase())
    .replace(/([.!?]\s+)(\p{Ll})/gu, (_, p, c) => p + c.toUpperCase());
}
