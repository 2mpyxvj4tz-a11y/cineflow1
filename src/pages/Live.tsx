import { useMemo, useState } from "react";
import { Radio, ExternalLink, Tv } from "lucide-react";

/**
 * Trang xem bóng đá trực tiếp.
 * Nhúng iframe từ các nguồn free phổ biến VN — ưu tiên các kênh 1080p có BLV tiếng Việt.
 * Lưu ý: link nhúng phụ thuộc vào nhà cung cấp; nếu chặn iframe sẽ có nút mở tab mới.
 */

type Source = {
  id: string;
  name: string;
  quality: string;
  blv: boolean;
  /** Hàm dựng URL nhúng theo slug kênh / id trận */
  embed: (channel: string) => string;
  /** URL gốc khi không nhúng được */
  origin: (channel: string) => string;
};

const SOURCES: Source[] = [
  {
    id: "thapcam",
    name: "Thapcam TV",
    quality: "1080p",
    blv: true,
    embed: (c) => `https://thapcam.xyz/embed/${c}`,
    origin: (c) => `https://thapcam.xyz/live/${c}`,
  },
  {
    id: "vebo",
    name: "Vebo TV",
    quality: "1080p",
    blv: true,
    embed: (c) => `https://vebo.xyz/embed/${c}`,
    origin: (c) => `https://vebo.xyz/truc-tiep/${c}`,
  },
  {
    id: "socolive",
    name: "Socolive",
    quality: "FHD",
    blv: true,
    embed: (c) => `https://socolivetv.me/embed/${c}`,
    origin: (c) => `https://socolivetv.me/truc-tiep/${c}`,
  },
  {
    id: "xoilac",
    name: "Xoilac TV",
    quality: "HD",
    blv: true,
    embed: (c) => `https://xoilac-tv.live/embed/${c}`,
    origin: (c) => `https://xoilac-tv.live/${c}`,
  },
];

/** Danh sách kênh phổ biến — slug giống nhau giữa các nguồn nên reuse được */
const CHANNELS = [
  { slug: "thapcam1", name: "Thapcam 1", desc: "Ngoại hạng Anh / Champions League" },
  { slug: "thapcam2", name: "Thapcam 2", desc: "La Liga / Serie A" },
  { slug: "thapcam3", name: "Thapcam 3", desc: "Bundesliga / Ligue 1" },
  { slug: "thapcam4", name: "Thapcam 4", desc: "V-League / AFC" },
  { slug: "thapcam5", name: "Thapcam 5", desc: "Đội tuyển QG" },
  { slug: "thapcam6", name: "Thapcam 6", desc: "Cúp QG các nước" },
  { slug: "thapcam7", name: "Thapcam 7", desc: "Giao hữu / Trẻ" },
  { slug: "thapcam8", name: "Thapcam 8", desc: "Dự phòng" },
];

export default function Live() {
  const [channel, setChannel] = useState(CHANNELS[0].slug);
  const [sourceId, setSourceId] = useState(SOURCES[0].id);
  const [iframeKey, setIframeKey] = useState(0);

  const source = useMemo(() => SOURCES.find((s) => s.id === sourceId)!, [sourceId]);
  const embedUrl = source.embed(channel);
  const originUrl = source.origin(channel);
  const activeChannel = CHANNELS.find((c) => c.slug === channel);

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-3xl md:text-4xl font-black tracking-tight">
              <Radio className="h-7 w-7 text-primary animate-pulse" />
              Bóng đá trực tiếp
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Ưu tiên nguồn 1080p có bình luận tiếng Việt — nếu lag hãy đổi nguồn bên dưới.
            </p>
          </div>
          <a
            href={originUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-accent"
          >
            <ExternalLink className="h-4 w-4" /> Mở nguồn gốc
          </a>
        </div>

        {/* Player */}
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black shadow-2xl">
          <iframe
            key={iframeKey + sourceId + channel}
            src={embedUrl}
            title={`${activeChannel?.name} - ${source.name}`}
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            referrerPolicy="no-referrer"
            className="h-full w-full"
          />
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          Không xem được? <button onClick={() => setIframeKey((k) => k + 1)} className="text-primary hover:underline">Tải lại player</button>
          {" "}hoặc đổi nguồn khác.
        </p>

        {/* Source selector */}
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold">Chọn nguồn phát</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {SOURCES.map((s) => {
              const active = s.id === sourceId;
              return (
                <button
                  key={s.id}
                  onClick={() => setSourceId(s.id)}
                  className={`group relative rounded-lg border p-4 text-left transition-colors ${
                    active ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Tv className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="font-semibold">{s.name}</span>
                  </div>
                  <div className="mt-1.5 flex gap-1.5">
                    <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">{s.quality}</span>
                    {s.blv && (
                      <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-foreground/80">BLV VN</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Channel grid */}
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold">Kênh đang phát</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {CHANNELS.map((c) => {
              const active = c.slug === channel;
              return (
                <button
                  key={c.slug}
                  onClick={() => setChannel(c.slug)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    active ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{c.name}</span>
                    {active && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{c.desc}</p>
                </button>
              );
            })}
          </div>
        </section>

        <p className="mt-8 rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          Các luồng phát do bên thứ ba (Thapcam, Vebo, Socolive, Xoilac) cung cấp. CineFlow chỉ tổng hợp link, không lưu trữ video. Vui lòng tuân thủ pháp luật về bản quyền tại nơi bạn sinh sống.
        </p>
      </div>
    </div>
  );
}
