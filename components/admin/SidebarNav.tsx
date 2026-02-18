"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { normalizeAdminPageKey } from "@/lib/admin/sidebar";

type NavItem = {
  href: string;
  label: string;
  badgeCount?: number;
};

type SidebarNavProps = {
  items: NavItem[];
};

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname();
  const [locallyRead, setLocallyRead] = useState<Record<string, boolean>>({});

  const currentPageKey = useMemo(
    () => normalizeAdminPageKey(pathname ?? ""),
    [pathname]
  );

  useEffect(() => {
    if (!currentPageKey) return;

    void fetch("/api/admin/sidebar-read", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ page: currentPageKey }),
    });
  }, [currentPageKey]);

  function isActive(path: string) {
    return pathname === path || (pathname?.startsWith(`${path}/`) ?? false);
  }

  function formatBadgeCount(value: number) {
    if (value > 99) return "99+";
    return String(value);
  }

  return (
    <aside className="rounded-2xl border border-[var(--border)] bg-[var(--surface-light)] p-4 shadow-sm">
      <p className="mb-3 text-sm font-semibold text-slate-700">الأقسام</p>
      <nav className="flex flex-wrap gap-2 sm:flex-col">
        {items.map((item) => {
          const active = isActive(item.href);
          const count =
            item.href === currentPageKey || locallyRead[item.href]
              ? 0
              : (item.badgeCount ?? 0);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() =>
                setLocallyRead((prev) => ({ ...prev, [item.href]: true }))
              }
              className={`inline-flex items-center justify-between gap-2 rounded-full border px-4 py-2 text-sm transition ${
                active
                  ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                  : "border-[var(--border)] text-slate-700 hover:border-[var(--brand)] hover:text-[var(--brand)]"
              }`}
            >
              <span>{item.label}</span>
              {count > 0 ? (
                <span
                  className={`inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                    active
                      ? "bg-white text-[var(--brand)]"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {formatBadgeCount(count)}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
