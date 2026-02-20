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

  const { data: order } = await supabase
    .from("damin_orders")
    .select("id, status, service_value, payer_user_id, beneficiary_user_id")
    .eq("id", id)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
  }

  if (!["awaiting_completion", "payment_submitted"].includes(order.status)) {
    return NextResponse.json(
      { error: "لا يمكن إكمال طلب بهذه الحالة" },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();

  // 1. Complete the order
  await supabase
    .from("damin_orders")
    .update({
      status: "completed",
      escrow_released_at: now,
      ...(order.status === "payment_submitted" ? { escrow_deposit_at: now } : {}),
      updated_at: now,
    })
    .eq("id", id);

  // 2. Credit beneficiary wallet
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

  // 3. Notify both parties
  const notifications = [];
  if (order.payer_user_id) {
    notifications.push({
      recipient_id: order.payer_user_id,
      type: "damin_order_completed",
      title: "تم اكتمال طلب الضامن",
      body: "تم التحقق من الدفع واكتمال الطلب بنجاح",
      data: { order_id: id },
      damin_order_id: id,
    });
  }
  if (order.beneficiary_user_id) {
    notifications.push({
      recipient_id: order.beneficiary_user_id,
      type: "damin_order_completed",
      title: "تم اكتمال طلب الضامن",
      body: "تم اكتمال الخدمة وسيتم تحويل المبلغ قريباً",
      data: { order_id: id },
      damin_order_id: id,
    });
  }
  if (notifications.length > 0) {
    await supabase.from("notifications").insert(notifications);
  }

  // 4. Send push notifications (best-effort)
  const pushUserIds = [order.payer_user_id, order.beneficiary_user_id].filter(
    Boolean
  ) as string[];
  if (pushUserIds.length > 0) {
    await sendExpoPushNotifications({
      userIds: pushUserIds,
      title: "تم اكتمال طلب الضامن",
      body: "تم اكتمال الخدمة وإطلاق المبلغ",
      data: { order_id: id },
    });
  }

  await logAdminAction({
    actorId: auth.userId,
    action: "complete_damin_order",
    entity: "damin_orders",
    entityId: id,
  });

  if (request.headers.get("accept")?.includes("application/json")) {
    return NextResponse.json({ success: true });
  }
  return NextResponse.redirect(request.headers.get("referer") ?? "/damin-orders");
}
