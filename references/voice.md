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

## Bỏ một câu đã thu

Thêm `~` ở đầu dòng đó trong `script.json`. `voice.mjs` vẫn căn câu đó theo bản thu, nên dùng lại được cache forced alignment, không tốn credit. Câu đó không có chỗ trong `VO`, không có WAV, không có cue. Các công cụ của từng phim đánh số câu theo `script.json` (ví dụ `tools/captions-final.mjs` của ct04) phải tra theo id `lN`, không tra theo thứ tự.

## OmniVoice: nhân bản giọng không cần ElevenLabs

Đã chạy thật ngày 07/11/2026 (Cơ thể bạn 10). Công cụ mẫu và hướng dẫn đầy đủ nằm trong dự án Video-Studio: `films/Co the ban/Code/tools/voicestudio/` và `docs/voicestudio-omnivoice.md`. Model `k2-fsa/OmniVoice` (`pip install omnivoice`) không cần token Hugging Face. VoiceStudio ghi giấy phép của model là `commercial_inference: restricted`, nên phải đọc giấy phép trước khi bật kiếm tiền. Nhân bản giọng của người khác hay giọng trong Voice Library còn phụ thuộc điều khoản ElevenLabs và luật của dự án.

- **Một câu một lượt, `duration` cố định.** Nếu đưa cả đoạn vào một lượt, các dòng dính vào nhau, có chữ bị đọc thừa hoặc lặp, nhịp trôi. Độ dài mỗi câu tính bằng số âm tiết ÷ 4,6 cộng 0,37 s cho mỗi dấu phẩy hoặc hai chấm (nhịp ElevenLabs v3 của kênh). Khoảng nghỉ giữa các câu do code đặt.
- **Lời mẫu (`ref_text`) phải khớp đoạn mẫu từng chữ.** Lệch chữ nào thì model đọc chen chữ đó vào câu mới. Câu ngắn bị nặng nhất: nghe như có hai lời chồng lên nhau. Cắt đoạn mẫu 9–14 s theo mốc Whisper đo lại trên chính file, không dùng mốc của bản căn cũ.
- **Thư viện gốc nhận danh sách câu trong một lượt** (`generate(text=[...], duration=[...], voice_clone_prompt=...)`). Đó là cách chạy theo lô mà vẫn tách riêng từng câu. Giọng mẫu chỉ mã hoá một lần bằng `create_voice_clone_prompt`.
- **Tốc độ:** trên GTX 1650 4 GB (qua API VoiceStudio) mỗi câu mất khoảng 20 s với mẫu 9 s và 8 bước, 57 s với mẫu 14 s và 16 bước. Thời gian gần như không phụ thuộc độ dài câu. Trên Kaggle T4, 32 bước, lô 8 câu: 19 câu trong 46 s.
- **Gọi API VoiceStudio từ Python, không gọi `curl` trong Git Bash.** Git Bash làm hỏng dấu tiếng Việt, model nhận chữ méo và đọc ra tiếng vô nghĩa.
- **Soát bằng Whisper không gợi ý trước chữ nào.** Bỏ số ở cả hai phía khi so: Whisper ghi "22" còn kịch bản ghi "hai mươi hai". Trên Kaggle, faster-whisper phải chạy CPU, vì ctranslate2 cần CUDA 12 còn PyTorch đã lên CUDA 13. Âm thanh đưa vào dạng mảng đã đọc sẵn, vì bản `av` có sẵn quá cũ.
- OmniVoice không trả mốc từng từ. Mốc trong câu được rải theo số ký tự, đủ dùng cho cue, không đủ cho karaoke.
