import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { logAdminAction } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireRoleForApi(["admin"]);
  if ("error" in auth) return auth.error;
  const supabase = getSupabaseServerClient();

  await supabase
    .from("damin_orders")
    .update({ status: "completed" })
    .eq("id", params.id);

  await logAdminAction({
    actorId: auth.userId,
    action: "resolve_damin_order",
    entity: "damin_orders",
    entityId: params.id,
  });

  return NextResponse.redirect(request.headers.get("referer") ?? "/damin-orders");
}
