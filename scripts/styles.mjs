// Style picker: one HTML page with every lemo-opuscar style (frame, 720p demo film, what it suits, 2D or 3D),
// the agent's shortlist for this film on top, filters, and a button that copies "Chọn style: <slug>" for the chat.
// The list comes from $LIB/styles/*/style.json; Vietnamese names and lines from references/styles-vi.json.
// Frames and films stream from the library's gallery (lemomo-ai.github.io/lemo-opuscar): the page needs the internet.
// Usage: node styles.mjs [--lib <LIB>] [--out films/chon-style.html] [--topic "…"] [--size 1080x1920]
//                        [--pick "slug=lý do|slug=lý do"]
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILL = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const LIB = path.resolve(opt('--lib', process.env.LIB || 'vendor/lemo-opuscar'));
const OUT = path.resolve(opt('--out', 'films/chon-style.html'));
const SITE = 'https://lemomo-ai.github.io/lemo-opuscar';
if (!existsSync(path.join(LIB, 'styles'))) { console.error(`no styles in ${LIB}: run setup.sh first, or pass --lib`); process.exit(2); }

const vi = JSON.parse(readFileSync(path.join(SKILL, 'references/styles-vi.json'), 'utf8'));
const styles = readdirSync(path.join(LIB, 'styles')).filter(s => !s.startsWith('_') && existsSync(path.join(LIB, 'styles', s, 'style.json')))
  .map(s => {
    const j = JSON.parse(readFileSync(path.join(LIB, 'styles', s, 'style.json'), 'utf8')), v = vi.styles[s] || {};
    return {
      slug: s, en: j.en, vi: v.vi || j.en, cat: vi.categories[j.category_en] || j.category_en, catEn: j.category_en,
      kind: v.kind || '?', line: v.line || j.line, uses: v.uses || j.uses.join(', '), film: j.film, dur: j.dur,
      material: ['Edit & Documentary', 'Evidence Films'].includes(j.category_en),
    };
  });
const bySlug = Object.fromEntries(styles.map(s => [s.slug, s]));
const pick = (opt('--pick', '') || '').split('|').map(x => x.trim()).filter(Boolean).map(x => {
  const [slug, ...why] = x.split('='); return { slug: slug.trim(), why: why.join('=').trim() };
});
for (const p of pick) if (!bySlug[p.slug]) { console.error(`--pick: no style "${p.slug}"`); process.exit(2); }
const missing = styles.filter(s => !vi.styles[s.slug]).map(s => s.slug);
if (missing.length) console.log(`no Vietnamese entry yet (shown in English): ${missing.join(', ')}`);

const data = { site: SITE, topic: opt('--topic', ''), size: opt('--size', ''), pick, styles,
  cats: [...new Set([...Object.values(vi.categories), ...styles.map(s => s.cat)])].filter(c => styles.some(s => s.cat === c)) };
const json = JSON.stringify(data).replace(/</g, '\\u003c');

