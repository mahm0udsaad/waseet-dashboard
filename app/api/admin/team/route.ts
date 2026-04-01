import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ADMIN_ROLES, type AdminRole } from "@/lib/auth/permissions";
import { logAdminAction } from "@/lib/supabase/admin";


// GET — list all team members (users with admin roles)
export async function GET() {
  const auth = await requireRoleForApi(["super_admin", "admin"]);
  if ("error" in auth) return auth.error;

  const supabase = getSupabaseServerClient();
  const { data: members, error } = await supabase
    .from("profiles")
    .select("user_id, display_name, phone, avatar_url, role, status, created_at")
    .in("role", ADMIN_ROLES as unknown as string[])
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ members: members ?? [] });
}

// POST — assign role to a user (promote to admin)
export async function POST(request: Request) {
  const auth = await requireRoleForApi(["super_admin", "admin"]);
  if ("error" in auth) return auth.error;

  const { userId, role } = await request.json();

  if (!userId || !role) {
    return NextResponse.json(
      { error: "معرف المستخدم والدور مطلوبان" },
      { status: 400 }
    );
  }

  if (!ADMIN_ROLES.includes(role as AdminRole)) {
    return NextResponse.json(
      { error: "دور غير صالح" },
      { status: 400 }
    );
  }

  // Only super_admin can assign super_admin role
  if (role === "super_admin" && auth.role !== "super_admin") {
    return NextResponse.json(
      { error: "فقط المدير الأعلى يمكنه تعيين مدير أعلى آخر" },
      { status: 403 }
    );
  }

  const supabase = getSupabaseServerClient();

  // Verify user exists
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, display_name, role")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json(
      { error: "المستخدم غير موجود" },
      { status: 404 }
    );
  }

  // Prevent non-super_admin from modifying super_admin users
  if (profile.role === "super_admin" && auth.role !== "super_admin") {
    return NextResponse.json(
      { error: "لا يمكنك تعديل صلاحيات المدير الأعلى" },
      { status: 403 }
    );
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAdminAction({
    actorId: auth.userId,
    action: "update_role",
    entity: "user",
    entityId: userId,
    metadata: { newRole: role, previousRole: profile.role },
  });

  return NextResponse.json({ success: true });
}

// PATCH — remove admin role (demote to user)
export async function PATCH(request: Request) {
  const auth = await requireRoleForApi(["super_admin", "admin"]);
  if ("error" in auth) return auth.error;

  const { userId } = await request.json();

  if (!userId) {
    return NextResponse.json(
      { error: "معرف المستخدم مطلوب" },
      { status: 400 }
    );
  }

  // Cannot demote yourself
  if (userId === auth.userId) {
    return NextResponse.json(
      { error: "لا يمكنك إزالة صلاحياتك الخاصة" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, role")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json(
      { error: "المستخدم غير موجود" },
      { status: 404 }
    );
  }

  // Only super_admin can demote super_admin
  if (profile.role === "super_admin" && auth.role !== "super_admin") {
    return NextResponse.json(
      { error: "لا يمكنك إزالة صلاحيات المدير الأعلى" },
      { status: 403 }
    );
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role: "user" })
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAdminAction({
    actorId: auth.userId,
    action: "remove_role",
    entity: "user",
    entityId: userId,
    metadata: { previousRole: profile.role },
  });

  return NextResponse.json({ success: true });
}
