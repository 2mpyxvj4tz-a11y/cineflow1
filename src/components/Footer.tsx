import { Film } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-card/40 px-4 py-10 md:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center gap-2 text-primary">
          <Film className="h-6 w-6" />
          <span className="text-xl font-bold">VPhim</span>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          VPhim là website xem phim online miễn phí, cập nhật phim mới nhất hàng ngày với chất lượng HD,
          vietsub và lồng tiếng. Dữ liệu phim được cung cấp bởi KKPhim.
        </p>
        <p className="mt-4 text-xs text-muted-foreground">© {new Date().getFullYear()} VPhim. Chỉ dùng cho mục đích trải nghiệm.</p>
      </div>
    </footer>
  );
}
