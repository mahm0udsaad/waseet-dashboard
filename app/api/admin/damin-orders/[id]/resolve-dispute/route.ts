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
  const auth = await requireRoleForApi(["super_admin", "admin"]);
  if ("error" in auth) return auth.error;
  const supabase = getSupabaseServerClient();

  let resolution: "completed" | "cancelled" = "completed";
  const contentType = request.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      const body = await request.json();
      if (body.resolution === "cancelled") resolution = "cancelled";
    } else {
      const formData = await request.formData();
      if (formData.get("resolution") === "cancelled") resolution = "cancelled";
    }
  } catch {
    // Default to completed
  }

  const { data: order } = await supabase
    .from("damin_orders")
    .select("id, status, service_value, payer_user_id, beneficiary_user_id")
    .eq("id", id)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
  }

  if (order.status !== "disputed") {
    return NextResponse.json(
      { error: "هذا الطلب ليس في حالة نزاع" },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();

  if (resolution === "completed") {
    // Release funds to beneficiary
    await supabase
      .from("damin_orders")
      .update({ status: "completed", escrow_released_at: now, updated_at: now })
      .eq("id", id);

    // Credit beneficiary wallet
    if (order.beneficiary_user_id) {
      await supabase.from("wallet_transactions").insert({
        user_id: order.beneficiary_user_id,
        order_id: order.id,
        type: "escrow_release",
        amount: order.service_value,
        description: `إطلاق مبلغ الضمان بعد حل النزاع - طلب #${order.id.slice(0, 8)}`,
        created_by: auth.userId,
      });
    }

    // Notify both parties
    const notifications = [];
    if (order.payer_user_id) {
      notifications.push({
        recipient_id: order.payer_user_id,
        type: "damin_order_completed",
        title: "تم حل النزاع",
        body: "تم حل النزاع وإكمال الطلب وإطلاق المبلغ للمستفيد",
        data: { order_id: id },
        damin_order_id: id,
      });
    }
    if (order.beneficiary_user_id) {
      notifications.push({
        recipient_id: order.beneficiary_user_id,
        type: "damin_order_completed",
        title: "تم حل النزاع",
        body: "تم حل النزاع لصالحك وسيتم تحويل المبلغ قريباً",
        data: { order_id: id },
        damin_order_id: id,
      });
    }
    if (notifications.length > 0) {
      await supabase.from("notifications").insert(notifications);
    }

    const pushUserIds = [order.payer_user_id, order.beneficiary_user_id].filter(
      Boolean
    ) as string[];
    if (pushUserIds.length > 0) {
      await sendExpoPushNotifications({
        userIds: pushUserIds,
        title: "تم حل النزاع",
        body: "تم حل النزاع وإكمال الطلب",
        data: { order_id: id },
      });
    }
  } else {
    // Cancel the order (refund scenario)
    await supabase
      .from("damin_orders")
      .update({ status: "cancelled", updated_at: now })
      .eq("id", id);

    const notifications = [];
    if (order.payer_user_id) {
      notifications.push({
        recipient_id: order.payer_user_id,
        type: "damin_order_cancelled",
        title: "تم إلغاء الطلب",
        body: "تم حل النزاع وإلغاء الطلب، سيتم استرداد المبلغ",
        data: { order_id: id },
        damin_order_id: id,
      });
    }
    if (order.beneficiary_user_id) {
      notifications.push({
        recipient_id: order.beneficiary_user_id,
        type: "damin_order_cancelled",
        title: "تم إلغاء الطلب",
        body: "تم حل النزاع وإلغاء الطلب",
        data: { order_id: id },
        damin_order_id: id,
      });
    }
    if (notifications.length > 0) {
      await supabase.from("notifications").insert(notifications);
    }

    const pushUserIds = [order.payer_user_id, order.beneficiary_user_id].filter(
      Boolean
    ) as string[];
    if (pushUserIds.length > 0) {
      await sendExpoPushNotifications({
        userIds: pushUserIds,
        title: "تم إلغاء الطلب",
        body: "تم حل النزاع وإلغاء الطلب",
        data: { order_id: id },
      });
    }
  }

  await logAdminAction({
    actorId: auth.userId,
    action: `resolve_dispute_${resolution}`,
    entity: "damin_orders",
    entityId: id,
    metadata: { resolution },
  });

  if (request.headers.get("accept")?.includes("application/json")) {
    return NextResponse.json({ success: true });
  }
  return NextResponse.redirect(request.headers.get("referer") ?? "/damin-orders");
}
