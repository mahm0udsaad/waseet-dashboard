import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { logAdminAction } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type ActionKind = "in_review" | "resolve" | "reject" | "note";

const ACTION_TO_STATUS: Partial<Record<ActionKind, string>> = {
  in_review: "in_review",
  resolve: "resolved",
  reject: "rejected",
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireRoleForApi(
    ["super_admin", "admin", "support_agent"],
    request
  );
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => ({}));
  const action = body.action as ActionKind | undefined;
  const adminNotes = (body.admin_notes as string | undefined) ?? null;

  if (!action || !["in_review", "resolve", "reject", "note"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  const { data: dispute } = await supabase
    .from("disputes")
    .select("id, status, reporter_id")
    .eq("id", id)
    .maybeSingle();

  if (!dispute) {
    return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
  }

  const update: Record<string, unknown> = {};
  if (adminNotes !== null) update.admin_notes = adminNotes;

  const targetStatus = ACTION_TO_STATUS[action];
  if (targetStatus) {
    update.status = targetStatus;
    if (targetStatus === "resolved" || targetStatus === "rejected") {
      update.resolved_by = auth.userId;
      update.resolved_at = new Date().toISOString();
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error } = await supabase.from("disputes").update(update).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAdminAction({
    actorId: auth.userId,
    action: `dispute_${action}`,
    entity: "disputes",
    entityId: id,
    metadata: { admin_notes: adminNotes },
  });

  return NextResponse.json({ success: true });
}
