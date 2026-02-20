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
  const auth = await requireRoleForApi(["super_admin", "admin", "finance"]);
  if ("error" in auth) return auth.error;
  const supabase = getSupabaseServerClient();

  let adminNote = "";
  const contentType = request.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      const body = await request.json();
      adminNote = body.admin_note ?? "";
    } else {
      const formData = await request.formData();
      adminNote = (formData.get("admin_note") as string) ?? "";
    }
  } catch {
    // Default empty note
  }

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
      { error: "لا يمكن رفض طلب تمت معالجته مسبقاً" },
      { status: 400 }
    );
  }

  await supabase
    .from("withdrawal_requests")
    .update({
      status: "rejected",
      admin_note: adminNote || null,
      processed_at: new Date().toISOString(),
    })
    .eq("id", id);

  // Notify user
  await supabase.from("notifications").insert({
    recipient_id: withdrawal.user_id,
    type: "withdrawal_rejected",
    title: "تم رفض طلب السحب",
    body: adminNote
      ? `تم رفض طلب سحب بمبلغ ${withdrawal.amount} ر.س - السبب: ${adminNote}`
      : `تم رفض طلب سحب بمبلغ ${withdrawal.amount} ر.س`,
    data: { withdrawal_id: id },
  });

  await sendExpoPushNotifications({
    userIds: [withdrawal.user_id],
    title: "تم رفض طلب السحب",
    body: adminNote
      ? `تم رفض طلب السحب - السبب: ${adminNote}`
      : "تم رفض طلب السحب",
    data: { withdrawal_id: id },
  });

  await logAdminAction({
    actorId: auth.userId,
    action: "reject_withdrawal",
    entity: "withdrawal_requests",
    entityId: id,
    metadata: { admin_note: adminNote },
  });

  if (request.headers.get("accept")?.includes("application/json")) {
    return NextResponse.json({ success: true });
  }
  return NextResponse.redirect(request.headers.get("referer") ?? "/withdrawals");
}
