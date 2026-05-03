import { useQuery } from "@tanstack/react-query";
import { useParams, useSearchParams } from "react-router-dom";
import { fetchListByType } from "@/lib/phim-api";
import { MovieGrid } from "@/components/MovieGrid";
import { Pagination } from "@/components/Pagination";
import { useEffect } from "react";

const TITLES: Record<string, string> = {
  "phim-le": "Phim lẻ",
  "phim-bo": "Phim bộ",
  "hoat-hinh": "Hoạt hình",
  "tv-shows": "TV Shows",
  "phim-vietsub": "Phim Vietsub",
  "phim-thuyet-minh": "Phim Thuyết minh",
  "phim-long-tieng": "Phim Lồng tiếng",
};

export default function MovieList() {
  const { type = "phim-le" } = useParams();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page") || 1);
  const title = TITLES[type] || "Danh sách phim";

  useEffect(() => {
    document.title = `${title} - VPhim`;
  }, [title]);

  const { data, isLoading } = useQuery({
    queryKey: ["list", type, page],
    queryFn: () => fetchListByType(type as any, page),
  });

  const items = data?.data.items ?? [];
  const totalPages = data?.data.params?.pagination?.totalPages ?? 1;

  const setPage = (p: number) => {
    setParams({ page: String(p) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="px-4 py-6 md:px-12">
      <h1 className="mb-6 text-2xl font-bold md:text-3xl">{title}</h1>
      <MovieGrid movies={items} loading={isLoading} />
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
