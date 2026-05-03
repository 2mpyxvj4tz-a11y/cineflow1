import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { searchMovies } from "@/lib/phim-api";
import { MovieGrid } from "@/components/MovieGrid";
import { Pagination } from "@/components/Pagination";
import { SEO } from "@/components/SEO";
import { X } from "lucide-react";

const LANG_OPTIONS = [
  { value: "vietsub", label: "Vietsub" },
  { value: "long-tieng", label: "Lồng tiếng" },
  { value: "thuyet-minh", label: "Thuyết minh" },
];

const QUALITY_OPTIONS = [
  { value: "4K", label: "4K" },
  { value: "FHD", label: "FHD" },
  { value: "HD", label: "HD" },
  { value: "SD", label: "SD" },
];

function matchLang(itemLang: string | undefined, filter: string) {
  if (!itemLang) return false;
  const norm = itemLang.toLowerCase();
  if (filter === "vietsub") return norm.includes("vietsub") || norm.includes("phụ đề") || norm.includes("phu de");
  if (filter === "long-tieng") return norm.includes("lồng tiếng") || norm.includes("long tieng");
  if (filter === "thuyet-minh") return norm.includes("thuyết minh") || norm.includes("thuyet minh");
  return false;
}

function matchQuality(itemQ: string | undefined, filter: string) {
  if (!itemQ) return false;
  const norm = itemQ.toUpperCase();
  if (filter === "4K") return norm.includes("4K") || norm.includes("2160");
  if (filter === "FHD") return norm.includes("FHD") || norm.includes("1080");
  if (filter === "HD") return norm === "HD" || norm.includes("HD") && !norm.includes("FHD");
  if (filter === "SD") return norm.includes("SD") || norm.includes("480");
  return false;
}

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const page = Number(params.get("page") || 1);
  const langFilter = params.get("lang") || "";
  const qualityFilter = params.get("quality") || "";

  const { data, isLoading } = useQuery({
    queryKey: ["search", q, page],
    queryFn: () => searchMovies(q, page),
    enabled: !!q,
  });

  const allItems = data?.data.items ?? [];
  const totalPages = data?.data.params?.pagination?.totalPages ?? 1;

  const items = useMemo(() => {
    return allItems.filter((m) => {
      if (langFilter && !matchLang(m.lang, langFilter)) return false;
      if (qualityFilter && !matchQuality(m.quality, qualityFilter)) return false;
      return true;
    });
  }, [allItems, langFilter, qualityFilter]);

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (!value) next.delete(key);
    else next.set(key, value);
    next.delete("page");
    setParams(next);
  };

  const hasFilters = !!(langFilter || qualityFilter);

  return (
    <div className="px-4 py-6 md:px-12">
      <SEO
        title={q ? `Tìm kiếm: ${q}` : "Tìm kiếm phim"}
        description={q ? `Kết quả tìm kiếm phim cho "${q}" trên CineFlow.` : undefined}
        noindex
      />
      <h1 className="mb-4 text-2xl font-bold md:text-3xl">
        Kết quả tìm kiếm: <span className="text-primary">"{q}"</span>
      </h1>

      {q && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
          <FilterGroup
            label="Phụ đề"
            options={LANG_OPTIONS}
            value={langFilter}
            onChange={(v) => updateParam("lang", v)}
          />
          <div className="hidden h-6 w-px bg-border md:block" />
          <FilterGroup
            label="Chất lượng"
            options={QUALITY_OPTIONS}
            value={qualityFilter}
            onChange={(v) => updateParam("quality", v)}
          />
          {hasFilters && (
            <button
              onClick={() => { const n = new URLSearchParams(); if (q) n.set("q", q); setParams(n); }}
              className="ml-auto inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent"
            >
              <X className="h-3.5 w-3.5" /> Xoá lọc
            </button>
          )}
        </div>
      )}

      {!q ? (
        <p className="text-muted-foreground">Nhập từ khoá để tìm phim.</p>
      ) : (
        <>
          {hasFilters && !isLoading && (
            <p className="mb-3 text-sm text-muted-foreground">
              Hiển thị <span className="font-semibold text-foreground">{items.length}</span> / {allItems.length} phim trong trang
            </p>
          )}
          <MovieGrid movies={items} loading={isLoading} emptyText={hasFilters ? "Không có phim phù hợp với bộ lọc" : "Không tìm thấy phim phù hợp"} />
          <Pagination page={page} totalPages={totalPages} onChange={(p) => {
            const n = new URLSearchParams(params); n.set("page", String(p)); setParams(n);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }} />
        </>
      )}
    </div>
  );
}

interface FilterGroupProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string | null) => void;
}

function FilterGroup({ label, options, value, onChange }: FilterGroupProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-semibold text-muted-foreground">{label}:</span>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(active ? null : o.value)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:border-primary hover:text-primary"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
