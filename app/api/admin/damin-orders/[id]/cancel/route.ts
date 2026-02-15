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
    .select("status")
    .eq("id", id)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
  }

  if (order.status === "completed") {
    return NextResponse.json(
      { error: "لا يمكن إلغاء طلب مكتمل" },
      { status: 400 }
    );
  }

  await supabase
    .from("damin_orders")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", id);

  await logAdminAction({
    actorId: auth.userId,
    action: "cancel_damin_order",
    entity: "damin_orders",
    entityId: id,
  });

  const referer = request.headers.get("referer");
  return NextResponse.redirect(referer ?? "/damin-orders");
}
