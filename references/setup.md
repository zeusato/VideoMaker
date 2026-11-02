# Cài đặt (một lần mỗi máy) và tốc độ render

## Công cụ hệ thống (người dùng tự cài)

- Node 20+ (đã dùng 22).
- **Python 3.11+**: `winget install Python.Python.3.12`. Python của Windows Store chỉ là lối tắt, không dùng được.
- **ffmpeg 7+**: `winget install Gyan.FFmpeg`. Bản `ffmpeg-static` 6.x đi kèm npm **không đủ**, vì `mux.sh` của lemo-opuscar từ chối bản 6.x.
- Git Bash: các script `.sh` chạy bằng `sh` của Git Bash.
- GPU: style 3D cần GPU. Đã chạy trên GTX 1650 Max-Q 4GB, có được nhưng chậm.

Shell của agent có thể chưa nhận PATH mới sau khi cài. Thêm vào đầu mỗi lệnh:

```sh
export PATH="$HOME/AppData/Local/Programs/Python/Python312:$(ls -d "$HOME"/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg*/ffmpeg-*/bin | head -1):$PATH"
```

## Thư viện

```sh
git clone --depth 1 https://github.com/lemomo-ai/lemo-opuscar.git <workspace>/vendor/lemo-opuscar
```

`setup.sh deps` của thư viện viết cho macOS/Linux (gọi `.venv/bin/python`). Trên Windows, chạy từ `$LIB`:

```sh
npm install --no-audit --no-fund
git checkout -- package.json package-lock.json            # npm có thể ghi lại lock file
python -m venv .venv
mkdir -p .venv/bin && printf '#!/bin/sh\nexec "$(dirname "$0")/../Scripts/python.exe" "$@"\n' > .venv/bin/python && chmod +x .venv/bin/python
.venv/bin/python -m pip install -r requirements.txt
export PYTHONUTF8=1 PYTHONIOENCODING=utf-8                # nếu thiếu: fetch.sh lỗi UnicodeEncodeError khi in "↓"
sh tools/fetch.sh hdri
sh tools/fetch.sh instruments vcsl                         # marimba, glockenspiel, vibraphone, harp, gran_cassa
sh tools/fetch.sh instruments vsco2ce                      # horn, timpani, bass_drum, cellos, tubular_bells
sh tools/fetch.sh instruments freepats                     # glass harp
```

Biến môi trường khi render:

- `PLAYWRIGHT_CHROME="C:/Program Files/Google/Chrome/Application/chrome.exe"`: dùng Chrome có sẵn thay cho bản headless shell phải tải về.
- `PYTHONUTF8=1`.

## Bẫy trên Windows

- Đường dẫn có dấu cách (`D:\Dev\Video AI`): luôn đặt trong ngoặc kép. `$(ls …)` sẽ tách sai; truyền từng file một.
- `drawtext` của ffmpeg báo lỗi Fontconfig: bỏ `drawtext` hoặc trỏ `fontfile=`.
- Puppeteer 23 trả ảnh dạng `Uint8Array`: phải bọc `Buffer.from()` trước khi đưa vào pngjs.
- Một tab Chrome chạy nền làm `page.evaluate` bị treo: mở trang so sánh sau cùng, hoặc so sánh pixel ở Node.
- Không xoá được thư mục `out/.video_segs-*` ngay sau khi dừng render: Chrome còn giữ file, đợi vài giây.

## Tốc độ render (đo thật, chưa tối ưu xong)

| Việc | Đo được | Ghi chú |
|---|---|---|
| Một khung 3D final (ssaa 2, GTAO, DOF 96 mẫu, shadow 4096) | khoảng 0,8 s, chạy một mình | GPU là nút thắt |
| 1.036 khung final, 3 worker | 945 s | các worker giành nhau GPU |
| `readcheck` mặc định (bước 0,04 s, mỗi bước dựng lại cả 3D) | khoảng 15 phút | |
| Âm thanh (mix.py + mux) | khoảng 1 phút | |

Đã thêm, **chưa đo**:

- `?q=draft` trong `film.js`: pixel ratio 1, ssaa 1, tắt AO, shadow 2048. Ước tính nhanh hơn khoảng 4 lần. Dùng cho mọi vòng review, final chỉ render một lần.
- `window.TEXTS(t)` chỉ đặt máy quay và vẽ lớp chữ, không dựng 3D. readcheck dự kiến chỉ còn vài chục giây.

Hướng tiếp theo (`ROADMAP.md`):

- Render lại riêng đoạn bị sửa rồi ghép vào.
- Thử 1–2 worker thay vì 3.
- Render preview ở `--size 960x540`.
- Render final trên máy có GPU mạnh hơn.

**Không xem video trong lúc đang render:** trình phát sẽ giật vì GPU và CPU đang bận, dễ tưởng là file lỗi.
