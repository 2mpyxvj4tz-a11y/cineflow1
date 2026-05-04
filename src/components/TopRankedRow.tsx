import { Link } from "react-router-dom";
import { Star, TrendingUp } from "lucide-react";
import { fixImg, type PhimItem } from "@/lib/phim-api";
import { useCardZoom } from "./CardZoomProvider";

interface RankedMovie extends PhimItem {
  __score: number;
}

interface Props {
  movies: RankedMovie[];
  loading?: boolean;
}

// Hiển thị Top 10 với số xếp hạng khổng lồ (Netflix-style) + điểm IMDb dẫn xuất
export function TopRankedRow({ movies, loading }: Props) {
  const top = movies.slice(0, 10);
  const { openZoom } = useCardZoom();

  return (
    <section className="py-6">
      <div className="mb-3 flex items-end justify-between px-4 md:px-12">
        <h2 className="flex items-center gap-2 text-lg font-bold md:text-2xl">
          <TrendingUp className="h-5 w-5 text-primary" /> Top 10 phim hay - Xếp hạng IMDb
        </h2>
        <span className="hidden text-xs text-muted-foreground md:inline">
          Cập nhật theo thời gian thực
        </span>
      </div>
      <div className="scrollbar-hide flex gap-2 overflow-x-auto px-4 pb-4 md:gap-4 md:px-12">
        {loading
          ? Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] w-[180px] flex-shrink-0 animate-pulse rounded-md bg-muted md:w-[230px]" />
            ))
          : top.map((m, idx) => {
              const img = fixImg(m.poster_url || m.thumb_url);
              const to = `/phim/${m.slug}`;
              const rating = m.__score.toFixed(1);
              return (
                <Link
                  key={m._id || m.slug}
                  to={to}
                  onClick={(e) => openZoom(e, { src: img, to, borderRadius: 6 })}
                  className="group relative flex flex-shrink-0 items-end pl-12 md:pl-20"
                >
                  {/* Giant rank number */}
                  <span
                    aria-hidden
                    className="absolute -left-1 bottom-0 select-none font-black leading-none text-transparent transition-transform duration-500 ease-out group-hover:scale-110"
                    style={{
                      fontSize: "10rem",
                      WebkitTextStroke: "3px hsl(var(--foreground))",
                      lineHeight: 0.85,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <div className="relative z-10 w-[140px] overflow-hidden rounded-md nf-card-shadow transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06] md:w-[180px]">
                    <div className="aspect-[2/3]">
                      <img
                        src={img}
                        alt={m.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => ((e.currentTarget as HTMLImageElement).src = "/placeholder.svg")}
                      />
                    </div>
                    <div className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-bold text-yellow-400 backdrop-blur">
                      <Star className="h-3 w-3 fill-current" />
                      {rating}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent p-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                      <h3 className="line-clamp-1 text-xs font-bold text-white">{m.name}</h3>
                      {m.year && <p className="text-[10px] text-white/70">{m.year}</p>}
                    </div>
                  </div>
                </Link>
              );
            })}
      </div>
    </section>
  );
}
