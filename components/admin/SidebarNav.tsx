"use client";

import {
  CircleDollarSign,
  FileText,
  ImageIcon,
  LayoutDashboard,
  Logs,
  Megaphone,
  MessageSquareText,
  MessagesSquare,
  Receipt,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Users,
  UserSquare2,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { normalizeAdminPageKey } from "@/lib/admin/sidebar";

type NavItem = {
  href: string;
  label: string;
  description?: string;
  badgeCount?: number;
};

type SidebarNavProps = {
  items: NavItem[];
  roleLabel: string;
  pendingCount: number;
};

const navIcons = {
  "/overview": LayoutDashboard,
  "/team": ShieldCheck,
  "/users": Users,
  "/support-agents": UserSquare2,
  "/ads": Megaphone,
  "/orders": ShoppingBag,
  "/damin-orders": Wallet,
  "/completion-requests": FileText,
  "/receipts": Receipt,
  "/payments": CircleDollarSign,
  "/chats": MessagesSquare,
  "/support-inbox": MessageSquareText,
  "/sliders": ImageIcon,
  "/withdrawals": Wallet,
  "/settings": Settings,
  "/audit-logs": Logs,
} as const;

export function SidebarNav({ items, roleLabel, pendingCount }: SidebarNavProps) {
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
    <aside className="admin-panel overflow-hidden rounded-[28px]">
      <div className="border-b border-slate-200/70 px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-subtle)]">
          التنقل
        </p>
        <h2 className="mt-2 text-lg font-semibold text-slate-950">
          لوحات العمل الرئيسية
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
          {roleLabel} مع {formatBadgeCount(pendingCount)} عنصر يحتاج مراجعة أو قراءة.
        </p>
      </div>

      <nav className="flex flex-col gap-1.5 p-3">
        {items.map((item) => {
          const active = isActive(item.href);
          const Icon = navIcons[item.href as keyof typeof navIcons] ?? LayoutDashboard;
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
              className={`group flex items-center gap-3 rounded-2xl border px-3 py-3 transition ${
                active
                  ? "border-rose-200 bg-rose-50 text-rose-900 shadow-sm"
                  : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-white"
              }`}
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition ${
                  active
                    ? "bg-rose-600 text-white"
                    : "bg-slate-100 text-slate-500 group-hover:bg-slate-900 group-hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{item.label}</span>
                {item.description ? (
                  <span
                    className={`mt-0.5 block text-xs leading-5 ${
                      active ? "text-rose-700/80" : "text-[var(--text-subtle)]"
                    }`}
                  >
                    {item.description}
                  </span>
                ) : null}
              </span>

              {count > 0 ? (
                <span
                  className={`inline-flex min-w-8 items-center justify-center rounded-full px-2 py-1 text-[11px] font-semibold ${
                    active
                      ? "bg-white text-rose-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {formatBadgeCount(count)}
                </span>
              ) : (
                <span className="text-xs text-[var(--text-subtle)]">فتح</span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
