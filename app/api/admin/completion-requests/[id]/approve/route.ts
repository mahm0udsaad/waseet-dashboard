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

  // Fetch completion request with order data
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

  const { data: order } = await supabase
    .from("damin_orders")
    .select("id, status, service_value, beneficiary_user_id, payer_user_id")
    .eq("id", cr.order_id)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "الطلب الأصلي غير موجود" }, { status: 404 });
  }

  const now = new Date().toISOString();

  // 1. Approve the completion request
  await supabase
    .from("damin_completion_requests")
    .update({ status: "approved", reviewed_by: auth.userId, reviewed_at: now })
    .eq("id", id);

  // 2. Complete the order and release escrow
  await supabase
    .from("damin_orders")
    .update({ status: "completed", escrow_released_at: now, updated_at: now })
    .eq("id", order.id);

  // 3. Credit beneficiary wallet
  if (order.beneficiary_user_id) {
    await supabase.from("wallet_transactions").insert({
      user_id: order.beneficiary_user_id,
      order_id: order.id,
      type: "escrow_release",
      amount: order.service_value,
      description: `إطلاق مبلغ الضمان - طلب #${order.id.slice(0, 8)}`,
      created_by: auth.userId,
    });
  }

  // 4. Notify both parties
  const notifications = [];
  if (order.payer_user_id) {
    notifications.push({
      recipient_id: order.payer_user_id,
      type: "damin_order_completed",
      title: "تم اكتمال طلب الضامن",
      body: "تم اكتمال الخدمة وإطلاق المبلغ للمستفيد",
      data: { order_id: order.id },
      damin_order_id: order.id,
    });
  }
  if (order.beneficiary_user_id) {
    notifications.push({
      recipient_id: order.beneficiary_user_id,
      type: "damin_order_completed",
      title: "تم اكتمال طلب الضامن",
      body: "تم اكتمال الخدمة وتم إضافة المبلغ لمحفظتك",
      data: { order_id: order.id },
      damin_order_id: order.id,
    });
  }
  if (notifications.length > 0) {
    await supabase.from("notifications").insert(notifications);
  }

  // 5. Send push notifications (best-effort)
  const pushUserIds = [order.payer_user_id, order.beneficiary_user_id].filter(Boolean) as string[];
  if (pushUserIds.length > 0) {
    await sendExpoPushNotifications({
      userIds: pushUserIds,
      title: "تم اكتمال طلب الضامن",
      body: "تم اكتمال الخدمة وإطلاق المبلغ",
      data: { order_id: order.id },
    });
  }

  await logAdminAction({
    actorId: auth.userId,
    action: "approve_completion_request",
    entity: "damin_completion_requests",
    entityId: id,
    metadata: { order_id: order.id },
  });

  if (request.headers.get("accept")?.includes("application/json")) {
    return NextResponse.json({ success: true });
  }
  return NextResponse.redirect(request.headers.get("referer") ?? "/completion-requests");
}