const html = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Chọn style video</title>
<style>
:root{--bg:#f6f4ef;--card:#fff;--ink:#1d1c1a;--mute:#6b675f;--line:#e2ddd2;--acc:#c2410c;--acc-ink:#fff;--chip:#ece7dc;--shadow:0 1px 2px rgba(0,0,0,.06),0 4px 16px rgba(0,0,0,.05)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#151412;--card:#201f1c;--ink:#efece6;--mute:#a19b90;--line:#34312c;--acc:#fb923c;--acc-ink:#1a1206;--chip:#2b2925;--shadow:none}}
:root[data-theme="dark"]{--bg:#151412;--card:#201f1c;--ink:#efece6;--mute:#a19b90;--line:#34312c;--acc:#fb923c;--acc-ink:#1a1206;--chip:#2b2925;--shadow:none}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,"Segoe UI",Roboto,sans-serif}
.wrap{max-width:1280px;margin:0 auto;padding:24px 16px 64px}
h1{font-size:26px;margin:0 0 4px}h2{font-size:18px;margin:32px 0 12px}
.sub{color:var(--mute);margin:0}.note{color:var(--mute);font-size:13px;margin-top:8px}
.bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:20px 0 8px}
input[type=search]{flex:1 1 220px;padding:9px 12px;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--ink);font:inherit}
.chip{border:1px solid var(--line);background:var(--chip);color:var(--ink);border-radius:999px;padding:5px 12px;font:inherit;font-size:13px;cursor:pointer}
.chip[aria-pressed=true]{background:var(--acc);border-color:var(--acc);color:var(--acc-ink)}
.cats{display:flex;flex-wrap:wrap;gap:6px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;overflow:hidden;cursor:pointer;box-shadow:var(--shadow);display:flex;flex-direction:column;text-align:left;padding:0;color:inherit;font:inherit}
.card:hover,.card:focus-visible{border-color:var(--acc);outline:none}
.card img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block;background:var(--chip)}
.card .b{padding:10px 12px 12px;display:flex;flex-direction:column;gap:4px}
.name{font-weight:650}.en{color:var(--mute);font-size:12px}
.line{font-size:13px;color:var(--mute);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:2px}.tag{font-size:11px;padding:1px 7px;border-radius:4px;background:var(--chip);color:var(--mute)}
.tag.k3{background:#7c3aed22;color:#7c3aed}.tag.mat{background:#0e749022;color:#0e7490}
.pick .card{border-color:var(--acc);border-width:2px}.why{font-size:13px;margin-top:4px}
.count{color:var(--mute);font-size:13px;margin:8px 0}
dialog{border:none;border-radius:14px;padding:0;max-width:min(960px,calc(100vw - 32px));width:100%;background:var(--card);color:var(--ink)}
dialog::backdrop{background:rgba(0,0,0,.6)}
dialog video{width:100%;display:block;background:#000;max-height:60vh}
dialog .b{padding:14px 18px 18px}.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:12px}
.btn{border:none;border-radius:8px;padding:9px 16px;font:inherit;font-weight:600;cursor:pointer;background:var(--acc);color:var(--acc-ink)}
.btn.ghost{background:var(--chip);color:var(--ink)}
code{background:var(--chip);padding:2px 6px;border-radius:4px;font-size:13px}
.toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:var(--ink);color:var(--bg);padding:10px 16px;border-radius:8px;opacity:0;transition:opacity .2s;pointer-events:none;max-width:calc(100vw - 32px)}
.toast.on{opacity:1}
</style></head><body><div class="wrap">
<h1>Chọn style cho video</h1>
<p class="sub" id="topic"></p>
<p class="note">Bấm một thẻ để xem phim mẫu của style đó, rồi bấm <b>Chọn style này</b> và dán vào khung chat. Phim mẫu là phim demo của thư viện lemo-opuscar: video của bạn giữ ngôn ngữ hình ảnh và âm thanh, nhưng câu chuyện, bố cục và cú máy sẽ khác. Ảnh và phim tải từ mạng.</p>
<section id="pickSec" hidden><h2>Gợi ý cho video này</h2><div class="grid pick" id="pick"></div></section>
<h2>Tất cả style</h2>
<div class="bar"><input type="search" id="q" placeholder="Tìm: tài chính, trẻ em, bản tin, 3D…">
<button class="chip" data-kind="2d" aria-pressed="false">Chỉ 2D (máy yếu)</button>
<button class="chip" data-kind="3d" aria-pressed="false">Chỉ 3D (cần GPU)</button>
<button class="chip" id="noMat" aria-pressed="false">Không cần tư liệu thật</button></div>
<div class="cats" id="cats"></div>
<p class="count" id="count"></p>
<div class="grid" id="grid"></div>
</div>
<dialog id="dlg"><video id="vid" controls playsinline preload="none"></video><div class="b">
<div class="name" id="dName" style="font-size:20px"></div><div class="en" id="dEn"></div>
<p id="dLine"></p><div class="tags" id="dTags"></div>
<div class="row"><button class="btn" id="choose">Chọn style này</button><button class="btn ghost" id="close">Đóng</button>
<span class="en">hoặc gõ vào chat: <code id="dCode"></code></span></div></div></dialog>
<div class="toast" id="toast"></div>
<script id="data" type="application/json">${json}</script>
<script>
const D = JSON.parse(document.getElementById('data').textContent);
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const img = s => D.site + '/img/' + s.slug + '_0.jpg';
const alt = s => 'https://raw.githubusercontent.com/lemomo-ai/lemo-opuscar/main/docs/frames/' + s.slug + '.jpg';
const tags = s => '<span class="tag">' + esc(s.cat) + '</span>' +
  (s.kind === '3d' ? '<span class="tag k3">3D · cần GPU</span>' : s.kind === '2d' ? '<span class="tag">2D</span>' : '') +
  (s.material ? '<span class="tag mat">cần tư liệu thật</span>' : '') +
  (s.dur ? '<span class="tag">mẫu ' + Math.round(s.dur) + ' giây</span>' : '');
