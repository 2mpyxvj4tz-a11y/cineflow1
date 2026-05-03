import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}

export function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;
  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="rounded-md border border-border p-2 disabled:opacity-40 hover:bg-accent"
        aria-label="Trang trước"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`min-w-9 rounded-md px-3 py-1.5 text-sm font-medium ${
            p === page ? "bg-primary text-primary-foreground" : "border border-border hover:bg-accent"
          }`}
        >
          {p}
        </button>
      ))}
      <button
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="rounded-md border border-border p-2 disabled:opacity-40 hover:bg-accent"
        aria-label="Trang sau"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
