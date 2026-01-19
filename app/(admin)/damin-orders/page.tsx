import { Badge } from "@/components/admin/Badge";
import { DataTable } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { SectionCard } from "@/components/admin/SectionCard";
import { ActionButton } from "@/components/admin/ActionButton";
import { formatDate, formatNumber } from "@/lib/format";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function statusTone(status: string) {
  if (status === "completed") return "success";
  if (status === "disputed") return "danger";
  if (status === "cancelled") return "warning";
  return "neutral";
}

export default async function DaminOrdersPage() {
  const supabase = getSupabaseServerClient();
  const { data: orders } = await supabase
    .from("damin_orders")
    .select(
      "id, creator_id, payer_user_id, beneficiary_user_id, status, total_amount, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(20);

  const userIds = Array.from(
    new Set(
      (orders ?? [])
        .flatMap((order) => [
          order.creator_id,
          order.payer_user_id,
          order.beneficiary_user_id,
        ])
        .filter(Boolean)
    )
  ) as string[];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, display_name")
    .in("user_id", userIds);

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.user_id, profile.display_name])
  );

  const rows =
    orders?.map((order) => ({
      ...order,
      creatorName: profileMap.get(order.creator_id ?? "") ?? "غير معروف",
      payerName: profileMap.get(order.payer_user_id ?? "") ?? "غير معروف",
      beneficiaryName:
        profileMap.get(order.beneficiary_user_id ?? "") ?? "غير معروف",
      statusBadge: (
        <Badge label={order.status} tone={statusTone(order.status)} />
      ),
    })) ?? [];

  return (
    <>
      <PageHeader
        title="طلبات الضامن"
        subtitle="متابعة الطلبات حسب الحالة والمبالغ."
      />
      <SectionCard
        title="قائمة الطلبات"
        description="آخر 20 طلباً مع المبالغ والحالة."
      >
        <DataTable
          columns={[
            { key: "id", label: "المعرف" },
            { key: "creatorName", label: "المنشئ" },
            { key: "payerName", label: "الدافع" },
            { key: "beneficiaryName", label: "المستفيد" },
            {
              key: "total_amount",
              label: "القيمة",
              render: (row) => `${formatNumber(row.total_amount as number)} ر.س`,
            },
            {
              key: "status",
              label: "الحالة",
              render: (row) => row.statusBadge,
            },
            {
              key: "created_at",
              label: "التاريخ",
              render: (row) => formatDate(row.created_at as string),
            },
            {
              key: "actions",
              label: "إجراءات",
              render: (row) => (
                <form
                  action={`/api/admin/damin-orders/${row.id}/resolve`}
                  method="post"
                >
                  <ActionButton label="تعليم كمكتملة" variant="primary" />
                </form>
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
