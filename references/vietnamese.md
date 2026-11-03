# Tiếng Việt

## Chuẩn hoá lời đọc (`scripts/normalize.mjs`)

| Viết | Đọc |
|---|---|
| `1.284,56` | một nghìn hai trăm tám mươi tư phẩy năm mươi sáu |
| `0,05` | không phẩy không năm (phần thập phân bắt đầu bằng 0 thì đọc từng chữ số) |
| `21` / `24` / `25` | hai mươi mốt / hai mươi tư / hai mươi lăm |
| `15` / `105` / `1.050` | mười lăm / một trăm linh năm / một nghìn không trăm năm mươi |
| `10%` | mười phần trăm |
| `02/11/2026` | ngày hai tháng mười một năm hai nghìn không trăm hai mươi sáu |
| `HPG`, `FPT` | hát pê giê, ép pê tê (2–4 chữ hoa thì đánh vần) |
| `VN-Index` | tra `scripts/lexicon.json` |

- Câu bắt đầu bằng số thì tự viết hoa chữ đầu ("55 tuổi." thành "Năm mươi lăm tuổi.").
- **Chưa xử lý:** dấu `+` và `−` trước số, đơn vị viết tắt (tr, tỷ đ, bp), số La Mã. Kịch bản nên viết sẵn dạng lời nói, bộ chuẩn hoá chỉ là lưới an toàn.
- Thêm từ đặc biệt vào `scripts/lexicon.json` (tên riêng, mã chỉ số, từ mượn).

## Viết lời

- Câu ngắn, mỗi câu một ý. Với giọng điềm thì khoảng 10–18 âm tiết một câu.
- Đọc to thử trong đầu: số lớn nên làm tròn khi nói ("bốn phẩy năm tỷ"), còn trên màn hình hiện số chính xác ("4,52 tỷ"). Ghi cả hai vào FACTS.md.
- Đặt cue trước chữ mang nghĩa, không trước hư từ: `{stock_down}giá cổ phiếu`, không viết `{stock_down}và giá`.

## Chữ trên hình

- **Font** (OFL, đủ dấu tiếng Việt, đã dùng thật): **Be Vietnam Pro** cho nhãn, verdict, phụ đề; **Inter** 200/300 cho số; **JetBrains Mono** cho đơn vị, tuổi, dòng nguồn; **Noto Serif** cho tiêu đề.
- Font lưu sẵn trong dự án: `scripts/fonts.mjs` tải bản rút gọn chỉ gồm các ký tự phim dùng (Google Fonts CSS2 `&text=`). Không gọi Google Fonts lúc render.
- Canvas chỉ tải webfont khi vẽ: phải `await document.fonts.load('<weight> <size> "<family>"', '<mẫu có dấu>')` trước khi vẽ khung đầu.
- Kiểm dấu ở kích thước thật: ơ, ư, ạ, ỹ, ặ hay bị lỗi với font hiển thị chỉ có Latin.

## Phụ đề

- Một dòng, đo bằng font thật. Rộng hơn vùng an toàn thì **tách thành hai cue tại dấu câu**, không xuống dòng. Vùng an toàn và cỡ chữ theo từng khổ: `references/formats.md` (16:9 khoảng 1.180px ở 36px; 9:16 khoảng 860px ở 48–56px).
- Giữ ít nhất max(1,8 giây; thời lượng đọc + 0,6 giây), và không đè lên cue tiếp theo.
- Phụ đề in trong hình. File `.srt` xuất riêng vào `captions/`.
- Thời gian đọc nhãn (readcheck, chữ Latin): số ký tự ÷ 15 + 1,5 giây.
