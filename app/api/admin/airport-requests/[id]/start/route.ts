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

  // 1. Fetch request details (need price + user_id)
  const { data: airportReq } = await supabase
    .from("airport_inspection_requests")
    .select("id, user_id, price, conversation_id, status")
    .eq("id", id)
    .single();

  if (!airportReq) {
    return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
  }

  // 2. Update status to in_progress
  await supabase
    .from("airport_inspection_requests")
    .update({ status: "in_progress", updated_at: new Date().toISOString() })
    .eq("id", id);

  // 3. Create conversation if not already exists
  let conversationId = airportReq.conversation_id;
  if (!conversationId) {
    const { data: chatData } = await supabase.rpc("admin_create_airport_chat", {
      p_request_id: id,
      p_admin_user_id: auth.userId,
    });
    conversationId = chatData?.conversation_id ?? null;
  }

  // 4. Create receipt + send as first message (payment confirmation)
  if (conversationId) {
    const price = airportReq.price ?? 0;

    // Create receipt record
    const { data: receipt } = await supabase
      .from("receipts")
      .insert({
        seller_id: auth.userId,
        buyer_id: airportReq.user_id,
        conversation_id: conversationId,
        description: "خدمة تفتيش وتوصيل المطار",
        amount: price,
        currency: "SAR",
        status: "seller_signed",
      })
      .select("id")
      .single();

    // Send receipt as first chat message (triggers notification + push via DB trigger)
    if (receipt) {
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: auth.userId,
        content: `تم تأكيد طلبك لخدمة تفتيش وتوصيل المطار.\nالمبلغ: ${price} ر.س\nفريق وسيط الآن يعمل على طلبك.`,
        attachments: [
          {
            type: "receipt",
            receipt_id: receipt.id,
            status: "seller_signed",
            amount: price,
            description: "خدمة تفتيش وتوصيل المطار",
          },
        ],
      });
    }
  }

  await logAdminAction({
    actorId: auth.userId,
    action: "start_airport_request",
    entity: "airport_inspection_requests",
    entityId: id,
    metadata: { conversation_id: conversationId },
  });

  if (request.headers.get("accept")?.includes("application/json")) {
    return NextResponse.json({ success: true, conversation_id: conversationId });
  }
  return NextResponse.redirect(
    request.headers.get("referer") ?? `/airport-requests/${id}`
  );
}
