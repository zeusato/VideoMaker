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

## Chuẩn bị máy (tự động, mỗi lần nhận yêu cầu)

Chi tiết: `references/setup.md`. Chạy từ workspace (thư mục Claude Code đang mở):

1. `sh "$SKILL/scripts/setup.sh"`: kiểm tra Git, Node 20+, Python 3.11+ và ffmpeg 7+; tải hoặc cập nhật lemo-opuscar vào `vendor/lemo-opuscar`; tạo `films/`. Dòng cuối in `LIB=` và `SKILL=`.
   - Thiếu công cụ hệ thống thì lệnh in ra lệnh `winget` tương ứng. **Hỏi người dùng trong lượt hỏi brief**, cài khi họ đồng ý, rồi chạy lại trong shell mới.
2. `sh "$SKILL/scripts/setup.sh" deps`: chạy **nền** ngay, trong lúc hỏi brief. Lệnh cài npm, Chrome headless shell và Python `.venv` (khoảng 350 MB, vài phút), kèm vá cho Windows.
3. Sau khi chọn style: `setup.sh assets hdri` nếu style là 3D, và `setup.sh assets <gói nhạc cụ>` theo những gì `STYLE.md` và cue map cần.

Biến dùng trong mọi lệnh:

- `LIB`: thư mục lemo-opuscar (mặc định `<workspace>/vendor/lemo-opuscar`).
- `SKILL`: thư mục skill này.
- Dự án phim: `<workspace>/films/<tên>/`, nằm **ngoài** `LIB`.
- Key ElevenLabs: `<workspace>/.env`. Không đọc, không in nội dung.

## Quy trình

### 0. Đọc thư viện

Đọc `$LIB/AGENTS.md`, `$LIB/DIRECTOR.md`, `$LIB/TECHNIQUE.md` và `references/lemo-opuscar.md` (cách dùng thư viện trong skill này, những gì đã chạy được).

### 1. Brief: một lượt hỏi duy nhất

Hỏi gộp trong **một** tin nhắn, rồi không hỏi thêm (DIRECTOR §1). Chỉ hỏi những gì yêu cầu chưa trả lời:

- Chủ đề, thông điệp chính, đối tượng xem.
- **Nơi đăng và khổ hình.** Hỏi video đăng ở đâu, rồi đề xuất khổ: YouTube/web là 16:9 `1920x1080`; TikTok/Shorts/Reels là 9:16 `1080x1920`; feed Facebook/Instagram là 4:5 `1080x1350`; vuông là `1080x1080`; màn hình sự kiện thì hỏi số pixel. Nhiều nơi đăng thì hỏi: một khổ chính hay nhiều phiên bản (mỗi phiên bản thêm một lần dựng bố cục và một lần render). Chi tiết: `references/formats.md`.
- Độ dài. Mặc định 30–60 giây; nói trước rằng style có chữ cần giữ đủ lâu nên thường dài hơn ước lượng 20–40%.
- Số liệu thật và nguồn, hoặc đồng ý dùng ví dụ minh hoạ.
- **Style:** gửi kèm trang chọn style có 2–3 gợi ý (bước 2). Người dùng chọn trên trang, hoặc để mình chọn.
- Máy có GPU rời không (style 3D cần GPU), nếu chưa rõ.
- Giọng: voice ID ElevenLabs, và **gói của tài khoản** (Free hay trả phí). Câu này quyết định cách làm giọng (bước 5).
- Có muốn duyệt storyboard trước không (mặc định: không).
- Công cụ hệ thống còn thiếu (nếu `setup.sh` báo): xin phép cài.

Ghi khổ đã chốt vào `SIZE` (và `FPS`) trong `timeline.js`. Từ đó mọi lệnh render đều theo khổ này.

### 2. Chọn style

Chọn theo **ẩn dụ của chủ đề**, không theo thói quen. Ví dụ: tiền tích luỹ là vật đếm được nên hợp **Data Physicalization**. Lọc thêm theo GPU, tư liệu thật và khổ hình (`references/styles.md`).

Người dùng không thể chọn từ một danh sách 66 cái tên. Vì vậy, trước khi gửi lượt hỏi brief, dựng **trang chọn style** có danh sách gợi ý ở trên cùng, rồi mở cho người dùng xem (browser pane, hoặc đưa đường dẫn file):

```sh
node "$SKILL/scripts/styles.mjs" --lib "$LIB" --out films/chon-style.html --topic "<chủ đề>" --size "<khổ>" \
  --pick "<slug>=<lý do gắn với chủ đề>|<slug>=<lý do>|<slug>=<lý do>"
```

Trang có ảnh khung và phim mẫu của cả 66 style, mô tả tiếng Việt, nhãn 2D/3D và "cần tư liệu thật", bộ lọc, và nút chép `Chọn style: <slug>` để dán vào chat. Người dùng đã nêu tên style thì bỏ qua bước này.

Khi đã chọn: đọc kỹ `$LIB/styles/<slug>/STYLE.md`, vì đó là luật cố định của style và phải giữ nguyên toàn bộ. Sau đó tải tài nguyên style cần (`setup.sh assets …`).

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
- **Không có ElevenLabs (hết credit, gói Free):** OmniVoice nhân bản giọng, chạy trên GPU NVIDIA ở máy hoặc trên GPU Kaggle miễn phí. Đọc từng câu với `duration` cố định, giọng mẫu phải có lời khớp từng chữ. Xem `references/voice.md`, mục OmniVoice. Chỉ dùng khi luật giọng của dự án cho phép nhân bản giọng.

### 6. Hình

- Theo `STYLE.md`. Sau khi có treatment thì tải mã nguồn demo (`sh "$SKILL/scripts/setup.sh" demo <slug>`, ra `$LIB/styles/<slug>/demo/`) và học kỹ thuật từ đó: set, rig, shader, reading kit, mix. Không lấy câu chuyện, shot hay timeline của demo.
- Trang phim đọc `out/cues.json` và `timeline.js`. Mọi mốc lấy từ cue, từ `T` trên lưới, hoặc từ hàm thời gian.
- Bố cục tính từ `innerWidth` × `innerHeight`, không gõ cứng kích thước. Khổ dọc thì dựng lại bố cục, không thu nhỏ bản ngang. Giữ chữ và phụ đề trong vùng an toàn của khổ (`references/formats.md`). Ảnh thử render với `--size <SIZE>`.
- Render style frame trước (`still.mjs`), ghép contact sheet, tự soát theo STYLE.md và `references/lessons.md`.
- Có chế độ nháp (`?q=draft`) cho các vòng review (`references/setup.md`, phần tốc độ).

### 7. Âm thanh

`mix.py` (mẫu trong `examples/lai-kep/`):

- Nhạc gốc viết theo cue map, dùng **bảng màu âm của style**.
- Foley từ `window.EV`: mỗi hành động có tiếng, đúng chất liệu.
- Ít nhất 2 khoảng hút lặng trước 2 impact thiết kế.
- Giọng nén trước, cao hơn nhạc khoảng 10 dB. Master −14 LUFS, true peak ≤ −1,2 dBTP.

### 8. Build

`templates/build.sh` là một lệnh chạy trọn: lịch, giọng, font, sự kiện, hình, mix, master, phụ đề, kiểm tra thời gian đọc, poster. Khổ hình lấy từ `SIZE` trong `timeline.js`. `SKIP_VIDEO=1` để chỉ làm lại phần tiếng; `SIZE=1080x1920` để làm thêm một phiên bản khổ khác. Chỉ render final **một lần**, ở cuối.

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
