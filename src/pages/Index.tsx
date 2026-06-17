import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Hero } from "@/components/Hero";
import { MovieRow } from "@/components/MovieRow";
import { SEO } from "@/components/SEO";
import { WorldClock } from "@/components/WorldClock";
import { TopRankedRow } from "@/components/TopRankedRow";
import { LazyRow } from "@/components/LazyRow";
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

// "IMDb-like" score
function imdbScore(m: PhimItem): number {
  const q = qualityScore(m.quality);
  const year = m.year ?? 2020;
  const recency = Math.max(0, Math.min(1, (year - 2010) / 15));
  const isAuMy = (m.country ?? []).some((c) => /au-my|my|au/i.test(c.slug));
  const isMovie = m.type === "single" || /phim-le/i.test(m.type ?? "");
  let score = 7.0 + q * 0.28 + recency * 0.9;
  if (isAuMy) score += 0.25;
  if (isMovie) score += 0.1;
  const seed = (m.slug || m.name || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const jitter = ((seed % 17) / 17 - 0.5) * 0.4;
  score = Math.min(9.6, Math.max(7.0, score + jitter));
  return score;
}

// Cache lâu, không poll - dữ liệu phim không đổi liên tục
const CACHE = { staleTime: 10 * 60_000, gcTime: 30 * 60_000, refetchOnWindowFocus: false } as const;

// Giới hạn 16 item/hàng (đủ scroll ngang, giảm 30% DOM so với 24)
const trim = (arr: PhimItem[] = []) => arr.slice(0, 12);

export default function Index() {
  // Eager: chỉ load các hàng above-the-fold
  const auMyQ = useQuery({ queryKey: ["country", "au-my"], queryFn: () => fetchByCountry("au-my", 1), ...CACHE });
  const newQ = useQuery({ queryKey: ["new-movies"], queryFn: () => fetchNewMovies(1), ...CACHE });

  // Lazy: chỉ fetch khi hàng tương ứng visible (giảm 13 → 2 request ban đầu)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const markVisible = (key: string) => setVisibleKeys((s) => (s.has(key) ? s : new Set(s).add(key)));
  const on = (k: string) => visibleKeys.has(k);

  const auMy2Q = useQuery({ queryKey: ["country", "au-my", 2], queryFn: () => fetchByCountry("au-my", 2), enabled: on("auMy2"), ...CACHE });
  const leQ = useQuery({ queryKey: ["list", "phim-le"], queryFn: () => fetchListByType("phim-le", 1), enabled: on("le"), ...CACHE });
  const boQ = useQuery({ queryKey: ["list", "phim-bo"], queryFn: () => fetchListByType("phim-bo", 1), enabled: on("bo"), ...CACHE });
  const animeQ = useQuery({ queryKey: ["list", "hoat-hinh"], queryFn: () => fetchListByType("hoat-hinh", 1), enabled: on("anime"), ...CACHE });
  const tvQ = useQuery({ queryKey: ["list", "tv-shows"], queryFn: () => fetchListByType("tv-shows", 1), enabled: on("tv"), ...CACHE });
  const hanQ = useQuery({ queryKey: ["country", "han-quoc"], queryFn: () => fetchByCountry("han-quoc", 1), enabled: on("han"), ...CACHE });
  const trungQ = useQuery({ queryKey: ["country", "trung-quoc"], queryFn: () => fetchByCountry("trung-quoc", 1), enabled: on("trung"), ...CACHE });
  const vsubQ = useQuery({ queryKey: ["list", "phim-vietsub"], queryFn: () => fetchListByType("phim-vietsub", 1), enabled: on("vsub"), ...CACHE });
  const longTiengQ = useQuery({ queryKey: ["list", "phim-long-tieng"], queryFn: () => fetchListByType("phim-long-tieng", 1), enabled: on("lt"), ...CACHE });
  const donghuaQ = useQuery({
    queryKey: ["donghua-local"],
    enabled: on("donghua"),
    queryFn: async () => {
      const { data } = await supabase
        .from("donghua_movies")
        .select("slug,name,origin_name,poster_url,thumb_url,year,quality,episode_current")
        .order("updated_at", { ascending: false })
        .limit(16);
      return (data ?? []).map((m) => ({ ...m, type: "hoathinh" })) as PhimItem[];
    },
    ...CACHE,
  });

  const auMyMovies = [...(auMyQ.data?.data.items ?? []), ...(auMy2Q.data?.data.items ?? [])];
  const auMyTop = sortByQuality(auMyMovies);
  const heroMovies = auMyTop.length ? auMyTop : (newQ.data?.items ?? []);

  // Pool cho ranking - chỉ dùng dữ liệu đã load
  const allPool = [
    ...(newQ.data?.items ?? []),
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
  const ranked = uniquePool.map((m) => ({ ...m, __score: imdbScore(m) })).sort((a, b) => b.__score - a.__score).slice(0, 16);
  const topQuality = uniquePool.filter((m) => qualityScore(m.quality) >= 4).slice(0, 16);

  return (
    <>
      <SEO
        title="Trang chủ"
        description="Xem phim Âu Mỹ, Hàn, Trung, Việt online HD, FHD & 4K vietsub, lồng tiếng. Cập nhật phim bom tấn Hollywood mỗi ngày."
        jsonLd={{ "@context": "https://schema.org", "@type": "WebSite", name: "CineFlow", url: window.location.origin }}
      />
      <Hero movies={heroMovies} />
      <div className="-mt-32 relative z-10 space-y-1 pb-12">
        {/* Above-the-fold: render ngay */}
        <TopRankedRow movies={ranked} loading={newQ.isLoading && auMyQ.isLoading} />
        <WorldClock />
        <MovieRow title="🔥 Đề xuất - Phim Âu Mỹ" movies={trim(auMyTop)} loading={auMyQ.isLoading} viewAllHref="/quoc-gia/au-my" />
        <MovieRow title="Mới cập nhật" movies={trim(sortByQuality(newQ.data?.items ?? []))} loading={newQ.isLoading} />

        {/* Lazy mount: chỉ render & fetch khi cuộn tới */}
        <LazyRow onVisible={() => markVisible("donghua")} minHeight={380}>
          {(donghuaQ.data?.length ?? 0) > 0 && (
            <MovieRow title="🐉 Hoạt hình 3D Donghua" movies={donghuaQ.data ?? []} loading={donghuaQ.isLoading} />
          )}
        </LazyRow>
        <LazyRow minHeight={380}>
          <MovieRow title="🏆 Chất lượng cao 4K / FHD" movies={topQuality} loading={newQ.isLoading} />
        </LazyRow>
        <LazyRow onVisible={() => markVisible("auMy2")} minHeight={380}>
          <MovieRow title="Bom tấn Hollywood" movies={trim(sortByQuality(auMy2Q.data?.data.items ?? []))} loading={auMy2Q.isLoading} viewAllHref="/quoc-gia/au-my" />
        </LazyRow>
        <LazyRow onVisible={() => markVisible("le")} minHeight={380}>
          <MovieRow title="Phim lẻ hot" movies={trim(sortByQuality(leQ.data?.data.items ?? []))} loading={leQ.isLoading} viewAllHref="/danh-sach/phim-le" />
        </LazyRow>
        <LazyRow onVisible={() => markVisible("bo")} minHeight={380}>
          <MovieRow title="Phim bộ hot" movies={trim(sortByQuality(boQ.data?.data.items ?? []))} loading={boQ.isLoading} viewAllHref="/danh-sach/phim-bo" />
        </LazyRow>
        <LazyRow onVisible={() => markVisible("han")} minHeight={380}>
          <MovieRow title="Phim Hàn Quốc" movies={trim(sortByQuality(hanQ.data?.data.items ?? []))} loading={hanQ.isLoading} viewAllHref="/quoc-gia/han-quoc" />
        </LazyRow>
        <LazyRow onVisible={() => markVisible("trung")} minHeight={380}>
          <MovieRow title="Phim Trung Quốc" movies={trim(sortByQuality(trungQ.data?.data.items ?? []))} loading={trungQ.isLoading} viewAllHref="/quoc-gia/trung-quoc" />
        </LazyRow>
        <LazyRow onVisible={() => markVisible("vsub")} minHeight={380}>
          <MovieRow title="Phim Vietsub" movies={trim(sortByQuality(vsubQ.data?.data.items ?? []))} loading={vsubQ.isLoading} viewAllHref="/danh-sach/phim-vietsub" />
        </LazyRow>
        <LazyRow onVisible={() => markVisible("lt")} minHeight={380}>
          <MovieRow title="Phim Lồng tiếng" movies={trim(sortByQuality(longTiengQ.data?.data.items ?? []))} loading={longTiengQ.isLoading} viewAllHref="/danh-sach/phim-long-tieng" />
        </LazyRow>
        <LazyRow onVisible={() => markVisible("anime")} minHeight={380}>
          <MovieRow title="Hoạt hình" movies={trim(sortByQuality(animeQ.data?.data.items ?? []))} loading={animeQ.isLoading} viewAllHref="/danh-sach/hoat-hinh" />
        </LazyRow>
        <LazyRow onVisible={() => markVisible("tv")} minHeight={380}>
          <MovieRow title="TV Shows" movies={trim(sortByQuality(tvQ.data?.data.items ?? []))} loading={tvQ.isLoading} viewAllHref="/danh-sach/tv-shows" />
        </LazyRow>
      </div>
    </>
  );
}
