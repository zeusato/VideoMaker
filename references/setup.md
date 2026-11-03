# Cài đặt và tốc độ render

## Bức tranh chung

Skill cần ba lớp. Agent tự cài lớp 2 và 3 bằng `scripts/setup.sh`; lớp 1 thì **hỏi người dùng trước** rồi mới cài.

| Lớp | Gồm | Ai cài | Dung lượng |
|---|---|---|---|
| 1. Công cụ hệ thống | Git, Node 20+, Python 3.11+, ffmpeg 7+, Chrome (không bắt buộc) | Người dùng đồng ý, rồi chạy lệnh `winget` | khoảng 300 MB |
| 2. Engine lemo-opuscar | Hướng dẫn đạo diễn, `core/` (render, âm thanh, mux), `STYLE.md` của 66 style | `setup.sh` (sparse clone) | khoảng 40 MB |
| 3. Gói của engine | npm (`three`, `playwright-core`), Chrome headless shell, Python `.venv` (numpy, scipy, soundfile, soxr, pillow) | `setup.sh deps` | khoảng 350 MB |
| 3b. Tài nguyên lớn, tải khi cần | HDRI cho style 3D; thư viện mẫu nhạc cụ | `setup.sh assets …` | 12 MB đến 1,4 GB |
| 4. Giọng | Key ElevenLabs trong `.env` | Người dùng | — |

Skill này chỉ dùng module có sẵn của Node, không có `package.json` riêng.

## Bố cục thư mục

```
<workspace>/                    thư mục Claude Code đang chạy
├── .env                        ELEVENLABS_API_KEY=…   (không commit, không in ra)
├── vendor/
│   └── lemo-opuscar/           LIB: engine, không sửa core/ hay styles/
│       ├── node_modules/  .venv/          (setup.sh deps)
│       ├── core/assets/polyhaven/         (assets hdri)
│       └── core/audio/instruments/        (assets vcsl, vsco2ce, …)
└── films/
    ├── chon-style.html         trang chọn style (scripts/styles.mjs)
    └── <tên>/                  một thư mục cho mỗi phim (tạo từ templates/)

~/.claude/skills/video-ai/      SKILL: skill này (git clone)
```

- `LIB` mặc định là `<workspace>/vendor/lemo-opuscar`. Dùng chung một thư viện cho nhiều workspace thì đặt biến `LIB` trước khi chạy.
- Phim nằm **ngoài** `LIB`. Lệnh render chạy từ `LIB` với đường dẫn tuyệt đối tới thư mục phim.
- Thư viện là **sparse clone**: có hướng dẫn, `core/` và mọi `STYLE.md`, nhưng không có mã nguồn demo, gallery và ảnh lớn. Mã nguồn demo của một style tải bằng `setup.sh demo <slug>`, và chỉ tải **sau khi** đã viết xong `TREATMENT.md`.
- Clone do `setup.sh` tạo được đánh dấu `videoai.managed`: mỗi lần chạy, `setup.sh` cập nhật nó theo nhánh `main` của thư viện (`reset --hard`, giữ các demo đã tải). Vì vậy không để file của mình trong `LIB`. Thư mục `LIB` do người dùng tự clone thì `setup.sh` dùng nguyên trạng, không cập nhật.
- `setup.sh` tự clone và tự áp sparse thay vì gọi `setup.sh` của thư viện. Lý do: Git Bash tự đổi mẫu `/styleboard/` thành `C:/Program Files/Git/styleboard/` trước khi đưa cho git. `setup.sh` của thư viện chỉ được gọi cho bước `deps`.

## Các bước agent làm ở lần đầu

Chạy từ workspace. `SKILL` là thư mục skill, thường là `~/.claude/skills/video-ai`.

**1. Kiểm tra và tải thư viện** (nhanh, chạy ngay khi nhận yêu cầu làm video):

```sh
sh "$SKILL/scripts/setup.sh"
```

- Thiếu công cụ hệ thống thì lệnh dừng và in danh sách kèm lệnh `winget`. Gộp danh sách đó vào **lượt hỏi brief**: "máy còn thiếu X, Y; cho mình cài bằng `winget install …` nhé?". Người dùng đồng ý thì chạy, rồi chạy lại `setup.sh` trong một shell mới (để nhận PATH mới).
- Dòng cuối in `LIB=…` và `SKILL=…`. Dùng hai giá trị này cho mọi lệnh sau.

**2. Cài gói của engine** (vài phút; chạy nền ngay sau bước 1, trong lúc hỏi brief):

```sh
sh "$SKILL/scripts/setup.sh" deps
```

Trên Windows, lệnh tự tạo `.venv` bằng Python của máy và một shim `.venv/bin/python` để engine (viết cho macOS/Linux) gọi được Python trong `.venv/Scripts`. Cài lại khi `package.json` hay `requirements.txt` của thư viện đổi.

**3. Tài nguyên theo style** (sau khi đã chọn style, chỉ tải cái cần):

