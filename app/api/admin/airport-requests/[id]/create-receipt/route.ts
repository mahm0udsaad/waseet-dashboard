import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { logAdminAction } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoleForApi(
    ["super_admin", "admin", "support_agent"],
    request
  );
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const { description, amount } = await request.json();

  if (!description?.trim() || !amount || isNaN(parseFloat(amount))) {
    return NextResponse.json({ error: "الوصف والمبلغ مطلوبان" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  const { data: airportReq } = await supabase
    .from("airport_inspection_requests")
    .select("conversation_id, user_id")
    .eq("id", id)
    .single();

  if (!airportReq?.conversation_id) {
    return NextResponse.json(
      { error: "يجب بدء محادثة أولاً قبل إنشاء الإيصال" },
      { status: 400 }
    );
  }

  const parsedAmount = parseFloat(amount);

  // seller = admin (فريق وسيط), buyer = user
  const { data: receipt, error: receiptError } = await supabase
    .from("receipts")
    .insert({
      seller_id: auth.userId,
      buyer_id: airportReq.user_id,
      conversation_id: airportReq.conversation_id,
      description: description.trim(),
      amount: parsedAmount,
      currency: "SAR",
      status: "seller_signed",
    })
    .select("id")
    .single();

  if (receiptError || !receipt) {
    return NextResponse.json(
      { error: receiptError?.message ?? "فشل إنشاء الإيصال" },
      { status: 400 }
    );
  }

  // Send chat message with receipt attachment — trigger handles notification + push
  await supabase.from("messages").insert({
    conversation_id: airportReq.conversation_id,
    sender_id: auth.userId,
    content: null,
    attachments: [
      {
        type: "receipt",
        receipt_id: receipt.id,
        status: "seller_signed",
        amount: parsedAmount,
        description: description.trim(),
      },
    ],
  });

  await logAdminAction({
    actorId: auth.userId,
    action: "create_airport_receipt",
    entity: "airport_inspection_requests",
    entityId: id,
    metadata: { receipt_id: receipt.id, amount: parsedAmount },
  });

  return NextResponse.json({ success: true, receipt_id: receipt.id });
}
