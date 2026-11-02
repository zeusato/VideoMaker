# FACTS — "Lãi kép"

Mọi con số trong phim là **ví dụ minh hoạ tính theo công thức**, không phải dữ liệu thị trường hay lợi nhuận thực tế. Tệp `data/series.json` chứa bảng tính từng năm.

## Giả định

- Góp đều **2.000.000 đồng/tháng**, cuối mỗi tháng (đúng với công thức FV dưới đây).
- Lợi nhuận giả định **10%/năm**, gộp hằng tháng: r = 10% / 12 mỗi tháng.
- An góp từ tuổi 25 đến 55 (360 tháng). Bình góp từ tuổi 35 đến 55 (240 tháng).

## Công thức

Giá trị tương lai của chuỗi góp đều: FV = P × ((1 + r)^n − 1) / r, với P = 2.000.000, r = 0,1/12.

| | Số tháng n | Tiền tự góp | Giá trị tại 55 tuổi | Tiền lãi |
|---|---|---|---|---|
| An | 360 | 720.000.000 | 4.521.000.000 (4,521 tỷ) | 3.801.000.000 |
| Bình | 240 | 480.000.000 | 1.519.000.000 (1,519 tỷ) | 1.039.000.000 |
| Chênh | | 240.000.000 | 3.002.000.000 (≈ 3 tỷ) | |

Tỉ lệ An/Bình = 2,977, tức gần gấp 3.

## Quy đổi ra vật thể (1 miếng = 20 triệu)

- An: 720 tr / 20 tr = 36 miếng gỗ. Tổng 4.521 tr / 20 tr = 226,05, làm tròn 226, nên có 190 miếng đồng. 226 × 20 tr = 4,52 tỷ.
- Bình: 480 tr / 20 tr = 24 miếng gỗ. Tổng 1.519 tr / 20 tr = 75,95, làm tròn 76, nên có 52 miếng đồng. 76 × 20 tr = 1,52 tỷ.
- Sai số làm tròn tối đa 1 miếng, tức 20 triệu.

## Các nhận định trong lời đọc

- "Lúc đầu, lãi gần như không thấy": năm 30 tuổi An có 6 miếng gỗ nhưng chỉ 2 miếng đồng.
- Tiền lãi của An vượt số tiền tự góp ở tháng thứ 153, tức **khoảng 37 tuổi 9 tháng** (lãi 308 triệu so với 306 triệu tự góp). Trên tháp, số miếng đồng vượt số miếng gỗ ở cùng thời điểm (`tools/data.mjs`, `CROSS_AGE`).
- Bình ở tuổi 55 có 24 gỗ + 52 đồng, bằng đúng An ở tuổi 45.
- Hiển thị "4,52 tỷ" và "1,52 tỷ"; lời đọc nói "bốn phẩy năm tỷ" và "một phẩy năm tỷ" (làm tròn một chữ số thập phân).
