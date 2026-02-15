import { Badge } from "@/components/admin/Badge";
import { DataTable } from "@/components/admin/DataTable";
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
    chatsClosed,
    daminCreated,
    daminPending,
    daminCompleted,
    daminPaymentSubmitted,
    daminDisputed,
    daminCompletedCommissions,
    daminPendingAmounts,
    recentUsers,
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
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("status", "closed"),
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
    supabase
      .from("damin_orders")
      .select("commission")
      .eq("status", "completed"),
    supabase
      .from("damin_orders")
      .select("total_amount")
      .eq("status", "payment_submitted"),
    supabase
      .from("profiles")
      .select("user_id, display_name, email, role, status, created_at")
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

  const kpis = [
    {
      label: "إجمالي المستخدمين",
      value: formatNumber(usersTotal.count ?? 0),
      hint: "كل الحسابات",
    },
    {
      label: "مستخدمون نشطون",
      value: formatNumber(usersActive.count ?? 0),
      hint: "الحسابات النشطة",
    },
    {
      label: "مستخدمون محظورون",
      value: formatNumber(usersBanned.count ?? 0),
      hint: "حسابات موقوفة",
    },
    {
      label: "إعلانات نشطة",
      value: formatNumber(adsActive.count ?? 0),
      hint: "من أصل " + formatNumber(adsTotal.count ?? 0),
    },
    {
      label: "إعلانات محجوبة",
      value: formatNumber(adsBlocked.count ?? 0),
      hint: "تحتاج مراجعة",
    },
    {
      label: "محادثات مفتوحة",
      value: formatNumber(chatsOpen.count ?? 0),
      hint: "صندوق الدعم",
    },
    {
      label: "محادثات مغلقة",
      value: formatNumber(chatsClosed.count ?? 0),
      hint: "مُنجزة",
    },
    {
      label: "طلبات الضامن",
      value: formatNumber(daminCreated.count ?? 0),
      hint: "تم إنشاؤها",
    },
  ];

  const userRows =
    recentUsers.data?.map((user) => ({
      ...user,
      statusBadge: (
        <Badge
          label={user.status === "banned" ? "محظور" : "نشط"}
          tone={user.status === "banned" ? "danger" : "success"}
        />
      ),
    })) ?? [];

  return (
    <>
      <PageHeader
        title="نظرة عامة"
        subtitle="ملخص سريع لأهم مؤشرات الأداء في وسيط الآن."
      />
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((item) => (
          <StatCard
            key={item.label}
            label={item.label}
            value={item.value}
            hint={item.hint}
          />
        ))}
      </section>

      {/* Damin Financial Summary */}
      <SectionCard
        title="ملخص الضامن المالي"
        description="إيرادات العمولات والمبالغ المعلقة."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[var(--border)] p-3">
            <p className="text-xs text-slate-500">إيرادات العمولات</p>
            <p className="mt-1 text-lg font-semibold text-emerald-700">
              {formatNumber(totalRevenue)} ر.س
            </p>
            <p className="text-xs text-slate-400">من {formatNumber(daminCompleted.count ?? 0)} طلب مكتمل</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] p-3">
            <p className="text-xs text-slate-500">مبالغ بانتظار التحقق</p>
            <p className="mt-1 text-lg font-semibold text-amber-600">
              {formatNumber(pendingPaymentAmount)} ر.س
            </p>
            <p className="text-xs text-slate-400">{formatNumber(daminPaymentSubmitted.count ?? 0)} طلب بانتظار المراجعة</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] p-3">
            <p className="text-xs text-slate-500">قيد التأكيد</p>
            <p className="mt-1 text-lg font-semibold text-slate-700">
              {formatNumber(daminPending.count ?? 0)}
            </p>
            <p className="text-xs text-slate-400">بانتظار تأكيد الأطراف</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] p-3">
            <p className="text-xs text-slate-500">نزاعات مفتوحة</p>
            <p className="mt-1 text-lg font-semibold text-rose-600">
              {formatNumber(daminDisputed.count ?? 0)}
            </p>
            <p className="text-xs text-slate-400">تحتاج تدخل الإدارة</p>
          </div>
        </div>
      </SectionCard>

      <section className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="طلبات الضامن"
          description="متابعة مراحل الطلبات الحالية."
        >
          <div className="flex flex-wrap gap-3 text-sm">
            <Badge label={`تم الإنشاء ${formatNumber(daminCreated.count ?? 0)}`} />
            <Badge
              label={`قيد التأكيد ${formatNumber(daminPending.count ?? 0)}`}
              tone="warning"
            />
            <Badge
              label={`بانتظار الدفع ${formatNumber(daminPaymentSubmitted.count ?? 0)}`}
              tone="warning"
            />
            <Badge
              label={`مكتملة ${formatNumber(daminCompleted.count ?? 0)}`}
              tone="success"
            />
            <Badge
              label={`نزاع ${formatNumber(daminDisputed.count ?? 0)}`}
              tone="danger"
            />
          </div>
        </SectionCard>
        <SectionCard
          title="صندوق الدعم"
          description="المحادثات المفتوحة التي تحتاج متابعة."
        >
          <div className="text-sm text-slate-600">
            توجد {formatNumber(chatsOpen.count ?? 0)} محادثة مفتوحة حالياً.
          </div>
        </SectionCard>
      </section>
      <SectionCard
        title="أحدث المستخدمين"
        description="آخر الحسابات التي تم إنشاؤها."
      >
        <DataTable
          columns={[
            { key: "display_name", label: "الاسم" },
            { key: "email", label: "البريد الإلكتروني" },
            { key: "role", label: "الدور" },
            {
              key: "status",
              label: "الحالة",
              render: (row) => row.statusBadge,
            },
            {
              key: "created_at",
              label: "تاريخ الإنشاء",
              render: (row) => formatDate(row.created_at as string),
            },
          ]}
          getRowKey={(row) => row.user_id as string}
          rows={userRows}
        />
      </SectionCard>
    </>
  );
}
