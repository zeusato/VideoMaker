# Luật rút ra từ những lần làm thật

Mỗi luật kèm lỗi đã gặp.

## Thời gian và timeline

1. **Không có số giây tuyệt đối trong code hình.** Một cảnh từng gõ cứng `OUT_END = 6.7`. Khi có giọng thật dài hơn, dòng xu tắt trước khi kịp chảy về. Mọi mốc phải suy từ cue, `T` trên lưới, hoặc `DUR`.
2. **Cue làm tròn về khung hình.** Mốc 3,6 giây ở 24 fps rơi vào khung 86,4, nên ô "3,6s" trong contact sheet lấy nhầm khung trước cue, trông như hình bị trễ.
3. **Giọng thật đọc chậm hơn ước lượng.** Ước 4,3 âm tiết/giây, thực tế 3,2–3,6. Luôn để `voice.mjs` kiểm tra chồng câu.
4. **Key máy quay phải theo thứ tự thời gian kể cả khi cue đổi.** Đặt key theo cue (`C.copper + .9`), không theo một mốc `T` cố định có thể nằm trước cue.

## Máy quay và bố cục

5. **Cú chuyển cảnh dài ít nhất 2 giây.** Từ macro kéo ra toàn cảnh trong 0,74 giây trông như video bị giật.
6. **Hai vật so sánh nằm trọn khung**, kể cả đỉnh tháp cao nhất. Tính chiều cao vật rồi lùi máy cho đủ.
7. **Bảng và nhãn không đè lên nhau.** Bảng đếm từng đè lên verdict. Mỗi bảng có vùng `minY`/`maxY` riêng.
8. **Phân biệt chất liệu ở kích thước thumbnail, cả khi nhìn từ bên hông.** Gỗ `#d8b98a` và đồng `#b86b45` dưới đèn ấm nhìn như nhau. Phải dùng gỗ rất nhạt và nhám (`#ecd6ae`, roughness .78) và đồng sẫm, satin (`#a4532f`, roughness .44). Viền thau phải mảnh để không lẫn với gỗ.
9. **Chữ khắc trên vật phải xoay theo máy quay.** Kiểm bằng một khung nhìn thẳng từ trên xuống (`?cam=top`).

## Chữ, phụ đề, giao file

10. **Không để `.srt` cạnh `.mp4`.** Hai lần người dùng thấy phụ đề bị nhân đôi.
11. **Nhãn giữ đủ lâu** (readcheck: số ký tự ÷ 15 + 1,5 giây). Hai nhãn từng chỉ hiện 1,28 và 2,28 giây.
12. Verdict trùng nội dung với phụ đề mà không đủ thời gian đọc thì **bỏ**, đừng cố nhét.

## Số liệu

13. **Kiểm quy ước công thức.** Code mô phỏng ban đầu góp đầu tháng (ra 4,559 tỷ) trong khi công thức FV là góp cuối tháng (ra 4,521 tỷ). Mốc giao cắt từng ghi 39 tuổi, đúng ra là 37 tuổi 9 tháng. Mọi số phải tính ra từ cùng một script và ghi vào FACTS.md.
14. **Làm tròn sang đơn vị vật thể** (1 miếng = 20 triệu) bằng `Math.round` trên giá trị cộng dồn, rồi kiểm tổng có khớp số hiển thị không.

## Quy trình

15. **Treatment và STYLE.md trước, code sau.** Bản đầu tiên (4 cảnh infographic phẳng) bị chê "lởm" vì bỏ qua phần nghề: không nhạc, không foley, máy đứng yên, chỉ chuyển cảnh bằng mờ dần.
16. **Làm nhiều thứ song song khi chờ người:** trong lúc chờ người dùng tạo giọng thì dựng hình bằng timeline ước lượng.
17. **Không xem video trong lúc máy đang render** (sẽ giật, dễ tưởng file lỗi).
18. **Kiểm quyền của API trước khi hứa tự động hoá.** Gói Free của ElevenLabs chặn giọng Voice Library qua API.
