import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const auth = await requireRoleForApi(["super_admin", "admin", "support_agent"]);
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const ids = url.searchParams.get("ids")?.split(",").filter(Boolean) ?? [];

  if (ids.length === 0 || ids.length > 10) {
    return NextResponse.json(
      { error: "يرجى تحديد 1-10 معرفات" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServerClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("user_id, display_name, email, phone, role, status, created_at")
    .in("user_id", ids);

  return NextResponse.json({ users: users ?? [] });
}
