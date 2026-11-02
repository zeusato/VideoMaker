# Giọng đọc

## Kiến trúc

```
script.json (câu + {cue}) → normalize → narration.txt
        → giọng (API hoặc file tải từ web)
        → forced alignment (mốc từng từ)
        → cắt từng câu → đặt mỗi câu lên lưới nhạc (VO trong timeline.js)
        → out/cues.json: { lines: [{id, start, dur, t0, t1, text, wav}], cues: {tên: giây} }
```

Hình, nhạc và phụ đề đều đọc `out/cues.json`. Đổi giọng hay thu lại thì chạy lại `voice.mjs`, cả phim tự khớp.

## ElevenLabs

| | Gói Free | Gói trả phí (Starter trở lên) |
|---|---|---|
| Giọng mặc định qua API | Được | Được |
| Giọng trong Voice Library qua API | **Không được** (402 `paid_plan_required`) | Được |
| Giọng Voice Library trên web | Được | Được |
| Forced alignment API | Được, nếu key có quyền `forced_alignment` | Được |
| Model tiếng Việt | `eleven_v3`, `eleven_v4`, `eleven_flash_v2_5` (`eleven_multilingual_v2` **không** có tiếng Việt) | như trên |

- **Key:** đọc từ biến `ELEVENLABS_API_KEY`, hoặc file `.env` (dạng `ELEVENLABS_API_KEY=...`, hay chỉ một dòng key) ở thư mục dự án hoặc thư mục cha. Key có thể bị giới hạn quyền. Quyền tối thiểu: `text_to_speech`, `forced_alignment`; thêm `voices_read` nếu muốn tự lọc giọng.
- **Không bao giờ in key ra log.** Đừng `cat` file `.env`; chỉ in tên biến.
- **`with-timestamps`** trả `alignment.characters[]` khớp từng ký tự với văn bản gửi đi (đã kiểm: 53/53). Cue tính theo chỉ số ký tự.
- **Forced alignment** (`POST /v1/forced-alignment`, multipart `file` + `text`) trả `words[]`. Đã kiểm trên file của Edge có mốc chuẩn: lệch khoảng 1 khung hình so với điểm bắt đầu có tiếng thật trên sóng âm, chính xác hơn mốc của Edge (Edge sớm đều khoảng 65 ms).
- `voice.mjs` **dừng** nếu số từ căn được khác số từ trong kịch bản: nghĩa là người dùng đã sửa chữ khi tạo giọng.
- Thẻ cảm xúc của v3 (`[warm]`, `[curious]`…) chưa kiểm với tiếng Việt. Với Data Physicalization (giọng điềm, chính xác) thì không dùng.

### Quy trình gói Free

1. Xuất `narration.txt` (`scripts/narration.mjs`) và điền `templates/voice-brief.md`: giọng, model, cài đặt, cách đọc từng đoạn, đường dẫn lưu.
2. Người dùng dán **nguyên văn** lên web, nghe thử, tải MP3 về `films/<tên>/audio/full.mp3`. Một file cho cả bài, để giọng liền mạch.
3. `node $SKILL/scripts/voice.mjs films/<tên>`.

## Đặt câu lên lưới

- `VO` trong `timeline.js`: `{ id, at: [ô nhịp, phách], pre? }`. Câu bắt đầu ở phách.
- Báo `OVERLAP` thì dời câu sau đi một phách, hoặc dời câu trước sớm hơn. Giữ khoảng thở ≥ 0,12 giây.
- Thực tế: ElevenLabs v3 đọc khoảng 3,2–3,6 âm tiết/giây (chậm hơn ước lượng 4,3). Kịch bản 450 ký tự cho khoảng 35 giây giọng, phim khoảng 43 giây.
- Câu "xoay chuyển" (ví dụ "Nhưng…") đặt đúng phách đầu ô nhịp nơi nhạc chuyển.

## Edge TTS (miễn phí, chỉ để dựng nháp)

- `msedge-tts` (npm) chạy được với `vi-VN-HoaiMyNeural` và `vi-VN-NamMinhNeural`, có mốc từng âm tiết.
- **Không ổn định:** hay ngắt kết nối, và bị chặn tạm sau vài chục lần gọi liền. Phải có thử lại và cache.
- Giọng cũ, đều. Người dùng chê, nên chỉ dùng làm giọng tạm.
- Mp3 của Edge có khoảng lặng ở đầu (khoảng 0,1 giây) và ở cuối (tới 0,8 giây). Phải cắt theo mốc từ đầu và từ cuối.

## Trộn giọng

Lọc thông cao 90 Hz → nén (thr .22, ratio 3.2) → cao hơn nhạc khoảng 10 dB theo RMS lúc đang nói → nhạc tự hạ (duck) khoảng 4 dB khi có giọng. Mẫu ở `examples/lai-kep/mix.py`.
