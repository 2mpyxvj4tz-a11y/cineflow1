import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MovieCard } from "./MovieCard";
import type { PhimItem } from "@/lib/phim-api";
import { Link } from "react-router-dom";

interface Props {
  title: string;
  movies: PhimItem[];
  loading?: boolean;
  viewAllHref?: string;
}

export function MovieRow({ title, movies, loading, viewAllHref }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  return (
    <section className="group/row relative py-4">
      <div className="mb-3 flex items-end justify-between px-4 md:px-12">
        <h2 className="text-lg font-bold md:text-2xl">{title}</h2>
        {viewAllHref && (
          <Link to={viewAllHref} className="text-sm text-muted-foreground hover:text-primary">
            Xem tất cả →
          </Link>
        )}
      </div>
      <div className="relative">
        <button
          aria-label="Cuộn trái"
          onClick={() => scroll(-1)}
          className="absolute left-0 top-1/2 z-20 hidden h-full w-12 -translate-y-1/2 items-center justify-center bg-gradient-to-r from-background/90 to-transparent opacity-0 transition-opacity group-hover/row:opacity-100 md:flex"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
        <div
          ref={ref}
          className="scrollbar-hide flex gap-3 overflow-x-auto scroll-smooth px-4 md:px-12 pb-2"
        >
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[2/3] w-[160px] flex-shrink-0 animate-pulse rounded-md bg-muted md:w-[200px] lg:w-[220px]"
                />
              ))
            : movies.map((m) => (
                <div key={m._id || m.slug} className="w-[160px] flex-shrink-0 md:w-[200px] lg:w-[220px]">
                  <MovieCard movie={m} />
                </div>
              ))}
        </div>
        <button
          aria-label="Cuộn phải"
          onClick={() => scroll(1)}
          className="absolute right-0 top-1/2 z-20 hidden h-full w-12 -translate-y-1/2 items-center justify-center bg-gradient-to-l from-background/90 to-transparent opacity-0 transition-opacity group-hover/row:opacity-100 md:flex"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      </div>
    </section>
  );
}
