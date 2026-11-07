# Dùng lemo-opuscar trong skill này

lemo-opuscar (github.com/lemomo-ai/lemo-opuscar, MIT; phim demo CC BY 4.0) là **engine và bộ nghề** của quy trình. Skill này không sao chép nó: `scripts/setup.sh` clone về `<workspace>/vendor/lemo-opuscar` (sparse) và mọi lệnh tham chiếu tới đó bằng biến `LIB` (`references/setup.md`).

## Đọc gì, khi nào

| Lúc | Đọc |
|---|---|
| Trước mọi thứ | `$LIB/AGENTS.md`, `$LIB/DIRECTOR.md`, `$LIB/TECHNIQUE.md` |
| Chọn style | `references/styles.md` (trang chọn style cho người dùng), rồi `$LIB/styles/<slug>/STYLE.md` |
| Sau khi đã có TREATMENT.md | `$LIB/styles/<slug>/DEMO.md` và `demo/` (chỉ để học kỹ thuật) |
| Tra lệnh | `$LIB/core/README.md` |
| Viết nhạc | `$LIB/core/audio/INSTRUMENTS.md` (tên nhạc cụ, quãng, giấy phép) |

## Luật của thư viện cần giữ

- **Không sửa `core/` hay `styles/`.** Dự án nằm ở `films/<tên>/`, ngoài `LIB`.
- Công cụ render gắn thư mục phim vào `/@film/`. Trong trang, tài nguyên của thư viện gọi bằng đường dẫn tuyệt đối: `/core/lib.js`, `/core/three/post.js`, `/node_modules/three/...`, `/core/assets/polyhaven/...`.
- Hợp đồng của trang:
  - `window.DUR`.
  - `window.render(t)`, phải tất định.
  - `window.READY = true` sau khi tải xong.
  - `window.EV`: sự kiện âm thanh.
  - `window.TEXTS(t)`: chữ đang hiện, dùng cho readcheck.
- Chạy công cụ từ `$LIB`: `node core/render/still.mjs <project> <t…>`, `video.mjs`, `events.mjs`, `readcheck.mjs`, `sh core/render/mux.sh`.
- Phim của người dùng **không** có credit LemoLab hay chữ ký "LemoLab × Claude" (DIRECTOR §11).
- Trước khi giao, so với demo: trong 6 yếu tố (cấu trúc, mở đầu, cú máy đặc trưng, đường máy quay, hình dạng nhạc, kết) phải khác ít nhất 4.

## Khai thác hết thư viện: danh sách soát

Gọi thẳng vào `$LIB` thay vì cài plugin `lemo-opuscar`, vì hai skill cùng nhận yêu cầu "làm video" sẽ giành nhau. Đổi lại, mỗi phim phải tự soát những phần sau. Các phim đã làm từng bỏ sót chúng.

- **`STYLE.md` §9 (Pitfalls) và §5, §7 đọc như luật, không phải gợi ý.** Ở style riso, §9 đã viết sẵn cách xuất gọn (xem mục dưới). ct01 và ct02 bỏ qua mục này, ct03 làm theo.
- **Công cụ trong `demo/tools/` của style** (ví dụ riso: `video_png.mjs`, `mux.sh`, `subs.py`). Được chép vào phim sau khi đã có treatment. Chúng thay bản mặc định của `core/` khi style cần.
- **Model sheet** (`demo/sheet.js`): render nhân vật và bảng mực trước khi dựng, theo DIRECTOR §5.
- **`core/tts/asr_check.py`**: dùng Whisper soát lại giọng thu. Cần chạy `setup.sh deps voice` (cài faster-whisper). Chạy với `--lang auto`, vì công cụ này không có chế độ riêng cho tiếng Việt, rồi tự xem `words.json`.
- **`LEMO_COLOR=bt709`** cho `mux.sh`: xuất yuv420p limited range BT.709. Mặc định là full range kiểu yuvj420p, dễ lệch màu khi Facebook, TikTok hay YouTube nén lại.
- **`MY-STYLES.md`**: lưu một style đã chỉnh thành style riêng ở `~/lemo-my-styles/`. Hợp khi series có khuôn hình cố định.
- **`core/audio/pluck.py`** (cần `deps music`), **`sfx.py`**, **`INSTRUMENTS.md`**: dùng cho nhạc và foley.
- **DIRECTOR §10** (lỗi hay gặp) và **§11** (soát trước khi giao): đọc lại trước khi render bản cuối.

## Xuất video gọn và nét

Cùng khổ 1080×1920, 24 fps: ct03 dài 89 giây chỉ nặng 15,8 MB (1,2 Mbps hình), trong khi ct04 dài 78 giây nặng 49 MB. Ba yếu tố quyết định, xếp theo mức ảnh hưởng:

1. **Không thêm grain ở bước mux** (`mux.sh … 24 0`). Grain `noise=…:allf=t` đổi mọi khung hình, nên bộ mã hoá không tận dụng được các khung lặp. Style in (riso, halftone) đã có hạt sẵn trong bản in, đúng như STYLE §7 viết: "No grain added at mux".
2. **Khung lặp thật sự.** Nhân vật chuyển động theo nhịp 12 fps (on twos). Lệch bản in cố định trong mỗi shot, không rung theo khung. Hạt mực chỉ đổi theo bước 12 fps. ct03 có 52% số khung nặng dưới 2 KB.
3. **Chỉ mã hoá có tổn hao một lần.** Chụp PNG (không dùng JPEG 4:2:0 vì làm nhoè chấm halftone), đưa vào bản trung gian không tổn hao `libx264 -crf 0 -pix_fmt yuv444p` (hoặc `-qp 0`), rồi mã hoá bản giao một lần với `-preset slow -crf 19..20 -tune grain -pix_fmt yuv420p`. Mẫu chạy được: `films/Co the ban/Code/ct03/tools/render.mjs` và `build.ps1`.

Mảng màu lớn phủ halftone (ct04 phủ tint gần kín khung) làm file nặng gấp ba và hình kém rõ. Xem thêm luật bố cục của style.

## Đã dùng thật: Data Physicalization (`examples/lai-kep/`)

- Phim 43 giây, một cú máy liền, 3D bằng three.js: tấm gỗ óc chó, 302 miếng instanced, HDRI studio, GTAO, độ sâu trường ảnh.
- Engine của demo (`set.js`, `film.js`, `mix.py`) được học rồi viết lại cho chủ đề mới: lịch rơi từng miếng theo tháng, reading ghim vào vật thể, bộ đếm chạy theo số miếng đã rơi.
- Đường máy quay dùng `track()` (`core/lib.js`) với các key `[t, [pos, target, focus, aperture]]`. Key **tham chiếu cue** (ví dụ `C.copper + .9`) chứ không dùng số giây.
- Đo trên GTX 1650 Max-Q 4GB: 1.036 khung final mất 945 giây với 3 worker, `readcheck` mặc định mất khoảng 15 phút. Cách tăng tốc ghi ở `setup.md`.

## Gợi ý style theo loại nội dung (chưa kiểm hết)

| Nội dung | Style nên thử |
|---|---|
| Tiền, tích luỹ, so sánh quy mô | Data Physicalization (đã làm), Isometric Infographic |
| Diễn biến một chỉ số theo thời gian | Data Storytelling (biểu đồ chì trên giấy) |
| Câu chuyện có nhân vật | Paper Pop-up Book, Mid-century Cartoon |
| Bản tin, tin nhanh | Broadcast News Package, Caption News |
| Giải thích cơ chế | Whiteboard Explainer, Blueprint, Exploded Teardown |
