import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Search, Menu, X, Moon, Sun, Heart, History as HistoryIcon, Settings as SettingsIcon, LogOut, User as UserIcon } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useAuth } from "./AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { fetchCategories, fetchCountries } from "@/lib/phim-api";

const NAV = [
  { to: "/", label: "Trang chủ" },
  { to: "/danh-sach/phim-le", label: "Phim lẻ" },
  { to: "/danh-sach/phim-bo", label: "Phim bộ" },
  { to: "/danh-sach/hoat-hinh", label: "Hoạt hình" },
  { to: "/danh-sach/tv-shows", label: "TV Shows" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [genreOpen, setGenreOpen] = useState(false);
  const navigate = useNavigate();
  const { resolved, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [userMenu, setUserMenu] = useState(false);

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories, staleTime: 1000 * 60 * 60 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    navigate(`/tim-kiem?q=${encodeURIComponent(keyword.trim())}`);
    setSearchOpen(false);
    setMobileOpen(false);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled || mobileOpen ? "bg-background shadow-md" : "bg-gradient-to-b from-black/80 via-black/40 to-transparent"
      }`}
    >
      <div className="flex h-16 items-center gap-4 px-4 md:px-12">
        <Link to="/" className="group/logo flex items-end gap-1.5 text-primary transition-transform duration-500 ease-out hover:scale-105">
          <span className="text-2xl md:text-3xl font-black tracking-tighter transition-all duration-500" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "-0.04em" }}>
            CINE<span className="text-foreground">FLOW</span>
          </span>
          <span
            className="relative -mb-0.5 ml-0.5 select-none text-xs md:text-sm italic text-foreground/60 transition-all duration-500 ease-out group-hover/logo:text-primary group-hover/logo:-translate-y-0.5"
            style={{ fontFamily: "'Dancing Script', 'Brush Script MT', cursive", fontWeight: 600 }}
          >
            Phuc
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              className={({ isActive }) =>
                `px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive ? "text-primary" : "text-foreground/80 hover:text-foreground"
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
          <div className="relative" onMouseLeave={() => setGenreOpen(false)}>
            <button
              onMouseEnter={() => setGenreOpen(true)}
              onClick={() => setGenreOpen((v) => !v)}
              className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground rounded-md"
            >
              Thể loại
            </button>
            {genreOpen && (
              <div className="absolute left-0 top-full mt-1 grid w-[520px] grid-cols-3 gap-1 rounded-md border border-border bg-popover p-3 shadow-xl">
                {categories.map((c) => (
                  <Link
                    key={c.slug}
                    to={`/the-loai/${c.slug}`}
                    onClick={() => setGenreOpen(false)}
                    className="rounded px-2 py-1.5 text-sm text-popover-foreground/80 hover:bg-accent hover:text-foreground"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="flex-1" />

        <form onSubmit={submit} className={`items-center transition-all ${searchOpen ? "flex" : "hidden md:flex"}`}>
          <div className="flex items-center rounded-full border border-border bg-background/80 px-3 backdrop-blur">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              autoFocus={searchOpen}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm phim, diễn viên..."
              className="w-40 bg-transparent px-2 py-1.5 text-sm outline-none md:w-56"
            />
          </div>
        </form>

        <button
          aria-label="Tìm kiếm"
          onClick={() => setSearchOpen((v) => !v)}
          className="rounded-full p-2 text-foreground hover:bg-accent md:hidden"
        >
          <Search className="h-5 w-5" />
        </button>

        <button
          aria-label="Đổi giao diện"
          onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
          className="rounded-full p-2 text-foreground hover:bg-accent"
        >
          {resolved === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {user ? (
          <div className="relative" onMouseLeave={() => setUserMenu(false)}>
            <button
              onClick={() => setUserMenu((v) => !v)}
              onMouseEnter={() => setUserMenu(true)}
              aria-label="Tài khoản"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
            >
              {(user.user_metadata?.display_name || user.email || "U").charAt(0).toUpperCase()}
            </button>
            {userMenu && (
              <div className="absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-md border border-border bg-popover shadow-xl">
                <div className="border-b border-border px-3 py-2 text-xs text-muted-foreground truncate">{user.email}</div>
                <Link to="/yeu-thich" onClick={() => setUserMenu(false)} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent">
                  <Heart className="h-4 w-4" /> Yêu thích
                </Link>
                <Link to="/lich-su" onClick={() => setUserMenu(false)} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent">
                  <HistoryIcon className="h-4 w-4" /> Lịch sử xem
                </Link>
                <Link to="/cai-dat" onClick={() => setUserMenu(false)} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent">
                  <SettingsIcon className="h-4 w-4" /> Cài đặt
                </Link>
                <button onClick={() => { signOut(); setUserMenu(false); }} className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-sm hover:bg-accent">
                  <LogOut className="h-4 w-4" /> Đăng xuất
                </button>
              </div>
            )}
          </div>
        ) : null}

        <button
          aria-label="Menu"
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-full p-2 text-foreground hover:bg-accent lg:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>


      {mobileOpen && (
        <div className="border-t border-border bg-background/95 px-4 py-3 lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/"}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `rounded px-3 py-2 text-sm ${isActive ? "bg-accent text-primary" : "text-foreground/80"}`
                }
              >
                {n.label}
              </NavLink>
            ))}
            <details className="px-1">
              <summary className="cursor-pointer rounded px-3 py-2 text-sm text-foreground/80">Thể loại</summary>
              <div className="grid grid-cols-2 gap-1 p-2">
                {categories.map((c) => (
                  <Link
                    key={c.slug}
                    to={`/the-loai/${c.slug}`}
                    onClick={() => setMobileOpen(false)}
                    className="rounded px-2 py-1 text-xs text-foreground/70 hover:bg-accent"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </details>
          </nav>
        </div>
      )}
    </header>
  );
}
