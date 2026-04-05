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
  const auth = await requireRoleForApi(["super_admin", "admin", "finance"], request);
  if ("error" in auth) return auth.error;
  const supabase = getSupabaseServerClient();

  const { data: withdrawal } = await supabase
    .from("withdrawal_requests")
    .select("id, status, user_id, amount")
    .eq("id", id)
    .maybeSingle();

  if (!withdrawal) {
    return NextResponse.json({ error: "طلب السحب غير موجود" }, { status: 404 });
  }

  if (withdrawal.status !== "pending") {
    return NextResponse.json(
      { error: "لا يمكن الموافقة على طلب تمت معالجته مسبقاً" },
      { status: 400 }
    );
  }

  await supabase
    .from("withdrawal_requests")
    .update({
      status: "approved",
      processed_at: new Date().toISOString(),
    })
    .eq("id", id);

  // Notify user
  await supabase.from("notifications").insert({
    recipient_id: withdrawal.user_id,
    type: "withdrawal_approved",
    title: "تمت الموافقة على طلب السحب",
    body: `تمت الموافقة على طلب سحب بمبلغ ${withdrawal.amount} ر.س`,
    data: { withdrawal_id: id },
  });

  await sendExpoPushNotifications({
    userIds: [withdrawal.user_id],
    title: "تمت الموافقة على طلب السحب",
    body: `تمت الموافقة على طلب سحب بمبلغ ${withdrawal.amount} ر.س`,
    data: { withdrawal_id: id },
  });

  await logAdminAction({
    actorId: auth.userId,
    action: "approve_withdrawal",
    entity: "withdrawal_requests",
    entityId: id,
  });

  if (request.headers.get("accept")?.includes("application/json")) {
    return NextResponse.json({ success: true });
  }
  return NextResponse.redirect(request.headers.get("referer") ?? "/withdrawals");
}
