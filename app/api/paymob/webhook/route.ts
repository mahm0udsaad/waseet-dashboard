import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { verifyPaymobHmac } from "@/lib/paymob";

/**
 * POST /api/paymob/webhook
 *
 * Receives Paymob transaction callbacks. No auth required (Paymob calls this).
 * Idempotent: terminal statuses (succeeded, failed) are never reverted.
 *
 * Paymob sends the transaction object in the body and an `hmac` query param.
 */
export async function POST(request: NextRequest) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ── HMAC verification ──
  const hmac = request.nextUrl.searchParams.get("hmac");
  const txnObj = (payload.obj ?? payload) as Record<string, unknown>;

  if (hmac) {
    const valid = verifyPaymobHmac(txnObj, hmac);
    if (!valid) {
      console.error("[webhook] HMAC verification failed");
      return NextResponse.json({ error: "HMAC invalid" }, { status: 403 });
    }
  } else {
    console.warn("[webhook] No HMAC parameter — accepting without verification");
  }

  // ── Extract transaction data ──
  const success = txnObj.success === true;
  const pending = txnObj.pending === true;
  const isVoided = txnObj.is_voided === true;
  const isRefunded = txnObj.is_refunded === true;
  const amountCents = txnObj.amount_cents as number | undefined;
  const currency = txnObj.currency as string | undefined;
  const paymobTxnId = txnObj.id ? String(txnObj.id) : undefined;
  const paymobOrderId = (txnObj.order as Record<string, unknown>)?.id
    ? String((txnObj.order as Record<string, unknown>).id)
    : undefined;

  // Look for our paymentId in extras or special_reference
  const extras = (txnObj.payment_extras ?? txnObj.extras ?? {}) as Record<
    string,
    string
  >;
  const order = (txnObj.order ?? {}) as Record<string, unknown>;
  const orderExtras = (order.extras ?? {}) as Record<string, string>;
  const specialRef =
    (order.special_reference as string) ?? extras.payment_id ?? orderExtras.payment_id;

  // Determine new status
  let newStatus: "succeeded" | "failed" | "canceled" | "pending";
  if (success && !pending) {
    newStatus = "succeeded";
  } else if (isVoided || isRefunded) {
    newStatus = "canceled";
  } else if (!success && !pending) {
    newStatus = "failed";
  } else {
    newStatus = "pending";
  }

  const supabase = getSupabaseServerClient();

  // ── Find the payment record ──
  let paymentId: string | null = null;

  // Strategy 1: special_reference / extras.payment_id (our UUID)
  if (specialRef) {
    const { data } = await supabase
      .from("payments")
      .select("id, status")
      .eq("id", specialRef)
      .maybeSingle();
    if (data) paymentId = data.id;
  }

  // Strategy 2: provider_order_id
  if (!paymentId && paymobOrderId) {
    const { data } = await supabase
      .from("payments")
      .select("id, status")
      .eq("provider_order_id", paymobOrderId)
      .maybeSingle();
    if (data) paymentId = data.id;
  }

  // Strategy 3: provider_intention_id (from extras)
  if (!paymentId && extras.payment_id) {
    const { data } = await supabase
      .from("payments")
      .select("id, status")
      .eq("provider_intention_id", extras.payment_id)
      .maybeSingle();
    if (data) paymentId = data.id;
  }

  if (!paymentId) {
    // Orphan webhook — store for investigation
    console.warn("[webhook] No matching payment found. Creating orphan record.", {
      paymobTxnId,
      paymobOrderId,
      specialRef,
    });

    await supabase.from("payments").insert({
      user_id: "00000000-0000-0000-0000-000000000000", // placeholder
      amount: amountCents ?? 0,
      currency: currency ?? "SAR",
      provider: "paymob",
      provider_order_id: paymobOrderId,
      status: newStatus,
      metadata: { orphan: true, paymob_txn_id: paymobTxnId },
      raw_webhook_payload: payload,
    });

    return NextResponse.json({ received: true });
  }

  // ── Idempotency: don't revert terminal states ──
  const { data: existing } = await supabase
    .from("payments")
    .select("status")
    .eq("id", paymentId)
    .single();

  const terminalStates = ["succeeded", "failed"];
  if (existing && terminalStates.includes(existing.status)) {
    // Already in a terminal state — only store the webhook payload
    await supabase
      .from("payments")
      .update({
        raw_webhook_payload: payload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentId);

    return NextResponse.json({ received: true });
  }

  // ── Update payment ──
  const { data: updatedPayment } = await supabase
    .from("payments")
    .update({
      status: newStatus,
      provider_order_id: paymobOrderId ?? undefined,
      raw_webhook_payload: payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", paymentId)
    .select("metadata")
    .single();

  // ── On success: move damin_order to awaiting_completion (escrow held) ──
  if (newStatus === "succeeded" && updatedPayment?.metadata) {
    const meta = updatedPayment.metadata as Record<string, string>;
    const orderId = meta.orderId;

    if (orderId) {
      const { data: order } = await supabase
        .from("damin_orders")
        .select("status, payer_user_id, beneficiary_user_id")
        .eq("id", orderId)
        .maybeSingle();

      // payment_submitted → awaiting_completion (money in escrow, NOT released)
      if (order && order.status === "payment_submitted") {
        await supabase
          .from("damin_orders")
          .update({
            status: "awaiting_completion",
            escrow_deposit_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        // Notify both parties
        const notifications = [];
        if (order.payer_user_id) {
          notifications.push({
            recipient_id: order.payer_user_id,
            type: "damin_payment_verified",
            title: "تم التحقق من الدفع",
            body: "تم إيداع المبلغ في الضمان. بانتظار تأكيد اكتمال الخدمة",
            data: { order_id: orderId },
            damin_order_id: orderId,
          });
        }
        if (order.beneficiary_user_id) {
          notifications.push({
            recipient_id: order.beneficiary_user_id,
            type: "damin_payment_verified",
            title: "تم إيداع مبلغ الضمان",
            body: "تم إيداع المبلغ في الضمان. قم بتقديم الخدمة ثم أكد الاكتمال لاستلام المبلغ",
            data: { order_id: orderId },
            damin_order_id: orderId,
          });
        }
        if (notifications.length > 0) {
          await supabase.from("notifications").insert(notifications);
        }

        console.log(`[webhook] damin_order ${orderId} → awaiting_completion (escrow held)`);
      }
    }
  }

  return NextResponse.json({ received: true });
}
