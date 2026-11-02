---
name: video-ai
description: Sản xuất video ngắn (30–90 giây) hoàn toàn bằng code, giọng đọc tiếng Việt, phụ đề, nhạc và tiếng động — từ một yêu cầu tới file MP4 thành phẩm. Dùng khi người dùng muốn làm video, clip, short, reel, video giải thích, video dữ liệu hoặc tài chính, "dựng video bằng code", "làm video từ kịch bản", hoặc tiếp tục một dự án trong thư mục films/. Engine là thư viện style lemo-opuscar (render(t) + Chrome headless + ffmpeg); giọng ElevenLabs, căn thời gian bằng forced alignment.
---

# Video AI — từ yêu cầu tới video thành phẩm

Bộ skill này là lớp quy trình đặt trên thư viện **lemo-opuscar** (github.com/lemomo-ai/lemo-opuscar). lemo-opuscar giữ phần nghề: 66 style, hướng dẫn đạo diễn, kỹ thuật dựng, công cụ render, sampler nhạc cụ, mux. Skill này thêm những gì thư viện không có: **tiếng Việt**, **giọng ElevenLabs và căn thời gian**, **chạy trên Windows**, và **các luật rút ra từ những lần làm thật**.

> Trước khi làm video thật, đọc `ROADMAP.md`: vài phần chưa được kiểm chứng.

## Nguyên tắc (không thương lượng)

1. **Phim được chấm theo thứ tự: âm thanh → nhịp → máy quay → đạo diễn.** Khung hình đẹp chỉ là điểm xuất phát (lemo-opuscar `DIRECTOR.md`).
2. **Một timeline là nguồn sự thật.** Tiếng đặt lên lưới nhạc, hình chạy theo tiếng. Code hình không bao giờ chứa số giây tuyệt đối: mọi mốc suy ra từ cue hoặc từ lưới.
3. **Treatment trước, demo sau.** Viết `TREATMENT.md` xong mới được mở `DEMO.md` hay code demo của style.
4. **Số liệu phải có nguồn hoặc công thức** trong `FACTS.md`. Ví dụ minh hoạ phải nói rõ là minh hoạ trên màn hình.
5. **Một vòng sửa** sau review, rồi giao. Ghi chú của người dùng sau khi giao là vòng mới.

## Chuẩn bị một lần trên mỗi máy

Đọc `references/setup.md`: cài Node 20+, Python 3.11+, ffmpeg 7+, clone lemo-opuscar, cài core tier, sample library, HDRI, và **các vá cho Windows**. Biến dùng trong mọi lệnh:

- `LIB`: thư mục lemo-opuscar (mặc định `<workspace>/vendor/lemo-opuscar`).
- `SKILL`: thư mục skill này.
- Dự án phim: `<workspace>/films/<tên>/`, nằm **ngoài** `LIB`.

## Quy trình

### 0. Đọc thư viện

Đọc `$LIB/AGENTS.md`, `$LIB/DIRECTOR.md`, `$LIB/TECHNIQUE.md` và `references/lemo-opuscar.md` (cách dùng thư viện trong skill này, những gì đã chạy được).

### 1. Brief: một lượt hỏi duy nhất

Hỏi gộp trong **một** tin nhắn, rồi không hỏi thêm (DIRECTOR §1). Chỉ hỏi những gì yêu cầu chưa trả lời:

- Chủ đề, thông điệp chính, đối tượng xem, nơi đăng (quyết định khổ 16:9 hay 9:16).
- Độ dài. Mặc định 30–60 giây; nói trước rằng style có chữ cần giữ đủ lâu nên thường dài hơn ước lượng 20–40%.
- Số liệu thật và nguồn, hoặc đồng ý dùng ví dụ minh hoạ.
- Style: người dùng chọn, hoặc để mình chọn (gợi ý 2–3 kèm lý do).
- Giọng: voice ID ElevenLabs, và **gói của tài khoản** (Free hay trả phí). Câu này quyết định cách làm giọng (bước 5).
- Có muốn duyệt storyboard trước không (mặc định: không).

### 2. Chọn style

Tra `$LIB/styles/README.md`. Chọn theo **ẩn dụ của chủ đề**, không theo thói quen. Ví dụ: tiền tích luỹ là vật đếm được nên hợp **Data Physicalization**. Đọc kỹ `$LIB/styles/<slug>/STYLE.md`: đó là luật cố định của style, giữ nguyên toàn bộ.

### 3. Treatment

Tạo `films/<tên>/` từ `templates/`. Viết `TREATMENT.md` theo DIRECTOR §4: ba phương án cấu trúc và lý do chọn, logline, benchmark, shot list (khung, góc, chuyển động máy, **lý do**), beat sheet, cue map (tempo, ô nhịp), bảng âm thanh, thiết kế chữ.

Tính số liệu bằng script và ghi `FACTS.md` trước khi viết lời. Tìm trong số liệu "khoảnh khắc đắt": điểm giao cắt, sự trùng khớp, tỉ lệ bất ngờ. Đó là cú xoay chuyển của phim.

### 4. Kịch bản có cue

`script.json` (xem `templates/script.json`): mỗi dòng là một câu đọc, chứa cue `{ten_cue}` đặt **ngay trước chữ** mà hình phải phản ứng.

