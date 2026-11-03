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
