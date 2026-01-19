import { ActionButton } from "@/components/admin/ActionButton";
import { Badge } from "@/components/admin/Badge";
import { DataTable } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { SectionCard } from "@/components/admin/SectionCard";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function SlidersPage() {
  const supabase = getSupabaseServerClient();
  const { data: banners } = await supabase
    .from("promotional_banners")
    .select(
      "id, title_ar, subtitle_ar, badge_ar, use_image, image_path, gradient_from, gradient_to, sort_order, is_active, created_at"
    )
    .order("sort_order", { ascending: true });

  const rows =
    banners?.map((banner) => ({
      ...banner,
      statusBadge: (
        <Badge label={banner.is_active ? "نشط" : "متوقف"} />
      ),
      typeBadge: (
        <Badge label={banner.use_image ? "صورة" : "نصي"} tone="neutral" />
      ),
    })) ?? [];

  return (
    <>
      <PageHeader
        title="السلايدر"
        subtitle="إدارة بانرات الحملات الدعائية وترتيبها."
      />
      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <SectionCard title="قائمة البانرات" description="العناصر الحالية في السلايدر.">
          <DataTable
            columns={[
              { key: "title_ar", label: "العنوان" },
              { key: "subtitle_ar", label: "الوصف" },
              {
                key: "type",
                label: "النوع",
                render: (row) => row.typeBadge,
              },
              {
                key: "status",
                label: "الحالة",
                render: (row) => row.statusBadge,
              },
              { key: "sort_order", label: "الترتيب" },
            ]}
            rows={rows}
          />
        </SectionCard>
        <SectionCard title="إضافة بانر" description="إنشاء بانر جديد للسلايدر.">
          <form action="/api/admin/banners" method="post" className="space-y-3">
            <input
              name="title_ar"
              placeholder="العنوان بالعربية"
              className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
            />
            <input
              name="subtitle_ar"
              placeholder="الوصف بالعربية"
              className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
            />
            <input
              name="badge_ar"
              placeholder="الوسم"
              className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
            />
            <input
              name="image_path"
              placeholder="مسار الصورة (اختياري)"
              className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
            />
            <input
              name="gradient_from"
              placeholder="لون البداية (مثل #0A1A2F)"
              className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
            />
            <input
              name="gradient_to"
              placeholder="لون النهاية (مثل #10233D)"
              className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
            />
            <select
              name="use_image"
              className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
            >
              <option value="false">بانر نصي</option>
              <option value="true">بانر بصورة</option>
            </select>
            <input
              name="sort_order"
              type="number"
              placeholder="ترتيب العرض"
              className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
            />
            <ActionButton label="حفظ البانر" variant="primary" />
          </form>
        </SectionCard>
      </section>
    </>
  );
}
