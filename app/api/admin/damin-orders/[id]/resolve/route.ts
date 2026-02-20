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

  const { data, error } = await supabase.rpc("confirm_damin_bank_payment", {
    p_order_id: id,
  });

  if (error) {
    const isNotFound = error.message?.includes("not found");
    const isBadStatus = error.message?.includes("not in payment_submitted");
    return NextResponse.json(
      { error: isNotFound ? "الطلب غير موجود" : isBadStatus ? "لا يمكن التحقق من طلب لم يتم إرسال الدفع فيه" : error.message },
      { status: isNotFound ? 404 : 400 }
    );
  }

  await logAdminAction({
    actorId: auth.userId,
    action: "verify_payment_damin_order",
    entity: "damin_orders",
    entityId: id,
  });

  if (request.headers.get("accept")?.includes("application/json")) {
    return NextResponse.json(data);
  }
  return NextResponse.redirect(request.headers.get("referer") ?? "/damin-orders");
}
