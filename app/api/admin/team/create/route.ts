import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ADMIN_ROLES, type AdminRole } from "@/lib/auth/permissions";
import { logAdminAction } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const auth = await requireRoleForApi(["super_admin", "admin"], request);
  if ("error" in auth) return auth.error;

  const { email, password, displayName, role } = await request.json();

  if (!email || !password || !displayName || !role) {
    return NextResponse.json(
      { error: "جميع الحقول مطلوبة" },
      { status: 400 }
    );
  }

  if (!ADMIN_ROLES.includes(role as AdminRole)) {
    return NextResponse.json({ error: "دور غير صالح" }, { status: 400 });
  }

  // Only super_admin can create super_admin users
  if (role === "super_admin" && auth.role !== "super_admin") {
    return NextResponse.json(
      { error: "فقط المدير الأعلى يمكنه إنشاء مدير أعلى آخر" },
      { status: 403 }
    );
  }

  const supabase = getSupabaseServerClient();

  // Create auth user via admin API
  const { data: newUser, error: createError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (createError || !newUser.user) {
    const msg = createError?.message ?? "فشل إنشاء المستخدم";
    const status = msg.includes("already") ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }

  // Create profile with the admin role
  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      user_id: newUser.user.id,
      display_name: displayName,
      email,
      role,
      status: "active",
    },
    { onConflict: "user_id" }
  );

  if (profileError) {
    // Rollback: delete the auth user if profile creation fails
    await supabase.auth.admin.deleteUser(newUser.user.id);
    return NextResponse.json(
      { error: profileError.message },
      { status: 500 }
    );
  }

  await logAdminAction({
    actorId: auth.userId,
    action: "create_team_member",
    entity: "user",
    entityId: newUser.user.id,
    metadata: { email, displayName, role },
  });

  return NextResponse.json({
    success: true,
    user: {
      id: newUser.user.id,
      email,
      displayName,
      role,
    },
  });
}
