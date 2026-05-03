import { Link } from "react-router-dom";
import { fixImg, type PhimItem } from "@/lib/phim-api";
import { Play } from "lucide-react";

interface Props {
  movie: PhimItem;
  variant?: "portrait" | "landscape";
}

export function MovieCard({ movie, variant = "portrait" }: Props) {
  const img = variant === "landscape" ? fixImg(movie.thumb_url || movie.poster_url) : fixImg(movie.poster_url || movie.thumb_url);
  return (
    <Link
      to={`/phim/${movie.slug}`}
      className="group relative block overflow-hidden rounded-md bg-muted transition-all duration-300 hover:scale-105 hover:z-10 hover:shadow-[var(--shadow-glow)]"
    >
      <div className={variant === "landscape" ? "aspect-video" : "aspect-[2/3]"}>
        <img
          src={img}
          alt={movie.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => ((e.currentTarget as HTMLImageElement).src = "/placeholder.svg")}
        />
      </div>
      {movie.episode_current && (
        <span className="absolute left-2 top-2 rounded bg-primary/90 px-2 py-0.5 text-xs font-semibold text-primary-foreground">
          {movie.episode_current}
        </span>
      )}
      {movie.quality && (
        <span className="absolute right-2 top-2 rounded bg-background/80 px-2 py-0.5 text-xs font-semibold text-foreground backdrop-blur">
          {movie.quality}
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2 text-white">
          <Play className="h-4 w-4 fill-current" />
          <h3 className="line-clamp-1 text-sm font-semibold">{movie.name}</h3>
        </div>
        {movie.origin_name && (
          <p className="line-clamp-1 text-xs text-white/70 mt-0.5">{movie.origin_name}</p>
        )}
        <div className="mt-1 flex items-center gap-2 text-xs text-white/80">
          {movie.year && <span>{movie.year}</span>}
          {movie.lang && <span className="rounded border border-white/30 px-1">{movie.lang}</span>}
        </div>
      </div>
    </Link>
  );
}
