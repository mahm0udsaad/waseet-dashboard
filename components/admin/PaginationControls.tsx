import Link from "next/link";
import { getPaginationSummary, getTotalPages } from "@/lib/pagination";

type PaginationControlsProps = {
  pathname: string;
  page: number;
  pageSize: number;
  totalItems: number;
  query?: Record<string, string | undefined>;
};

export function PaginationControls({
  pathname,
  page,
  pageSize,
  totalItems,
  query = {},
}: PaginationControlsProps) {
  const totalPages = getTotalPages(totalItems, pageSize);
  const safePage = Math.min(page, totalPages);
  const summary = getPaginationSummary(totalItems, safePage, pageSize);

  if (totalItems === 0) {
    return null;
  }

  const pageSet = new Set([
    1,
    totalPages,
    Math.max(1, safePage - 1),
    safePage,
    Math.min(totalPages, safePage + 1),
  ]);
  const pages = [...pageSet].sort((a, b) => a - b);

  const buildHref = (targetPage: number) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    params.set("page", String(targetPage));
    return `${pathname}?${params.toString()}`;
  };

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-3 text-sm">
      <p className="text-slate-500">
        عرض {summary.from}-{summary.to} من {totalItems}
      </p>
      {totalPages > 1 ? (
        <div className="flex items-center gap-1">
          <Link
            href={buildHref(Math.max(1, safePage - 1))}
            aria-disabled={safePage === 1}
            className={`rounded-lg border px-3 py-1 ${
              safePage === 1
                ? "pointer-events-none border-[var(--border)] text-slate-300"
                : "border-[var(--border)] text-slate-700 hover:border-[var(--brand)] hover:text-[var(--brand)]"
            }`}
          >
            السابق
          </Link>
          {pages.map((pageNumber, index) => {
            const previous = pages[index - 1];
            const showDots = previous && pageNumber - previous > 1;
            return (
              <span key={pageNumber} className="flex items-center gap-1">
                {showDots ? <span className="px-1 text-slate-400">...</span> : null}
                <Link
                  href={buildHref(pageNumber)}
                  className={`rounded-lg border px-3 py-1 ${
                    pageNumber === safePage
                      ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                      : "border-[var(--border)] text-slate-700 hover:border-[var(--brand)] hover:text-[var(--brand)]"
                  }`}
                >
                  {pageNumber}
                </Link>
              </span>
            );
          })}
          <Link
            href={buildHref(Math.min(totalPages, safePage + 1))}
            aria-disabled={safePage === totalPages}
            className={`rounded-lg border px-3 py-1 ${
              safePage === totalPages
                ? "pointer-events-none border-[var(--border)] text-slate-300"
                : "border-[var(--border)] text-slate-700 hover:border-[var(--brand)] hover:text-[var(--brand)]"
            }`}
          >
            التالي
          </Link>
        </div>
      ) : null}
    </div>
  );
}
