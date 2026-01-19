import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { logAdminAction } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireRoleForApi(["admin"]);
  if ("error" in auth) return auth.error;
  const supabase = getSupabaseServerClient();

  await supabase
    .from("ads")
    .update({ status: "removed" })
    .eq("id", id);

  await logAdminAction({
    actorId: auth.userId,
    action: "delete_ad",
    entity: "ads",
    entityId: id,
  });

  return NextResponse.redirect(request.headers.get("referer") ?? "/ads");
}
