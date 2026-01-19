import { ActionButton } from "@/components/admin/ActionButton";
import { PageHeader } from "@/components/admin/PageHeader";
import { SectionCard } from "@/components/admin/SectionCard";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = getSupabaseServerClient();
  const { data: settings } = await supabase.from("app_settings").select("key, value");

  const settingsMap = new Map(
    (settings ?? []).map((item) => [item.key, item.value as Record<string, unknown>])
  );

  const maintenance = settingsMap.get("maintenance") ?? { enabled: false };
  const announcement = settingsMap.get("announcement") ?? {
    enabled: false,
    text: "",
  };

  return (
    <>
      <PageHeader
        title="الإعدادات"
        subtitle="إدارة وضع الصيانة والإعلانات العامة."
      />
      <section className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="وضع الصيانة" description="تعطيل الخدمات مؤقتاً.">
          <form action="/api/admin/settings" method="post" className="space-y-3">
            <input type="hidden" name="key" value="maintenance" />
            <select
              name="enabled"
              defaultValue={maintenance.enabled ? "true" : "false"}
              className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
            >
              <option value="false">إيقاف وضع الصيانة</option>
              <option value="true">تشغيل وضع الصيانة</option>
            </select>
            <ActionButton label="حفظ الإعداد" variant="primary" />
          </form>
        </SectionCard>
        <SectionCard
          title="شريط الإعلانات"
          description="إظهار تنبيه عام للمستخدمين."
        >
          <form action="/api/admin/settings" method="post" className="space-y-3">
            <input type="hidden" name="key" value="announcement" />
            <textarea
              name="text"
              defaultValue={(announcement.text as string) ?? ""}
              placeholder="نص الإعلان"
              className="min-h-[120px] w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
            />
            <select
              name="enabled"
              defaultValue={announcement.enabled ? "true" : "false"}
              className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
            >
              <option value="false">إخفاء الإعلان</option>
              <option value="true">إظهار الإعلان</option>
            </select>
            <ActionButton label="تحديث الإعلان" variant="primary" />
          </form>
        </SectionCard>
      </section>
    </>
  );
}
