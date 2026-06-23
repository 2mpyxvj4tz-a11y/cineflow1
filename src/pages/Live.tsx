import { Radio, ExternalLink, Tv, Trophy } from "lucide-react";

/**
 * Trang tổng hợp link bóng đá trực tiếp.
 * Các site nguồn (Thapcam/Vebo/Socolive/Xoilac) chặn nhúng iframe (X-Frame-Options: deny)
 * nên ta hiển thị dạng grid link, click mở tab mới — ưu tiên nguồn 1080p + BLV tiếng Việt.
 */

type Source = {
  id: string;
  name: string;
  quality: string;
  blv: boolean;
  color: string;
  home: string;
  /** Link xem trực tiếp theo slug kênh */
  watch: (channel: string) => string;
};

const SOURCES: Source[] = [
  {
    id: "thapcam",
    name: "Thapcam TV",
    quality: "1080p",
    blv: true,
    color: "from-red-600 to-orange-500",
    home: "https://thapcam.xyz",
    watch: (c) => `https://thapcam.xyz/live/${c}`,
  },
  {
    id: "vebo",
    name: "Vebo TV",
    quality: "1080p",
    blv: true,
    color: "from-blue-600 to-cyan-500",
    home: "https://vebo.xyz",
    watch: (c) => `https://vebo.xyz/truc-tiep/${c}`,
  },
  {
    id: "socolive",
    name: "Socolive",
    quality: "FHD",
    blv: true,
    color: "from-green-600 to-emerald-500",
    home: "https://socolivetv.me",
    watch: (c) => `https://socolivetv.me/truc-tiep/${c}`,
  },
  {
    id: "xoilac",
    name: "Xoilac TV",
    quality: "HD",
    blv: true,
    color: "from-purple-600 to-pink-500",
    home: "https://xoilac-tv.live",
    watch: (c) => `https://xoilac-tv.live/${c}`,
  },
];

const CHANNELS = [
  { slug: "thapcam1", name: "Kênh 1", desc: "Ngoại hạng Anh / Champions League" },
  { slug: "thapcam2", name: "Kênh 2", desc: "La Liga / Serie A" },
  { slug: "thapcam3", name: "Kênh 3", desc: "Bundesliga / Ligue 1" },
  { slug: "thapcam4", name: "Kênh 4", desc: "V-League / AFC" },
  { slug: "thapcam5", name: "Kênh 5", desc: "Đội tuyển Quốc gia" },
  { slug: "thapcam6", name: "Kênh 6", desc: "Cúp QG các nước" },
  { slug: "thapcam7", name: "Kênh 7", desc: "Giao hữu / Trẻ" },
  { slug: "thapcam8", name: "Kênh 8", desc: "Dự phòng" },
];

export default function Live() {
  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <h1 className="flex items-center gap-2 text-3xl md:text-4xl font-black tracking-tight">
            <Radio className="h-7 w-7 text-red-500 animate-pulse" />
            Bóng đá trực tiếp
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Bấm vào kênh để mở luồng xem trong tab mới. Ưu tiên 1080p có bình luận tiếng Việt.
          </p>
        </div>

        {/* Quick access các nguồn chính */}
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
            <Trophy className="h-5 w-5 text-primary" /> Truy cập nhanh nguồn
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {SOURCES.map((s) => (
              <a
                key={s.id}
                href={s.home}
                target="_blank"
                rel="noopener noreferrer"
                className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${s.color} p-4 text-white shadow-lg transition-transform hover:scale-[1.03]`}
              >
                <div className="flex items-center gap-2">
                  <Tv className="h-5 w-5" />
                  <span className="font-bold">{s.name}</span>
                </div>
                <div className="mt-2 flex gap-1.5">
                  <span className="rounded bg-white/25 px-1.5 py-0.5 text-[10px] font-bold backdrop-blur">{s.quality}</span>
                  {s.blv && <span className="rounded bg-white/25 px-1.5 py-0.5 text-[10px] font-bold backdrop-blur">BLV VN</span>}
                </div>
                <ExternalLink className="absolute right-3 top-3 h-4 w-4 opacity-70 transition-opacity group-hover:opacity-100" />
              </a>
            ))}
          </div>
        </section>

        {/* Kênh — mỗi kênh có 4 link nguồn để fallback */}
        <section>
          <h2 className="mb-3 text-lg font-bold">Kênh đang phát</h2>
          <div className="space-y-3">
            {CHANNELS.map((c) => (
              <div key={c.slug} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="font-bold">{c.name}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{c.desc}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SOURCES.map((s) => (
                    <a
                      key={s.id}
                      href={s.watch(c.slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:border-primary hover:bg-primary/10"
                    >
                      <Tv className="h-3.5 w-3.5" />
                      {s.name}
                      <span className="rounded bg-primary/20 px-1 py-px text-[9px] font-bold text-primary">{s.quality}</span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-8 rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          Lưu ý: CineFlow chỉ tổng hợp link công khai từ bên thứ ba, không lưu trữ video. Nếu một nguồn không vào được, hãy thử nguồn khác — các site này hay đổi domain. Vui lòng tuân thủ pháp luật bản quyền tại nơi bạn sinh sống.
        </p>
      </div>
    </div>
  );
}
