export type AdminRole =
  | "super_admin"
  | "admin"
  | "finance"
  | "support_agent"
  | "viewer";

export const ADMIN_ROLES: AdminRole[] = [
  "super_admin",
  "admin",
  "finance",
  "support_agent",
  "viewer",
];

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "مدير أعلى",
  admin: "مدير",
  finance: "مالية",
  support_agent: "وكيل دعم",
  viewer: "مشاهد",
};

export const ROLE_NAV_ACCESS: Record<AdminRole, string[]> = {
  super_admin: [
    "/overview",
    "/users",
    "/team",
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
    "/withdrawals",
    "/settings",
    "/audit-logs",
  ],
  admin: [
    "/overview",
    "/users",
    "/team",
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
    "/withdrawals",
    "/audit-logs",
  ],
  finance: [
    "/overview",
    "/damin-orders",
    "/completion-requests",
    "/payments",
    "/withdrawals",
    "/receipts",
  ],
  support_agent: [
    "/overview",
    "/damin-orders",
    "/users",
    "/chats",
    "/support-inbox",
  ],
  viewer: ["/overview", "/receipts", "/payments"],
};

export function getNavItemsForRole(role: AdminRole): string[] {
  return ROLE_NAV_ACCESS[role] ?? [];
}
