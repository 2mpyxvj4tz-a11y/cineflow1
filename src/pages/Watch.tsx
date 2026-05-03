import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { fetchMovieDetail, fixImg } from "@/lib/phim-api";
import { HlsPlayer } from "@/components/HlsPlayer";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function Watch() {
  const { slug = "", episode = "" } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["movie", slug],
    queryFn: () => fetchMovieDetail(slug),
    enabled: !!slug,
  });

  const m = data?.movie;
  const episodes = data?.episodes ?? m?.episodes ?? [];
  const [serverIdx, setServerIdx] = useState(0);

  const currentServer = episodes[serverIdx];
  const currentEp = useMemo(() => currentServer?.server_data.find((e) => e.slug === episode) ?? currentServer?.server_data[0], [currentServer, episode]);

  // Find previous/next episode in current server
  const epIndex = currentServer?.server_data.findIndex((e) => e.slug === currentEp?.slug) ?? -1;
  const prev = epIndex > 0 ? currentServer?.server_data[epIndex - 1] : null;
  const next = epIndex >= 0 && currentServer && epIndex < currentServer.server_data.length - 1 ? currentServer.server_data[epIndex + 1] : null;

  useEffect(() => {
    if (m?.name && currentEp) document.title = `${m.name} - ${currentEp.name} - VPhim`;
  }, [m, currentEp]);

  if (isLoading || !m || !currentEp) {
    return <div className="aspect-video w-full animate-pulse bg-muted" />;
  }

  return (
    <div>
      <div className="bg-black">
        <div className="mx-auto aspect-video max-h-[85vh] w-full max-w-[1600px]">
          <HlsPlayer src={currentEp.link_m3u8} poster={fixImg(m.thumb_url || m.poster_url)} />
        </div>
      </div>

      <div className="px-4 py-6 md:px-12">
        <Link to={`/phim/${m.slug}`} className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Quay lại chi tiết
        </Link>
        <h1 className="text-2xl font-bold md:text-3xl">{m.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Đang xem: {currentEp.name}</p>

        <div className="mt-4 flex gap-2">
          {prev && (
            <Link
              to={`/xem/${m.slug}/${prev.slug}`}
              className="inline-flex items-center gap-1 rounded-md bg-secondary px-4 py-2 text-sm hover:bg-accent"
            >
              <ChevronLeft className="h-4 w-4" /> Tập trước
            </Link>
          )}
          {next && (
            <Link
              to={`/xem/${m.slug}/${next.slug}`}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Tập sau <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {episodes.length > 1 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {episodes.map((srv, i) => (
              <button
                key={srv.server_name}
                onClick={() => setServerIdx(i)}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  i === serverIdx ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                {srv.server_name}
              </button>
            ))}
          </div>
        )}

        <section className="mt-6">
          <h2 className="mb-3 text-lg font-semibold">Danh sách tập</h2>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
            {currentServer?.server_data.map((ep) => (
              <Link
                key={ep.slug}
                to={`/xem/${m.slug}/${ep.slug}`}
                className={`rounded-md px-3 py-2 text-center text-sm font-medium transition-colors ${
                  ep.slug === currentEp.slug
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                {ep.name}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
