export type AdminRole =
  | "super_admin"
  | "admin"
  | "finance"
  | "support_agent"
  | "viewer";

export const ROLE_NAV_ACCESS: Record<AdminRole, string[]> = {
  super_admin: [
    "/overview",
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
  ],
  admin: [
    "/overview",
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
    "/audit-logs",
  ],
  finance: [
    "/overview",
    "/damin-orders",
    "/completion-requests",
    "/payments",
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
