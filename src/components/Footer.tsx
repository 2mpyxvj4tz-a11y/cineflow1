import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-card/40 px-4 py-10 md:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center gap-1">
          <span className="text-xl font-black tracking-tighter text-primary" style={{ letterSpacing: "-0.04em" }}>
            CINE<span className="text-foreground">FLOW</span>
          </span>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          CineFlow - Khám phá kho phim Âu Mỹ, Hàn Quốc, Trung Quốc và Việt Nam chất lượng HD, FHD, 2K và 4K
          với phụ đề Việt và lồng tiếng. Cập nhật phim mới mỗi ngày.
        </p>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link to="/danh-sach/phim-le" className="hover:text-primary">Phim lẻ</Link>
          <Link to="/danh-sach/phim-bo" className="hover:text-primary">Phim bộ</Link>
          <Link to="/quoc-gia/au-my" className="hover:text-primary">Phim Âu Mỹ</Link>
          <Link to="/quoc-gia/han-quoc" className="hover:text-primary">Phim Hàn</Link>
          <Link to="/danh-sach/hoat-hinh" className="hover:text-primary">Hoạt hình</Link>
          <Link to="/danh-sach/tv-shows" className="hover:text-primary">TV Shows</Link>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} CineFlow. Chỉ dùng cho mục đích trải nghiệm.
        </p>
      </div>
    </footer>
  );
}
