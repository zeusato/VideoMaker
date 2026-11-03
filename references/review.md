# Review trước khi giao

Chạy từ thư mục dự án; `FF` là ffmpeg 7+.

## 1. Contact sheet toàn phim

```sh
"$FF" -v error -y -i <tên>.mp4 -vf "fps=1/1.8,scale=480:-1,tile=4x6" -frames:v 1 review/sheet_full.jpg
```

Khổ dọc thì dùng `scale=-1:480` và `tile=6x3` (`references/formats.md`).

Đọc ảnh và soát:

- Mạch truyện đúng beat sheet.
- Hook xuất hiện trong 3 giây đầu.
- Hai vật so sánh nằm trọn khung.
- Nhãn và bảng không đè lên nhau, không đè lên phụ đề.
- Chữ đủ to cho màn hình điện thoại.
- Không có chữ hay vật thể chính trong vùng bị giao diện app che (khổ 9:16).
- Vật thể chính chiếm ít nhất 1/3 chiều cao khung ở các khoảnh khắc quan trọng.

## 2. Tìm cú máy quá gấp hoặc khung bị nhảy

```sh
"$FF" -hide_banner -i <tên>.mp4 -vf "scale=480:-1,select='gte(scene,0)',metadata=print:key=lavfi.scene_score" -an -f null - 2>&1 \
  | grep -oE "pts_time:[0-9.]+|scene_score=[0-9.]+" | paste - - | sort -t= -k2 -nr | head
```

Trung vị phải rất nhỏ (khoảng 0,0006). Đỉnh nào không trùng một sự kiện đã thiết kế (vật rơi, impact) thì là cú máy quá gấp: kéo key máy quay ra ít nhất 2 giây.

## 3. Kỹ thuật

```sh
"$FF" -hide_banner -i <tên>.mp4 -af ebur128 -f null - 2>&1 | grep -E "^\s+(I|LRA|Peak):"     # khoảng −14 LUFS
"$FF" -hide_banner -i <tên>.mp4 -vf blackdetect=d=0.1:pix_th=0.05 -an -f null - 2>&1 | grep -c black_start   # 0
ffprobe -v error -select_streams v:0 -show_entries stream=pix_fmt,r_frame_rate,nb_frames -of default=nw=1 <tên>.mp4
```

## 4. Chữ và phụ đề

- `node $LIB/core/render/readcheck.mjs films/<tên>`: mọi chữ phải giữ đủ lâu. Lỗi nào báo `BAD` thì kéo dài hoặc cho hiện sớm hơn.
- Cắt dải phụ đề ở các điểm chuyển câu (16:9: `-ss t -vf crop=1400:180:0:900`; 9:16: `crop=1080:220:0:1260`), xác nhận mỗi lúc chỉ có một dòng.
- `.srt` phải nằm ở `captions/`.

## 5. Giọng

- `voice.mjs` không báo lỗi số từ, không báo `OVERLAP`.
- Agent không tự nghe được: phải nói rõ với người dùng rằng âm thanh chưa có ai nghe kiểm, và nhờ họ nghe với loa thật.

## 6. Một vòng sửa

Gom mọi lỗi từ các bước 1–5, sửa trong **một** lượt, render lại một lần (dùng `SKIP_VIDEO=1` nếu chỉ sửa tiếng), rồi kiểm lại.
