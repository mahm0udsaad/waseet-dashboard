"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ADMIN_NAV_GROUPS, type AdminNavGroupId } from "@/lib/admin/sidebar";

type PaletteItem = {
  href: string;
  label: string;
  description?: string;
  group?: AdminNavGroupId;
};

export function CommandPalette({ items }: { items: PaletteItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isToggle = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (isToggle) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const haystack = `${item.label} ${item.description ?? ""} ${item.href}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [items, query]);

  const grouped = useMemo(() => {
    const map = new Map<AdminNavGroupId, PaletteItem[]>();
    for (const item of filtered) {
      const g = (item.group ?? "system") as AdminNavGroupId;
      const list = map.get(g) ?? [];
      list.push(item);
      map.set(g, list);
    }
    return map;
  }, [filtered]);

  const flat = useMemo(
    () =>
      ADMIN_NAV_GROUPS.flatMap((g) => grouped.get(g.id) ?? []),
    [grouped]
  );

  useEffect(() => {
    if (activeIndex >= flat.length) setActiveIndex(0);
  }, [flat.length, activeIndex]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % Math.max(flat.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + flat.length) % Math.max(flat.length, 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = flat[activeIndex];
      if (target) {
        router.push(target.href);
        setOpen(false);
      }
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/40 px-4 pt-[12vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث في لوحات الإدارة..."
            className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
          <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {flat.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-slate-500">
              لا توجد نتائج
            </p>
          ) : (
            ADMIN_NAV_GROUPS.map((group) => {
              const groupItems = grouped.get(group.id);
              if (!groupItems || groupItems.length === 0) return null;
              return (
                <div key={group.id} className="mb-2">
                  <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {group.label}
                  </p>
                  {groupItems.map((item) => {
                    const flatIndex = flat.indexOf(item);
                    const active = flatIndex === activeIndex;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        onMouseEnter={() => setActiveIndex(flatIndex)}
                        className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm ${
                          active
                            ? "bg-rose-50 text-rose-900"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium">{item.label}</span>
                          {item.description ? (
                            <span className="block truncate text-xs text-slate-500">
                              {item.description}
                            </span>
                          ) : null}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {item.href}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-2 text-[11px] text-slate-500">
          <span>↑↓ للتنقل · Enter للفتح</span>
          <span>
            <kbd className="rounded border border-slate-200 bg-white px-1 py-0.5 font-semibold">
              ⌘
            </kbd>{" "}
            +{" "}
            <kbd className="rounded border border-slate-200 bg-white px-1 py-0.5 font-semibold">
              K
            </kbd>
          </span>
        </div>
      </div>
    </div>
  );
}
