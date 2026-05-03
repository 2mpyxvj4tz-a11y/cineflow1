import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Play, Info } from "lucide-react";
import { fixImg, type PhimItem } from "@/lib/phim-api";

interface Props {
  movies: PhimItem[];
}

export function Hero({ movies }: Props) {
  const [idx, setIdx] = useState(0);
  const slides = movies.slice(0, 5);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides.length]);

  if (slides.length === 0) {
    return <div className="h-[60vh] w-full animate-pulse bg-muted" />;
  }

  const current = slides[idx];

  return (
    <section className="relative h-[70vh] min-h-[480px] w-full overflow-hidden">
      {slides.map((m, i) => (
        <img
          key={m.slug}
          src={fixImg(m.thumb_url || m.poster_url)}
          alt={m.name}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
            i === idx ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute inset-x-0 bottom-0 px-4 pb-16 md:px-12 md:pb-24">
        <div className="max-w-2xl">
          <h1 className="mb-3 text-3xl font-extrabold leading-tight text-shadow-lg md:text-6xl">
            {current.name}
          </h1>
          {current.origin_name && (
            <p className="mb-3 text-base text-foreground/80 md:text-lg">{current.origin_name}</p>
          )}
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
            {current.year && <span className="rounded bg-foreground/10 px-2 py-0.5 backdrop-blur">{current.year}</span>}
            {current.quality && <span className="rounded bg-primary/90 px-2 py-0.5 text-primary-foreground">{current.quality}</span>}
            {current.lang && <span className="rounded border border-foreground/30 px-2 py-0.5">{current.lang}</span>}
            {current.episode_current && <span className="rounded border border-foreground/30 px-2 py-0.5">{current.episode_current}</span>}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to={`/phim/${current.slug}`}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-105"
            >
              <Play className="h-5 w-5 fill-current" /> Xem ngay
            </Link>
            <Link
              to={`/phim/${current.slug}`}
              className="inline-flex items-center gap-2 rounded-md bg-foreground/10 px-6 py-3 font-semibold backdrop-blur transition-colors hover:bg-foreground/20"
            >
              <Info className="h-5 w-5" /> Chi tiết
            </Link>
          </div>
        </div>
        <div className="absolute bottom-6 right-6 hidden gap-1 md:flex">
          {slides.map((_, i) => (
            <button
              key={i}
              aria-label={`Slide ${i + 1}`}
              onClick={() => setIdx(i)}
              className={`h-1.5 rounded-full transition-all ${i === idx ? "w-8 bg-primary" : "w-3 bg-foreground/40"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
