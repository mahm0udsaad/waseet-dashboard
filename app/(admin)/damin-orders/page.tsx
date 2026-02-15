import Link from "next/link";
import { Badge } from "@/components/admin/Badge";
import { DataTable } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { SectionCard } from "@/components/admin/SectionCard";
import { StatCard } from "@/components/admin/StatCard";
import { formatDate, formatNumber } from "@/lib/format";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const STATUS_MAP: Record<string, { label: string; tone: "neutral" | "success" | "warning" | "danger" }> = {
  created: { label: "تم الإنشاء", tone: "neutral" },
  pending_confirmations: { label: "بانتظار التأكيد", tone: "warning" },
  both_confirmed: { label: "تم التأكيد", tone: "neutral" },
  payment_submitted: { label: "تم إرسال الدفع", tone: "warning" },
  completed: { label: "مكتمل", tone: "success" },
  cancelled: { label: "ملغي", tone: "danger" },
  disputed: { label: "متنازع عليه", tone: "danger" },
};

const FILTER_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "payment_submitted", label: "بانتظار التحقق" },
  { value: "pending_confirmations", label: "بانتظار التأكيد" },
  { value: "both_confirmed", label: "تم التأكيد" },
  { value: "completed", label: "مكتمل" },
  { value: "disputed", label: "متنازع عليه" },
  { value: "cancelled", label: "ملغي" },
  { value: "created", label: "تم الإنشاء" },
];

type Props = {
  searchParams: Promise<{ status?: string }>;
};

export default async function DaminOrdersPage({ searchParams }: Props) {
  const { status: filterStatus } = await searchParams;
  const supabase = getSupabaseServerClient();

  const [completedSum, pendingSum, totalOrders, pendingCount] = await Promise.all([
    supabase
      .from("damin_orders")
      .select("commission")
      .eq("status", "completed"),
    supabase
      .from("damin_orders")
      .select("total_amount")
      .eq("status", "payment_submitted"),
    supabase
      .from("damin_orders")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("damin_orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "payment_submitted"),
  ]);

  const totalRevenue = (completedSum.data ?? []).reduce(
    (sum, row) => sum + (Number(row.commission) || 0),
    0
  );
  const pendingAmount = (pendingSum.data ?? []).reduce(
    (sum, row) => sum + (Number(row.total_amount) || 0),
    0
  );

  // Fetch orders with optional filter
  let query = supabase
    .from("damin_orders")
    .select(
      "id, creator_id, payer_user_id, beneficiary_user_id, payer_phone, beneficiary_phone, service_type_or_details, service_value, commission, total_amount, status, payment_submitted_at, metadata, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (filterStatus && filterStatus !== "all") {
    query = query.eq("status", filterStatus);
  }

  const { data: orders } = await query;

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

  const { data: profiles } = userIds.length > 0
    ? await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds)
    : { data: [] };

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.user_id, p.display_name])
  );

  const rows =
    orders?.map((order) => {
      const meta = (order.metadata ?? {}) as Record<string, string>;
      const statusInfo = STATUS_MAP[order.status] ?? { label: order.status, tone: "neutral" as const };
      return {
        ...order,
        payerName: profileMap.get(order.payer_user_id ?? "") ?? order.payer_phone ?? "—",
        beneficiaryName:
          profileMap.get(order.beneficiary_user_id ?? "") ?? order.beneficiary_phone ?? "—",
        transferPhone: meta.transfer_phone ?? "—",
        statusBadge: <Badge label={statusInfo.label} tone={statusInfo.tone} />,
      };
    }) ?? [];

  return (
    <>
      <PageHeader
        title="طلبات الضامن"
        subtitle="متابعة الطلبات حسب الحالة والمبالغ."
      />

      {/* Financial KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="إجمالي الطلبات"
          value={formatNumber(totalOrders.count ?? 0)}
          hint="كل الطلبات"
        />
        <StatCard
          label="بانتظار التحقق"
          value={formatNumber(pendingCount.count ?? 0)}
          hint="تحتاج إجراء الإدارة"
        />
        <StatCard
          label="إيرادات العمولات"
          value={`${formatNumber(totalRevenue)} ر.س`}
          hint="من الطلبات المكتملة"
        />
        <StatCard
          label="مبالغ معلقة"
          value={`${formatNumber(pendingAmount)} ر.س`}
          hint="بانتظار التحقق من الدفع"
        />
      </section>

      {/* Status Filter */}
      <SectionCard title="تصفية حسب الحالة" description="اختر حالة لعرض الطلبات المناسبة.">
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((opt) => {
            const isActive = (filterStatus ?? "all") === opt.value;
            return (
              <Link
                key={opt.value}
                href={opt.value === "all" ? "/damin-orders" : `/damin-orders?status=${opt.value}`}
                className={`rounded-full border px-4 py-1.5 text-sm transition ${
                  isActive
                    ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                    : "border-[var(--border)] text-slate-700 hover:border-[var(--brand)] hover:text-[var(--brand)]"
                }`}
              >
                {opt.label}
              </Link>
            );
          })}
        </div>
      </SectionCard>

      {/* Orders Table */}
      <SectionCard
        title="قائمة الطلبات"
        description={`عدد النتائج: ${formatNumber(rows.length)}`}
      >
        <DataTable
          columns={[
            {
              key: "id",
              label: "المعرف",
              render: (row) => (
                <Link
                  href={`/damin-orders/${row.id}`}
                  className="text-[var(--brand)] underline underline-offset-2"
                >
                  {(row.id as string).slice(0, 8)}...
                </Link>
              ),
            },
            { key: "payerName", label: "صاحب الطلب (الدافع)" },
            { key: "beneficiaryName", label: "مقدم الخدمة (المستفيد)" },
            {
              key: "service_value",
              label: "قيمة الخدمة",
              render: (row) => `${formatNumber(row.service_value as number)} ر.س`,
            },
            {
              key: "total_amount",
              label: "الإجمالي",
              render: (row) => `${formatNumber(row.total_amount as number)} ر.س`,
            },
            {
              key: "status",
              label: "الحالة",
              render: (row) => row.statusBadge,
            },
            {
              key: "transferPhone",
              label: "هاتف التحويل",
              render: (row) =>
                row.status === "payment_submitted" ? (
                  <span className="font-mono text-xs">{row.transferPhone as string}</span>
                ) : (
                  <span className="text-slate-400">—</span>
                ),
            },
            {
              key: "created_at",
              label: "التاريخ",
              render: (row) => formatDate(row.created_at as string),
            },
          ]}
          getRowKey={(row) => row.id as string}
          rows={rows}
        />
      </SectionCard>
    </>
  );
}
