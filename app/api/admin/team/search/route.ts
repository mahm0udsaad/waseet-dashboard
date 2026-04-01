import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// GET — search users by name/phone to add to team
export async function GET(request: Request) {
  const auth = await requireRoleForApi(["super_admin", "admin"]);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  const supabase = getSupabaseServerClient();
  const filter = `display_name.ilike.%${q}%,phone.ilike.%${q}%`;

  const { data: users, error } = await supabase
    .from("profiles")
    .select("user_id, display_name, phone, avatar_url, role")
    .or(filter)
    .eq("role", "user")
    .limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users: users ?? [] });
}
