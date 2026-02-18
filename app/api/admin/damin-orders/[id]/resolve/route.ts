import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { logAdminAction } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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
    .select("status, payer_user_id, beneficiary_user_id")
    .eq("id", id)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
  }

  if (order.status !== "payment_submitted") {
    return NextResponse.json(
      { error: "لا يمكن التحقق من طلب لم يتم إرسال الدفع فيه" },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();

  await supabase
    .from("damin_orders")
    .update({
      status: "awaiting_completion",
      escrow_deposit_at: now,
      updated_at: now,
    })
    .eq("id", id);

  // Notify both parties
  const notifications = [];
  if (order.payer_user_id) {
    notifications.push({
      recipient_id: order.payer_user_id,
      type: "damin_payment_verified",
      title: "تم التحقق من الدفع",
      body: "تم التحقق من تحويلك البنكي بنجاح، بانتظار اكتمال الخدمة",
      data: { order_id: id },
      damin_order_id: id,
    });
  }
  if (order.beneficiary_user_id) {
    notifications.push({
      recipient_id: order.beneficiary_user_id,
      type: "damin_payment_verified",
      title: "تم التحقق من الدفع",
      body: "تم تأكيد استلام المبلغ في الضمان، يمكنك البدء بتقديم الخدمة",
      data: { order_id: id },
      damin_order_id: id,
    });
  }
  if (notifications.length > 0) {
    await supabase.from("notifications").insert(notifications);
  }

  await logAdminAction({
    actorId: auth.userId,
    action: "verify_payment_damin_order",
    entity: "damin_orders",
    entityId: id,
  });

  if (request.headers.get("accept")?.includes("application/json")) {
    return NextResponse.json({ success: true });
  }
  return NextResponse.redirect(request.headers.get("referer") ?? "/damin-orders");
}
