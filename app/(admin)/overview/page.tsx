import Link from "next/link";
import { Badge } from "@/components/admin/Badge";
import { PageHeader } from "@/components/admin/PageHeader";
import { SectionCard } from "@/components/admin/SectionCard";
import { StatCard } from "@/components/admin/StatCard";
import { formatDate, formatNumber } from "@/lib/format";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function OverviewPage() {
  const supabase = getSupabaseServerClient();

  const [
    usersTotal,
    usersActive,
    usersBanned,
    adsTotal,
    adsActive,
    adsBlocked,
    chatsOpen,
    daminCreated,
    daminPending,
    daminCompleted,
    daminPaymentSubmitted,
    daminDisputed,
    daminCompletedCommissions,
    daminPendingAmounts,
    ordersTotal,
    ordersPendingPayment,
    receiptsTotal,
    paymentsTotal,
    paymentsSucceeded,
    withdrawalsPending,
    withdrawalsPendingAmounts,
    recentUsers,
    recentDamin,
  ] = await Promise.all([
    supabase.from("profiles").select("user_id", { count: "exact", head: true }),
    supabase.from("profiles").select("user_id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("profiles").select("user_id", { count: "exact", head: true }).eq("status", "banned"),
    supabase.from("ads").select("id", { count: "exact", head: true }),
    supabase.from("ads").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("ads").select("id", { count: "exact", head: true }).eq("status", "blocked"),
    supabase.from("conversations").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("damin_orders").select("id", { count: "exact", head: true }).eq("status", "created"),
    supabase.from("damin_orders").select("id", { count: "exact", head: true }).in("status", ["pending_confirmations", "both_confirmed"]),
    supabase.from("damin_orders").select("id", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("damin_orders").select("id", { count: "exact", head: true }).eq("status", "payment_submitted"),
    supabase.from("damin_orders").select("id", { count: "exact", head: true }).eq("status", "disputed"),
    supabase.from("damin_orders").select("commission").eq("status", "completed"),
    supabase.from("damin_orders").select("total_amount").eq("status", "payment_submitted"),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "awaiting_payment"),
    supabase.from("receipts").select("id", { count: "exact", head: true }),
    supabase.from("payments").select("id", { count: "exact", head: true }),
    supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "succeeded"),
    supabase.from("withdrawal_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("withdrawal_requests").select("amount").eq("status", "pending"),
    supabase.from("profiles").select("user_id, display_name, phone, role, status, created_at").order("created_at", { ascending: false }).limit(8),
    supabase.from("damin_orders").select("id, service_type_or_details, total_amount, status, created_at").order("created_at", { ascending: false }).limit(5),
  ]);

  const totalRevenue = (daminCompletedCommissions.data ?? []).reduce(
    (sum, row) => sum + (Number(row.commission) || 0), 0
  );
  const pendingPaymentAmount = (daminPendingAmounts.data ?? []).reduce(
    (sum, row) => sum + (Number(row.total_amount) || 0), 0
  );
  const pendingWithdrawalAmount = (withdrawalsPendingAmounts.data ?? []).reduce(
    (sum, row) => sum + (Number(row.amount) || 0), 0
  );

  const daminStatusMap: Record<string, { l: string; t: "neutral" | "success" | "warning" | "danger" }> = {
    created: { l: "تم الإنشاء", t: "neutral" },
    pending_confirmations: { l: "بانتظار التأكيد", t: "warning" },
    both_confirmed: { l: "تم التأكيد", t: "neutral" },
    payment_submitted: { l: "بانتظار الدفع", t: "warning" },
    escrow_funded: { l: "تم التمويل", t: "success" },
    completed: { l: "مكتمل", t: "success" },
    cancelled: { l: "ملغي", t: "danger" },
    disputed: { l: "نزاع", t: "danger" },
  };

  return (
    <>
      <PageHeader
        title="نظرة عامة"
        subtitle="ملخص سريع لأهم مؤشرات الأداء في وسيط الآن."
      />

      {/* Urgent Actions */}
      {((daminDisputed.count ?? 0) > 0 ||
        (daminPaymentSubmitted.count ?? 0) > 0 ||
        (withdrawalsPending.count ?? 0) > 0 ||
        (chatsOpen.count ?? 0) > 0) && (
        <SectionCard title="يحتاج إجراء عاجل" description="عناصر تتطلب تدخلك الفوري.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(daminDisputed.count ?? 0) > 0 && (
              <Link
                href="/damin-orders?status=disputed"
                className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 transition hover:shadow-md"
              >
                <div>
                  <p className="text-sm font-semibold text-rose-700">نزاعات مفتوحة</p>
                  <p className="text-2xl font-bold text-rose-800">{daminDisputed.count}</p>
                </div>
                <span className="text-rose-400 text-2xl">!</span>
              </Link>
            )}
            {(daminPaymentSubmitted.count ?? 0) > 0 && (
              <Link
                href="/damin-orders?status=payment_submitted"
                className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4 transition hover:shadow-md"
              >
                <div>
                  <p className="text-sm font-semibold text-amber-700">بانتظار تحقق الدفع</p>
                  <p className="text-2xl font-bold text-amber-800">{daminPaymentSubmitted.count}</p>
                </div>
                <span className="text-amber-400 text-2xl">{formatNumber(pendingPaymentAmount)} ر.س</span>
              </Link>
            )}
            {(withdrawalsPending.count ?? 0) > 0 && (
              <Link
                href="/withdrawals?status=pending"
                className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4 transition hover:shadow-md"
              >
                <div>
                  <p className="text-sm font-semibold text-amber-700">طلبات سحب معلقة</p>
                  <p className="text-2xl font-bold text-amber-800">{withdrawalsPending.count}</p>
                </div>
                <span className="text-amber-400 text-sm">{formatNumber(pendingWithdrawalAmount)} ر.س</span>
              </Link>
            )}
            {(chatsOpen.count ?? 0) > 0 && (
              <Link
                href="/support-inbox"
                className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 p-4 transition hover:shadow-md"
              >
                <div>
                  <p className="text-sm font-semibold text-blue-700">محادثات دعم مفتوحة</p>
                  <p className="text-2xl font-bold text-blue-800">{chatsOpen.count}</p>
                </div>
                <span className="text-blue-400 text-2xl">&rarr;</span>
              </Link>
            )}
          </div>
        </SectionCard>
      )}

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="إجمالي المستخدمين"
          value={formatNumber(usersTotal.count ?? 0)}
          hint={`${formatNumber(usersActive.count ?? 0)} نشط · ${formatNumber(usersBanned.count ?? 0)} محظور`}
        />
        <StatCard
          label="الإعلانات"
          value={formatNumber(adsTotal.count ?? 0)}
          hint={`${formatNumber(adsActive.count ?? 0)} نشط · ${formatNumber(adsBlocked.count ?? 0)} محجوب`}
        />
        <StatCard
          label="إيرادات العمولات"
          value={`${formatNumber(totalRevenue)} ر.س`}
          hint={`من ${formatNumber(daminCompleted.count ?? 0)} طلب ضامن مكتمل`}
        />
        <StatCard
          label="المدفوعات الناجحة"
          value={formatNumber(paymentsSucceeded.count ?? 0)}
          hint={`من أصل ${formatNumber(paymentsTotal.count ?? 0)} عملية`}
        />
        <StatCard
          label="الطلبات"
          value={formatNumber(ordersTotal.count ?? 0)}
          hint={`${formatNumber(ordersPendingPayment.count ?? 0)} بانتظار الدفع`}
        />
        <StatCard
          label="طلبات الضامن"
          value={formatNumber((daminCreated.count ?? 0) + (daminPending.count ?? 0) + (daminCompleted.count ?? 0) + (daminPaymentSubmitted.count ?? 0) + (daminDisputed.count ?? 0))}
          hint={`${formatNumber(daminCompleted.count ?? 0)} مكتمل · ${formatNumber(daminPending.count ?? 0)} قيد التأكيد`}
        />
        <StatCard
          label="الإيصالات"
          value={formatNumber(receiptsTotal.count ?? 0)}
          hint="إيصالات المعاملات"
        />
        <StatCard
          label="محادثات مفتوحة"
          value={formatNumber(chatsOpen.count ?? 0)}
          hint="تحتاج متابعة"
        />
      </section>

      {/* Financial + Damin Pipeline */}
      <section className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="الملخص المالي" description="إيرادات العمولات والمبالغ المعلقة.">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-medium text-emerald-600">إيرادات العمولات</p>
              <p className="mt-1 text-xl font-bold text-emerald-800">
                {formatNumber(totalRevenue)} ر.س
              </p>
              <p className="mt-0.5 text-xs text-emerald-600">
                من {formatNumber(daminCompleted.count ?? 0)} طلب مكتمل
              </p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-medium text-amber-600">مبالغ بانتظار التحقق</p>
              <p className="mt-1 text-xl font-bold text-amber-800">
                {formatNumber(pendingPaymentAmount)} ر.س
              </p>
              <p className="mt-0.5 text-xs text-amber-600">
                {formatNumber(daminPaymentSubmitted.count ?? 0)} طلب بانتظار
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="مراحل طلبات الضامن" description="توزيع الطلبات حسب الحالة.">
          <div className="flex flex-wrap gap-2">
            <Badge label={`تم الإنشاء ${formatNumber(daminCreated.count ?? 0)}`} />
            <Badge label={`قيد التأكيد ${formatNumber(daminPending.count ?? 0)}`} tone="warning" />
            <Badge label={`بانتظار الدفع ${formatNumber(daminPaymentSubmitted.count ?? 0)}`} tone="warning" />
            <Badge label={`مكتملة ${formatNumber(daminCompleted.count ?? 0)}`} tone="success" />
            <Badge label={`نزاع ${formatNumber(daminDisputed.count ?? 0)}`} tone="danger" />
          </div>
        </SectionCard>
      </section>

      {/* Recent Activity */}
      <section className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="أحدث المستخدمين"
          description="آخر الحسابات المسجلة."
          actions={
            <Link href="/users" className="text-xs text-[var(--brand)] hover:underline">
              عرض الكل
            </Link>
          }
        >
          {(recentUsers.data ?? []).length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-slate-500">
              لا يوجد مستخدمون بعد.
            </div>
          ) : (
            <div className="space-y-2">
              {(recentUsers.data ?? []).map((user) => (
                <Link
                  key={user.user_id}
                  href={`/users/${user.user_id}`}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3 text-sm transition hover:border-[var(--brand)]/30 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                      {user.display_name?.charAt(0) ?? "?"}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{user.display_name}</p>
                      <p className="text-xs text-slate-400" dir="ltr">{user.phone ?? "—"}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <Badge
                      label={user.status === "banned" ? "محظور" : "نشط"}
                      tone={user.status === "banned" ? "danger" : "success"}
                    />
                    <p className="mt-1 text-xs text-slate-400">{formatDate(user.created_at)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="أحدث طلبات الضامن"
          description="آخر الطلبات المُنشأة."
          actions={
            <Link href="/damin-orders" className="text-xs text-[var(--brand)] hover:underline">
              عرض الكل
            </Link>
          }
        >
          {(recentDamin.data ?? []).length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-slate-500">
              لا توجد طلبات ضامن بعد.
            </div>
          ) : (
            <div className="space-y-2">
              {(recentDamin.data ?? []).map((order) => {
                const info = daminStatusMap[order.status] ?? { l: order.status, t: "neutral" as const };
                return (
                  <Link
                    key={order.id}
                    href={`/damin-orders/${order.id}`}
                    className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3 text-sm transition hover:border-[var(--brand)]/30 hover:shadow-sm"
                  >
                    <div>
                      <p className="font-medium text-slate-900 line-clamp-1">
                        {order.service_type_or_details ?? "طلب ضامن"}
                      </p>
                      <p className="text-xs text-slate-400">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-700">
                        {formatNumber(order.total_amount)} ر.س
                      </span>
                      <Badge label={info.l} tone={info.t} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </SectionCard>
      </section>
    </>
  );
}
