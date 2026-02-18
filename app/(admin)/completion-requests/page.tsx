import Link from "next/link";
import { Badge } from "@/components/admin/Badge";
import { DataTable } from "@/components/admin/DataTable";
import { CompletionRequestRowActions } from "@/components/admin/completion-requests/CompletionRequestRowActions";
import { PageHeader } from "@/components/admin/PageHeader";
import { PaginationControls } from "@/components/admin/PaginationControls";
import { SectionCard } from "@/components/admin/SectionCard";
import { StatCard } from "@/components/admin/StatCard";
import { formatDate, formatNumber } from "@/lib/format";
import { getPaginationRange, parsePageParam } from "@/lib/pagination";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const STATUS_MAP: Record<string, { label: string; tone: "neutral" | "success" | "warning" | "danger" }> = {
  pending: { label: "بانتظار المراجعة", tone: "warning" },
  approved: { label: "تمت الموافقة", tone: "success" },
  rejected: { label: "مرفوض", tone: "danger" },
};

const FILTER_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "pending", label: "بانتظار المراجعة" },
  { value: "approved", label: "تمت الموافقة" },
  { value: "rejected", label: "مرفوض" },
];

type Props = {
  searchParams: Promise<{ status?: string; page?: string }>;
};

export default async function CompletionRequestsPage({ searchParams }: Props) {
  const { status: filterStatus, page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);
  const pageSize = 20;
  const { from, to } = getPaginationRange(page, pageSize);
  const activeStatus = filterStatus && filterStatus !== "all" ? filterStatus : undefined;
  const supabase = getSupabaseServerClient();

  // Stats
  const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
    supabase.from("damin_completion_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("damin_completion_requests").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("damin_completion_requests").select("id", { count: "exact", head: true }).eq("status", "rejected"),
  ]);

  // Fetch requests
  let query = supabase
    .from("damin_completion_requests")
    .select("id, order_id, requested_by, requested_at, status, admin_comment, reviewed_at")
    .order("requested_at", { ascending: false })
    .range(from, to);

  let countQuery = supabase
    .from("damin_completion_requests")
    .select("id", { count: "exact", head: true });

  if (activeStatus) {
    query = query.eq("status", activeStatus);
    countQuery = countQuery.eq("status", activeStatus);
  }

  const [{ data: requests }, { count: filteredCount }] = await Promise.all([query, countQuery]);

  // Fetch order data and user profiles
  const orderIds = [...new Set((requests ?? []).map((r) => r.order_id).filter(Boolean))] as string[];
  const userIds = [...new Set((requests ?? []).map((r) => r.requested_by).filter(Boolean))] as string[];

  const [ordersResult, profilesResult] = await Promise.all([
    orderIds.length > 0
      ? supabase
          .from("damin_orders")
          .select("id, service_value, commission, total_amount, payer_user_id, beneficiary_user_id")
          .in("id", orderIds)
      : { data: [] },
    userIds.length > 0
      ? supabase.from("profiles").select("user_id, display_name").in("user_id", userIds)
      : { data: [] },
  ]);

  const orderMap = new Map((ordersResult.data ?? []).map((o) => [o.id, o]));
  const profileMap = new Map((profilesResult.data ?? []).map((p) => [p.user_id, p.display_name]));

  const rows = (requests ?? []).map((cr) => {
    const statusInfo = STATUS_MAP[cr.status] ?? { label: cr.status, tone: "neutral" as const };
    const order = orderMap.get(cr.order_id);
    return {
      ...cr,
      requesterName: profileMap.get(cr.requested_by) ?? "غير معروف",
      serviceValue: order?.service_value ?? 0,
      totalAmount: order?.total_amount ?? 0,
      statusBadge: <Badge label={statusInfo.label} tone={statusInfo.tone} />,
    };
  });

  return (
    <>
      <PageHeader
        title="طلبات الاكتمال"
        subtitle="مراجعة طلبات إنهاء الخدمة وإطلاق المبالغ."
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="بانتظار المراجعة"
          value={formatNumber(pendingCount.count ?? 0)}
          hint="تحتاج إجراء"
        />
        <StatCard
          label="تمت الموافقة"
          value={formatNumber(approvedCount.count ?? 0)}
          hint="تم إطلاق المبالغ"
        />
        <StatCard
          label="مرفوض"
          value={formatNumber(rejectedCount.count ?? 0)}
          hint="تم رفض الطلب"
        />
      </section>

      <SectionCard title="تصفية حسب الحالة">
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((opt) => {
            const isActive = (filterStatus ?? "all") === opt.value;
            return (
              <Link
                key={opt.value}
                href={opt.value === "all" ? "/completion-requests" : `/completion-requests?status=${opt.value}`}
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
        title="قائمة الطلبات"
        description={`عدد النتائج: ${formatNumber(filteredCount ?? 0)}`}
      >
        <DataTable
          columns={[
            {
              key: "order_id",
              label: "رقم الطلب",
              render: (row) => (
                <Link
                  href={`/damin-orders/${row.order_id}`}
                  className="text-[var(--brand)] underline underline-offset-2"
                >
                  {(row.order_id as string).slice(0, 8)}...
                </Link>
              ),
            },
            { key: "requesterName", label: "مقدم الطلب" },
            {
              key: "serviceValue",
              label: "قيمة الخدمة",
              render: (row) => `${formatNumber(row.serviceValue as number)} ر.س`,
            },
            {
              key: "totalAmount",
              label: "الإجمالي",
              render: (row) => `${formatNumber(row.totalAmount as number)} ر.س`,
            },
            {
              key: "requested_at",
              label: "تاريخ الطلب",
              render: (row) => formatDate(row.requested_at as string),
            },
            {
              key: "status",
              label: "الحالة",
              render: (row) => row.statusBadge,
            },
            {
              key: "admin_comment",
              label: "ملاحظة",
              render: (row) =>
                row.admin_comment ? (
                  <span className="text-xs text-slate-600">{(row.admin_comment as string).slice(0, 30)}...</span>
                ) : (
                  <span className="text-slate-400">—</span>
                ),
            },
            {
              key: "actions",
              label: "إجراءات",
              render: (row) => (
                <CompletionRequestRowActions
                  requestId={row.id as string}
                  orderId={row.order_id as string}
                  status={row.status as string}
                />
              ),
            },
          ]}
          getRowKey={(row) => row.id as string}
          rows={rows}
        />
        <PaginationControls
          pathname="/completion-requests"
          page={page}
          pageSize={pageSize}
          totalItems={filteredCount ?? 0}
          query={activeStatus ? { status: activeStatus } : {}}
        />
      </SectionCard>
    </>
  );
}
