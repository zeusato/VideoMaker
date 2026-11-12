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

## Render khung hình (đo trên Windows, phim 16:9 dài 8 phút, 14.651 khung, 12/11/2026)

19. **Lấy khung bằng cách đọc thẳng canvas, không chụp màn hình.** `page.screenshot` PNG mất 0,8–2 s mỗi khung, nhiều khi lâu hơn bước vẽ. Chụp qua CDP (`Page.captureScreenshot`, kể cả `optimizeForSpeed`) nhanh gấp 6–10 lần nhưng lấy ảnh từ compositor, nên **có thể trả khung cũ**: khung đầu mỗi đoạn ra trang trắng, chỗ cắt cảnh trễ 1–3 khung. Cách đúng: trong `page.evaluate` gọi `render(t)` rồi `getImageData` của chính canvas, trả base64 (khoảng 0,1 s), đẩy vào ffmpeg `-f rawvideo -pix_fmt rgba -s WxH`. Đo lại khớp ảnh soát 0,4/255.
20. **Số luồng render bị giới hạn bởi bộ nhớ cam kết của Windows, không phải số lõi CPU.** Mỗi Chrome headless của cảnh nặng (nhiều sprite độ phân giải cao) chiếm 1,5–3 GB cam kết. Vượt trần thì canvas không xin được bộ nhớ và **vẽ ra trống mà không báo lỗi** (mất cả mảng hình), hoặc node báo "Committing semi space failed", CDP báo "Unable to capture screenshot". Trước khi render, xem `Get-Counter '\Memory\Committed Bytes','\Memory\Commit Limit'` rồi chọn số luồng = khoảng trống ÷ 3 GB.
21. **Bắt lỗi canvas thay vì để vẽ trống.** Sau mỗi `getContext('2d')` cho sprite và trước khi đọc khung, kiểm `ctx.isContextLost()`; mất thì `throw`, để luồng chết to tiếng chứ không xuất khung thiếu hình. Giới hạn bộ đệm sprite mỗi trang (vd. 160 MB) để giảm bộ nhớ.
22. **Render theo khúc nhỏ có thử lại, không theo vài đoạn lớn.** Chia phim thành khúc khoảng 500 khung, N luồng nhận khúc lần lượt; khúc nào chết hoặc đếm khung không đủ thì chạy lại (tối đa 3 lần). Một luồng chết chỉ mất một khúc, không mất một phần ba phim. Mẫu: `films/Su song duoi dai duong/Code/nkb01/tools/render_chunks.sh` + chế độ `part a b out.mp4` của `render.mjs` trong repo VideoStudio.
23. **Mọi khúc nối bằng `concat -c copy` phải cùng thiết lập x264.** `veryfast` dùng CABAC, `ultrafast` thì không; trộn hai loại trong một lần nối thì phần sau giải mã sai. Đổi preset thì render lại toàn bộ.
24. **Dọn tiến trình render cũ trước khi chạy lại.** Phiên agent bị tắt giữa chừng để lại node, Chrome headless, ffmpeg còn sống giữ hàng GB bộ nhớ; bộ điều phối có vòng thử lại còn sống sẽ tự đẻ luồng mới. Tắt bộ điều phối trước, rồi node, rồi ffmpeg. Không tắt ffmpeg bằng lệnh chung khi đã có lượt render mới đang chạy (lệnh tắt chạy chậm có thể giết nhầm luồng mới).
25. **Soát thành phẩm ở mọi mối nối.** Sau khi ghép, so khung MP4 với ảnh soát render riêng ở khung cuối và khung đầu của từng khúc, cộng các mốc rải đều; lệch trung bình > 3/255 là có vấn đề. Lần này nhờ bước này mới phát hiện cả lỗi trễ khung lẫn lỗi mất hình.
