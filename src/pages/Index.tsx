import { useQuery } from "@tanstack/react-query";
import { Hero } from "@/components/Hero";
import { MovieRow } from "@/components/MovieRow";
import { SEO } from "@/components/SEO";
import { fetchByCountry, fetchListByType, fetchNewMovies } from "@/lib/phim-api";

export default function Index() {
  const auMyQ = useQuery({ queryKey: ["country", "au-my"], queryFn: () => fetchByCountry("au-my", 1) });
  const newQ = useQuery({ queryKey: ["new-movies"], queryFn: () => fetchNewMovies(1) });
  const leQ = useQuery({ queryKey: ["list", "phim-le"], queryFn: () => fetchListByType("phim-le", 1) });
  const boQ = useQuery({ queryKey: ["list", "phim-bo"], queryFn: () => fetchListByType("phim-bo", 1) });
  const animeQ = useQuery({ queryKey: ["list", "hoat-hinh"], queryFn: () => fetchListByType("hoat-hinh", 1) });
  const tvQ = useQuery({ queryKey: ["list", "tv-shows"], queryFn: () => fetchListByType("tv-shows", 1) });

  const auMyMovies = auMyQ.data?.data.items ?? [];
  const heroMovies = auMyMovies.length ? auMyMovies : (newQ.data?.items ?? []);

  return (
    <>
      <SEO
        title="Trang chủ"
        description="Xem phim Âu Mỹ, Hàn, Trung, Việt online HD & 4K vietsub, lồng tiếng. Cập nhật phim bom tấn Hollywood mỗi ngày."
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "CineFlow",
          url: window.location.origin,
        }}
      />
      <Hero movies={heroMovies} />
      <div className="-mt-24 relative z-10 space-y-2">
        <MovieRow title="🔥 Đề xuất - Phim Âu Mỹ" movies={auMyMovies} loading={auMyQ.isLoading} viewAllHref="/quoc-gia/au-my" />
        <MovieRow title="Mới cập nhật" movies={newQ.data?.items ?? []} loading={newQ.isLoading} />
        <MovieRow title="Phim lẻ hot" movies={leQ.data?.data.items ?? []} loading={leQ.isLoading} viewAllHref="/danh-sach/phim-le" />
        <MovieRow title="Phim bộ hot" movies={boQ.data?.data.items ?? []} loading={boQ.isLoading} viewAllHref="/danh-sach/phim-bo" />
        <MovieRow title="Hoạt hình" movies={animeQ.data?.data.items ?? []} loading={animeQ.isLoading} viewAllHref="/danh-sach/hoat-hinh" />
        <MovieRow title="TV Shows" movies={tvQ.data?.data.items ?? []} loading={tvQ.isLoading} viewAllHref="/danh-sach/tv-shows" />
      </div>
    </>
  );
}
