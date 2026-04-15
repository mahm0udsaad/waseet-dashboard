import type { ReactNode } from "react";
import { SidebarNav } from "@/components/admin/SidebarNav";
import { TopBar } from "@/components/admin/TopBar";
import { ADMIN_NAV_ITEMS, TRACKED_BADGE_PATHS } from "@/lib/admin/sidebar";
import { requireRole } from "@/lib/auth/requireRole";
import {
  getNavItemsForRole,
  ROLE_LABELS,
  type AdminRole,
} from "@/lib/auth/permissions";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { userId, role } = await requireRole(["super_admin", "admin", "finance", "support_agent", "viewer"]);
  const allowedPaths = getNavItemsForRole(role as AdminRole);
  const allowedItems = ADMIN_NAV_ITEMS.filter((item) => allowedPaths.includes(item.href));
  const trackedPathSet = new Set<string>(TRACKED_BADGE_PATHS);
  const trackedAllowedPaths = allowedItems
    .map((item) => item.href)
    .filter((href) => trackedPathSet.has(href));

  const supabase = getSupabaseServerClient();
  const { data: reads } = trackedAllowedPaths.length
    ? await supabase
        .from("admin_page_reads")
        .select("page_key, last_seen_at")
        .eq("user_id", userId)
        .in("page_key", trackedAllowedPaths)
    : { data: [] as Array<{ page_key: string; last_seen_at: string }> };

  const readMap = new Map((reads ?? []).map((row) => [row.page_key, row.last_seen_at]));
  const sinceDefault = "1970-01-01T00:00:00.000Z";

  const badgeEntries = await Promise.all(
    trackedAllowedPaths.map(async (path) => {
      const since = readMap.get(path) ?? sinceDefault;
      let count = 0;

      if (path === "/users") {
        const result = await supabase
          .from("profiles")
          .select("user_id", { count: "exact", head: true })
          .gt("created_at", since);
        count = result.count ?? 0;
      } else if (path === "/support-agents") {
        const result = await supabase
          .from("profiles")
          .select("user_id", { count: "exact", head: true })
          .eq("role", "support_agent")
          .gt("created_at", since);
        count = result.count ?? 0;
      } else if (path === "/ads") {
        const result = await supabase
          .from("ads")
          .select("id", { count: "exact", head: true })
          .gt("created_at", since);
        count = result.count ?? 0;
      } else if (path === "/orders") {
        const result = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .gt("created_at", since);
        count = result.count ?? 0;
      } else if (path === "/damin-orders") {
        const result = await supabase
          .from("damin_orders")
          .select("id", { count: "exact", head: true })
          .gt("created_at", since);
        count = result.count ?? 0;
      } else if (path === "/airport-requests") {
        const result = await supabase
          .from("airport_inspection_requests")
          .select("id", { count: "exact", head: true })
          .gt("created_at", since);
        count = result.count ?? 0;
      } else if (path === "/completion-requests") {
        const result = await supabase
          .from("damin_completion_requests")
          .select("id", { count: "exact", head: true })
          .gt("requested_at", since);
        count = result.count ?? 0;
      } else if (path === "/receipts") {
        const result = await supabase
          .from("receipts")
          .select("id", { count: "exact", head: true })
          .gt("created_at", since);
        count = result.count ?? 0;
      } else if (path === "/payments") {
        const result = await supabase
          .from("payments")
          .select("id", { count: "exact", head: true })
          .gt("created_at", since);
        count = result.count ?? 0;
      } else if (path === "/chats") {
        const result = await supabase
          .from("conversations")
          .select("id", { count: "exact", head: true })
          .gt("created_at", since);
        count = result.count ?? 0;
      } else if (path === "/support-inbox") {
        const result = await supabase
          .from("conversations")
          .select("id", { count: "exact", head: true })
          .eq("status", "open")
          .gt("created_at", since);
        count = result.count ?? 0;
      } else if (path === "/sliders") {
        const result = await supabase
          .from("home_sliders")
          .select("id", { count: "exact", head: true })
          .gt("created_at", since);
        count = result.count ?? 0;
      } else if (path === "/settings") {
        const result = await supabase
          .from("app_settings")
          .select("key", { count: "exact", head: true })
          .gt("updated_at", since);
        count = result.count ?? 0;
      } else if (path === "/audit-logs") {
        const result = await supabase
          .from("admin_audit_logs")
          .select("id", { count: "exact", head: true })
          .gt("created_at", since);
        count = result.count ?? 0;
      }

      return [path, count] as const;
    })
  );

  const badgeMap: Record<string, number> = Object.fromEntries(badgeEntries);
  const overviewCount = Object.values(badgeMap).reduce((sum, value) => sum + value, 0);
  const roleLabel = ROLE_LABELS[role as AdminRole];

  return (
    <div className="admin-shell relative min-h-screen px-3 py-4 sm:px-5 lg:px-6">
      <div className="admin-grid-overlay absolute inset-0" />
      <div className="relative mx-auto flex max-w-[1520px] flex-col gap-5">
        <TopBar
          roleLabel={roleLabel}
          pendingCount={overviewCount}
          sectionCount={allowedItems.length}
        />
        <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="xl:sticky xl:top-5 xl:self-start">
            <SidebarNav
              roleLabel={roleLabel}
              pendingCount={overviewCount}
              items={allowedItems.map((item) => ({
                ...item,
                badgeCount:
                  item.href === "/overview"
                    ? overviewCount
                    : (badgeMap[item.href] ?? 0),
              }))}
            />
          </div>
          <main className="flex min-w-0 flex-col gap-5">{children}</main>
        </div>
      </div>
    </div>
  );
}
