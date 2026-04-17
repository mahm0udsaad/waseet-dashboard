export const ADMIN_NAV_ITEMS = [
  { href: "/overview", label: "نظرة عامة", description: "ملخص الأداء والتنبيهات" },
  { href: "/team", label: "إدارة الفريق", description: "أدوار الإدارة والصلاحيات" },
  { href: "/users", label: "المستخدمون", description: "الحسابات والحالة" },
  { href: "/support-agents", label: "وكلاء الدعم", description: "فريق المتابعة والرد" },
  { href: "/ads", label: "الإعلانات", description: "مراجعة المحتوى والعروض" },
  { href: "/orders", label: "الطلبات", description: "سير الطلبات والتحويلات" },
  { href: "/damin-orders", label: "طلبات الضامن", description: "عمليات الضامن والمدفوعات" },
  { href: "/airport-requests", label: "خدمة المطار", description: "طلبات تفتيش وتوصيل المطار" },
  { href: "/airport-chats", label: "محادثات المطار", description: "محادثات خدمة التفتيش والتوصيل" },
  { href: "/airport-requests/settings", label: "إعدادات خدمة المطار", description: "السعر وحالة تفعيل الخدمة" },
  { href: "/completion-requests", label: "طلبات الاكتمال", description: "اعتماد إنهاء الخدمة" },
  { href: "/receipts", label: "الإيصالات", description: "مستندات المعاملات" },
  { href: "/payments", label: "المدفوعات", description: "متابعة عمليات Paymob" },
  { href: "/chats", label: "المحادثات", description: "سجل الرسائل والأعضاء" },
  { href: "/support-inbox", label: "صندوق دعم وسيط", description: "الانتظار المفتوح الآن" },
  { href: "/support-tickets", label: "تذاكر الدعم", description: "تذاكر مركز المساعدة من المستخدمين" },
  { href: "/disputes", label: "بلاغات المستخدمين", description: "النزاعات المرفوعة من شاشة المحادثة" },
  { href: "/sliders", label: "السلايدر", description: "محتوى الواجهة الرئيسية" },
  { href: "/withdrawals", label: "طلبات السحب", description: "إدارة المحفظة والتحويل" },
  { href: "/settings", label: "الإعدادات", description: "العمولات والخيارات العامة" },
  { href: "/audit-logs", label: "سجل التدقيق", description: "تتبّع تغييرات الإدارة" },
] as const;

export const TRACKED_BADGE_PATHS = [
  "/users",
  "/support-agents",
  "/ads",
  "/orders",
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
