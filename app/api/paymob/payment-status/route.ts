import { NextResponse, type NextRequest } from "next/server";
import { requireAuthForApi } from "@/lib/auth/requireAuthForApi";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/paymob/payment-status?paymentId=<uuid>
 *
 * Returns the current status of a payment. Auth required.
 * Users can only query their own payments (enforced by query filter).
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuthForApi(request);
  if ("error" in auth) return auth.error;

  const paymentId = request.nextUrl.searchParams.get("paymentId");
  if (!paymentId) {
    return NextResponse.json(
      { error: "paymentId query parameter is required" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServerClient();
  const { data: payment, error } = await supabase
    .from("payments")
    .select("id, status, amount, currency, provider_intention_id, created_at, updated_at")
    .eq("id", paymentId)
    .eq("user_id", auth.userId) // multi-tenant: only own payments
    .maybeSingle();

  if (error) {
    console.error("[payment-status] DB error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment" },
      { status: 500 }
    );
  }

  if (!payment) {
    return NextResponse.json(
      { error: "Payment not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    paymentId: payment.id,
    status: payment.status,
    amountMinor: payment.amount,
    currency: payment.currency,
    providerIntentionId: payment.provider_intention_id,
    createdAt: payment.created_at,
    updatedAt: payment.updated_at,
  });
}
