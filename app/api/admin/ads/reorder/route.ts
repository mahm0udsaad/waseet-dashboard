import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const auth = await requireRoleForApi(["super_admin", "admin"]);
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const { ad_ids, new_orders } = body as { ad_ids: string[]; new_orders: number[] };

  if (
    !Array.isArray(ad_ids) ||
    !Array.isArray(new_orders) ||
    ad_ids.length !== new_orders.length
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.rpc("reorder_ads", { ad_ids, new_orders });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
