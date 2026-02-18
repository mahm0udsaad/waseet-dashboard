import { ActionButton } from "@/components/admin/ActionButton";
import { Badge } from "@/components/admin/Badge";
import { DataTable } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { PaginationControls } from "@/components/admin/PaginationControls";
import { SectionCard } from "@/components/admin/SectionCard";
import { formatDate } from "@/lib/format";
import { getPaginationRange, parsePageParam } from "@/lib/pagination";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const PAGE_SIZE = 20;

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function SupportAgentsPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);
  const { from, to } = getPaginationRange(page, PAGE_SIZE);
  const supabase = getSupabaseServerClient();
  const [{ data: agents }, { count }] = await Promise.all([
    supabase
      .from("profiles")
      .select("user_id, display_name, email, status, created_at, role")
      .eq("role", "support_agent")
      .order("created_at", { ascending: false })
      .range(from, to),
    supabase
      .from("profiles")
      .select("user_id", { count: "exact", head: true })
      .eq("role", "support_agent"),
  ]);

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
          description="الوكلاء الحاليون مع دعم التنقل بين الصفحات."
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
          <PaginationControls
            pathname="/support-agents"
            page={page}
            pageSize={PAGE_SIZE}
            totalItems={count ?? 0}
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
