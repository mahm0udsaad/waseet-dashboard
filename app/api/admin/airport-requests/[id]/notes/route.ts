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

  const body = (await request.json().catch(() => null)) as
    | { notes?: string }
    | null;
  const notes = typeof body?.notes === "string" ? body.notes : "";

  const supabase = getSupabaseServerClient();

  await supabase
    .from("airport_inspection_requests")
    .update({ admin_notes: notes, updated_at: new Date().toISOString() })
    .eq("id", id);

  await logAdminAction({
    actorId: auth.userId,
    action: "update_airport_request_notes",
    entity: "airport_inspection_requests",
    entityId: id,
  });

  return NextResponse.json({ success: true });
}
