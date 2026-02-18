import Link from "next/link";
import { Badge } from "@/components/admin/Badge";
import { DataTable } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { PaginationControls } from "@/components/admin/PaginationControls";
import { SectionCard } from "@/components/admin/SectionCard";
import { StatCard } from "@/components/admin/StatCard";
import { formatDate, formatNumber } from "@/lib/format";
import { getPaginationRange, parsePageParam } from "@/lib/pagination";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const STATUS_MAP: Record<
  string,
  { label: string; tone: "neutral" | "success" | "warning" | "danger" }
> = {
  created: { label: "تم الإنشاء", tone: "neutral" },
  pending: { label: "معلق", tone: "warning" },
  succeeded: { label: "ناجح", tone: "success" },
  failed: { label: "فاشل", tone: "danger" },
  canceled: { label: "ملغي", tone: "danger" },
};

const FILTER_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "pending", label: "معلق" },
  { value: "succeeded", label: "ناجح" },
  { value: "failed", label: "فاشل" },
  { value: "canceled", label: "ملغي" },
  { value: "created", label: "تم الإنشاء" },
];

const PAGE_SIZE = 30;

type Props = {
  searchParams: Promise<{ status?: string; page?: string }>;
};

export default async function PaymentsPage({ searchParams }: Props) {
  const { status: filterStatus, page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);
  const { from, to } = getPaginationRange(page, PAGE_SIZE);
  const activeStatus =
    filterStatus && filterStatus !== "all" ? filterStatus : undefined;
  const supabase = getSupabaseServerClient();

  const [totalPayments, succeededSum, failedCount, pendingCount] =
    await Promise.all([
      supabase
        .from("payments")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("payments")
        .select("amount")
        .eq("status", "succeeded"),
      supabase
        .from("payments")
        .select("id", { count: "exact", head: true })
        .eq("status", "failed"),
      supabase
        .from("payments")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

  // Amount is in halala (minor units), convert to SAR
  const totalSucceededAmount = (succeededSum.data ?? []).reduce(
    (sum, row) => sum + (Number(row.amount) || 0),
    0
  ) / 100;

  let paymentsQuery = supabase
    .from("payments")
    .select(
      "id, user_id, amount, currency, provider, status, provider_intention_id, created_at"
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  let filteredCountQuery = supabase
    .from("payments")
    .select("id", { count: "exact", head: true });

  if (activeStatus) {
    paymentsQuery = paymentsQuery.eq("status", activeStatus);
    filteredCountQuery = filteredCountQuery.eq("status", activeStatus);
  }

  const [{ data: payments }, { count: filteredCount }] = await Promise.all([
    paymentsQuery,
    filteredCountQuery,
  ]);

  // Fetch user profiles
  const userIds = Array.from(
    new Set((payments ?? []).map((p) => p.user_id).filter(Boolean))
  ) as string[];

  const { data: profiles } =
    userIds.length > 0
      ? await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", userIds)
      : { data: [] };

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.user_id, p.display_name])
  );

  const rows =
    payments?.map((payment) => {
      const statusInfo = STATUS_MAP[payment.status] ?? {
        label: payment.status,
        tone: "neutral" as const,
      };
      return {
        ...payment,
        userName: profileMap.get(payment.user_id) ?? "—",
        amountSar: (Number(payment.amount) / 100).toFixed(2),
        statusBadge: <Badge label={statusInfo.label} tone={statusInfo.tone} />,
      };
    }) ?? [];

  return (
    <>
      <PageHeader
        title="المدفوعات"
        subtitle="متابعة عمليات الدفع عبر Paymob."
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="إجمالي العمليات"
          value={formatNumber(totalPayments.count ?? 0)}
          hint="كل العمليات"
        />
        <StatCard
          label="المبالغ الناجحة"
          value={`${formatNumber(totalSucceededAmount)} ر.س`}
          hint="تم الدفع بنجاح"
        />
        <StatCard
          label="عمليات فاشلة"
          value={formatNumber(failedCount.count ?? 0)}
          hint="فشلت في الدفع"
        />
        <StatCard
          label="عمليات معلقة"
          value={formatNumber(pendingCount.count ?? 0)}
          hint="بانتظار التأكيد"
        />
      </section>

      <SectionCard
        title="تصفية حسب الحالة"
        description="اختر حالة لعرض العمليات المناسبة."
      >
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((opt) => {
            const isActive = (filterStatus ?? "all") === opt.value;
            return (
              <Link
                key={opt.value}
                href={
                  opt.value === "all"
                    ? "/payments"
                    : `/payments?status=${opt.value}`
                }
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

      <SectionCard
        title="قائمة المدفوعات"
        description={`عدد النتائج: ${formatNumber(filteredCount ?? 0)}`}
      >
        <DataTable
          columns={[
            {
              key: "id",
              label: "المعرف",
              render: (row) => (
                <span className="font-mono text-xs">
                  {(row.id as string).slice(0, 8)}...
                </span>
              ),
            },
            { key: "userName", label: "المستخدم" },
            {
              key: "amount",
              label: "المبلغ",
              render: (row) =>
                `${row.amountSar as string} ${row.currency as string}`,
            },
            { key: "provider", label: "مزود الدفع" },
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
          ]}
          getRowKey={(row) => row.id as string}
          rows={rows}
        />
        <PaginationControls
          pathname="/payments"
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={filteredCount ?? 0}
          query={activeStatus ? { status: activeStatus } : {}}
        />
      </SectionCard>
    </>
  );
}
