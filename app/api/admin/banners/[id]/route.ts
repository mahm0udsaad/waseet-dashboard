import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { logAdminAction } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireRoleForApi(["super_admin", "admin"]);
  if ("error" in auth) return auth.error;
  const supabase = getSupabaseServerClient();

  const payload = await request.json();
  const { error } = await supabase
    .from("home_sliders")
    .update(payload)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logAdminAction({
    actorId: auth.userId,
    action: "update_banner",
    entity: "home_sliders",
    entityId: id,
    metadata: payload,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireRoleForApi(["super_admin", "admin"]);
  if ("error" in auth) return auth.error;
  const supabase = getSupabaseServerClient();

  const { error } = await supabase
    .from("home_sliders")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logAdminAction({
    actorId: auth.userId,
    action: "delete_banner",
    entity: "home_sliders",
    entityId: id,
  });

  return NextResponse.json({ success: true });
}
