import { ActionButton } from "@/components/admin/ActionButton";
import { Badge } from "@/components/admin/Badge";
import { DataTable } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { SectionCard } from "@/components/admin/SectionCard";
import { formatDate } from "@/lib/format";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdsPage() {
  const supabase = getSupabaseServerClient();
  const { data: ads } = await supabase
    .from("ads")
    .select(
      "id, title, type, status, created_at, price, owner_id, profiles!ads_owner_id_fkey(display_name, email)"
    )
    .order("created_at", { ascending: false })
    .limit(20);

  const rows =
    ads?.map((ad) => ({
      ...ad,
      ownerName: ad.profiles?.display_name ?? "غير معروف",
      statusBadge: (
        <Badge
          label={ad.status === "blocked" ? "محجوب" : "نشط"}
          tone={ad.status === "blocked" ? "danger" : "success"}
        />
      ),
    })) ?? [];

  return (
    <>
      <PageHeader
        title="الإعلانات"
        subtitle="إدارة الإعلانات وحالة النشر."
      />
      <SectionCard
        title="قائمة الإعلانات"
        description="آخر 20 إعلاناً مع إجراءات الحظر."
      >
        <DataTable
          columns={[
            { key: "title", label: "العنوان" },
            { key: "ownerName", label: "المالك" },
            { key: "type", label: "النوع" },
            {
              key: "status",
              label: "الحالة",
              render: (row) => row.statusBadge,
            },
            {
              key: "created_at",
              label: "تاريخ الإنشاء",
              render: (row) => formatDate(row.created_at as string),
            },
            {
              key: "actions",
              label: "إجراءات",
              render: (row) => (
                <div className="flex flex-wrap gap-2">
                  <form action={`/api/admin/ads/${row.id}/block`} method="post">
                    <ActionButton label="حظر" variant="danger" />
                  </form>
                  <form action={`/api/admin/ads/${row.id}/unblock`} method="post">
                    <ActionButton label="إلغاء الحظر" />
                  </form>
                  <form action={`/api/admin/ads/${row.id}/delete`} method="post">
                    <ActionButton label="حذف" variant="danger" />
                  </form>
                </div>
              ),
            },
          ]}
          getRowKey={(row) => row.id as string}
          rows={rows}
        />
      </SectionCard>
    </>
  );
}
