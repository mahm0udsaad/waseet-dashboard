import Link from "next/link";
import { Badge } from "@/components/admin/Badge";
import { DataTable } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { PaginationControls } from "@/components/admin/PaginationControls";
import { SectionCard } from "@/components/admin/SectionCard";
import { StatCard } from "@/components/admin/StatCard";
import { WithdrawalRowActions } from "@/components/admin/withdrawals/WithdrawalRowActions";
import { formatDate, formatNumber } from "@/lib/format";
import { getPaginationRange, parsePageParam } from "@/lib/pagination";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const STATUS_MAP: Record<string, { label: string; tone: "neutral" | "success" | "warning" | "danger" }> = {
  pending: { label: "قيد الانتظار", tone: "warning" },
  approved: { label: "تمت الموافقة", tone: "success" },
  rejected: { label: "مرفوض", tone: "danger" },
  completed: { label: "مكتمل", tone: "success" },
};

const FILTER_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "pending", label: "قيد الانتظار" },
  { value: "approved", label: "تمت الموافقة" },
  { value: "rejected", label: "مرفوض" },
  { value: "completed", label: "مكتمل" },
];

type Props = {
  searchParams: Promise<{ status?: string; page?: string }>;
};

export default async function WithdrawalsPage({ searchParams }: Props) {
  const { status: filterStatus, page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);
  const pageSize = 30;
  const { from, to } = getPaginationRange(page, pageSize);
  const activeStatus = filterStatus && filterStatus !== "all" ? filterStatus : undefined;
  const supabase = getSupabaseServerClient();

  // KPI queries
  const [totalResult, pendingResult, approvedSumResult, pendingSumResult] = await Promise.all([
    supabase
      .from("withdrawal_requests")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("withdrawal_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("withdrawal_requests")
      .select("amount")
      .eq("status", "approved"),
    supabase
      .from("withdrawal_requests")
      .select("amount")
      .eq("status", "pending"),
  ]);

  const approvedTotal = (approvedSumResult.data ?? []).reduce(
    (sum, row) => sum + (Number(row.amount) || 0),
    0
  );
  const pendingTotal = (pendingSumResult.data ?? []).reduce(
    (sum, row) => sum + (Number(row.amount) || 0),
    0
  );

  // Data query
  let dataQuery = supabase
    .from("withdrawal_requests")
    .select("id, user_id, amount, iban, bank_name, account_holder_name, status, admin_note, created_at, processed_at")
    .order("created_at", { ascending: false })
    .range(from, to);

  let countQuery = supabase
    .from("withdrawal_requests")
    .select("id", { count: "exact", head: true });

  if (activeStatus) {
    dataQuery = dataQuery.eq("status", activeStatus);
    countQuery = countQuery.eq("status", activeStatus);
  }

  const [{ data: withdrawals }, { count: filteredCount }] = await Promise.all([
    dataQuery,
    countQuery,
  ]);

  // Fetch user profiles
  const userIds = Array.from(
    new Set((withdrawals ?? []).map((w) => w.user_id).filter(Boolean))
  ) as string[];

  const { data: profiles } = userIds.length > 0
    ? await supabase
        .from("profiles")
        .select("user_id, display_name, phone")
        .in("user_id", userIds)
    : { data: [] };

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.user_id, p])
  );

  const rows =
    withdrawals?.map((w) => {
      const profile = profileMap.get(w.user_id);
      const statusInfo = STATUS_MAP[w.status] ?? { label: w.status, tone: "neutral" as const };
      return {
        ...w,
        userName: profile?.display_name ?? "غير معروف",
        userPhone: profile?.phone ?? null,
        statusBadge: <Badge label={statusInfo.label} tone={statusInfo.tone} />,
      };
    }) ?? [];

  return (
    <>
      <PageHeader
        title="طلبات السحب"
        subtitle="إدارة طلبات سحب الأرصدة من المحافظ."
      />

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="إجمالي الطلبات"
          value={formatNumber(totalResult.count ?? 0)}
          hint="كل الطلبات"
        />
        <StatCard
          label="قيد الانتظار"
          value={formatNumber(pendingResult.count ?? 0)}
          hint="تحتاج إجراء الإدارة"
        />
        <StatCard
          label="مبالغ تمت الموافقة عليها"
          value={`${formatNumber(approvedTotal)} ر.س`}
          hint="إجمالي المعتمد"
        />
        <StatCard
          label="مبالغ معلقة"
          value={`${formatNumber(pendingTotal)} ر.س`}
          hint="بانتظار المراجعة"
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
                href={opt.value === "all" ? "/withdrawals" : `/withdrawals?status=${opt.value}`}
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

      {/* Table */}
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
                <span className="font-mono text-xs text-slate-500">
                  {(row.id as string).slice(0, 8)}...
                </span>
              ),
            },
            { key: "userName", label: "المستخدم" },
            {
              key: "amount",
              label: "المبلغ",
              render: (row) => `${formatNumber(row.amount as number)} ر.س`,
            },
            {
              key: "iban",
              label: "IBAN",
              render: (row) => {
                const iban = row.iban as string;
                if (!iban) return <span className="text-slate-300">—</span>;
                return (
                  <span className="break-all font-mono text-xs" dir="ltr" title={iban}>
                    {iban}
                  </span>
                );
              },
            },
            { key: "bank_name", label: "البنك" },
            {
              key: "account_holder_name",
              label: "صاحب الحساب",
              render: (row) => (
                <span className="text-sm">{row.account_holder_name as string ?? "—"}</span>
              ),
            },
            {
              key: "status",
              label: "الحالة",
              render: (row) => row.statusBadge,
            },
            {
              key: "admin_note",
              label: "ملاحظة",
              render: (row) =>
                row.admin_note ? (
                  <span className="text-xs text-slate-500">{row.admin_note as string}</span>
                ) : (
                  <span className="text-slate-300">—</span>
                ),
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
                <WithdrawalRowActions
                  withdrawalId={row.id as string}
                  status={row.status as string}
                  userId={row.user_id as string}
                  amount={row.amount as number}
                />
              ),
            },
          ]}
          getRowKey={(row) => row.id as string}
          rows={rows}
        />
        <PaginationControls
          pathname="/withdrawals"
          page={page}
          pageSize={pageSize}
          totalItems={filteredCount ?? 0}
          query={activeStatus ? { status: activeStatus } : {}}
        />
      </SectionCard>
    </>
  );
}
