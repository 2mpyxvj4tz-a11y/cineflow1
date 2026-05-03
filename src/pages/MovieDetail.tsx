import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { fetchMovieDetail, fixImg } from "@/lib/phim-api";
import { Play, Calendar, Clock, Globe } from "lucide-react";
import { useEffect } from "react";
import { FavoriteButton } from "@/components/FavoriteButton";
import { Comments } from "@/components/Comments";
import { SEO } from "@/components/SEO";

export default function MovieDetail() {
  const { slug = "" } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["movie", slug],
    queryFn: () => fetchMovieDetail(slug),
    enabled: !!slug,
  });

  useEffect(() => {
    if (data?.movie?.name) document.title = `${data.movie.name} - VPhim`;
  }, [data]);

  if (isLoading) {
    return <div className="px-4 py-20 md:px-12"><div className="h-96 animate-pulse rounded-lg bg-muted" /></div>;
  }
  if (error || !data?.movie) {
    return <div className="px-4 py-20 text-center md:px-12">Không tìm thấy phim.</div>;
  }

  const m = data.movie;
  const episodes = data.episodes ?? m.episodes ?? [];
  const firstEp = episodes[0]?.server_data?.[0];

  return (
    <article>
      <div className="relative h-[55vh] min-h-[360px] w-full overflow-hidden">
        <img src={fixImg(m.thumb_url || m.poster_url)} alt={m.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 gradient-hero" />
      </div>

      <div className="relative -mt-40 px-4 md:px-12">
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <img
            src={fixImg(m.poster_url || m.thumb_url)}
            alt={m.name}
            className="hidden w-[220px] rounded-lg shadow-xl md:block"
          />
          <div>
            <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">{m.name}</h1>
            {m.origin_name && <p className="mt-2 text-lg text-foreground/70">{m.origin_name}</p>}

            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              {m.year && <span className="rounded bg-foreground/10 px-2 py-0.5">{m.year}</span>}
              {m.quality && <span className="rounded bg-primary px-2 py-0.5 text-primary-foreground">{m.quality}</span>}
              {m.lang && <span className="rounded border border-border px-2 py-0.5">{m.lang}</span>}
              {m.episode_current && <span className="rounded border border-border px-2 py-0.5">{m.episode_current}</span>}
              {m.time && (
                <span className="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5">
                  <Clock className="h-3 w-3" /> {m.time}
                </span>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {firstEp && (
                <Link
                  to={`/xem/${m.slug}/${episodes[0].server_data[0].slug}`}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-105"
                >
                  <Play className="h-5 w-5 fill-current" /> Xem ngay
                </Link>
              )}
              <FavoriteButton movieSlug={m.slug} movieName={m.name} posterUrl={fixImg(m.poster_url || m.thumb_url)} />

            </div>

            <div className="mt-6 grid gap-2 text-sm">
              {m.category && m.category.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Thể loại: </span>
                  {m.category.map((c, i) => (
                    <span key={c.slug}>
                      <Link to={`/the-loai/${c.slug}`} className="text-primary hover:underline">{c.name}</Link>
                      {i < m.category!.length - 1 && ", "}
                    </span>
                  ))}
                </div>
              )}
              {m.country && m.country.length > 0 && (
                <div className="inline-flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Quốc gia: </span>
                  {m.country.map((c, i) => (
                    <span key={c.slug}>
                      <Link to={`/quoc-gia/${c.slug}`} className="text-primary hover:underline">{c.name}</Link>
                      {i < m.country!.length - 1 && ", "}
                    </span>
                  ))}
                </div>
              )}
              {m.director && m.director.length > 0 && m.director[0] && (
                <div><span className="text-muted-foreground">Đạo diễn: </span>{m.director.join(", ")}</div>
              )}
              {m.actor && m.actor.length > 0 && m.actor[0] && (
                <div><span className="text-muted-foreground">Diễn viên: </span>{m.actor.slice(0, 8).join(", ")}</div>
              )}
            </div>

            {m.content && (
              <div className="mt-6">
                <h2 className="mb-2 text-lg font-bold">Nội dung</h2>
                <div
                  className="prose prose-sm max-w-none text-foreground/80 dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: m.content }}
                />
              </div>
            )}
          </div>
        </div>

        {episodes.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-2xl font-bold">Danh sách tập</h2>
            {episodes.map((srv) => (
              <div key={srv.server_name} className="mb-6">
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground">{srv.server_name}</h3>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
                  {srv.server_data.map((ep) => (
                    <Link
                      key={ep.slug}
                      to={`/xem/${m.slug}/${ep.slug}`}
                      className="rounded-md bg-secondary px-3 py-2 text-center text-sm font-medium text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      {ep.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        <Comments movieSlug={m.slug} />
      </div>
    </article>
  );
}
