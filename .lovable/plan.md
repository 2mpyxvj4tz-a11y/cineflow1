## Chẩn đoán hiện trạng

Mình đã profile trang chủ — đây là số đo:

| Chỉ số | Giá trị | Đánh giá |
|---|---|---|
| **DOM nodes** | **22.914** | Quá nặng (mục tiêu <5.000) |
| **Element trên trang** | 6.231 | Nguyên nhân chính gây lag scroll |
| **Event listeners** | 1.287 | Mỗi card tạo nhiều listener |
| **FCP (thấy nội dung đầu tiên)** | **4,6s** | Rất chậm (tốt <1,8s) |
| **DOM Content Loaded** | 4,3s | Chậm |
| **Task duration** | 7,75s | Main thread bị block lâu |
| **JS bundle ban đầu** | ~1,3MB / 73 script | Không code-split, tải cả HLS ở trang chủ |
| **API call song song khi load** | **13 useQuery** | Đều `refetchInterval: 60s` → poll liên tục |

## Nguyên nhân gốc

1. **Render eager 15 hàng × 24 card = 360 card** ngay từ đầu, mỗi card có animation hover `will-change-transform` + gradient + 4-5 phần tử con.
2. **13 query song song**, mỗi query tự refetch mỗi 60s và khi focus tab → liên tục re-render toàn trang chủ.
3. **Không code-split route**: `Watch.tsx` kéo theo `hls.js` (229KB) tải kể cả khi đang ở `/`. Cộng với MovieDetail, WatchParty đều nằm trong bundle chính.
4. **Không preconnect** tới `phimimg.com` / `phimapi.com` → ảnh và API tốn round-trip DNS+TLS.
5. **`CardZoomProvider`** dùng FLIP animation phức tạp + setTimeout chuyển trang → kéo dài chuyển trang ~520ms.
6. **`lucide-react` 156KB** — import không tối ưu trên một số file.

## Kế hoạch tối ưu (chia 2 nhóm)

### Nhóm A — Quick wins (impact lớn, rủi ro thấp)

1. **Code-split route bằng `React.lazy` + `Suspense`** trong `src/App.tsx`
   - Tách `Watch`, `MovieDetail`, `WatchParty`, `MovieList`, `Category`, `Search`, `Favorites`, `History`, `Settings`, `Auth` thành chunk riêng.
   - Trang chủ sẽ KHÔNG tải `hls.js` nữa → giảm ~230KB bundle khởi đầu.
   - Kỳ vọng FCP giảm còn ~2s.

2. **Giảm tần suất refetch & cache lâu hơn** trong `src/pages/Index.tsx`
   - Bỏ `refetchInterval: 60_000` (poll mỗi phút × 13 query là dư thừa cho danh sách phim).
   - Đổi thành: `staleTime: 10 * 60_000`, `refetchOnWindowFocus: false`. Người dùng vẫn được dữ liệu mới khi vào lại sau 10 phút.
   - Tiết kiệm ~13 request/phút và xoá re-render chu kỳ.

3. **Preconnect tới CDN ảnh & API** trong `index.html`
   ```html
   <link rel="preconnect" href="https://phimimg.com" crossorigin>
   <link rel="preconnect" href="https://phimapi.com" crossorigin>
   <link rel="dns-prefetch" href="https://phimimg.com">
   ```

4. **Bỏ `will-change-transform` mặc định trên `MovieCard`** (`src/components/MovieCard.tsx`)
   - Chỉ kích hoạt khi hover (`group-hover:will-change-transform`). 360 card cùng bật `will-change` đẩy GPU layer rất nặng.

5. **Thêm `width`/`height` cho `<img>` trong `MovieCard`** để browser không phải tính layout lại từng ảnh.

### Nhóm B — Cải tiến cấu trúc (impact rất lớn, cần thay đổi nhiều hơn)

6. **Lazy-mount các MovieRow ngoài viewport** (`src/components/MovieRow.tsx` + tạo wrapper `LazyRow`)
   - Dùng `IntersectionObserver`: chỉ render hàng khi gần vào viewport (200px). Trước khi vào viewport chỉ hiển thị skeleton chiều cao cố định.
   - Kỳ vọng DOM nodes giảm từ ~23k xuống ~3-5k khi load đầu, scroll mượt hẳn.

7. **Lazy-fire các `useQuery` không nằm trong 2-3 hàng đầu**
   - Dùng option `enabled` của react-query, chỉ bật khi `LazyRow` của hàng đó visible.
   - Trang chủ chỉ gọi 2-3 API ngay từ đầu thay vì 13.

8. **Giảm số card mỗi hàng** từ 24 xuống 14-16 (vẫn đủ để scroll ngang) — giảm ~30% DOM mỗi hàng.

9. **Giữ `CardZoomProvider` nhưng giảm delay từ 520ms → 280ms** và tắt overlay trên thiết bị `prefers-reduced-motion`.

## Files sẽ sửa

- `src/App.tsx` — bọc routes bằng `lazy()` + `<Suspense>`
- `index.html` — thêm preconnect/dns-prefetch
- `src/pages/Index.tsx` — bỏ `refetchInterval`, đặt `staleTime`, giảm số lượng query mở ngay, dùng `LazyRow`
- `src/components/MovieCard.tsx` — bỏ `will-change`, thêm `width`/`height`
- `src/components/MovieRow.tsx` — wrap nội dung trong observer
- `src/components/LazyRow.tsx` *(tạo mới)* — wrapper IntersectionObserver
- `src/components/CardZoomProvider.tsx` — giảm thời gian transition

## Câu hỏi cho bạn

Bạn muốn mình làm:
- **Chỉ Nhóm A** (quick wins, ~5 file, ít rủi ro, kỳ vọng FCP từ 4,6s → ~2s)?
- **Cả A + B** (toàn diện, kỳ vọng FCP ~1,2s + scroll mượt hẳn, có thay đổi cấu trúc MovieRow)?

Hoặc nếu bạn có hàng/khu vực nào *bắt buộc* phải hiện ngay (vd Hero + TopRanked + Hoạt hình 3D), cứ nói để mình ưu tiên giữ nguyên không lazy.
