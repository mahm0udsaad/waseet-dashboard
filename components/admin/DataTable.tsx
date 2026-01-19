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
};

export function DataTable<Row extends Record<string, unknown>>({
  columns,
  rows,
  getRowKey,
}: DataTableProps<Row>) {
  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div
          key={getRowKey ? getRowKey(row, index) : `row-${index}`}
          className="flex flex-col gap-2 rounded-xl border border-[var(--border)] p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
        >
          {columns.map((column) => (
            <div key={column.key} className="min-w-0">
              <p className="text-xs text-slate-500">{column.label}</p>
              <div className="text-sm text-slate-900">
                {column.render ? column.render(row) : (row[column.key] as ReactNode)}
              </div>
            </div>
          ))}
        </div>
      ))}
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-slate-500">
          لا توجد بيانات حالياً.
        </div>
      ) : null}
    </div>
  );
}
