import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CircleDollarSign,
  MessageSquareText,
  ReceiptText,
  ShieldAlert,
  Users,
  Wallet,
} from "lucide-react";
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
    supabase
      .from("profiles")
      .select("user_id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("profiles")
      .select("user_id", { count: "exact", head: true })
      .eq("status", "banned"),
    supabase.from("ads").select("id", { count: "exact", head: true }),
    supabase
      .from("ads")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("ads")
      .select("id", { count: "exact", head: true })
      .eq("status", "blocked"),
    supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("damin_orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "created"),
    supabase
      .from("damin_orders")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending_confirmations", "both_confirmed"]),
    supabase
      .from("damin_orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed"),
    supabase
      .from("damin_orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "payment_submitted"),
    supabase
      .from("damin_orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "disputed"),
    supabase.from("damin_orders").select("commission").eq("status", "completed"),
    supabase
      .from("damin_orders")
      .select("total_amount")
      .eq("status", "payment_submitted"),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "awaiting_payment"),
    supabase.from("receipts").select("id", { count: "exact", head: true }),
    supabase.from("payments").select("id", { count: "exact", head: true }),
    supabase
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("status", "succeeded"),
    supabase
      .from("withdrawal_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("withdrawal_requests").select("amount").eq("status", "pending"),
    supabase
      .from("profiles")
      .select("user_id, display_name, phone, role, status, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("damin_orders")
      .select("id, service_type_or_details, total_amount, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const totalRevenue = (daminCompletedCommissions.data ?? []).reduce(
    (sum, row) => sum + (Number(row.commission) || 0),
    0
  );
  const pendingPaymentAmount = (daminPendingAmounts.data ?? []).reduce(
    (sum, row) => sum + (Number(row.total_amount) || 0),
    0
  );
  const pendingWithdrawalAmount = (withdrawalsPendingAmounts.data ?? []).reduce(
    (sum, row) => sum + (Number(row.amount) || 0),
    0
  );

  const totalDaminOrders =
    (daminCreated.count ?? 0) +
    (daminPending.count ?? 0) +
    (daminCompleted.count ?? 0) +
    (daminPaymentSubmitted.count ?? 0) +
    (daminDisputed.count ?? 0);

  const totalUrgentItems =
    (daminDisputed.count ?? 0) +
    (daminPaymentSubmitted.count ?? 0) +
    (withdrawalsPending.count ?? 0) +
    (chatsOpen.count ?? 0);

  const daminStatusMap: Record<
    string,
    { label: string; tone: "neutral" | "success" | "warning" | "danger" }
  > = {
    created: { label: "تم الإنشاء", tone: "neutral" },
    pending_confirmations: { label: "بانتظار التأكيد", tone: "warning" },
    both_confirmed: { label: "تم التأكيد", tone: "neutral" },
    payment_submitted: { label: "بانتظار الدفع", tone: "warning" },
    escrow_funded: { label: "تم التمويل", tone: "success" },
    completed: { label: "مكتمل", tone: "success" },
    cancelled: { label: "ملغي", tone: "danger" },
    disputed: { label: "نزاع", tone: "danger" },
  };

  const urgentActions = [
    (daminDisputed.count ?? 0) > 0
      ? {
          href: "/damin-orders?status=disputed",
          label: "نزاعات مفتوحة",
          value: formatNumber(daminDisputed.count ?? 0),
          helper: "تحتاج قرارًا إداريًا مباشرًا",
          icon: ShieldAlert,
          tone:
            "border-rose-200 bg-[var(--danger-soft)] text-[var(--danger)]",
        }
      : null,
    (daminPaymentSubmitted.count ?? 0) > 0
      ? {
          href: "/damin-orders?status=payment_submitted",
          label: "مدفوعات بانتظار التحقق",
          value: `${formatNumber(pendingPaymentAmount)} ر.س`,
          helper: `${formatNumber(daminPaymentSubmitted.count ?? 0)} طلب`,
          icon: Wallet,
          tone:
            "border-amber-200 bg-[var(--warning-soft)] text-[var(--warning)]",
        }
      : null,
    (withdrawalsPending.count ?? 0) > 0
      ? {
          href: "/withdrawals?status=pending",
          label: "طلبات سحب معلقة",
          value: `${formatNumber(pendingWithdrawalAmount)} ر.س`,
          helper: `${formatNumber(withdrawalsPending.count ?? 0)} طلب`,
          icon: CircleDollarSign,
          tone:
            "border-amber-200 bg-[var(--warning-soft)] text-[var(--warning)]",
        }
      : null,
    (chatsOpen.count ?? 0) > 0
      ? {
          href: "/support-inbox",
          label: "محادثات دعم مفتوحة",
          value: formatNumber(chatsOpen.count ?? 0),
          helper: "رسائل بانتظار الرد",
          icon: MessageSquareText,
          tone: "border-blue-200 bg-[var(--info-soft)] text-[var(--info)]",
        }
      : null,
  ].filter(Boolean) as Array<{
    href: string;
    label: string;
    value: string;
    helper: string;
    icon: typeof ShieldAlert;
    tone: string;
  }>;

  const pipelineItems = [
    {
      label: "تم الإنشاء",
      value: formatNumber(daminCreated.count ?? 0),
      tone: "neutral" as const,
    },
    {
      label: "قيد التأكيد",
      value: formatNumber(daminPending.count ?? 0),
      tone: "warning" as const,
    },
    {
      label: "بانتظار الدفع",
      value: formatNumber(daminPaymentSubmitted.count ?? 0),
      tone: "warning" as const,
    },
    {
      label: "مكتملة",
      value: formatNumber(daminCompleted.count ?? 0),
      tone: "success" as const,
    },
    {
      label: "نزاعات",
      value: formatNumber(daminDisputed.count ?? 0),
      tone: "danger" as const,
    },
  ];

  return (
    <>
      <PageHeader
        title="نظرة عامة"
        subtitle="واجهة قيادة مركزة لأكثر ما يحتاج متابعة اليوم: التنبيهات، المؤشرات، وآخر الحركة على المنصة."
      />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)]">
        <div className="admin-panel relative overflow-hidden rounded-[32px] p-6 sm:p-7">
          <div className="absolute left-0 top-0 h-40 w-40 rounded-full bg-rose-100 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-slate-100 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
              <AlertTriangle className="h-3.5 w-3.5" />
              مركز القرار اليوم
            </div>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-slate-950">
              {totalUrgentItems > 0
                ? `${formatNumber(totalUrgentItems)} عناصر تتطلب متابعة مباشرة`
                : "لا توجد عناصر عاجلة حالياً"}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
              هذا الملخص يرفع أهم الإشارات إلى الأعلى حتى لا تضيع وسط كثافة البيانات:
              النزاعات، المدفوعات المعلقة، طلبات السحب، ورسائل الدعم المفتوحة.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[24px] border border-white/80 bg-white/80 p-4">
                <p className="text-xs font-medium text-[var(--text-subtle)]">
                  إيرادات العمولات
                </p>
                <p className="mt-3 text-2xl font-semibold text-slate-950">
                  {formatNumber(totalRevenue)} ر.س
                </p>
                <p className="mt-1 text-xs text-[var(--text-subtle)]">
                  من {formatNumber(daminCompleted.count ?? 0)} طلب مكتمل
                </p>
              </div>

              <div className="rounded-[24px] border border-white/80 bg-white/80 p-4">
                <p className="text-xs font-medium text-[var(--text-subtle)]">
                  طلبات الضامن
                </p>
                <p className="mt-3 text-2xl font-semibold text-slate-950">
                  {formatNumber(totalDaminOrders)}
                </p>
                <p className="mt-1 text-xs text-[var(--text-subtle)]">
                  {formatNumber(daminPending.count ?? 0)} قيد التأكيد الآن
                </p>
              </div>

              <div className="rounded-[24px] border border-white/80 bg-white/80 p-4">
                <p className="text-xs font-medium text-[var(--text-subtle)]">
                  المدفوعات الناجحة
                </p>
                <p className="mt-3 text-2xl font-semibold text-slate-950">
                  {formatNumber(paymentsSucceeded.count ?? 0)}
                </p>
                <p className="mt-1 text-xs text-[var(--text-subtle)]">
                  من أصل {formatNumber(paymentsTotal.count ?? 0)} عملية
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-700">
                {formatNumber(usersActive.count ?? 0)} مستخدم نشط
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-700">
                {formatNumber(adsActive.count ?? 0)} إعلان نشط
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-700">
                {formatNumber(receiptsTotal.count ?? 0)} إيصال
              </span>
            </div>
          </div>
        </div>

        <div className="admin-panel rounded-[32px] p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-subtle)]">
                اختصارات تشغيلية
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">
                أسرع طريق لما يحتاج تصرّف
              </h2>
            </div>
            <ArrowLeft className="h-4 w-4 text-slate-400" />
          </div>

          <div className="mt-5 space-y-3">
            {urgentActions.length > 0 ? (
              urgentActions.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between gap-3 rounded-[24px] border p-4 transition hover:-translate-y-0.5 hover:shadow-sm ${item.tone}`}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/70">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-950">
                          {item.label}
                        </p>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                          {item.helper}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold">{item.value}</span>
                  </Link>
                );
              })
            ) : (
              <div className="rounded-[24px] border border-dashed border-emerald-200 bg-emerald-50 p-6 text-center">
                <p className="text-sm font-semibold text-emerald-700">
                  لا توجد مهام عاجلة الآن
                </p>
                <p className="mt-1 text-xs text-emerald-600">
                  يمكنك التركيز على المتابعة الدورية وتحسين الأداء.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
          label="الطلبات"
          value={formatNumber(ordersTotal.count ?? 0)}
          hint={`${formatNumber(ordersPendingPayment.count ?? 0)} بانتظار الدفع`}
          tone="warning"
        />
        <StatCard
          label="المحادثات المفتوحة"
          value={formatNumber(chatsOpen.count ?? 0)}
          hint="تحتاج متابعة من فريق الدعم"
          tone={chatsOpen.count ? "warning" : "neutral"}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <SectionCard
          title="صحة التدفق المالي"
          description="عرض سريع للمبالغ المحققة والمعلّقة حتى تبقى حالة التحصيل واضحة من أول نظرة."
        >
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-medium text-emerald-700">
                إيرادات العمولات
              </p>
              <p className="mt-3 text-2xl font-semibold text-emerald-900">
                {formatNumber(totalRevenue)} ر.س
              </p>
              <p className="mt-1 text-xs text-emerald-700">
                متولدة من الطلبات المكتملة
              </p>
            </div>

            <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-medium text-amber-700">
                مبالغ بانتظار التحقق
              </p>
              <p className="mt-3 text-2xl font-semibold text-amber-900">
                {formatNumber(pendingPaymentAmount)} ر.س
              </p>
              <p className="mt-1 text-xs text-amber-700">
                مرتبطة بطلبات ضامن لم تُعتمد بعد
              </p>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-600">
                طلبات سحب معلقة
              </p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">
                {formatNumber(pendingWithdrawalAmount)} ر.س
              </p>
              <p className="mt-1 text-xs text-slate-600">
                {formatNumber(withdrawalsPending.count ?? 0)} طلب يحتاج قرارًا
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="مراحل طلبات الضامن"
          description="توزيع الحالات الرئيسية حتى يظهر موضع التكدّس سريعًا."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {pipelineItems.map((item) => (
              <div
                key={item.label}
                className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4"
              >
                <Badge label={item.label} tone={item.tone} />
                <p className="mt-4 text-2xl font-semibold text-slate-950">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <SectionCard
          title="أحدث المستخدمين"
          description="آخر الحسابات المسجلة مع الحالة الحالية لكل حساب."
          actions={
            <Link
              href="/users"
              className="rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
            >
              عرض الكل
            </Link>
          }
        >
          {(recentUsers.data ?? []).length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[var(--border)] bg-white p-8 text-center text-sm text-[var(--text-muted)]">
              لا يوجد مستخدمون بعد.
            </div>
          ) : (
            <div className="space-y-3">
              {(recentUsers.data ?? []).map((user) => (
                <Link
                  key={user.user_id}
                  href={`/users/${user.user_id}`}
                  className="flex items-center justify-between gap-4 rounded-[24px] border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-sm"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-600">
                      {user.display_name?.charAt(0) ?? "؟"}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-950">
                        {user.display_name ?? "مستخدم جديد"}
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-subtle)]" dir="ltr">
                        {user.phone ?? "—"}
                      </p>
                    </div>
                  </div>

                  <div className="text-left">
                    <Badge
                      label={user.status === "banned" ? "محظور" : "نشط"}
                      tone={user.status === "banned" ? "danger" : "success"}
                    />
                    <p className="mt-2 text-xs text-[var(--text-subtle)]">
                      {formatDate(user.created_at)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="أحدث طلبات الضامن"
          description="آخر ما دخل إلى النظام مع قيمة الطلب وحالته الحالية."
          actions={
            <Link
              href="/damin-orders"
              className="rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
            >
              عرض الكل
            </Link>
          }
        >
          {(recentDamin.data ?? []).length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[var(--border)] bg-white p-8 text-center text-sm text-[var(--text-muted)]">
              لا توجد طلبات ضامن بعد.
            </div>
          ) : (
            <div className="space-y-3">
              {(recentDamin.data ?? []).map((order) => {
                const info = daminStatusMap[order.status] ?? {
                  label: order.status,
                  tone: "neutral" as const,
                };

                return (
                  <Link
                    key={order.id}
                    href={`/damin-orders/${order.id}`}
                    className="flex items-center justify-between gap-4 rounded-[24px] border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-sm"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                          <ReceiptText className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="line-clamp-1 font-semibold text-slate-950">
                            {order.service_type_or_details ?? "طلب ضامن"}
                          </p>
                          <p className="mt-1 text-xs text-[var(--text-subtle)]">
                            {formatDate(order.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-950">
                        {formatNumber(order.total_amount)} ر.س
                      </p>
                      <div className="mt-2">
                        <Badge label={info.label} tone={info.tone} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </SectionCard>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="admin-panel rounded-[28px] p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
              <Users className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-950">المستخدمون</p>
              <p className="text-xs text-[var(--text-subtle)]">
                {formatNumber(usersActive.count ?? 0)} نشطون الآن
              </p>
            </div>
          </div>
        </div>

        <div className="admin-panel rounded-[28px] p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
              <Wallet className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-950">الدفع والتحصيل</p>
              <p className="text-xs text-[var(--text-subtle)]">
                {formatNumber(daminPaymentSubmitted.count ?? 0)} طلبات ضامن بانتظار التحقق
              </p>
            </div>
          </div>
        </div>

        <div className="admin-panel rounded-[28px] p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
              <CircleDollarSign className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-950">المعاملات المالية</p>
              <p className="text-xs text-[var(--text-subtle)]">
                {formatNumber(paymentsTotal.count ?? 0)} عملية دفع و{formatNumber(receiptsTotal.count ?? 0)} إيصال
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
