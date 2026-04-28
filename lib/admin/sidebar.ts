export const ADMIN_NAV_GROUPS = [
  { id: "overview", label: "نظرة عامة" },
  { id: "operations", label: "العمليات" },
  { id: "airport", label: "خدمة المطار" },
  { id: "communication", label: "التواصل" },
  { id: "people", label: "الأشخاص" },
  { id: "content", label: "المحتوى" },
  { id: "system", label: "النظام" },
] as const;

export type AdminNavGroupId = (typeof ADMIN_NAV_GROUPS)[number]["id"];

export const ADMIN_NAV_ITEMS = [
  { href: "/overview", label: "نظرة عامة", description: "ملخص الأداء والتنبيهات", group: "overview" },

  { href: "/orders", label: "الطلبات", description: "سير الطلبات والتحويلات", group: "operations" },
  { href: "/bank-transfers", label: "التحويلات البنكية", description: "قبول ورفض إيصالات التحويل", group: "operations" },
  { href: "/damin-orders", label: "طلبات الضامن", description: "عمليات الضامن والمدفوعات", group: "operations" },
  { href: "/completion-requests", label: "طلبات الاكتمال", description: "اعتماد إنهاء الخدمة", group: "operations" },
  { href: "/receipts", label: "الإيصالات", description: "مستندات المعاملات", group: "operations" },
  { href: "/payments", label: "المدفوعات", description: "متابعة عمليات Paymob", group: "operations" },
  { href: "/withdrawals", label: "طلبات السحب", description: "إدارة المحفظة والتحويل", group: "operations" },

  { href: "/airport-requests", label: "طلبات المطار", description: "طلبات تفتيش وتوصيل المطار", group: "airport" },
  { href: "/airport-chats", label: "محادثات المطار", description: "محادثات خدمة التفتيش والتوصيل", group: "airport" },
  { href: "/airport-requests/settings", label: "إعدادات المطار", description: "السعر وحالة تفعيل الخدمة", group: "airport" },

  { href: "/chats", label: "المحادثات", description: "سجل الرسائل والأعضاء", group: "communication" },
  { href: "/support-inbox", label: "صندوق دعم وسيط", description: "الانتظار المفتوح الآن", group: "communication" },
  { href: "/support-tickets", label: "تذاكر الدعم", description: "تذاكر مركز المساعدة من المستخدمين", group: "communication" },
  { href: "/disputes", label: "بلاغات المستخدمين", description: "النزاعات المرفوعة من شاشة المحادثة", group: "communication" },

  { href: "/users", label: "المستخدمون", description: "الحسابات والحالة", group: "people" },
  { href: "/support-agents", label: "وكلاء الدعم", description: "فريق المتابعة والرد", group: "people" },
  { href: "/team", label: "إدارة الفريق", description: "أدوار الإدارة والصلاحيات", group: "people" },

  { href: "/ads", label: "الإعلانات", description: "مراجعة المحتوى والعروض", group: "content" },
  { href: "/sliders", label: "السلايدر", description: "محتوى الواجهة الرئيسية", group: "content" },

  { href: "/settings", label: "الإعدادات", description: "العمولات والخيارات العامة", group: "system" },
  { href: "/audit-logs", label: "سجل التدقيق", description: "تتبّع تغييرات الإدارة", group: "system" },
] as const;

export const TRACKED_BADGE_PATHS = [
  "/users",
  "/support-agents",
  "/ads",
  "/orders",
  "/bank-transfers",
  "/damin-orders",
  "/airport-requests",
  "/airport-chats",
  "/airport-requests/settings",
  "/completion-requests",
  "/receipts",
  "/payments",
  "/chats",
  "/support-inbox",
  "/support-tickets",
  "/disputes",
  "/sliders",
  "/withdrawals",
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
