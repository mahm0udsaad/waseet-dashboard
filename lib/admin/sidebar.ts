export const ADMIN_NAV_ITEMS = [
  { href: "/overview", label: "نظرة عامة" },
  { href: "/users", label: "المستخدمون" },
  { href: "/support-agents", label: "وكلاء الدعم" },
  { href: "/ads", label: "الإعلانات" },
  { href: "/orders", label: "الطلبات" },
  { href: "/damin-orders", label: "طلبات الضامن" },
  { href: "/completion-requests", label: "طلبات الاكتمال" },
  { href: "/receipts", label: "الإيصالات" },
  { href: "/payments", label: "المدفوعات" },
  { href: "/chats", label: "المحادثات" },
  { href: "/support-inbox", label: "صندوق دعم وسيط" },
  { href: "/sliders", label: "السلايدر" },
  { href: "/settings", label: "الإعدادات" },
  { href: "/audit-logs", label: "سجل التدقيق" },
] as const;

export const TRACKED_BADGE_PATHS = [
  "/users",
  "/support-agents",
  "/ads",
  "/orders",
  "/damin-orders",
  "/completion-requests",
  "/receipts",
  "/payments",
  "/chats",
  "/support-inbox",
  "/sliders",
  "/settings",
  "/audit-logs",
] as const;

export function normalizeAdminPageKey(pathname: string): string | null {
  const cleanPath = pathname.split("?")[0].split("#")[0];
  const allNavPaths = ADMIN_NAV_ITEMS.map((item) => item.href).sort(
    (a, b) => b.length - a.length
  );

  return (
    allNavPaths.find(
      (path) => cleanPath === path || cleanPath.startsWith(`${path}/`)
    ) ?? null
  );
}
