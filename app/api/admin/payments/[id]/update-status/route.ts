import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { logAdminAction } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const ALLOWED_TARGETS = ["succeeded", "failed", "refunded", "canceled"] as const;
type TargetStatus = (typeof ALLOWED_TARGETS)[number];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireRoleForApi(["super_admin", "admin", "finance"], request);
  if ("error" in auth) return auth.error;

  let body: { targetStatus?: string; note?: string } = {};
  try {
    body = await request.json();
  } catch {
    /* empty body OK */
  }

  const targetStatus = body.targetStatus as TargetStatus | undefined;
  if (!targetStatus || !ALLOWED_TARGETS.includes(targetStatus)) {
    return NextResponse.json(
      {
        error: `targetStatus must be one of: ${ALLOWED_TARGETS.join(", ")}`,
      },
      { status: 400 }
    );
  }

  const note = (body.note ?? "").trim() || null;
  const supabase = getSupabaseServerClient();

  const { data: payment, error: fetchError } = await supabase
    .from("payments")
    .select("id, status, metadata")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!payment) {
    return NextResponse.json({ error: "العملية غير موجودة" }, { status: 404 });
  }

  if (payment.status === targetStatus) {
    return NextResponse.json(
      { error: "العملية في هذه الحالة بالفعل" },
      { status: 400 }
    );
  }

  // Append admin override marker to metadata so it's auditable from the row itself
  const metadata = {
    ...((payment.metadata as Record<string, unknown> | null) ?? {}),
    admin_override: {
      previous_status: payment.status,
      new_status: targetStatus,
      actor_id: auth.userId,
      note,
      at: new Date().toISOString(),
    },
  };

  const { error: updateError } = await supabase
    .from("payments")
    .update({
      status: targetStatus,
      metadata,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await logAdminAction({
    actorId: auth.userId,
    action: `payment_mark_${targetStatus}`,
    entity: "payments",
    entityId: id,
    metadata: { previous_status: payment.status, note },
  });

  if (request.headers.get("accept")?.includes("application/json")) {
    return NextResponse.json({ success: true, status: targetStatus });
  }
  return NextResponse.redirect(request.headers.get("referer") ?? "/payments");
}
