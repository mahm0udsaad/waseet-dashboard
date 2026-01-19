import type { ReactNode } from "react";
import { SidebarNav } from "@/components/admin/SidebarNav";
import { TopBar } from "@/components/admin/TopBar";
import { requireRole } from "@/lib/auth/requireRole";

const navItems = [
  { href: "/overview", label: "نظرة عامة" },
  { href: "/users", label: "المستخدمون" },
  { href: "/support-agents", label: "وكلاء الدعم" },
  { href: "/ads", label: "الإعلانات" },
  { href: "/damin-orders", label: "طلبات الضامن" },
  { href: "/chats", label: "المحادثات" },
  { href: "/support-inbox", label: "صندوق دعم وسيط" },
  { href: "/sliders", label: "السلايدر" },
  { href: "/settings", label: "الإعدادات" },
  { href: "/audit-logs", label: "سجل التدقيق" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { role } = await requireRole(["admin", "support_agent"]);
  const allowedItems =
    role === "support_agent"
      ? navItems.filter((item) =>
          ["/chats", "/support-inbox", "/overview"].includes(item.href)
        )
      : navItems;

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <TopBar />
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <SidebarNav items={allowedItems} />
          <main className="flex flex-col gap-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
