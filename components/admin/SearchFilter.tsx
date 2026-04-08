"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type FilterField = {
  key: string;
  label: string;
  type: "text" | "select";
  options?: { value: string; label: string }[];
  placeholder?: string;
};

type SearchFilterProps = {
  fields: FilterField[];
  pathname: string;
  currentQuery: Record<string, string | undefined>;
};

export function SearchFilter({
  fields,
  pathname,
  currentQuery,
}: SearchFilterProps) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const field of fields) {
      initial[field.key] = currentQuery[field.key] ?? "";
    }
    return initial;
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    for (const [key, val] of Object.entries(values)) {
      if (val) params.set(key, val);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleReset() {
    const cleared: Record<string, string> = {};
    for (const field of fields) {
      cleared[field.key] = "";
    }
    setValues(cleared);
    router.push(pathname);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="admin-panel rounded-[28px] p-4 sm:p-5"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            أدوات التصفية
          </div>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            حسّن النتائج بسرعة عبر البحث والحالة والخيارات المتاحة.
          </p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {fields.map((field) => (
            <div key={field.key} className="min-w-0">
              <label className="mb-2 block text-xs font-medium text-[var(--text-subtle)]">
                {field.label}
              </label>
              {field.type === "text" ? (
                <div className="relative">
                  <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={values[field.key]}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    placeholder={field.placeholder ?? field.label}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-10 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--brand)] focus:ring-4 focus:ring-rose-100"
                  />
                </div>
              ) : (
                <select
                  value={values[field.key]}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-rose-100"
                >
                  <option value="">الكل</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="rounded-full bg-[var(--brand)] px-4 py-3 text-sm font-medium text-white transition hover:brightness-95"
          >
            تطبيق التصفية
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-full border border-[var(--border)] bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300"
          >
            مسح
          </button>
        </div>
      </div>
    </form>
  );
}
