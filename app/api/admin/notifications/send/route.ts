import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { logAdminAction } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { sendExpoPushNotifications } from "@/lib/push";

export async function POST(request: Request) {
  const auth = await requireRoleForApi(["super_admin", "admin", "support_agent"]);
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const { recipientIds, title, body: notifBody, entityType, entityId } = body;

  if (
    !Array.isArray(recipientIds) ||
    recipientIds.length === 0 ||
    !title ||
    !notifBody
  ) {
    return NextResponse.json(
      { error: "يرجى تعبئة جميع الحقول المطلوبة" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServerClient();

  const notifications = recipientIds.map((recipientId: string) => ({
    recipient_id: recipientId,
    actor_id: auth.userId,
    type: "admin_notification",
    title,
    body: notifBody,
    data: { entityType, entityId },
  }));

  const { error } = await supabase.from("notifications").insert(notifications);

  if (error) {
    return NextResponse.json(
      { error: "فشل في إرسال الإشعارات" },
      { status: 500 }
    );
  }

  // Send push notifications (best-effort)
  await sendExpoPushNotifications({
    userIds: recipientIds,
    title,
    body: notifBody,
    data: { entityType, entityId },
  });

  await logAdminAction({
    actorId: auth.userId,
    action: "send_notification",
    entity: entityType ?? "notification",
    entityId: entityId ?? null,
    metadata: { recipientCount: recipientIds.length, title },
  });

  return NextResponse.json({ success: true });
}
