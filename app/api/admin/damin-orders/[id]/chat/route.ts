import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireRoleForApi(["super_admin", "admin", "support_agent"], request);
  if ("error" in auth) return auth.error;
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase.rpc("admin_get_dispute_chat", {
    p_order_id: id,
  });

  if (error) {
    const isNotFound = error.message?.includes("not found");
    return NextResponse.json(
      { error: isNotFound ? "الطلب غير موجود" : error.message },
      { status: isNotFound ? 404 : 400 }
    );
  }

  return NextResponse.json(data);
}
