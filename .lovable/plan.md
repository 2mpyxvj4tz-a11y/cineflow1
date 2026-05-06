## Mục tiêu

Thêm 5 tính năng vào CineFlow:
1. Menu **Quốc gia** trên header để lọc phim theo nước
2. Nút **tua ±5 giây** trong trình phát
3. **Phòng xem chung** (tối đa 40 người) có chat + voice (mic on/off/mute)
4. Tab chọn **Vietsub / Thuyết minh / Lồng tiếng** to hơn, có poster phim
5. Hàng **diễn viên** dạng avatar tròn ở dưới mô tả phim

---

### 1. Menu Quốc gia (Header)

`src/components/Header.tsx`:
- Thêm dropdown "Quốc gia" cạnh "Thể loại", dùng `fetchCountries()` (đã có sẵn trong `phim-api.ts`).
- Click → điều hướng `/quoc-gia/:slug` (route đã tồn tại trong `App.tsx` → `Category` mode="country").
- Hiển thị grid 3 cột trên desktop, accordion trên mobile (giống dropdown thể loại hiện tại).

---

### 2. Tua ±5 giây

`src/components/HlsPlayer.tsx`:
- Overlay 2 nút bo tròn (`Rewind 5s` / `Forward 5s`) hai bên nút play, icon `RotateCcw` / `RotateCw` từ lucide.
- Bind phím tắt: `←` lùi 5s, `→` tới 5s, `Space` play/pause.
- Double-tap trái/phải trên mobile để tua.

---

### 3. Phòng xem chung (Watch Party)

**Database (migration mới):**
- `watch_rooms`: `id`, `room_code` (text unique 6 ký tự), `password_hash` (text), `host_id` (uuid), `movie_slug`, `episode_slug`, `created_at`, `max_users` (int default 40).
- `room_participants`: `id`, `room_id` (fk), `user_id`, `display_name`, `joined_at`, `mic_enabled` (bool), `mic_muted` (bool).
- `room_messages`: `id`, `room_id`, `user_id`, `display_name`, `content`, `created_at`.
- RLS: chỉ thành viên trong phòng mới insert/select message + participant.
- Bật **realtime** cho `room_participants`, `room_messages` (broadcast video state cũng dùng channel).
- Edge function `verify-room` để hash + so password (bcrypt) khi join.

**UI:**
- Trên `Watch.tsx` thêm nút "Xem chung" → mở dialog: tạo phòng (sinh code 6 ký tự + password) hoặc nhập `room_code` + password để vào.
- Trang `/phong/:code`:
  - Cột trái: video player đồng bộ (host phát play/pause/seek qua Supabase channel `broadcast`, các client lắng nghe và `seekTo`).
  - Cột phải: danh sách người (≤40 + counter), khung chat realtime, các nút mic: bật mic, tắt mic, mute người khác.
- Voice dùng **WebRTC peer-to-peer mesh** (đủ cho 8-10 người ổn định; >10 sẽ cảnh báo độ trễ) với signaling qua Supabase Realtime channel. Không dùng SFU (chi phí). Lưu ý người dùng giới hạn voice thực tế ~10 người, chat vẫn 40.

---

### 4. Tab Vietsub / Thuyết minh / Lồng tiếng

`src/components/MovieRow.tsx` hoặc khu vực hiển thị tab ngôn ngữ trên `Index.tsx`:
- Tăng kích thước tab: padding `px-6 py-3`, font `text-base font-semibold`.
- Thêm thumbnail poster (fetch 1 phim đại diện mỗi tab) hiển thị bên cạnh chữ — ảnh nhỏ 40x56 bo góc.
- Tab active có viền primary + glow.

---

### 5. Diễn viên dạng avatar tròn

`src/pages/MovieDetail.tsx`:
- Sau phần "Nội dung", thêm section "Diễn viên".
- Render `m.actor` thành hàng cuộn ngang, mỗi item: avatar tròn 80x80 + tên ở dưới.
- API KKPhim không trả ảnh diễn viên → dùng dịch vụ ảnh fallback: gọi TMDB search person (free, no key cần) hoặc fallback initials avatar (chữ cái đầu trên nền gradient) nếu không có ảnh. Mặc định dùng **initials avatar** (đảm bảo luôn hiển thị, không phụ thuộc external API). Nếu user muốn ảnh thật sẽ thêm TMDB sau.

---

### Files sẽ tạo/sửa

**Tạo mới:**
- `supabase/migrations/...watch_rooms.sql`
- `supabase/functions/verify-room/index.ts`
- `src/pages/WatchParty.tsx`
- `src/components/CreateRoomDialog.tsx`
- `src/components/ActorAvatars.tsx`

**Sửa:**
- `src/components/Header.tsx` (menu quốc gia)
- `src/components/HlsPlayer.tsx` (±5s)
- `src/components/MovieRow.tsx` hoặc tab ngôn ngữ trên `Index.tsx` (tab to hơn + poster)
- `src/pages/MovieDetail.tsx` (avatars + nút xem chung)
- `src/pages/Watch.tsx` (nút xem chung)
- `src/App.tsx` (route `/phong/:code`)

---

### Câu hỏi cần xác nhận trước khi build

- Voice chat: chấp nhận giới hạn thực tế ~10 người do dùng WebRTC mesh (không tốn server)? Hay muốn bắt buộc 40 người voice (cần tích hợp dịch vụ SFU như LiveKit, có chi phí)?
- Ảnh diễn viên: dùng initials avatar (gradient + chữ cái) hay tích hợp TMDB lấy ảnh thật?