```sh
sh "$SKILL/scripts/setup.sh" assets hdri                # style 3D (nhãn "3D" trên trang chọn style)
sh "$SKILL/scripts/setup.sh" assets vcsl vsco2ce        # nhạc cụ mà STYLE.md và cue map cần
```

| Gói | Nội dung | Dung lượng |
|---|---|---|
| `hdri` | HDRI Poly Haven cho ánh sáng 3D | 12 MB |
| `vcsl` | marimba, glockenspiel, vibraphone, harp, gran cassa | 285 MB |
| `vsco2ce` | horn, timpani, bass drum, cello, tubular bells | 414 MB |
| `freepats` | glass harp | 416 MB |
| `karoryfer`, `salamander` | (xem `$LIB/core/audio/INSTRUMENTS.md`) | 78 MB, 229 MB |

`sampler.py` của thư viện báo đúng gói còn thiếu khi một nhạc cụ không có. Mỗi gói cần trống khoảng gấp đôi dung lượng của nó khi giải nén. Tải dở thì chạy lại cùng lệnh, nó tải tiếp.

**4. Key ElevenLabs:** người dùng tạo `<workspace>/.env` với dòng `ELEVENLABS_API_KEY=…`. Key cần quyền `text_to_speech` và `forced_alignment`. Không đọc hay in nội dung file này; chỉ kiểm tra là file có tồn tại.

Muốn cài một lượt thì dùng `sh "$SKILL/scripts/setup.sh" all`: gồm kiểm tra, thư viện, `deps`, và `hdri vcsl vsco2ce freepats` (bộ đã dùng cho phim mẫu, khoảng 1,5 GB).

## Cài skill trên máy mới

```sh
git clone https://github.com/zeusato/VideoMaker.git ~/.claude/skills/video-ai
```

Sau đó, trong workspace, nói với Claude Code: "chuẩn bị máy để làm video". Agent sẽ chạy bước 1–3 ở trên.

## Bẫy trên Windows

- Các script `.sh` chạy bằng `sh` của Git Bash. `scripts/env.sh` (mọi `build.sh` đều nạp file này) tự thêm Python và ffmpeg do winget cài vào PATH, trỏ `PLAYWRIGHT_CHROME` tới Chrome có sẵn, và bật `PYTHONUTF8=1`.
- Python của Microsoft Store chỉ là lối tắt, không dùng được: cài bằng `winget install Python.Python.3.12`.
- Bản `ffmpeg-static` 6.x đi kèm npm **không đủ**, vì `mux.sh` từ chối bản 6.x.
- Thiếu `PYTHONUTF8=1` thì `fetch.sh` lỗi `UnicodeEncodeError` khi in "↓".
- Đường dẫn có dấu cách (`D:\Dev\Video AI`): luôn đặt trong ngoặc kép. `$(ls …)` sẽ tách sai; truyền từng file một.
- `drawtext` của ffmpeg báo lỗi Fontconfig: bỏ `drawtext` hoặc trỏ `fontfile=`.
- Puppeteer 23 trả ảnh dạng `Uint8Array`: phải bọc `Buffer.from()` trước khi đưa vào pngjs.
- Một tab Chrome chạy nền làm `page.evaluate` bị treo: mở trang so sánh sau cùng, hoặc so sánh pixel ở Node.
- Không xoá được thư mục `out/.video_segs-*` ngay sau khi dừng render: Chrome còn giữ file, đợi vài giây.
- GPU: style 3D cần GPU. Đã chạy trên GTX 1650 Max-Q 4GB, được nhưng chậm.

## Tốc độ render (đo thật, chưa tối ưu xong)

| Việc | Đo được | Ghi chú |
|---|---|---|
| Một khung 3D final (ssaa 2, GTAO, DOF 96 mẫu, shadow 4096) | khoảng 0,8 s, chạy một mình | GPU là nút thắt |
| 1.036 khung final, 3 worker | 945 s | các worker giành nhau GPU |
| `readcheck` mặc định (bước 0,04 s, mỗi bước dựng lại cả 3D) | khoảng 15 phút | |
| Âm thanh (mix.py + mux) | khoảng 1 phút | |

Đã thêm, **chưa đo**:

- `?q=draft` trong `film.js`: pixel ratio 1, ssaa 1, tắt AO, shadow 2048. Ước tính nhanh hơn khoảng 4 lần. Dùng cho mọi vòng review; final chỉ render một lần.
- `window.TEXTS(t)` chỉ đặt máy quay và vẽ lớp chữ, không dựng 3D. readcheck dự kiến chỉ còn vài chục giây.

Hướng tiếp theo (`ROADMAP.md`):

- Render lại riêng đoạn bị sửa rồi ghép vào.
- Thử 1–2 worker thay vì 3.
- Render preview ở `--size 960x540`.
- Render final trên máy có GPU mạnh hơn.

**Không xem video trong lúc đang render:** trình phát sẽ giật vì GPU và CPU đang bận, dễ tưởng là file lỗi.
