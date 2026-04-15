import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { logAdminAction } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireRoleForApi(["super_admin", "admin"], request);
  if ("error" in auth) return auth.error;
  const supabase = getSupabaseServerClient();

  await supabase
    .from("airport_inspection_requests")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", id);

  await logAdminAction({
    actorId: auth.userId,
    action: "cancel_airport_request",
    entity: "airport_inspection_requests",
    entityId: id,
  });

  if (request.headers.get("accept")?.includes("application/json")) {
    return NextResponse.json({ success: true });
  }
  return NextResponse.redirect(
    request.headers.get("referer") ?? `/airport-requests/${id}`
  );
}
