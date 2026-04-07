import { NextResponse } from "next/server";
import { getSupabaseAuthServerClient } from "@/lib/supabase/ssr";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminRole } from "./permissions";
import { ADMIN_ROLES } from "./permissions";

export type { AdminRole };

export async function requireRoleForApi(allowed: AdminRole[], _request: Request) {
  const supabase = await getSupabaseAuthServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return { error: NextResponse.json({ error: "غير مصرح" }, { status: 401 }) };
  }

  const adminClient = getSupabaseServerClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  const role = (profile?.role ?? "user") as string;

  if (!ADMIN_ROLES.includes(role as AdminRole)) {
    return { error: NextResponse.json({ error: "غير مصرح — ليس لديك صلاحية" }, { status: 403 }) };
  }

  if (!allowed.includes(role as AdminRole)) {
    return { error: NextResponse.json({ error: "غير مصرح — صلاحيات غير كافية" }, { status: 403 }) };
  }

  return { userId: userData.user.id, role: role as AdminRole };
}
