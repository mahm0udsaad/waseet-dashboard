import type { CSSProperties, ReactNode } from "react";

type Column<Row> = {
  key: string;
  label: string;
  render?: (row: Row) => ReactNode;
};

type DataTableProps<Row> = {
  columns: Column<Row>[];
  rows: Row[];
  getRowKey?: (row: Row, index: number) => string;
  emptyMessage?: string;
  emptyIcon?: string;
};

export function DataTable<Row extends Record<string, unknown>>({
  columns,
  rows,
  getRowKey,
  emptyMessage = "لا توجد بيانات حالياً.",
  emptyIcon,
}: DataTableProps<Row>) {
  const desktopTemplate = columns
    .map((column) =>
      column.key === "actions" ? "minmax(140px, auto)" : "minmax(0, 1fr)"
    )
    .join(" ");
  const desktopGridStyle = {
    "--desktop-template": desktopTemplate,
  } as CSSProperties;

  return (
    <div className="space-y-3">
      {rows.length > 0 ? (
        <div
          className="hidden rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-xs font-semibold text-[var(--text-subtle)] md:grid md:[grid-template-columns:var(--desktop-template)]"
          style={desktopGridStyle}
        >
          {columns.map((column) => (
            <div key={column.key} className={column.key === "actions" ? "text-left" : ""}>
              {column.label}
            </div>
          ))}
        </div>
      ) : null}

      {rows.map((row, index) => (
        <div
          key={getRowKey ? getRowKey(row, index) : `row-${index}`}
          className="overflow-visible rounded-[24px] border border-slate-200 bg-white p-4 text-sm shadow-sm transition hover:shadow-md sm:p-5"
        >
          <div
            className="grid gap-3 md:items-center md:[grid-template-columns:var(--desktop-template)]"
            style={desktopGridStyle}
          >
            {columns.map((column) => {
              const isActionsColumn = column.key === "actions";
              const isDateColumn =
                /(^|_)(created_at|updated_at|date)$/.test(column.key) ||
                column.key.endsWith("_at");
              const label =
                isDateColumn && !column.label.includes("ميلادي")
                  ? `${column.label} (ميلادي)`
                  : column.label;

              return (
                <div
                  key={column.key}
                  className={
                    isActionsColumn
                      ? "border-t border-slate-200 pt-3 md:border-t-0 md:pt-0"
                      : "min-w-0"
                  }
                >
                  <p className="mb-1 text-xs font-medium text-[var(--text-subtle)] md:hidden">
                    {label}
                  </p>
                  <div
                    className={
                      isActionsColumn
                        ? "flex flex-wrap items-center justify-between gap-3 md:justify-start"
                        : "break-words text-base font-medium text-slate-900"
                    }
                  >
                    {column.render
                      ? column.render(row)
                      : (row[column.key] as ReactNode) ?? <span className="text-slate-300">—</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {rows.length === 0 && (
        <div className="rounded-[24px] border border-dashed border-[var(--border)] bg-white p-8 text-center sm:p-10">
          {emptyIcon && <p className="mb-2 text-2xl">{emptyIcon}</p>}
          <p className="text-sm text-[var(--text-muted)]">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}
