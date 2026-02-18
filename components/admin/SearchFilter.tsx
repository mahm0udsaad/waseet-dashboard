"use client";

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
      className="flex flex-wrap items-end gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-light)] p-3"
    >
      {fields.map((field) => (
        <div key={field.key} className="min-w-[140px] flex-1">
          <label className="mb-1 block text-xs text-slate-500">
            {field.label}
          </label>
          {field.type === "text" ? (
            <input
              type="text"
              value={values[field.key]}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
              }
              placeholder={field.placeholder ?? field.label}
              className="w-full rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--brand)]"
            />
          ) : (
            <select
              value={values[field.key]}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
              }
              className="w-full rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--brand)] bg-white"
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
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-full bg-[var(--brand)] px-3 py-1.5 text-xs text-white"
        >
          بحث
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-slate-700"
        >
          مسح
        </button>
      </div>
    </form>
  );
}
