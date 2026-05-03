import { useQuery } from "@tanstack/react-query";
import { useParams, useSearchParams } from "react-router-dom";
import { fetchByCategory, fetchByCountry } from "@/lib/phim-api";
import { MovieGrid } from "@/components/MovieGrid";
import { Pagination } from "@/components/Pagination";

interface Props {
  mode: "category" | "country";
}

export default function Category({ mode }: Props) {
  const { slug = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page") || 1);

  const { data, isLoading } = useQuery({
    queryKey: [mode, slug, page],
    queryFn: () => (mode === "category" ? fetchByCategory(slug, page) : fetchByCountry(slug, page)),
    enabled: !!slug,
  });

  const items = data?.data.items ?? [];
  const totalPages = data?.data.params?.pagination?.totalPages ?? 1;
  const heading = (mode === "category" ? "Thể loại: " : "Quốc gia: ") + slug;

  return (
    <div className="px-4 py-6 md:px-12">
      <h1 className="mb-6 text-2xl font-bold capitalize md:text-3xl">{heading.replace(/-/g, " ")}</h1>
      <MovieGrid movies={items} loading={isLoading} />
      <Pagination page={page} totalPages={totalPages} onChange={(p) => { setParams({ page: String(p) }); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
    </div>
  );
}
