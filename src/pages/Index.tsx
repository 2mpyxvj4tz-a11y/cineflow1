import { useQuery } from "@tanstack/react-query";
import { Hero } from "@/components/Hero";
import { MovieRow } from "@/components/MovieRow";
import { SEO } from "@/components/SEO";
import { fetchByCountry, fetchListByType, fetchNewMovies, type PhimItem } from "@/lib/phim-api";

// Ưu tiên phim chất lượng cao: 4K → 2K → FHD → 1080p → HD → còn lại
const QUALITY_RANK: Record<string, number> = {
  "4k": 6, "2k": 5, "fhd": 4, "1080p": 4, "1080": 4, "hd": 3, "720p": 2, "sd": 1,
};
function qualityScore(q?: string) {
  if (!q) return 0;
  const k = q.toLowerCase().trim();
  return QUALITY_RANK[k] ?? (k.includes("4k") ? 6 : k.includes("2k") ? 5 : k.includes("fhd") || k.includes("1080") ? 4 : k.includes("hd") ? 3 : 0);
}
function sortByQuality(items: PhimItem[] = []): PhimItem[] {
  return [...items].sort((a, b) => qualityScore(b.quality) - qualityScore(a.quality));
}

export default function Index() {
  const auMyQ = useQuery({ queryKey: ["country", "au-my"], queryFn: () => fetchByCountry("au-my", 1) });
  const auMy2Q = useQuery({ queryKey: ["country", "au-my", 2], queryFn: () => fetchByCountry("au-my", 2) });
  const newQ = useQuery({ queryKey: ["new-movies"], queryFn: () => fetchNewMovies(1) });
  const leQ = useQuery({ queryKey: ["list", "phim-le"], queryFn: () => fetchListByType("phim-le", 1) });
  const boQ = useQuery({ queryKey: ["list", "phim-bo"], queryFn: () => fetchListByType("phim-bo", 1) });
  const animeQ = useQuery({ queryKey: ["list", "hoat-hinh"], queryFn: () => fetchListByType("hoat-hinh", 1) });
  const tvQ = useQuery({ queryKey: ["list", "tv-shows"], queryFn: () => fetchListByType("tv-shows", 1) });
  const hanQ = useQuery({ queryKey: ["country", "han-quoc"], queryFn: () => fetchByCountry("han-quoc", 1) });
  const trungQ = useQuery({ queryKey: ["country", "trung-quoc"], queryFn: () => fetchByCountry("trung-quoc", 1) });
  const vsubQ = useQuery({ queryKey: ["list", "phim-vietsub"], queryFn: () => fetchListByType("phim-vietsub", 1) });
  const longTiengQ = useQuery({ queryKey: ["list", "phim-long-tieng"], queryFn: () => fetchListByType("phim-long-tieng", 1) });

  const auMyMovies = [...(auMyQ.data?.data.items ?? []), ...(auMy2Q.data?.data.items ?? [])];
  const auMyTop = sortByQuality(auMyMovies);
  const heroMovies = auMyTop.length ? auMyTop : (newQ.data?.items ?? []);

  // "Top chất lượng cao" gộp từ nhiều nguồn, lọc 1080p+
  const allPool = [
    ...(newQ.data?.items ?? []),
    ...(leQ.data?.data.items ?? []),
    ...(boQ.data?.data.items ?? []),
    ...auMyMovies,
  ];
  const seen = new Set<string>();
  const topQuality = allPool
    .filter((m) => qualityScore(m.quality) >= 4)
    .filter((m) => (seen.has(m.slug) ? false : (seen.add(m.slug), true)))
    .slice(0, 24);

  return (
    <>
      <SEO
        title="Trang chủ"
        description="Xem phim Âu Mỹ, Hàn, Trung, Việt online HD, FHD & 4K vietsub, lồng tiếng. Cập nhật phim bom tấn Hollywood mỗi ngày."
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "CineFlow",
          url: window.location.origin,
        }}
      />
      <Hero movies={heroMovies} />
      <div className="-mt-32 relative z-10 space-y-1 pb-12">
        <MovieRow title="🔥 Đề xuất - Phim Âu Mỹ" movies={auMyTop} loading={auMyQ.isLoading} viewAllHref="/quoc-gia/au-my" />
        <MovieRow title="🏆 Chất lượng cao 4K / FHD" movies={topQuality} loading={newQ.isLoading} />
        <MovieRow title="Mới cập nhật" movies={sortByQuality(newQ.data?.items ?? [])} loading={newQ.isLoading} />
        <MovieRow title="Bom tấn Hollywood" movies={sortByQuality(auMy2Q.data?.data.items ?? [])} loading={auMy2Q.isLoading} viewAllHref="/quoc-gia/au-my" />
        <MovieRow title="Phim lẻ hot" movies={sortByQuality(leQ.data?.data.items ?? [])} loading={leQ.isLoading} viewAllHref="/danh-sach/phim-le" />
        <MovieRow title="Phim bộ hot" movies={sortByQuality(boQ.data?.data.items ?? [])} loading={boQ.isLoading} viewAllHref="/danh-sach/phim-bo" />
        <MovieRow title="Phim Hàn Quốc" movies={sortByQuality(hanQ.data?.data.items ?? [])} loading={hanQ.isLoading} viewAllHref="/quoc-gia/han-quoc" />
        <MovieRow title="Phim Trung Quốc" movies={sortByQuality(trungQ.data?.data.items ?? [])} loading={trungQ.isLoading} viewAllHref="/quoc-gia/trung-quoc" />
        <MovieRow title="Phim Vietsub" movies={sortByQuality(vsubQ.data?.data.items ?? [])} loading={vsubQ.isLoading} viewAllHref="/danh-sach/phim-vietsub" />
        <MovieRow title="Phim Lồng tiếng" movies={sortByQuality(longTiengQ.data?.data.items ?? [])} loading={longTiengQ.isLoading} viewAllHref="/danh-sach/phim-long-tieng" />
        <MovieRow title="Hoạt hình" movies={sortByQuality(animeQ.data?.data.items ?? [])} loading={animeQ.isLoading} viewAllHref="/danh-sach/hoat-hinh" />
        <MovieRow title="TV Shows" movies={sortByQuality(tvQ.data?.data.items ?? [])} loading={tvQ.isLoading} viewAllHref="/danh-sach/tv-shows" />
      </div>
    </>
  );
}
