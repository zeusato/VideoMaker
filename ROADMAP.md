# ROADMAP: việc cần làm trước khi dùng thật

Trạng thái: **v0.1**, đã chạy trọn một phim ("Lãi kép", Data Physicalization, 43 giây) trên Windows + GTX 1650.

## Phải làm

- [ ] **Tốc độ render.**
  - Đo chế độ `?q=draft` và `TEXTS` không dựng 3D (đã có code, chưa đo).
  - Thử 1–2 worker thay vì 3, và preview ở `--size 960x540`.
  - Viết script render lại riêng một đoạn rồi ghép vào, cho các lần sửa nhỏ.
  - Mục tiêu: một vòng review dưới 5 phút cho 40 giây phim.
- [ ] **Nghe kiểm âm thanh** của `examples/lai-kep` với loa thật. Agent không tự nghe được: cần người dùng chấm nhạc, foley, mức giọng, rồi rút thành luật mix.
- [ ] **Gói ElevenLabs:** quyết định Free (tạo tiếng trên web, phải làm tay mỗi video) hay Starter (API tự động hoàn toàn). Nếu Starter thì chạy thử `provider: "elevenlabs-api"` trong `voice.mjs`; nhánh này đã viết nhưng **chưa chạy thật**.
- [ ] **Phim thứ hai bằng một style khác** (2D, nhiều cảnh, ví dụ Data Storytelling hoặc Broadcast News Package) để kiểm các phần chưa đụng tới: kit dùng chung, chia việc cho worker, chuyển cảnh bằng chất liệu của style.
- [ ] **Khổ dọc 9:16** cho short/reel: `--size 1080x1920`, bố cục, vùng an toàn của phụ đề.

## Nên làm

- [ ] `mix.py` dùng chung: tách phần chung (bus, duck, suck-out, master, đo mức) ra khỏi phần riêng của từng style (foley, nhạc).
- [ ] Chuẩn hoá thêm: dấu `+`/`−` trước số, đơn vị viết tắt, số La Mã. Kiểm thẻ cảm xúc của Eleven v3 với tiếng Việt.
- [ ] Kiểm tra lời đọc bằng speech-to-text (`asr_check.py` của lemo-opuscar, faster-whisper tiếng Việt) như lưới an toàn thứ hai.
- [ ] Vòng sửa của GPT-6 Astra (worker): còn thiếu bản v2 để kết luận có giao code cho Astra được không.
- [ ] Render final trên máy có GPU mạnh hơn, hoặc trên cloud.
- [ ] Đăng tải: xuất preset cho YouTube, TikTok, Facebook (bitrate, khổ, `.srt`).

## Đã kiểm chứng

- Hợp đồng `render(t)` tất định, render từng cảnh, ghép phim, ghép tiếng.
- Chuẩn hoá số tiếng Việt, mã cổ phiếu, ngày tháng, phần trăm.
- ElevenLabs: tạo tiếng trên web, căn thời gian bằng forced alignment API (gói Free), cắt từng câu, đặt lên lưới nhạc, báo chồng câu. `scripts/voice.mjs` cho ra đúng các cue của bản sản xuất (lệch 0,000 s).
- lemo-opuscar trên Windows với các vá trong `references/setup.md`.
- Review: contact sheet, scene-score, readcheck, ebur128, blackdetect.
