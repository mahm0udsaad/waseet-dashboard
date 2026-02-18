import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { logAdminAction } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { sendExpoPushNotifications } from "@/lib/push";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireRoleForApi(["super_admin", "admin", "finance"]);
  if ("error" in auth) return auth.error;
  const supabase = getSupabaseServerClient();

  let adminComment = "";
  try {
    const body = await request.json();
    adminComment = body.admin_comment ?? "";
  } catch {
    // No body provided
  }

  const { data: cr } = await supabase
    .from("damin_completion_requests")
    .select("id, order_id, status, requested_by")
    .eq("id", id)
    .maybeSingle();

  if (!cr) {
    return NextResponse.json({ error: "طلب الاكتمال غير موجود" }, { status: 404 });
  }
  if (cr.status !== "pending") {
    return NextResponse.json({ error: "تم مراجعة هذا الطلب مسبقاً" }, { status: 400 });
  }

  const now = new Date().toISOString();

  // 1. Reject the completion request
  await supabase
    .from("damin_completion_requests")
    .update({
      status: "rejected",
      admin_comment: adminComment || null,
      reviewed_by: auth.userId,
      reviewed_at: now,
    })
    .eq("id", id);

  // 2. Revert order status to awaiting_completion
  await supabase
    .from("damin_orders")
    .update({ status: "awaiting_completion", updated_at: now })
    .eq("id", cr.order_id);

  // 3. Notify the requester
  if (cr.requested_by) {
    await supabase.from("notifications").insert({
      recipient_id: cr.requested_by,
      type: "damin_completion_rejected",
      title: "تم رفض طلب الاكتمال",
      body: adminComment
        ? `تم رفض طلب إنهاء الخدمة. السبب: ${adminComment}`
        : "تم رفض طلب إنهاء الخدمة، يرجى التواصل مع الدعم",
      data: { order_id: cr.order_id },
      damin_order_id: cr.order_id,
    });

    await sendExpoPushNotifications({
      userIds: [cr.requested_by],
      title: "تم رفض طلب الاكتمال",
      body: adminComment || "تم رفض طلب إنهاء الخدمة",
      data: { order_id: cr.order_id },
    });
  }

  await logAdminAction({
    actorId: auth.userId,
    action: "reject_completion_request",
    entity: "damin_completion_requests",
    entityId: id,
    metadata: { order_id: cr.order_id, admin_comment: adminComment },
  });

  if (request.headers.get("accept")?.includes("application/json")) {
    return NextResponse.json({ success: true });
  }
  return NextResponse.redirect(request.headers.get("referer") ?? "/completion-requests");
}
