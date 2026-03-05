import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { logAdminAction } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

async function updateChatReceiptStatus(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  conversationId: string,
  newStatus: string
) {
  // Try RPC first, fall back to direct update
  const { error } = await supabase.rpc("update_payment_receipt_status", {
    p_conversation_id: conversationId,
    p_new_status: newStatus,
  });

  if (error) {
    // Fallback: direct update
    const { data: messages } = await supabase
      .from("messages")
      .select("id, attachments")
      .eq("conversation_id", conversationId)
      .contains("attachments", JSON.stringify([{ type: "payment_receipt", status: "pending" }]));

    if (messages?.length) {
      await Promise.all(
        messages.map((msg) => {
          const updated = (msg.attachments as Record<string, string>[]).map(
            (att) =>
              att.type === "payment_receipt" && att.status === "pending"
                ? { ...att, status: newStatus }
                : att
          );
          return supabase
            .from("messages")
            .update({ attachments: updated })
            .eq("id", msg.id);
        })
      );
    }
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireRoleForApi(["super_admin", "admin", "finance"]);
  if ("error" in auth) return auth.error;
  const supabase = getSupabaseServerClient();

  // Step 1: Approve via RPC (sets status → payment_verified)
  const { error: rpcError } = await supabase.rpc(
    "approve_service_bank_transfer",
    { p_order_id: id }
  );

  if (rpcError) {
    const isNotFound = rpcError.message?.includes("not found");
    return NextResponse.json(
      {
        error: isNotFound
          ? "الطلب غير موجود"
          : rpcError.message ?? "حدث خطأ أثناء تأكيد التحويل",
      },
      { status: isNotFound ? 404 : 400 }
    );
  }

  // Step 2: Update the payment_receipt message in chat to "succeeded"
  const { data: order } = await supabase
    .from("orders")
    .select("conversation_id")
    .eq("id", id)
    .maybeSingle();

  if (order?.conversation_id) {
    await updateChatReceiptStatus(supabase, order.conversation_id, "succeeded");
  }

  // Step 3: Send notifications to both users
  await supabase.rpc("notify_order_transfer_result", {
    p_order_id: id,
    p_approved: true,
  });

  await logAdminAction({
    actorId: auth.userId,
    action: "approve_transfer_order",
    entity: "orders",
    entityId: id,
  });

  if (request.headers.get("accept")?.includes("application/json")) {
    return NextResponse.json({ success: true });
  }
  return NextResponse.redirect(request.headers.get("referer") ?? "/orders");
}
