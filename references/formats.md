# Khổ hình và kích thước

Khổ hình quyết định bố cục, cú máy, cỡ chữ và vị trí phụ đề. Vì vậy phải chốt nó **trong brief**, trước khi chọn style và viết treatment. Đổi khổ sau khi đã dựng hình gần như là làm lại phần hình.

## Câu hỏi trong brief

Hỏi **nơi đăng**, không hỏi "kích thước bao nhiêu", rồi đề xuất khổ theo bảng dưới. Người dùng nêu nhiều nơi đăng thì hỏi thêm: một khổ chính, hay nhiều phiên bản (mỗi phiên bản thêm một lần dựng bố cục và một lần render).

| Nơi đăng | Khổ | `SIZE` | Ghi chú |
|---|---|---|---|
| YouTube, website, trình chiếu, TV | 16:9 ngang | `1920x1080` | Mặc định của lemo-opuscar và của mọi demo |
| TikTok, YouTube Shorts, Reels (Facebook, Instagram), Zalo Video | 9:16 dọc | `1080x1920` | Có vùng bị giao diện app che (bên dưới) |
| Bài đăng feed Facebook, Instagram, LinkedIn | 4:5 dọc | `1080x1350` | Chiếm nhiều chỗ trên feed nhất mà không bị cắt |
| Feed vuông, quảng cáo nhiều vị trí | 1:1 | `1080x1080` | |
| Màn hình LED, sự kiện, kiosk | theo màn hình thật | hỏi số pixel | Chiều rộng và chiều cao phải là số chẵn |

- **Tốc độ khung hình:** mặc định 24 fps. Nếu `STYLE.md` của style ghi 30 hay 60 fps thì dùng số đó (`FPS` trong `timeline.js`).
- **4K** (`3840x2160`) tốn thời gian render gấp khoảng 4 lần. Chỉ làm khi người dùng thật sự cần, và báo trước thời gian.
- Người dùng không biết nơi đăng: đề xuất 16:9 nếu xem trên máy tính hoặc trình chiếu, 9:16 nếu xem trên điện thoại.

## Ghi khổ vào dự án

`timeline.js` là nơi duy nhất ghi khổ:

```js
export const SIZE = '1080x1920', FPS = 24;
```

`build.sh` đọc `SIZE` và truyền `--size` cho `events.mjs`, `video.mjs`, `readcheck.mjs`. Khi render ảnh thử thì tự thêm vào lệnh: `node core/render/still.mjs "<project>" 3 8 --size 1080x1920`.

**Phiên bản thứ hai** (ví dụ bản dọc của một phim ngang): `SIZE=1080x1920 sh films/<tên>/build.sh`. Lệnh này ra `<tên>-1080x1920.mp4`, `captions/<tên>-1080x1920.srt` và `poster-1080x1920.jpg`. Tiếng, nhạc và timeline dùng chung; bố cục thì trang phim phải tự xử lý cho khổ đó (dưới đây).

## Dựng hình theo khổ

- Trang phim lấy kích thước từ `innerWidth` × `innerHeight` (TECHNIQUE §2). **Không** gõ cứng `1920`, `1080`, và không thu nhỏ bố cục 16:9 rồi đặt vào khung dọc.
- **Dựng lại bố cục, đừng co lại.** Ở khổ dọc, hai vật so sánh đặt **trên–dưới** thay vì trái–phải, máy quay lùi hoặc hạ góc để lấy chiều cao, và bảng số liệu chuyển thành cột.
- Kiểm tra **khung style trước**: render 2–3 ảnh thử ở đúng khổ rồi mới làm tiếp.
- Style có ngữ pháp hình ngang (chia màn hình, dải tít bản tin, bản đồ rộng, tranh cuộn ngang) thì đọc kỹ `STYLE.md`. Nếu style không nói gì về khổ dọc thì báo người dùng ngay lúc chọn style rằng phải dựng lại bố cục, và đề xuất style khác nếu ngữ pháp ngang là cốt lõi của style.

## Vùng an toàn

Chữ, nhãn và vật thể chính phải nằm trong vùng an toàn. Số liệu tính cho khung chuẩn của từng khổ; khổ khác thì tính theo tỉ lệ.

| Khổ | Lề an toàn | Phụ đề |
|---|---|---|
| 16:9 `1920x1080` | 5% mỗi cạnh (96 px ngang, 54 px dọc) | Một dòng, rộng tối đa khoảng 1.180 px ở cỡ 36–40 px, đáy dòng cách đáy khung khoảng 90 px |
| 9:16 `1080x1920` | trên 220 px, **dưới 420 px**, **phải 140 px**, trái 60 px: giao diện TikTok, Reels, Shorts che các vùng này (tên kênh, mô tả, nút thích và chia sẻ) | Một dòng, rộng tối đa khoảng 860 px ở cỡ 48–56 px, đặt quanh y ≈ 1.300–1.450 (trên vùng mô tả của app). Dài hơn thì tách cue, không xuống dòng |
| 4:5 `1080x1350` | 5% mỗi cạnh | Một dòng, rộng tối đa khoảng 940 px ở cỡ 44–50 px |
| 1:1 `1080x1080` | 5% mỗi cạnh | Một dòng, rộng tối đa khoảng 940 px ở cỡ 40–46 px |

Cỡ chữ tối thiểu cho nhãn (theo spec chia việc): 28 px ở 16:9; 40 px ở 9:16, 4:5 và 1:1, vì những khổ này xem trên điện thoại.

## Review theo khổ

- Contact sheet khổ dọc: `tile=6x3` thay cho `tile=4x6`, và `scale=-1:480` thay cho `scale=480:-1`.
- Cắt dải phụ đề theo đúng vùng phụ đề của khổ, ví dụ 9:16: `crop=1080:220:0:1260`.
- Soát thêm: không có chữ hay vật thể chính nằm trong vùng bị giao diện app che.
