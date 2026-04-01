import type { ReactNode } from "react";

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
  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div
          key={getRowKey ? getRowKey(row, index) : `row-${index}`}
          className="flex flex-col gap-2 rounded-xl border border-[var(--border)] p-3 text-sm transition hover:border-[var(--brand)]/20 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
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
                    ? "mt-1 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-2"
                    : "min-w-0"
                }
              >
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <div
                  className={
                    isActionsColumn
                      ? "flex items-center text-sm text-slate-900"
                      : "text-base font-medium text-slate-900"
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
      ))}
      {rows.length === 0 && (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center">
          {emptyIcon && <p className="mb-2 text-2xl">{emptyIcon}</p>}
          <p className="text-sm text-slate-500">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}
