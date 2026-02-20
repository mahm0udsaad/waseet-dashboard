import Link from "next/link";
import { Badge } from "@/components/admin/Badge";
import { DataTable } from "@/components/admin/DataTable";
import { DaminOrderRowActions } from "@/components/admin/damin-orders/DaminOrderRowActions";
import { PageHeader } from "@/components/admin/PageHeader";
import { PaginationControls } from "@/components/admin/PaginationControls";
import { SectionCard } from "@/components/admin/SectionCard";
import { StatCard } from "@/components/admin/StatCard";
import { formatDate, formatNumber } from "@/lib/format";
import { getPaginationRange, parsePageParam } from "@/lib/pagination";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const STATUS_MAP: Record<string, { label: string; tone: "neutral" | "success" | "warning" | "danger" }> = {
  created: { label: "تم الإنشاء", tone: "neutral" },
  pending_confirmations: { label: "بانتظار التأكيد", tone: "warning" },
  both_confirmed: { label: "تم التأكيد", tone: "neutral" },
  payment_submitted: { label: "تم إرسال الدفع", tone: "warning" },
  awaiting_completion: { label: "بانتظار اكتمال الخدمة", tone: "warning" },
  completion_requested: { label: "طلب اكتمال", tone: "warning" },
  completed: { label: "مكتمل", tone: "success" },
  cancelled: { label: "ملغي", tone: "danger" },
  disputed: { label: "متنازع عليه", tone: "danger" },
};

const FILTER_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "payment_submitted", label: "بانتظار التحقق" },
  { value: "awaiting_completion", label: "بانتظار اكتمال الخدمة" },
  { value: "completion_requested", label: "طلب اكتمال" },
  { value: "pending_confirmations", label: "بانتظار التأكيد" },
  { value: "both_confirmed", label: "تم التأكيد" },
  { value: "completed", label: "مكتمل" },
  { value: "disputed", label: "متنازع عليه" },
  { value: "cancelled", label: "ملغي" },
  { value: "created", label: "تم الإنشاء" },
];

type Props = {
  searchParams: Promise<{ status?: string; page?: string }>;
};

export default async function DaminOrdersPage({ searchParams }: Props) {
  const { status: filterStatus, page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);
  const pageSize = 30;
  const { from, to } = getPaginationRange(page, pageSize);
  const activeStatus = filterStatus && filterStatus !== "all" ? filterStatus : undefined;
  const supabase = getSupabaseServerClient();

  const [completedSum, pendingSum, totalOrders, pendingCount, completionCount] = await Promise.all([
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
    supabase
      .from("damin_orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "completion_requested"),
  ]);

  const totalRevenue = (completedSum.data ?? []).reduce(
    (sum, row) => sum + (Number(row.commission) || 0),
    0
  );
  const pendingAmount = (pendingSum.data ?? []).reduce(
    (sum, row) => sum + (Number(row.total_amount) || 0),
    0
  );

  let ordersQuery = supabase
    .from("damin_orders")
    .select(
      "id, creator_id, payer_user_id, beneficiary_user_id, payer_phone, beneficiary_phone, service_type_or_details, service_value, commission, total_amount, status, payment_submitted_at, metadata, created_at"
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  let filteredCountQuery = supabase
    .from("damin_orders")
    .select("id", { count: "exact", head: true });

  if (activeStatus) {
    ordersQuery = ordersQuery.eq("status", activeStatus);
    filteredCountQuery = filteredCountQuery.eq("status", activeStatus);
  }

  const [{ data: orders }, { count: filteredCount }] = await Promise.all([
    ordersQuery,
    filteredCountQuery,
  ]);

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
        paymentMethod: meta.payment_method ?? null,
        hasReceipt: !!meta.transfer_receipt_url,
        statusBadge: <Badge label={statusInfo.label} tone={statusInfo.tone} />,
      };
    }) ?? [];

  return (
    <>
      <PageHeader
        title="طلبات الضامن"
        subtitle="متابعة الطلبات حسب الحالة والمبالغ."
        actions={
          <a
            href="/api/admin/export?entity=damin_orders"
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-slate-700 transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
          >
            تصدير CSV
          </a>
        }
      />

      {/* Financial KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
          label="طلبات اكتمال"
          value={formatNumber(completionCount.count ?? 0)}
          hint="بانتظار مراجعة الاكتمال"
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
        description={`عدد النتائج: ${formatNumber(filteredCount ?? 0)}`}
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
            { key: "payerName", label: "الدافع" },
            { key: "beneficiaryName", label: "المستفيد" },
            {
              key: "service_value",
              label: "قيمة الخدمة",
              render: (row) => `${formatNumber(row.service_value as number)} ر.س`,
            },
            {
              key: "payment_method",
              label: "طريقة الدفع",
              render: (row) => {
                if (!row.paymentMethod) return <span className="text-slate-400">—</span>;
                return row.paymentMethod === "card_paymob" ? (
                  <Badge label="بطاقة" tone="success" />
                ) : (
                  <Badge label="تحويل بنكي" tone="warning" />
                );
              },
            },
            {
              key: "receipt",
              label: "إيصال",
              render: (row) =>
                row.hasReceipt ? (
                  <span className="text-xs font-medium text-emerald-600">مرفق</span>
                ) : (
                  <span className="text-slate-400">—</span>
                ),
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
                <DaminOrderRowActions
                  orderId={row.id as string}
                  status={row.status as string}
                  payerUserId={row.payer_user_id as string | null}
                  beneficiaryUserId={row.beneficiary_user_id as string | null}
                  payerName={row.payerName as string}
                  beneficiaryName={row.beneficiaryName as string}
                  metadata={(row.metadata ?? {}) as Record<string, string>}
                />
              ),
            },
          ]}
          getRowKey={(row) => row.id as string}
          rows={rows}
        />
        <PaginationControls
          pathname="/damin-orders"
          page={page}
          pageSize={pageSize}
          totalItems={filteredCount ?? 0}
          query={activeStatus ? { status: activeStatus } : {}}
        />
      </SectionCard>
    </>
  );
}