- Viết ở **dạng lời nói**: câu ngắn, không ký hiệu như "(+0,97%)". Số viết bằng chữ số; `scripts/normalize.mjs` đổi thành chữ đọc. Phụ đề vẫn hiện chữ số.
- Xuất `narration.txt` (văn bản đã chuẩn hoá, mỗi câu cách một dòng trống) bằng `node $SKILL/scripts/narration.mjs films/<tên>`.

Chi tiết tiếng Việt: `references/vietnamese.md`.

### 5. Giọng

Đọc `references/voice.md`. Tóm tắt:

- **ElevenLabs gói trả phí:** gọi API `with-timestamps`, tự động hoàn toàn.
- **ElevenLabs gói Free:** giọng trong Voice Library **không gọi được qua API** (lỗi 402). Gửi người dùng `voice-brief.md` cùng `narration.txt`; họ tạo trên web và lưu `audio/full.mp3`. API forced alignment thì gói Free dùng được, nhưng phải bật quyền `forced_alignment` cho key.
- Sau đó `node $SKILL/scripts/voice.mjs films/<tên>`: căn từng từ, cắt từng câu, đặt mỗi câu lên lưới nhạc (`VO` trong `timeline.js`), xuất `out/cues.json`. Lệnh **báo lỗi nếu hai câu chồng nhau**; khi đó dời câu sau đi một phách.
- Trong lúc chờ giọng: `voice.mjs --estimate` ước lượng độ dài để dựng hình trước.

### 6. Hình

- Theo `STYLE.md`. Sau khi có treatment thì học kỹ thuật từ demo (`$LIB/styles/<slug>/demo/`): set, rig, shader, reading kit, mix. Không lấy câu chuyện, shot hay timeline của demo.
- Trang phim đọc `out/cues.json` và `timeline.js`. Mọi mốc lấy từ cue, từ `T` trên lưới, hoặc từ hàm thời gian.
- Render style frame trước (`still.mjs`), ghép contact sheet, tự soát theo STYLE.md và `references/lessons.md`.
- Có chế độ nháp (`?q=draft`) cho các vòng review (`references/setup.md`, phần tốc độ).

### 7. Âm thanh

`mix.py` (mẫu trong `examples/lai-kep/`):

- Nhạc gốc viết theo cue map, dùng **bảng màu âm của style**.
- Foley từ `window.EV`: mỗi hành động có tiếng, đúng chất liệu.
- Ít nhất 2 khoảng hút lặng trước 2 impact thiết kế.
- Giọng nén trước, cao hơn nhạc khoảng 10 dB. Master −14 LUFS, true peak ≤ −1,2 dBTP.

### 8. Build

`templates/build.sh` là một lệnh chạy trọn: lịch, giọng, font, sự kiện, hình, mix, master, phụ đề, kiểm tra thời gian đọc, poster. `SKIP_VIDEO=1` để chỉ làm lại phần tiếng. Chỉ render final **một lần**, ở cuối.

### 9. Review và một vòng sửa

Làm theo `references/review.md`:

- Contact sheet toàn phim.
- Điểm "nhảy" giữa các khung (tìm cú máy quá gấp).
- `readcheck`, `ebur128`, `blackdetect`, soát phụ đề.

Gom mọi lỗi, sửa trong **một** lượt, kiểm lại một lần.

### 10. Giao

Trong `films/<tên>/`:

- `<tên>.mp4` và `poster.jpg`.
- `captions/<tên>.srt`. **Không bao giờ để cạnh file `.mp4`**: trình phát sẽ tự nạp và nhân đôi phụ đề đã in trong hình.
- `TREATMENT.md`, `FACTS.md`, `CREDITS`, `build.sh`.

Báo người dùng: file ở đâu, dài bao nhiêu, đã kiểm những gì, còn gì chưa kiểm (đặc biệt là âm thanh, vì agent không tự nghe được). Dặn họ **không xem thử trong lúc máy đang render** vì sẽ giật.

## Chia việc

Phim một cú máy liền (3D, một set) thì một agent dựng. Phim nhiều cảnh 2D thì boss viết storyboard và spec từng cảnh, worker code từng cảnh song song, có kit dùng chung. Spec bắt buộc ghi: cỡ chữ tối thiểu, danh sách chữ được dùng, trạng thái đầu cảnh trung tính, cấm số giây tuyệt đối. Kết quả thử nghiệm và cách giao cho agent khác (ví dụ GPT-6 Astra qua người dùng): `references/delegation.md`.

## Luật cứng (bản đầy đủ: `references/lessons.md`)

- Không để `.srt` cạnh `.mp4`.
- Không gõ số giây tuyệt đối trong code hình. Cue làm tròn về khung hình.
- Mỗi cú máy chuyển cảnh dài ít nhất 2 giây. Tìm cú quá gấp bằng điểm scene-score.
- Chữ trên hình giữ ít nhất (số ký tự ÷ 15 + 1,5) giây. Phụ đề một dòng, giữ ít nhất max(1,8 giây; thời lượng đọc + 0,6 giây).
- Hai vật so sánh phải nằm trọn trong khung. Nhãn và bảng không được đè lên nhau.
- Chất liệu và màu của hai chuỗi số liệu phải phân biệt được ở kích thước thumbnail.
- Kiểm quy ước công thức (góp đầu tháng hay cuối tháng) trước khi viết số vào lời đọc.
