import Link from "next/link";
import { ActionButton } from "@/components/admin/ActionButton";
import { PageHeader } from "@/components/admin/PageHeader";
import { SectionCard } from "@/components/admin/SectionCard";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function AirportServiceSettingsPage() {
  const supabase = getSupabaseServerClient();

  const { data: settings } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["airport_service_price", "airport_service_active"]);

  const settingsMap = new Map(
    (settings ?? []).map((s) => [s.key, s.value as Record<string, unknown>])
  );

  const price = (settingsMap.get("airport_service_price")?.amount as number) ?? 500;
  const active = (settingsMap.get("airport_service_active")?.enabled as boolean) ?? true;

  return (
    <>
      <PageHeader
        title="إعدادات خدمة المطار"
        subtitle="تحكم في حالة الخدمة وسعرها المعروض للمستخدمين."
        actions={
          <Link
            href="/airport-requests"
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-slate-700 transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
          >
            العودة للطلبات
          </Link>
        }
      />

      <section className="grid gap-4 lg:grid-cols-2">
        {/* Service active/inactive */}
        <SectionCard
          title="حالة الخدمة"
          description="تحكم في ظهور خدمة المطار للمستخدمين في التطبيق."
        >
          <form
            action="/api/admin/airport-requests/settings"
            method="post"
            className="space-y-3"
          >
            <input type="hidden" name="price" value={price} />
            <select
              name="active"
              defaultValue={active ? "true" : "false"}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
            >
              <option value="true">✅ الخدمة نشطة — تظهر للمستخدمين</option>
              <option value="false">🔴 الخدمة متوقفة — مخفية من التطبيق</option>
            </select>
            <ActionButton label="حفظ الحالة" variant="primary" />
          </form>

          <div className="mt-4 rounded-xl border border-[var(--border)] bg-slate-50 p-3 text-xs text-slate-500">
            عند إيقاف الخدمة، لن تظهر بطاقة خدمة المطار في التطبيق للمستخدمين الجدد. الطلبات القائمة لا تتأثر.
          </div>
        </SectionCard>

        {/* Service price */}
        <SectionCard
          title="سعر الخدمة"
          description="السعر الذي يدفعه المستخدم عند تقديم طلب تفتيش مطار."
        >
          <form
            action="/api/admin/airport-requests/settings"
            method="post"
            className="space-y-3"
          >
            <input type="hidden" name="active" value={active ? "true" : "false"} />
            <div className="flex items-center gap-2">
              <input
                type="number"
                name="price"
                defaultValue={price}
                min={0}
                step={1}
                className="flex-1 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                placeholder="500"
              />
              <span className="text-sm font-medium text-slate-600">ر.س</span>
            </div>
            <ActionButton label="حفظ السعر" variant="primary" />
          </form>

          <div className="mt-4 rounded-xl border border-[var(--border)] bg-slate-50 p-3 text-xs text-slate-500">
            السعر الحالي: <span className="font-semibold text-slate-700">{price} ر.س</span>. يسري على الطلبات الجديدة فقط.
          </div>
        </SectionCard>
      </section>

      {/* Status guide */}
      <SectionCard
        title="دليل مراحل الطلب"
        description="توضيح معنى كل حالة في مسار تنفيذ الخدمة."
      >
        <div className="space-y-3">
          {[
            {
              status: "بانتظار الدفع",
              color: "bg-slate-400",
              desc: "المستخدم قدّم الطلب ولم يكمل الدفع بعد.",
            },
            {
              status: "بانتظار اعتماد التحويل",
              color: "bg-amber-400",
              desc: "المستخدم رفع إيصال تحويل بنكي — يحتاج مراجعة يدوية.",
            },
            {
              status: "مدفوع",
              color: "bg-blue-500",
              desc: "تم تأكيد الدفع. الطلب جاهز لبدء التنفيذ.",
            },
            {
              status: "قيد التنفيذ",
              color: "bg-violet-500",
              desc: "الفريق يعمل على تنفيذ خدمة التفتيش والتوصيل.",
            },
            {
              status: "مكتمل",
              color: "bg-emerald-500",
              desc: "تم تسليم الخدمة بنجاح وإغلاق الطلب.",
            },
            {
              status: "مرفوض",
              color: "bg-rose-400",
              desc: "الطلب رُفض من الإدارة (مثلاً وثائق غير مكتملة).",
            },
            {
              status: "ملغي",
              color: "bg-slate-600",
              desc: "تم إلغاء الطلب قبل التنفيذ.",
            },
          ].map(({ status, color, desc }) => (
            <div key={status} className="flex items-start gap-3">
              <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${color}`} />
              <div>
                <p className="text-sm font-medium text-slate-800">{status}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </>
  );
}
