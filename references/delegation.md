# Chia việc giữa các agent

## Kết quả thử nghiệm (11/2026)

| Bài | Claude | GPT-6 Astra | Kết luận |
|---|---|---|---|
| Cảnh 10 giây, spec chặt (bản tin VN-Index) | Đạt mọi kiểm tra | Đạt mọi kiểm tra, tự lo việc tải font cho canvas | Ngang nhau |
| Cảnh 12 giây, đề mở ("Lãi suất và chứng khoán") | 9,0/10: kể chuyện nhân quả rõ; lỗi là thừa hiệu ứng | 8,0/10: gọn, có ý tưởng hay (cọc xu); lỗi là nguyên nhân quá nhỏ, trạng thái đầu không trung tính | Claude hơn ở tư duy "tắt tiếng vẫn hiểu" |
| Sửa theo nhận xét | Trúng 5/5, khoảng 2 phút | Chưa có kết quả | Chưa kết luận |

(Người chấm là Claude, có thể thiên vị.)

## Quy tắc

- **Phần sáng tạo thuộc boss:** treatment, storyboard, ẩn dụ, trạng thái đầu và cuối của từng cảnh, cue map.
- **Worker code từ spec đã chốt.** Spec phải ghi:
  1. Hợp đồng kỹ thuật: tất định, không `Date.now`/`Math.random`/CSS animation, chỉ một file.
  2. **Cấm số giây tuyệt đối**, mọi mốc tính từ `s.cues`, `s.start`, `s.end`.
  3. Danh sách chữ được phép, không thêm chữ khác.
  4. Cỡ chữ tối thiểu: 28px cho nhãn, 36–40px cho phụ đề.
  5. Trạng thái đầu cảnh phải trung tính (ví dụ chứng khoán không được "đang tăng" trước khi câu chuyện bắt đầu).
  6. Vùng an toàn, màu, nhân vật lấy từ kit dùng chung.
  7. Số lần render tối đa, và cách tự kiểm.
- **Kit dùng chung** cho phim nhiều cảnh 2D: phụ đề, dòng miễn trừ trách nhiệm, chuyển cảnh, token màu, avatar nhân vật. Lỗi chung thì sửa một lần trong kit, không sửa từng cảnh.
- Phim một cú máy liền (một set 3D) thì **một agent dựng**: không chia nhỏ được.
- Worker không có công cụ thì người dùng làm cầu nối: boss viết một file `.md` giao việc, người dùng đưa cho worker. Đó là cách đã làm với Astra qua VS Code Copilot. Copilot CLI ở chế độ không tương tác thì chưa thử.

## Mẫu nhận xét cho vòng sửa

Mỗi điểm gồm: hiện tượng nhìn thấy, vì sao sai (theo tiêu chí nào), cách sửa cụ thể. Kèm theo:

- Giới hạn số lần render.
- Yêu cầu worker báo lại từng điểm: đã sửa thế nào, điểm nào chưa sửa được và vì sao.

Chấm lại cả việc "sửa có làm hỏng chỗ khác không".
