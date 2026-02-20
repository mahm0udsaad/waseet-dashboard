import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { logAdminAction } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireRoleForApi(["super_admin", "admin"]);
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

  if (!["payment_submitted", "both_confirmed", "awaiting_completion", "completion_requested"].includes(order.status)) {
    return NextResponse.json(
      { error: "لا يمكن فتح نزاع على هذا الطلب" },
      { status: 400 }
    );
  }

  await supabase
    .from("damin_orders")
    .update({ status: "disputed", updated_at: new Date().toISOString() })
    .eq("id", id);

  await logAdminAction({
    actorId: auth.userId,
    action: "dispute_damin_order",
    entity: "damin_orders",
    entityId: id,
  });

  if (request.headers.get("accept")?.includes("application/json")) {
    return NextResponse.json({ success: true });
  }
  return NextResponse.redirect(request.headers.get("referer") ?? "/damin-orders");
}
