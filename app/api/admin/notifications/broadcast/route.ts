import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { logAdminAction } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { sendExpoPushNotifications } from "@/lib/push";

export async function POST(request: Request) {
  const auth = await requireRoleForApi(["super_admin", "admin"]);
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const { title, body: notifBody } = body;

  if (!title?.trim() || !notifBody?.trim()) {
    return NextResponse.json(
      { error: "يرجى تعبئة العنوان والنص" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServerClient();

  // Get all active users
  const { data: users, error: usersError } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("status", "active");

  if (usersError || !users || users.length === 0) {
    return NextResponse.json(
      { error: "فشل في جلب المستخدمين" },
      { status: 500 }
    );
  }

  const recipientIds = users.map((u) => u.user_id);

  // Insert notifications in batches of 500
  const batchSize = 500;
  for (let i = 0; i < recipientIds.length; i += batchSize) {
    const batch = recipientIds.slice(i, i + batchSize);
    const notifications = batch.map((recipientId) => ({
      recipient_id: recipientId,
      actor_id: auth.userId,
      type: "admin_notification",
      title: title.trim(),
      body: notifBody.trim(),
      data: { entityType: "broadcast" },
    }));

    const { error } = await supabase.from("notifications").insert(notifications);
    if (error) {
      return NextResponse.json(
        { error: "فشل في إرسال الإشعارات" },
        { status: 500 }
      );
    }
  }

  // Send push notifications (best-effort)
  await sendExpoPushNotifications({
    userIds: recipientIds,
    title: title.trim(),
    body: notifBody.trim(),
    data: { entityType: "broadcast" },
  });

  await logAdminAction({
    actorId: auth.userId,
    action: "broadcast_notification",
    entity: "notification",
    entityId: null,
    metadata: { recipientCount: recipientIds.length, title },
  });

  return NextResponse.json({
    success: true,
    recipientCount: recipientIds.length,
  });
}
