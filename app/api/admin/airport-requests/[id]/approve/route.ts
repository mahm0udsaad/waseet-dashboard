import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { logAdminAction } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireRoleForApi(["super_admin", "admin"], request);
  if ("error" in auth) return auth.error;
  const supabase = getSupabaseServerClient();

  // Get user_id before updating
  const { data: airportReq } = await supabase
    .from("airport_inspection_requests")
    .select("user_id")
    .eq("id", id)
    .single();

  await supabase
    .from("airport_inspection_requests")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("id", id);

  // Send push notification to user
  if (airportReq?.user_id) {
    await supabase.from("notifications").insert({
      recipient_id: airportReq.user_id,
      type: "airport_request_approved",
      title: "تم اعتماد الدفع",
      body: "تم اعتماد التحويل البنكي لخدمة المطار. سيتم بدء التنفيذ قريباً.",
      data: { airport_request_id: id },
    });
  }

  await logAdminAction({
    actorId: auth.userId,
    action: "approve_airport_request",
    entity: "airport_inspection_requests",
    entityId: id,
  });

  if (request.headers.get("accept")?.includes("application/json")) {
    return NextResponse.json({ success: true });
  }
  return NextResponse.redirect(
    request.headers.get("referer") ?? `/airport-requests/${id}`
  );
}
