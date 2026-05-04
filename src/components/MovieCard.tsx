import { Link } from "react-router-dom";
import { fixImg, type PhimItem } from "@/lib/phim-api";
import { Play, Star } from "lucide-react";

interface Props {
  movie: PhimItem;
  variant?: "portrait" | "landscape";
}

export function MovieCard({ movie, variant = "portrait" }: Props) {
  const img =
    variant === "landscape"
      ? fixImg(movie.thumb_url || movie.poster_url)
      : fixImg(movie.poster_url || movie.thumb_url);

  const isHighQ = /4k|2k|fhd|1080/i.test(movie.quality || "");

  return (
    <Link
      to={`/phim/${movie.slug}`}
      className="group relative block overflow-hidden rounded-md bg-card will-change-transform transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.08] hover:z-20 nf-card-shadow hover:shadow-[0_20px_50px_-12px_hsl(357_92%_47%/0.5)]"
    >
      <div className={variant === "landscape" ? "aspect-video" : "aspect-[2/3]"}>
        <img
          src={img}
          alt={movie.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
          onError={(e) => ((e.currentTarget as HTMLImageElement).src = "/placeholder.svg")}
        />
      </div>
      {movie.episode_current && (
        <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur">
          {movie.episode_current}
        </span>
      )}
      {movie.quality && (
        <span
          className={`absolute right-2 top-2 rounded px-2 py-0.5 text-xs font-bold backdrop-blur ${
            isHighQ ? "bg-primary text-primary-foreground" : "bg-black/70 text-white"
          }`}
        >
          {movie.quality}
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent p-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2 text-white">
          <Play className="h-4 w-4 fill-current text-primary" />
          <h3 className="line-clamp-1 text-sm font-bold">{movie.name}</h3>
        </div>
        {movie.origin_name && (
          <p className="line-clamp-1 text-xs text-white/70 mt-0.5">{movie.origin_name}</p>
        )}
        <div className="mt-1 flex items-center gap-2 text-xs text-white/80">
          {movie.year && <span>{movie.year}</span>}
          {movie.lang && <span className="rounded border border-white/30 px-1">{movie.lang}</span>}
          {isHighQ && (
            <span className="ml-auto inline-flex items-center gap-0.5 text-primary">
              <Star className="h-3 w-3 fill-current" />HD+
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
