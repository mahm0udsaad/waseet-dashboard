import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { logAdminAction } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type ActionKind = "reply" | "in_progress" | "resolve" | "close" | "priority";

const ACTION_TO_STATUS: Partial<Record<ActionKind, string>> = {
  in_progress: "in_progress",
  resolve: "resolved",
  close: "closed",
};

const VALID_PRIORITIES = new Set(["low", "normal", "high", "urgent"]);

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
  const adminResponse = (body.admin_response as string | undefined) ?? null;
  const priority = (body.priority as string | undefined) ?? null;

  if (
    !action ||
    !["reply", "in_progress", "resolve", "close", "priority"].includes(action)
  ) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("id, status, user_id")
    .eq("id", id)
    .maybeSingle();

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const update: Record<string, unknown> = {};

  if (action === "reply" && (!adminResponse || adminResponse.trim().length === 0)) {
    return NextResponse.json({ error: "Empty response" }, { status: 400 });
  }

  if (adminResponse !== null && adminResponse.length > 0) {
    update.admin_response = adminResponse;
  }

  const targetStatus = ACTION_TO_STATUS[action];
  if (targetStatus) {
    update.status = targetStatus;
    if (targetStatus === "resolved" || targetStatus === "closed") {
      update.resolved_at = new Date().toISOString();
    }
  }

  // For "reply" without status change, also nudge to in_progress if it's open.
  if (action === "reply" && ticket.status === "open") {
    update.status = "in_progress";
  }

  if (action === "priority") {
    if (!priority || !VALID_PRIORITIES.has(priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }
    update.priority = priority;
    // Don't claim ownership through this action; assigned_to stays as-is.
  }

  // Mark assignment when the agent first acts.
  if (action !== "priority") {
    update.assigned_to = auth.userId;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("support_tickets")
    .update(update)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAdminAction({
    actorId: auth.userId,
    action: `support_ticket_${action}`,
    entity: "support_tickets",
    entityId: id,
    metadata: { admin_response: adminResponse, priority },
  });

  return NextResponse.json({ success: true });
}
