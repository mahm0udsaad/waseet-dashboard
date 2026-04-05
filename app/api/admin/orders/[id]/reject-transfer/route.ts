import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { logAdminAction } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

async function updateChatReceiptStatus(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  conversationId: string,
  newStatus: string
) {
  const { error } = await supabase.rpc("update_payment_receipt_status", {
    p_conversation_id: conversationId,
    p_new_status: newStatus,
  });

  if (error) {
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
  const auth = await requireRoleForApi(["super_admin", "admin", "finance"], request);
  if ("error" in auth) return auth.error;
  const supabase = getSupabaseServerClient();

  // Parse rejection reason from body
  let reason = "";
  try {
    const body = await request.json();
    reason = body.reason ?? "";
  } catch {
    // form submission fallback
    try {
      const formData = await request.clone().formData();
      reason = (formData.get("reason") as string) ?? "";
    } catch {
      // no reason provided
    }
  }

  // Step 1: Reject via RPC (sets status → awaiting_payment)
  const { error: rpcError } = await supabase.rpc(
    "reject_service_bank_transfer",
    { p_order_id: id, p_reason: reason }
  );

  if (rpcError) {
    const isNotFound = rpcError.message?.includes("not found");
    return NextResponse.json(
      {
        error: isNotFound
          ? "الطلب غير موجود"
          : rpcError.message ?? "حدث خطأ أثناء رفض التحويل",
      },
      { status: isNotFound ? 404 : 400 }
    );
  }

  // Step 2: Update the payment_receipt message in chat to "rejected"
  const { data: order } = await supabase
    .from("orders")
    .select("conversation_id")
    .eq("id", id)
    .maybeSingle();

  if (order?.conversation_id) {
    await updateChatReceiptStatus(supabase, order.conversation_id, "rejected");
  }

  // Step 3: Send rejection notifications
  await supabase.rpc("notify_order_transfer_result", {
    p_order_id: id,
    p_approved: false,
    p_reason: reason,
  });

  await logAdminAction({
    actorId: auth.userId,
    action: "reject_transfer_order",
    entity: "orders",
    entityId: id,
    metadata: reason ? { reason } : undefined,
  });

  if (request.headers.get("accept")?.includes("application/json")) {
    return NextResponse.json({ success: true });
  }
  return NextResponse.redirect(request.headers.get("referer") ?? "/orders");
}
