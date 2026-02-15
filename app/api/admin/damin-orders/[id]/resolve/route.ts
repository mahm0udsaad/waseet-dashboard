import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { logAdminAction } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireRoleForApi(["admin"]);
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
      { error: "لا يمكن إكمال طلب لم يتم إرسال الدفع فيه" },
      { status: 400 }
    );
  }

  await supabase
    .from("damin_orders")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", id);

  // Notify both parties
  const notifications = [];
  if (order.payer_user_id) {
    notifications.push({
      user_id: order.payer_user_id,
      type: "damin_order_completed",
      title: "تم اكتمال طلب الضامن",
      body: "تم التحقق من الدفع واكتمال الطلب بنجاح",
      data: { order_id: id },
    });
  }
  if (order.beneficiary_user_id) {
    notifications.push({
      user_id: order.beneficiary_user_id,
      type: "damin_order_completed",
      title: "تم اكتمال طلب الضامن",
      body: "تم اكتمال الخدمة وسيتم تحويل المبلغ قريباً",
      data: { order_id: id },
    });
  }
  if (notifications.length > 0) {
    await supabase.from("notifications").insert(notifications);
  }

  await logAdminAction({
    actorId: auth.userId,
    action: "resolve_damin_order",
    entity: "damin_orders",
    entityId: id,
  });

  const referer = request.headers.get("referer");
  return NextResponse.redirect(referer ?? "/damin-orders");
}
