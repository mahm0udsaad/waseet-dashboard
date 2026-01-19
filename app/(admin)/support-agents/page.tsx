import { ActionButton } from "@/components/admin/ActionButton";
import { Badge } from "@/components/admin/Badge";
import { DataTable } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { SectionCard } from "@/components/admin/SectionCard";
import { formatDate } from "@/lib/format";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function SupportAgentsPage() {
  const supabase = getSupabaseServerClient();
  const { data: agents } = await supabase
    .from("profiles")
    .select("user_id, display_name, email, status, created_at, role")
    .eq("role", "support_agent")
    .order("created_at", { ascending: false });

  const rows =
    agents?.map((agent) => ({
      ...agent,
      statusBadge: (
        <Badge
          label={agent.status === "banned" ? "مُعطّل" : "نشط"}
          tone={agent.status === "banned" ? "warning" : "success"}
        />
      ),
    })) ?? [];

  return (
    <>
      <PageHeader
        title="وكلاء الدعم"
        subtitle="إدارة حسابات وكلاء الدعم وإعادة تعيين كلمات المرور."
      />
      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <SectionCard
          title="قائمة الوكلاء"
          description="الوكلاء الحاليون مع حالاتهم."
        >
          <DataTable
            columns={[
              { key: "display_name", label: "الاسم" },
              { key: "email", label: "البريد الإلكتروني" },
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
              {
                key: "actions",
                label: "إجراءات",
                render: (row) => (
                  <form
                    action={`/api/admin/users/${row.user_id}/ban`}
                    method="post"
                  >
                    <ActionButton label="تعطيل" variant="danger" />
                  </form>
                ),
              },
            ]}
            getRowKey={(row) => row.user_id as string}
            rows={rows}
          />
        </SectionCard>
        <SectionCard
          title="إضافة وكيل"
          description="إنشاء حساب لوكيل دعم جديد."
        >
          <form action="/api/admin/agents" method="post" className="space-y-3">
            <input
              name="email"
              type="email"
              required
              placeholder="البريد الإلكتروني"
              className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
            />
            <input
              name="password"
              type="password"
              required
              placeholder="كلمة المرور المؤقتة"
              className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
            />
            <ActionButton label="إنشاء الوكيل" variant="primary" />
          </form>
        </SectionCard>
      </section>
    </>
  );
}
