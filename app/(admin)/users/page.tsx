import { ActionButton } from "@/components/admin/ActionButton";
import { Badge } from "@/components/admin/Badge";
import { DataTable } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { SectionCard } from "@/components/admin/SectionCard";
import { formatDate } from "@/lib/format";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function UsersPage() {
  const supabase = getSupabaseServerClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("user_id, display_name, email, role, status, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  const rows =
    users?.map((user) => ({
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
        title="المستخدمون"
        subtitle="إدارة حسابات المستخدمين وحالة النشاط."
        actions={
          <div className="flex flex-wrap gap-2 text-sm">
            <ActionButton label="تصدير البيانات" />
            <ActionButton label="فلترة متقدمة" variant="primary" />
          </div>
        }
      />
      <SectionCard
        title="قائمة المستخدمين"
        description="عرض آخر 20 حساباً مع إمكانية اتخاذ الإجراءات."
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
            {
              key: "actions",
              label: "إجراءات",
              render: (row) => (
                <div className="flex flex-wrap gap-2">
                  <form action={`/api/admin/users/${row.user_id}/ban`} method="post">
                    <ActionButton label="حظر" variant="danger" />
                  </form>
                  <form
                    action={`/api/admin/users/${row.user_id}/unban`}
                    method="post"
                  >
                    <ActionButton label="إلغاء الحظر" />
                  </form>
                  <form
                    action={`/api/admin/users/${row.user_id}/delete`}
                    method="post"
                  >
                    <ActionButton label="حذف" variant="danger" />
                  </form>
                </div>
              ),
            },
          ]}
          getRowKey={(row) => row.user_id as string}
          rows={rows}
        />
      </SectionCard>
    </>
  );
}
