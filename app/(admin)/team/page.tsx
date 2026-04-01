import { PageHeader } from "@/components/admin/PageHeader";
import { TeamManager } from "@/components/admin/team/TeamManager";
import { requireRole } from "@/lib/auth/requireRole";
import { ADMIN_ROLES } from "@/lib/auth/permissions";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function TeamPage() {
  const { userId, role } = await requireRole(["super_admin", "admin"]);

  const supabase = getSupabaseServerClient();
  const { data: members } = await supabase
    .from("profiles")
    .select("user_id, display_name, phone, avatar_url, role, status, created_at")
    .in("role", ADMIN_ROLES as unknown as string[])
    .order("created_at", { ascending: true });

  return (
    <>
      <PageHeader
        title="إدارة الفريق"
        subtitle="إضافة وتعديل وإزالة أعضاء فريق الإدارة وصلاحياتهم."
      />
      <TeamManager
        initialMembers={members ?? []}
        currentUserId={userId}
        currentUserRole={role}
      />
    </>
  );
}
