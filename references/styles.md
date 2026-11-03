# Giúp người dùng chọn style

lemo-opuscar có 66 style. Tên tiếng Anh như "Data Physicalization" hay "Isometric Picture Book" không giúp người dùng hình dung được gì. Vì vậy **luôn cho người dùng xem hình**, không chỉ đưa danh sách tên.

## Quy trình

1. **Lọc trước, đưa danh sách ngắn sau.** Từ brief (chủ đề, ẩn dụ, nơi đăng, khổ hình, máy có GPU không, có tư liệu thật không), chọn ra 2–3 style. Mỗi style kèm **một câu lý do** gắn với chủ đề, ví dụ "tiền tích luỹ là vật đếm được, nên xếp thành tháp", không viết chung chung kiểu "đẹp, hiện đại".
2. **Dựng trang chọn style** có danh sách ngắn ở trên cùng:

   ```sh
   node "$SKILL/scripts/styles.mjs" --lib "$LIB" --out films/chon-style.html \
     --topic "Lãi kép cho người mới đi làm" --size "1080x1920 (TikTok)" \
     --pick "data-physical=Tiền tích luỹ là vật đếm được|dataviz=Đường lãi kép tự kể chuyện|iso-infographic=Dòng tiền đi qua từng bước"
   ```

   Trang gồm ảnh khung và **phim mẫu 720p** của từng style, mô tả và công dụng tiếng Việt, nhãn 2D hay 3D (cần GPU), nhãn "cần tư liệu thật", ô tìm kiếm, và lọc theo nhóm. Nút **Chọn style này** chép câu `Chọn style: <slug> (<tên>)` để người dùng dán vào chat.
3. **Mở trang cho người dùng:**
   - Trong app Claude (desktop): mở bằng browser pane. Trang là file tĩnh, nên chạy một server tĩnh cho thư mục `films/` rồi mở `http://localhost:<port>/chon-style.html`.
   - Trong terminal: đưa đường dẫn tuyệt đối của file để người dùng mở bằng trình duyệt.
   - Không mở được gì: gửi link gallery chính thức <https://lemomo-ai.github.io/lemo-opuscar/>, kèm danh sách ngắn có slug.
4. **Gửi trang cùng lượt hỏi brief**, không tách thành một lượt hỏi riêng: "chọn style trên trang này (mình gợi ý X vì…), hoặc để mình chọn". Người dùng trả lời brief và chọn style trong cùng một tin nhắn. Sau đó đọc `$LIB/styles/<slug>/STYLE.md`.

   Nếu câu trả lời brief làm đổi danh sách ngắn (ví dụ người dùng nói máy không có GPU, hay đổi sang khổ dọc), dựng lại trang với danh sách mới và gửi kèm đúng một câu hỏi: chọn style nào.

Người dùng đã nêu tên style ngay từ đầu thì bỏ qua trang này.

## Tiêu chí lọc

| Câu hỏi | Ảnh hưởng |
|---|---|
| Ẩn dụ của chủ đề là gì (vật đếm được, dòng chảy, hành trình, so sánh, cơ chế)? | Tiêu chí chính. Xem bảng gợi ý trong `references/lemo-opuscar.md` |
| Có GPU rời không? | Không có thì loại style 3D: render rất chậm hoặc không chạy được |
| Có tư liệu thật không (ảnh lưu trữ, ảnh vệ tinh, dữ liệu quét, footage)? | Nhóm *Dựng từ tư liệu* và *Phim chứng cứ* cần tư liệu thật, không bịa được |
| Khổ dọc? | Style có ngữ pháp hình ngang phải dựng lại bố cục (`references/formats.md`) |
| Độ dài và giọng? | Style giàu chữ cần thời gian đọc, nên phim dài hơn ước lượng |

## Trang chọn style hoạt động thế nào

- Danh sách style lấy trực tiếp từ `$LIB/styles/*/style.json`, nên thư viện thêm style thì trang tự có.
- Tên, mô tả, công dụng tiếng Việt và nhãn 2D/3D nằm ở `references/styles-vi.json`. Style mới chưa có ở đó sẽ hiện bằng tiếng Anh, và script in ra tên các style còn thiếu: bổ sung vào file để lần sau có tiếng Việt. Nhãn 2D/3D xác định bằng cách xem demo có dùng three.js không.
- Ảnh và phim tải từ trang gallery của thư viện (`lemomo-ai.github.io/lemo-opuscar/img/<slug>_0.jpg`, `/films/<slug>.mp4`). Bản sparse clone không có ảnh và phim, nên trang **cần mạng**.
- Phim mẫu là phim của thư viện. Nói rõ với người dùng: video của họ giữ ngôn ngữ hình ảnh và âm thanh của style, nhưng câu chuyện, bố cục và cú máy sẽ khác (DIRECTOR yêu cầu khác demo ít nhất 4/6 yếu tố).
