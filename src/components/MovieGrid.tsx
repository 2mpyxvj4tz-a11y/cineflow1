import { MovieCard } from "./MovieCard";
import type { PhimItem } from "@/lib/phim-api";

interface Props {
  movies: PhimItem[];
  loading?: boolean;
  emptyText?: string;
}

export function MovieGrid({ movies, loading, emptyText = "Không có kết quả" }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    );
  }
  if (!movies.length) return <p className="py-12 text-center text-muted-foreground">{emptyText}</p>;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {movies.map((m) => (
        <MovieCard key={m._id || m.slug} movie={m} />
      ))}
    </div>
  );
}
