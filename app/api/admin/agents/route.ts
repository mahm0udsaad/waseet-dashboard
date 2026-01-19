import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { logAdminAction } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const auth = await requireRoleForApi(["admin"]);
  if ("error" in auth) return auth.error;
  const supabase = getSupabaseServerClient();

  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  if (!email || !password) {
    return NextResponse.json({ error: "البيانات غير مكتملة." }, { status: 400 });
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    return NextResponse.json({ error: error?.message ?? "فشل إنشاء الوكيل." }, { status: 400 });
  }

  await supabase.from("profiles").upsert({
    user_id: data.user.id,
    email,
    display_name: email.split("@")[0],
    role: "support_agent",
    status: "active",
  });

  await logAdminAction({
    actorId: auth.userId,
    action: "create_support_agent",
    entity: "profiles",
    entityId: data.user.id,
    metadata: { email },
  });

  return NextResponse.redirect(request.headers.get("referer") ?? "/support-agents");
}
