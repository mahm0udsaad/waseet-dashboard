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
      .from("profiles")
      .select("user_id, display_name, email, role, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

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
              label={`مكتملة ${formatNumber(daminCompleted.count ?? 0)}`}
              tone="success"
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