const card = (s, why) => '<button class="card" data-slug="' + s.slug + '"><img loading="lazy" alt="" src="' + img(s) + '" onerror="this.onerror=null;this.src=\\'' + alt(s) + '\\'">' +
  '<div class="b"><div class="name">' + esc(s.vi) + '</div><div class="en">' + esc(s.en) + ' · <code>' + s.slug + '</code></div>' +
  (why ? '<div class="why"><b>Vì sao:</b> ' + esc(why) + '</div>' : '<div class="line">' + esc(s.line) + '</div>') +
  '<div class="line"><b>Hợp với:</b> ' + esc(s.uses) + '</div><div class="tags">' + tags(s) + '</div></div></button>';
const by = Object.fromEntries(D.styles.map(s => [s.slug, s]));
$('topic').textContent = [D.topic && 'Video: ' + D.topic, D.size && 'Khổ: ' + D.size].filter(Boolean).join(' · ');
if (D.pick.length) { $('pickSec').hidden = false; $('pick').innerHTML = D.pick.map(p => card(by[p.slug], p.why)).join(''); }
let cat = '', kind = '', noMat = false;
$('cats').innerHTML = ['Tất cả', ...D.cats].map((c, i) => '<button class="chip" data-cat="' + (i ? esc(c) : '') + '" aria-pressed="' + !i + '">' + esc(c) + '</button>').join('');
const fold = s => s.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();
function draw() {
  const q = fold($('q').value.trim());
  const list = D.styles.filter(s => (!cat || s.cat === cat) && (!kind || s.kind === kind) && (!noMat || !s.material) &&
    (!q || fold([s.vi, s.en, s.slug, s.cat, s.catEn, s.line, s.uses, s.kind].join(' ')).includes(q)));
  $('grid').innerHTML = list.map(s => card(s)).join('');
  $('count').textContent = list.length + ' / ' + D.styles.length + ' style';
}
$('cats').onclick = e => { const b = e.target.closest('[data-cat]'); if (!b) return; cat = b.dataset.cat;
  $('cats').querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', x === b)); draw(); };
document.querySelectorAll('[data-kind]').forEach(b => b.onclick = () => { kind = kind === b.dataset.kind ? '' : b.dataset.kind;
  document.querySelectorAll('[data-kind]').forEach(x => x.setAttribute('aria-pressed', x.dataset.kind === kind)); draw(); });
$('noMat').onclick = () => { noMat = !noMat; $('noMat').setAttribute('aria-pressed', noMat); draw(); };
$('q').oninput = draw;
let cur = null;
document.addEventListener('click', e => { const c = e.target.closest('.card'); if (!c) return; open(by[c.dataset.slug]); });
function open(s) {
  cur = s; $('dName').textContent = s.vi; $('dEn').textContent = s.en + ' · phim mẫu "' + s.film + '"';
  $('dLine').textContent = s.line; $('dTags').innerHTML = tags(s) + '<span class="tag">hợp với: ' + esc(s.uses) + '</span>';
  $('dCode').textContent = msg(s); const v = $('vid'); v.poster = img(s); v.src = D.site + '/films/' + s.slug + '.mp4';
  $('dlg').showModal(); v.play().catch(() => {});
}
const msg = s => 'Chọn style: ' + s.slug + ' (' + s.vi + ')';
const shut = () => { const v = $('vid'); v.pause(); v.removeAttribute('src'); v.load(); $('dlg').close(); };
$('close').onclick = shut; $('dlg').addEventListener('cancel', e => { e.preventDefault(); shut(); });
$('dlg').onclick = e => { if (e.target === $('dlg')) shut(); };
$('choose').onclick = async () => {
  let ok = true; try { await navigator.clipboard.writeText(msg(cur)); } catch { ok = false; }
  const t = $('toast'); t.textContent = ok ? 'Đã chép: "' + msg(cur) + '". Dán vào khung chat.' : 'Gõ vào chat: ' + msg(cur);
  t.classList.add('on'); setTimeout(() => t.classList.remove('on'), 3500);
};
draw();
</script></body></html>
`;
mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, html);
console.log(`${styles.length} styles${pick.length ? `, shortlist: ${pick.map(p => p.slug).join(', ')}` : ''} → ${OUT}`);
