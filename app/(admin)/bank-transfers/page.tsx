import Link from "next/link";
import { ArrowUpRight, Banknote, ReceiptText } from "lucide-react";
import { Badge } from "@/components/admin/Badge";
import { PageHeader } from "@/components/admin/PageHeader";
import { PaginationControls } from "@/components/admin/PaginationControls";
import { SectionCard } from "@/components/admin/SectionCard";
import { StatCard } from "@/components/admin/StatCard";
import { BankTransferActions } from "@/components/admin/bank-transfers/BankTransferActions";
import { ReceiptImage } from "@/components/admin/damin-orders/ReceiptImage";
import { formatDate, formatNumber } from "@/lib/format";
import { getPaginationRange, parsePageParam } from "@/lib/pagination";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const STATUS_MAP: Record<
  string,
  { label: string; tone: "neutral" | "success" | "warning" | "danger" }
> = {
  awaiting_admin_transfer_approval: { label: "بانتظار التأكيد", tone: "warning" },
  payment_verified: { label: "تم القبول", tone: "success" },
  in_progress: { label: "قيد التنفيذ", tone: "neutral" },
  completion_requested: { label: "بانتظار تأكيد المشتري", tone: "neutral" },
  completed: { label: "مكتمل", tone: "success" },
  awaiting_payment: { label: "أُعيد للدفع", tone: "danger" },
  cancelled: { label: "ملغي", tone: "danger" },
  refunded: { label: "مسترد", tone: "danger" },
};

const TABS = [
  { value: "pending", label: "بانتظار التأكيد", statuses: ["awaiting_admin_transfer_approval"] },
  {
    value: "approved",
    label: "تم القبول",
    statuses: ["payment_verified", "in_progress", "completion_requested", "completed"],
  },
  {
    value: "rejected",
    label: "مرفوضة / ملغاة",
    statuses: ["awaiting_payment", "cancelled", "refunded"],
  },
  { value: "all", label: "الكل", statuses: [] },
];

const PAGE_SIZE = 20;

type Props = {
  searchParams: Promise<{ tab?: string; page?: string }>;
};

