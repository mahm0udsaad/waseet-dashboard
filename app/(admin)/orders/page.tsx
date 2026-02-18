import Link from "next/link";
import { Badge } from "@/components/admin/Badge";
import { DataTable } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { PaginationControls } from "@/components/admin/PaginationControls";
import { SectionCard } from "@/components/admin/SectionCard";
import { StatCard } from "@/components/admin/StatCard";
import { OrderRowActions } from "@/components/admin/orders/OrderRowActions";
import { formatDate, formatNumber } from "@/lib/format";
import { getPaginationRange, parsePageParam } from "@/lib/pagination";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const STATUS_MAP: Record<
  string,
  { label: string; tone: "neutral" | "success" | "warning" | "danger" }
> = {
  pending_payment: { label: "بانتظار الدفع", tone: "warning" },
  paid: { label: "تم الدفع", tone: "neutral" },
  completed: { label: "مكتمل", tone: "success" },
  cancelled: { label: "ملغي", tone: "danger" },
};

const FILTER_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "pending_payment", label: "بانتظار الدفع" },
  { value: "paid", label: "تم الدفع" },
  { value: "completed", label: "مكتمل" },
  { value: "cancelled", label: "ملغي" },
];

const PAGE_SIZE = 30;

type Props = {
  searchParams: Promise<{ status?: string; page?: string }>;
};

export default async function OrdersPage({ searchParams }: Props) {
  const { status: filterStatus, page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);
  const { from, to } = getPaginationRange(page, PAGE_SIZE);
  const activeStatus =
    filterStatus && filterStatus !== "all" ? filterStatus : undefined;
  const supabase = getSupabaseServerClient();

  const [totalOrders, pendingCount, completedSum] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_payment"),
    supabase
      .from("orders")
      .select("amount")
      .eq("status", "completed"),
  ]);

  const totalRevenue = (completedSum.data ?? []).reduce(
    (sum, row) => sum + (Number(row.amount) || 0),
    0
  );

  let ordersQuery = supabase
    .from("orders")
    .select(
      "id, buyer_id, seller_id, ad_id, conversation_id, receipt_id, amount, currency, status, created_at"
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  let filteredCountQuery = supabase
    .from("orders")
    .select("id", { count: "exact", head: true });

  if (activeStatus) {
    ordersQuery = ordersQuery.eq("status", activeStatus);
    filteredCountQuery = filteredCountQuery.eq("status", activeStatus);
  }

  const [{ data: orders }, { count: filteredCount }] = await Promise.all([
    ordersQuery,
    filteredCountQuery,
  ]);

  // Fetch profiles for buyers and sellers
  const userIds = Array.from(
    new Set(
      (orders ?? [])
        .flatMap((o) => [o.buyer_id, o.seller_id])
        .filter(Boolean)
    )
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
    orders?.map((order) => {
      const statusInfo = STATUS_MAP[order.status] ?? {
        label: order.status,
        tone: "neutral" as const,
      };
      return {
        ...order,
        buyerName: profileMap.get(order.buyer_id ?? "") ?? "—",
        sellerName: profileMap.get(order.seller_id ?? "") ?? "—",
        statusBadge: <Badge label={statusInfo.label} tone={statusInfo.tone} />,
      };
    }) ?? [];

  return (
    <>
      <PageHeader
        title="الطلبات"
        subtitle="إدارة طلبات المنصة ومتابعة الحالة."
        actions={
          <a
            href="/api/admin/export?entity=orders&format=csv"
            className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-slate-700"
          >
            تصدير البيانات
          </a>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="إجمالي الطلبات"
          value={formatNumber(totalOrders.count ?? 0)}
          hint="كل الطلبات"
        />
        <StatCard
          label="بانتظار الدفع"
          value={formatNumber(pendingCount.count ?? 0)}
          hint="طلبات لم تُدفع بعد"
        />
        <StatCard
          label="إيرادات الطلبات"
          value={`${formatNumber(totalRevenue)} ر.س`}
          hint="من الطلبات المكتملة"
        />
        <StatCard
          label="عدد النتائج"
          value={formatNumber(filteredCount ?? 0)}
          hint="حسب الفلتر الحالي"
        />
      </section>

      <SectionCard
        title="تصفية حسب الحالة"
        description="اختر حالة لعرض الطلبات المناسبة."
      >
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((opt) => {
            const isActive = (filterStatus ?? "all") === opt.value;
            return (
              <Link
                key={opt.value}
                href={
                  opt.value === "all"
                    ? "/orders"
                    : `/orders?status=${opt.value}`
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
        title="قائمة الطلبات"
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
            { key: "buyerName", label: "المشتري" },
            { key: "sellerName", label: "البائع" },
            {
              key: "amount",
              label: "المبلغ",
              render: (row) =>
                `${formatNumber(row.amount as number)} ${row.currency as string}`,
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
                <OrderRowActions
                  orderId={row.id as string}
                  status={row.status as string}
                  buyerId={row.buyer_id as string | null}
                  sellerId={row.seller_id as string | null}
                  buyerName={row.buyerName as string}
                  sellerName={row.sellerName as string}
                  conversationId={row.conversation_id as string | null}
                  receiptId={row.receipt_id as string | null}
                />
              ),
            },
          ]}
          getRowKey={(row) => row.id as string}
          rows={rows}
        />
        <PaginationControls
          pathname="/orders"
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={filteredCount ?? 0}
          query={activeStatus ? { status: activeStatus } : {}}
        />
      </SectionCard>
    </>
  );
}
