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
    const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), 7000);
    return () => clearInterval(t);
  }, [slides.length]);

  if (slides.length === 0) {
    return <div className="h-[85vh] w-full animate-pulse bg-muted" />;
  }

  const current = slides[idx];

  return (
    <section className="relative h-[85vh] min-h-[560px] w-full overflow-hidden">
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
      <div className="absolute inset-0 gradient-hero-side" />
      <div className="absolute inset-0 gradient-hero" />

      <div className="absolute inset-x-0 bottom-0 px-4 pb-24 md:px-16 md:pb-32">
        <div className="max-w-2xl">
          <h1 className="mb-4 text-4xl font-black leading-none text-white text-shadow-lg md:text-7xl">
            {current.name}
          </h1>
          {current.origin_name && (
            <p className="mb-3 text-base text-white/80 text-shadow-md md:text-lg">{current.origin_name}</p>
          )}
          <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-white">
            {current.year && <span className="rounded bg-white/15 px-2 py-0.5 backdrop-blur">{current.year}</span>}
            {current.quality && <span className="rounded bg-primary px-2 py-0.5 font-semibold text-primary-foreground">{current.quality}</span>}
            {current.lang && <span className="rounded border border-white/40 px-2 py-0.5">{current.lang}</span>}
            {current.episode_current && <span className="rounded border border-white/40 px-2 py-0.5">{current.episode_current}</span>}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to={`/xem/${current.slug}`}
              className="inline-flex items-center gap-2 rounded bg-white px-7 py-3 text-base font-bold text-black transition-all hover:bg-white/80"
            >
              <Play className="h-6 w-6 fill-current" /> Phát
            </Link>
            <Link
              to={`/phim/${current.slug}`}
              className="inline-flex items-center gap-2 rounded bg-white/25 px-7 py-3 text-base font-bold text-white backdrop-blur transition-colors hover:bg-white/40"
            >
              <Info className="h-6 w-6" /> Thông tin
            </Link>
          </div>
        </div>
        <div className="absolute bottom-8 right-6 hidden gap-1 md:flex">
          {slides.map((_, i) => (
            <button
              key={i}
              aria-label={`Slide ${i + 1}`}
              onClick={() => setIdx(i)}
              className={`h-1 rounded-full transition-all ${i === idx ? "w-10 bg-primary" : "w-4 bg-white/40"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
