import type { ReactNode } from "react";
import { TopBar } from "@/components/admin/TopBar";
import { requireRole } from "@/lib/auth/requireRole";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getNavItemsForRole,
  ROLE_LABELS,
  type AdminRole,
} from "@/lib/auth/permissions";
import { ADMIN_NAV_ITEMS } from "@/lib/admin/sidebar";

// Full-width layout — TopBar only, no sidebar grid.
// Used for pages that need maximum horizontal space (e.g. chats).
export default async function AdminFullLayout({ children }: { children: ReactNode }) {
  const { userId, role } = await requireRole([
    "super_admin",
    "admin",
    "finance",
    "support_agent",
    "viewer",
  ]);

  const allowedPaths = getNavItemsForRole(role as AdminRole);
  const allowedItems = ADMIN_NAV_ITEMS.filter((item) =>
    allowedPaths.includes(item.href)
  );
  const roleLabel = ROLE_LABELS[role as AdminRole];

  // Quick badge count for TopBar (total unread across sections)
  const supabase = getSupabaseServerClient();
  const { count: pendingCount } = await supabase
    .from("conversations")
    .select("id", { count: "exact", head: true })
    .eq("status", "open");

  return (
    <div className="admin-shell relative min-h-screen px-3 py-4 sm:px-5 lg:px-6">
      <div className="admin-grid-overlay absolute inset-0" />
      <div className="relative mx-auto flex max-w-[1520px] flex-col gap-5">
        <TopBar
          roleLabel={roleLabel}
          pendingCount={pendingCount ?? 0}
          sectionCount={allowedItems.length}
        />
        <main className="flex min-w-0 flex-col">{children}</main>
      </div>
    </div>
  );
}
