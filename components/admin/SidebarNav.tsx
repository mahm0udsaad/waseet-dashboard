"use client";

import {
  CircleDollarSign,
  FileText,
  ImageIcon,
  LayoutDashboard,
  Banknote,
  Logs,
  Megaphone,
  MessageSquareText,
  MessagesSquare,
  Plane,
  Receipt,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Users,
  UserSquare2,
  Wallet,
  AlertTriangle,
  LifeBuoy,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ADMIN_NAV_GROUPS,
  type AdminNavGroupId,
  normalizeAdminPageKey,
} from "@/lib/admin/sidebar";
import { useRealtimeBadgeBumps } from "./useRealtimeBadgeBumps";

type NavItem = {
  href: string;
  label: string;
  description?: string;
  badgeCount?: number;
  group?: AdminNavGroupId;
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
  "/bank-transfers": Banknote,
  "/damin-orders": Wallet,
  "/airport-requests": Plane,
  "/airport-chats": MessagesSquare,
  "/airport-requests/settings": Settings,
  "/completion-requests": FileText,
  "/receipts": Receipt,
  "/payments": CircleDollarSign,
  "/chats": MessagesSquare,
  "/support-inbox": MessageSquareText,
  "/support-tickets": LifeBuoy,
  "/disputes": AlertTriangle,
  "/sliders": ImageIcon,
  "/withdrawals": Wallet,
  "/settings": Settings,
  "/audit-logs": Logs,
} as const;

const COLLAPSED_STORAGE_KEY = "admin.sidebar.collapsedGroups.v1";

export function SidebarNav({ items, roleLabel, pendingCount }: SidebarNavProps) {
  const pathname = usePathname();
  const [locallyRead, setLocallyRead] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState<Record<AdminNavGroupId, boolean>>(
    {} as Record<AdminNavGroupId, boolean>
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COLLAPSED_STORAGE_KEY);
      if (raw) setCollapsed(JSON.parse(raw));
    } catch {}
  }, []);

  function toggleGroup(id: AdminNavGroupId) {
    setCollapsed((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(COLLAPSED_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  const currentPageKey = useMemo(
    () => normalizeAdminPageKey(pathname ?? ""),
    [pathname]
  );

  const realtimeBumps = useRealtimeBadgeBumps(currentPageKey);

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

  const grouped = useMemo(() => {
    const map = new Map<AdminNavGroupId, NavItem[]>();
    for (const item of items) {
      const group = (item.group ?? "system") as AdminNavGroupId;
      const list = map.get(group) ?? [];
      list.push(item);
      map.set(group, list);
    }
    return map;
  }, [items]);

  return (
    <aside className="admin-panel overflow-hidden rounded-[28px]">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">{roleLabel}</p>
        <div className="flex items-center gap-2">
          {pendingCount > 0 ? (
            <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
              {formatBadgeCount(pendingCount)}
            </span>
          ) : null}
          <kbd className="hidden items-center gap-0.5 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 sm:inline-flex">
            ⌘K
          </kbd>
        </div>
      </div>

      <nav className="flex flex-col gap-3 p-2">
        {ADMIN_NAV_GROUPS.map((group) => {
          const groupItems = grouped.get(group.id);
          if (!groupItems || groupItems.length === 0) return null;

          const isCollapsed = !!collapsed[group.id];
          const groupHasActive = groupItems.some((i) => isActive(i.href));
          const groupBadgeTotal = groupItems.reduce((sum, i) => {
            if (i.href === currentPageKey || locallyRead[i.href]) return sum;
            return sum + (i.badgeCount ?? 0) + (realtimeBumps[i.href] ?? 0);
          }, 0);
          const showCollapsed = isCollapsed && !groupHasActive;

          return (
            <div key={group.id} className="flex flex-col gap-0.5">
              {group.id !== "overview" ? (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="flex items-center justify-between gap-2 rounded-md px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-subtle)] hover:text-slate-700"
                >
                  <span>{group.label}</span>
                  <span className="flex items-center gap-1.5">
                    {showCollapsed && groupBadgeTotal > 0 ? (
                      <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700">
                        {formatBadgeCount(groupBadgeTotal)}
                      </span>
                    ) : null}
                    <ChevronDown
                      className={`h-3 w-3 transition-transform ${
                        showCollapsed ? "-rotate-90" : ""
                      }`}
                    />
                  </span>
                </button>
              ) : null}

              {showCollapsed ? null : groupItems.map((item) => {
                const active = isActive(item.href);
                const Icon =
                  navIcons[item.href as keyof typeof navIcons] ?? LayoutDashboard;
                const count =
                  item.href === currentPageKey || locallyRead[item.href]
                    ? 0
                    : (item.badgeCount ?? 0) + (realtimeBumps[item.href] ?? 0);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.description}
                    onClick={() =>
                      setLocallyRead((prev) => ({ ...prev, [item.href]: true }))
                    }
                    className={`group flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition ${
                      active
                        ? "bg-rose-50 text-rose-900"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        active
                          ? "text-rose-600"
                          : "text-slate-500 group-hover:text-slate-900"
                      }`}
                    />
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {item.label}
                    </span>
                    {count > 0 ? (
                      <span
                        className={`inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                          active
                            ? "bg-rose-600 text-white"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {formatBadgeCount(count)}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
