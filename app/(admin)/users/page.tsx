import { Badge } from "@/components/admin/Badge";
import { BroadcastNotificationButton } from "@/components/admin/BroadcastNotificationButton";
import { DataTable } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { PaginationControls } from "@/components/admin/PaginationControls";
import { SearchFilter } from "@/components/admin/SearchFilter";
import { SectionCard } from "@/components/admin/SectionCard";
import { UserRowActions } from "@/components/admin/users/UserRowActions";
import { fillMissingUserContacts } from "@/lib/admin/user-contact";
import { requireRole } from "@/lib/auth/requireRole";
import { formatDate } from "@/lib/format";
import { getPaginationRange, parsePageParam } from "@/lib/pagination";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const PAGE_SIZE = 20;

const roleLabels: Record<string, string> = {
  super_admin: "مدير أعلى",
  admin: "مدير",
  finance: "مالية",
  support_agent: "وكيل دعم",
  viewer: "مشاهد",
  user: "مستخدم",
};

type Props = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
    role?: string;
  }>;
};

export default async function UsersPage({ searchParams }: Props) {
  const { role: currentAdminRole } = await requireRole([
    "super_admin",
    "admin",
    "support_agent",
  ]);
  const { page: pageParam, q, status, role } = await searchParams;
  const page = parsePageParam(pageParam);
  const { from, to } = getPaginationRange(page, PAGE_SIZE);
  const supabase = getSupabaseServerClient();
  const canManageUsers =
    currentAdminRole === "super_admin" || currentAdminRole === "admin";

  let query = supabase
    .from("profiles")
    .select("user_id, display_name, email, phone, role, status, created_at");

  let countQuery = supabase
    .from("profiles")
    .select("user_id", { count: "exact", head: true });

  if (q) {
    const filter = `display_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`;
    query = query.or(filter);
    countQuery = countQuery.or(filter);
  }
  if (status) {
    query = query.eq("status", status);
    countQuery = countQuery.eq("status", status);
  }
  if (role) {
    query = query.eq("role", role);
    countQuery = countQuery.eq("role", role);
  }

  const [{ data: users }, { count }] = await Promise.all([
    query.order("created_at", { ascending: false }).range(from, to),
    countQuery,
  ]);
  const hydratedUsers = await fillMissingUserContacts(users ?? []);

  const rows =
    hydratedUsers.map((user) => ({
      ...user,
      statusBadge: (
        <Badge
          label={user.status === "banned" ? "محظور" : "نشط"}
          tone={user.status === "banned" ? "danger" : "success"}
        />
      ),
      roleLabel: roleLabels[user.role] ?? user.role,
    })) ?? [];

  return (
    <>
      <PageHeader
        title="المستخدمون"
        subtitle="إدارة حسابات المستخدمين وحالة النشاط."
        actions={
          <div className="flex items-center gap-2">
            <BroadcastNotificationButton />
            <a
              href="/api/admin/export?entity=users&format=csv"
              className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-slate-700"
            >
              تصدير البيانات
            </a>
          </div>
        }
      />

      <div className="mb-4">
        <SearchFilter
          pathname="/users"
          currentQuery={{ q, status, role }}
          fields={[
            {
              key: "q",
              label: "بحث",
              type: "text",
              placeholder: "الاسم أو البريد الإلكتروني أو رقم الجوال",
            },
            {
              key: "status",
              label: "الحالة",
              type: "select",
              options: [
                { value: "active", label: "نشط" },
                { value: "banned", label: "محظور" },
                { value: "deleted", label: "محذوف" },
              ],
            },
            {
              key: "role",
              label: "الدور",
              type: "select",
              options: [
                { value: "user", label: "مستخدم" },
                { value: "super_admin", label: "مدير أعلى" },
                { value: "admin", label: "مدير" },
                { value: "finance", label: "مالية" },
                { value: "support_agent", label: "وكيل دعم" },
                { value: "viewer", label: "مشاهد" },
              ],
            },
          ]}
        />
      </div>

      <SectionCard
        title="قائمة المستخدمين"
        description="إدارة حسابات المستخدمين مع تنقل سريع بين الصفحات."
      >
        <DataTable
          columns={[
            { key: "display_name", label: "الاسم" },
            { key: "email", label: "البريد الإلكتروني" },
            {
              key: "phone",
              label: "رقم الجوال",
              render: (row) => (row.phone as string) ?? "—",
            },
            {
              key: "role",
              label: "الدور",
              render: (row) => row.roleLabel as string,
            },
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
                <UserRowActions
                  userId={row.user_id as string}
                  displayName={row.display_name as string}
                  status={row.status as string}
                  canManageUsers={canManageUsers}
                />
              ),
            },
          ]}
          getRowKey={(row) => row.user_id as string}
          rows={rows}
        />
        <PaginationControls
          pathname="/users"
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={count ?? 0}
          query={{ q, status, role }}
        />
      </SectionCard>
    </>
  );
}