export default async function BankTransfersPage({ searchParams }: Props) {
  const { tab: tabParam, page: pageParam } = await searchParams;
  const activeTab = TABS.find((t) => t.value === tabParam) ?? TABS[0];
  const page = parsePageParam(pageParam);
  const { from, to } = getPaginationRange(page, PAGE_SIZE);
  const supabase = getSupabaseServerClient();

  const baseFilter = supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("payment_method", "bank_transfer");

  const [pendingCount, approvedCount, rejectedCount, totalCount, pendingAmounts] =
    await Promise.all([
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("payment_method", "bank_transfer")
        .eq("status", "awaiting_admin_transfer_approval"),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("payment_method", "bank_transfer")
        .in("status", ["payment_verified", "in_progress", "completion_requested", "completed"]),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("payment_method", "bank_transfer")
        .in("status", ["awaiting_payment", "cancelled", "refunded"]),
      baseFilter,
      supabase
        .from("orders")
        .select("amount")
        .eq("payment_method", "bank_transfer")
        .eq("status", "awaiting_admin_transfer_approval"),
    ]);

  const pendingAmountTotal = (pendingAmounts.data ?? []).reduce(
    (sum, row) => sum + (Number(row.amount) || 0),
    0
  );

  let listQuery = supabase
    .from("orders")
    .select(
      "id, buyer_id, seller_id, ad_id, conversation_id, receipt_id, amount, currency, status, payment_method, transfer_phone, transfer_receipt_url, transfer_submitted_at, created_at"
    )
    .eq("payment_method", "bank_transfer")
    .order("transfer_submitted_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  let countQuery = supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("payment_method", "bank_transfer");

  if (activeTab.statuses.length > 0) {
    listQuery = listQuery.in("status", activeTab.statuses);
    countQuery = countQuery.in("status", activeTab.statuses);
  }

  const [{ data: orders }, { count: filteredCount }] = await Promise.all([
    listQuery,
    countQuery,
  ]);

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
          .select("user_id, display_name, phone")
          .in("user_id", userIds)
      : { data: [] };

  const profileMap = new Map(
    (profiles ?? []).map((p) => [
      p.user_id,
      { name: p.display_name as string | null, phone: p.phone as string | null },
    ])
  );

  return (
    <>
      <PageHeader
        title="التحويلات البنكية"
        subtitle="مكان واحد لمراجعة إيصالات التحويل البنكي وقبولها أو رفضها بسرعة."
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="بانتظار التأكيد"
          value={formatNumber(pendingCount.count ?? 0)}
          hint={`${formatNumber(pendingAmountTotal)} ر.س قيد المراجعة`}
          tone={pendingCount.count ? "warning" : "neutral"}
          href="/bank-transfers?tab=pending"
        />
        <StatCard
          label="تم القبول"
          value={formatNumber(approvedCount.count ?? 0)}
          hint="تحويلات مُعتمدة"
          tone="success"
          href="/bank-transfers?tab=approved"
        />
        <StatCard
          label="مرفوضة / ملغاة"
          value={formatNumber(rejectedCount.count ?? 0)}
          hint="رُفضت أو لم يكتمل دفعها"
          tone="danger"
          href="/bank-transfers?tab=rejected"
        />
        <StatCard
          label="إجمالي التحويلات"
          value={formatNumber(totalCount.count ?? 0)}
          hint="منذ بدء الخدمة"
          href="/bank-transfers?tab=all"
        />
      </section>

      <SectionCard
        title="حالة التحويلات"
        description="تنقّل بين قوائم التحويلات حسب الحالة."
      >
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const isActive = activeTab.value === tab.value;
            return (
              <Link
                key={tab.value}
                href={tab.value === "pending" ? "/bank-transfers" : `/bank-transfers?tab=${tab.value}`}
                className={`rounded-full border px-4 py-1.5 text-sm transition ${
                  isActive
                    ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                    : "border-[var(--border)] text-slate-700 hover:border-[var(--brand)] hover:text-[var(--brand)]"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        title={activeTab.label}
        description={`عدد النتائج: ${formatNumber(filteredCount ?? 0)}`}
      >
        {(orders ?? []).length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[var(--border)] bg-white p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Banknote className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-900">
              لا توجد تحويلات في هذه القائمة
            </p>
            <p className="mt-1 text-xs text-[var(--text-subtle)]">
              عند ورود تحويل جديد سيظهر هنا تلقائياً.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {(orders ?? []).map((order) => {
              const buyer = profileMap.get(order.buyer_id ?? "") ?? null;
              const seller = profileMap.get(order.seller_id ?? "") ?? null;
              const statusInfo = STATUS_MAP[order.status] ?? {
                label: order.status,
                tone: "neutral" as const,
              };
              const canAct = order.status === "awaiting_admin_transfer_approval";
              const submittedAt = order.transfer_submitted_at ?? order.created_at;

              return (
                <article
                  key={order.id}
                  className="rounded-[24px] border border-[var(--border)] bg-white p-4 shadow-sm transition hover:border-rose-200 hover:shadow-md sm:p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                    <div className="shrink-0">
                      {order.transfer_receipt_url ? (
                        <ReceiptImage receiptUrl={order.transfer_receipt_url as string} />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-rose-200 bg-rose-50 text-xs text-rose-600">
                          لم يُرفق
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge label={statusInfo.label} tone={statusInfo.tone} />
                        <Link
                          href={`/orders/${order.id}`}
                          className="inline-flex items-center gap-1 font-mono text-xs text-[var(--brand)] hover:underline"
                        >
                          #{(order.id as string).slice(0, 8)}
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                        <span className="text-xs text-[var(--text-subtle)]">
                          {formatDate(submittedAt as string)}
                        </span>
                      </div>

                      <p className="mt-3 text-2xl font-semibold text-slate-950">
                        {formatNumber(order.amount as number)} {order.currency as string}
                      </p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
                            المشتري (المحوِّل)
                          </p>
                          <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                            {buyer?.name ?? "—"}
                          </p>
                          <p className="mt-0.5 text-xs text-[var(--text-subtle)]" dir="ltr">
                            {order.transfer_phone ?? buyer?.phone ?? "—"}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
                            البائع
                          </p>
                          <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                            {seller?.name ?? "—"}
                          </p>
                          <p className="mt-0.5 text-xs text-[var(--text-subtle)]" dir="ltr">
                            {seller?.phone ?? "—"}
                          </p>
                        </div>
                      </div>

                      {order.conversation_id ? (
                        <Link
                          href={`/chats/${order.conversation_id}`}
                          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-[var(--brand)]"
                        >
                          <ReceiptText className="h-3.5 w-3.5" />
                          عرض المحادثة
                        </Link>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 items-start lg:items-center">
                      {canAct ? (
                        <BankTransferActions orderId={order.id as string} />
                      ) : (
                        <Link
                          href={`/orders/${order.id}`}
                          className="rounded-full border border-[var(--border)] px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
                        >
                          عرض الطلب
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <PaginationControls
          pathname="/bank-transfers"
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={filteredCount ?? 0}
          query={activeTab.value !== "pending" ? { tab: activeTab.value } : {}}
        />
      </SectionCard>
    </>
  );
}
