import { useQuery } from "@tanstack/react-query";
import { Hero } from "@/components/Hero";
import { MovieRow } from "@/components/MovieRow";
import { SEO } from "@/components/SEO";
import { WorldClock } from "@/components/WorldClock";
import { TopRankedRow } from "@/components/TopRankedRow";
import { fetchByCountry, fetchListByType, fetchNewMovies, type PhimItem } from "@/lib/phim-api";
import { supabase } from "@/integrations/supabase/client";

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

// "IMDb-like" score (proxy ổn định): chất lượng + năm + bonus US/EU + bonus phim lẻ điện ảnh
// Cho ra 7.0 - 9.6 để hiển thị tự nhiên kiểu IMDb
function imdbScore(m: PhimItem): number {
  const q = qualityScore(m.quality); // 0..6
  const year = m.year ?? 2020;
  const recency = Math.max(0, Math.min(1, (year - 2010) / 15)); // 0..1
  const isAuMy = (m.country ?? []).some((c) => /au-my|my|au/i.test(c.slug));
  const isMovie = m.type === "single" || /phim-le/i.test(m.type ?? "");
  let score = 7.0 + q * 0.28 + recency * 0.9;
  if (isAuMy) score += 0.25;
  if (isMovie) score += 0.1;
  // Tạo dao động nhẹ ổn định theo slug để khác biệt giữa các phim
  const seed = (m.slug || m.name || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const jitter = ((seed % 17) / 17 - 0.5) * 0.4;
  score = Math.min(9.6, Math.max(7.0, score + jitter));
  return score;
}

// Real-time: refetch mỗi 60s, refresh khi tab focus lại
const RT = { refetchInterval: 60_000, refetchOnWindowFocus: true } as const;

export default function Index() {
  const auMyQ = useQuery({ queryKey: ["country", "au-my"], queryFn: () => fetchByCountry("au-my", 1), ...RT });
  const auMy2Q = useQuery({ queryKey: ["country", "au-my", 2], queryFn: () => fetchByCountry("au-my", 2), ...RT });
  const newQ = useQuery({ queryKey: ["new-movies"], queryFn: () => fetchNewMovies(1), ...RT });
  const new2Q = useQuery({ queryKey: ["new-movies", 2], queryFn: () => fetchNewMovies(2), ...RT });
  const leQ = useQuery({ queryKey: ["list", "phim-le"], queryFn: () => fetchListByType("phim-le", 1), ...RT });
  const boQ = useQuery({ queryKey: ["list", "phim-bo"], queryFn: () => fetchListByType("phim-bo", 1), ...RT });
  const animeQ = useQuery({ queryKey: ["list", "hoat-hinh"], queryFn: () => fetchListByType("hoat-hinh", 1), ...RT });
  const tvQ = useQuery({ queryKey: ["list", "tv-shows"], queryFn: () => fetchListByType("tv-shows", 1), ...RT });
  const hanQ = useQuery({ queryKey: ["country", "han-quoc"], queryFn: () => fetchByCountry("han-quoc", 1), ...RT });
  const trungQ = useQuery({ queryKey: ["country", "trung-quoc"], queryFn: () => fetchByCountry("trung-quoc", 1), ...RT });
  const vsubQ = useQuery({ queryKey: ["list", "phim-vietsub"], queryFn: () => fetchListByType("phim-vietsub", 1), ...RT });
  const longTiengQ = useQuery({ queryKey: ["list", "phim-long-tieng"], queryFn: () => fetchListByType("phim-long-tieng", 1), ...RT });
  const donghuaQ = useQuery({
    queryKey: ["donghua-local"],
    queryFn: async () => {
      const { data } = await supabase
        .from("donghua_movies")
        .select("slug,name,origin_name,poster_url,thumb_url,year,quality,episode_current")
        .order("updated_at", { ascending: false })
        .limit(24);
      return (data ?? []).map((m) => ({ ...m, type: "hoathinh" })) as PhimItem[];
    },
    ...RT,
  });

  const auMyMovies = [...(auMyQ.data?.data.items ?? []), ...(auMy2Q.data?.data.items ?? [])];
  const auMyTop = sortByQuality(auMyMovies);
  const heroMovies = auMyTop.length ? auMyTop : (newQ.data?.items ?? []);

  // Pool gộp tất cả nguồn cho ranking & top quality
  const allPool = [
    ...(newQ.data?.items ?? []),
    ...(new2Q.data?.items ?? []),
    ...(leQ.data?.data.items ?? []),
    ...(boQ.data?.data.items ?? []),
    ...auMyMovies,
    ...(hanQ.data?.data.items ?? []),
    ...(trungQ.data?.data.items ?? []),
  ];
  const dedupe = (arr: PhimItem[]) => {
    const seen = new Set<string>();
    return arr.filter((m) => (seen.has(m.slug) ? false : (seen.add(m.slug), true)));
  };
  const uniquePool = dedupe(allPool);

  // Top IMDb-like: sort theo score giảm dần, lấy top 10
  const ranked = uniquePool
    .map((m) => ({ ...m, __score: imdbScore(m) }))
    .sort((a, b) => b.__score - a.__score)
    .slice(0, 20);

  // Top chất lượng cao (1080p+)
  const topQuality = uniquePool.filter((m) => qualityScore(m.quality) >= 4).slice(0, 24);

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
        <TopRankedRow movies={ranked} loading={newQ.isLoading && auMyQ.isLoading} />
        <WorldClock />
        {(donghuaQ.data?.length ?? 0) > 0 && (
          <MovieRow title="🐉 Hoạt hình 3D Donghua" movies={donghuaQ.data ?? []} loading={donghuaQ.isLoading} />
        )}
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
