import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { searchMovies } from "@/lib/phim-api";
import { MovieGrid } from "@/components/MovieGrid";
import { Pagination } from "@/components/Pagination";
import { useEffect } from "react";

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const page = Number(params.get("page") || 1);

  useEffect(() => {
    document.title = `Tìm kiếm: ${q} - VPhim`;
  }, [q]);

  const { data, isLoading } = useQuery({
    queryKey: ["search", q, page],
    queryFn: () => searchMovies(q, page),
    enabled: !!q,
  });

  const items = data?.data.items ?? [];
  const totalPages = data?.data.params?.pagination?.totalPages ?? 1;

  return (
    <div className="px-4 py-6 md:px-12">
      <h1 className="mb-6 text-2xl font-bold md:text-3xl">
        Kết quả tìm kiếm: <span className="text-primary">"{q}"</span>
      </h1>
      {!q ? (
        <p className="text-muted-foreground">Nhập từ khoá để tìm phim.</p>
      ) : (
        <>
          <MovieGrid movies={items} loading={isLoading} emptyText="Không tìm thấy phim phù hợp" />
          <Pagination page={page} totalPages={totalPages} onChange={(p) => { setParams({ q, page: String(p) }); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        </>
      )}
    </div>
  );
}
