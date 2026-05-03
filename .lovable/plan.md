
# Kế hoạch: Web xem phim phong cách Netflix

## Tổng quan
Xây dựng web xem phim tiếng Việt sử dụng API miễn phí KKPhim (phim.nguonc.com / phimapi.com) làm nguồn dữ liệu chính. Giao diện tối giản giống Netflix, hỗ trợ dark/light mode, có hệ thống tài khoản người dùng với yêu thích và bình luận.

## Nguồn dữ liệu phim
- **KKPhim API** (https://phimapi.com): API công khai, không cần key, có hàng nghìn phim Việt sub/lồng tiếng, link HLS (.m3u8) sẵn sàng phát.
- Endpoints chính: phim mới cập nhật, chi tiết phim theo slug, tìm kiếm, danh sách theo thể loại/quốc gia/năm.

## Các trang & tính năng

### 1. Trang chủ
- Hero banner carousel: phim hot (auto-slide)
- Các hàng phim cuộn ngang: "Phim mới cập nhật", "Phim lẻ", "Phim bộ", "Phim hoạt hình", "TV Shows"
- Hover card hiện tên + năm + thể loại

### 2. Trang chi tiết phim (`/phim/:slug`)
- Backdrop + poster + tiêu đề, mô tả, năm, thời lượng, thể loại, quốc gia, diễn viên, đạo diễn
- Nút "Xem ngay" + "Thêm vào yêu thích"
- Danh sách tập (cho phim bộ) chia theo server
- Khu vực bình luận & đánh giá sao (1-5)

### 3. Trang xem phim (`/xem/:slug/:episode`)
- Video player HLS (hls.js) full-width, hỗ trợ chuyển tập, chuyển server
- Bên dưới: thông tin phim + bình luận

### 4. Tìm kiếm & lọc (`/tim-kiem`, `/the-loai/:slug`, `/quoc-gia/:slug`)
- Ô search ở header
- Trang kết quả với grid phim, lọc theo thể loại / quốc gia / năm / loại phim, phân trang

### 5. Tài khoản
- Đăng nhập / đăng ký (email + mật khẩu, Google)
- Trang "Yêu thích" (`/yeu-thich`): danh sách phim đã lưu
- Trang "Lịch sử xem" (`/lich-su`): các phim/tập đã xem gần đây
- Trang cài đặt (`/cai-dat`): đổi theme (dark/light/system), đổi tên hiển thị, đăng xuất

### 6. Header / Navigation
- Logo, menu (Trang chủ, Phim lẻ, Phim bộ, Hoạt hình, Thể loại dropdown), search, avatar dropdown
- Toggle theme nhanh

## Thiết kế (Netflix-style)
- Mặc định **dark mode**, có light mode trong cài đặt
- Màu chính: nền đen #0a0a0a, accent đỏ Netflix-like (HSL ~ 0 84% 50%), text trắng/xám
- Font sans hiện đại (Inter)
- Card phim bo nhẹ, hover scale + glow đỏ
- Hàng phim cuộn ngang mượt với mũi tên trái/phải
- Skeleton loading cho data
- Responsive đầy đủ: mobile (1 cột), tablet (3-4), desktop (6+)

## Backend (Lovable Cloud)

### Auth
- Email/password + Google sign-in
- Auto-confirm email bật để test nhanh

### Database tables
- `profiles` (id, display_name, avatar_url, theme_preference, created_at) — auto-create trigger
- `favorites` (id, user_id, movie_slug, movie_name, poster_url, created_at)
- `watch_history` (id, user_id, movie_slug, episode_slug, movie_name, poster_url, watched_at)
- `comments` (id, user_id, movie_slug, content, rating, created_at)
- RLS: user chỉ đọc/sửa của mình; comments mọi người đọc được, chỉ chủ sở hữu sửa/xoá

## Phạm vi triển khai theo bước
Phạm vi lớn — sẽ làm theo các giai đoạn để kiểm soát chất lượng:

**Giai đoạn 1 (lần này):**
- Setup design system Netflix dark/light
- Tích hợp KKPhim API (fetch helper)
- Header + trang chủ với các hàng phim cuộn ngang + hero carousel
- Trang chi tiết phim
- Trang xem phim với HLS player
- Tìm kiếm cơ bản

**Giai đoạn 2 (yêu cầu sau):**
- Bật Lovable Cloud, setup auth (email + Google) + bảng dữ liệu
- Trang đăng nhập/đăng ký, profile dropdown
- Yêu thích, lịch sử xem
- Bình luận & đánh giá
- Trang cài đặt + theme toggle persist

## Chi tiết kỹ thuật
- React Router cho routing đa trang
- TanStack Query cho cache API phim
- `hls.js` cho streaming m3u8
- `next-themes`-like custom provider qua class `dark` trên `<html>`
- API base: `https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3`, `https://phimapi.com/phim/{slug}`, `https://phimapi.com/v1/api/tim-kiem`
- Tất cả màu qua CSS variables HSL trong `index.css` + `tailwind.config.ts`
