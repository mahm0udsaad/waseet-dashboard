import { NextResponse } from "next/server";
import { requireAuthForApi } from "@/lib/auth/requireAuthForApi";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createPaymobIntention, paymobConfig } from "@/lib/paymob";

/**
 * POST /api/paymob/create-intention
 *
 * Creates a Paymob payment intention and persists a Payment record.
 * Auth: Bearer token (mobile) or session cookie (web).
 *
 * Body:
 *   amountSar: number (e.g. 149.99)
 *   customer: { firstName, lastName, email, phone }
 *   metadata?: { orderId?, serviceId?, ... }
 */
export async function POST(request: Request) {
  // ── Auth ──
  const auth = await requireAuthForApi(request);
  if ("error" in auth) return auth.error;

  // ── Parse & validate input ──
  let body: {
    amountSar: number;
    customer: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
    metadata?: Record<string, unknown>;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { amountSar, customer, metadata } = body;

  if (!amountSar || typeof amountSar !== "number" || amountSar <= 0) {
    return NextResponse.json(
      { error: "amountSar must be a positive number" },
      { status: 400 }
    );
  }
  if (!customer?.firstName || !customer?.lastName || !customer?.email || !customer?.phone) {
    return NextResponse.json(
      { error: "customer must include firstName, lastName, email, phone" },
      { status: 400 }
    );
  }

  const amountMinor = Math.round(amountSar * 100);
  const supabase = getSupabaseServerClient();

  // ── Create Payment row ──
  const { data: payment, error: dbError } = await supabase
    .from("payments")
    .insert({
      user_id: auth.userId,
      amount: amountMinor,
      currency: paymobConfig.currency,
      provider: "paymob",
      status: "created",
      metadata: metadata ?? {},
    })
    .select("id")
    .single();

  if (dbError || !payment) {
    console.error("[create-intention] DB insert error:", dbError);
    return NextResponse.json(
      { error: "Failed to create payment record" },
      { status: 500 }
    );
  }

  // ── Call Paymob Intention API ──
  try {
    const intentionRes = await createPaymobIntention({
      amount: amountMinor,
      currency: paymobConfig.currency,
      paymentMethods: [paymobConfig.integrationIdCard],
      billingData: {
        first_name: customer.firstName,
        last_name: customer.lastName,
        email: customer.email,
        phone_number: customer.phone,
      },
      extras: {
        payment_id: payment.id,
        user_id: auth.userId,
      },
      specialReference: payment.id,
    });

    // ── Update Payment with Paymob response ──
    await supabase
      .from("payments")
      .update({
        provider_intention_id: intentionRes.id,
        provider_order_id: intentionRes.intention_order_id ?? null,
        client_secret: intentionRes.client_secret,
        status: "pending",
        raw_init_response: intentionRes as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    return NextResponse.json({
      paymentId: payment.id,
      clientSecret: intentionRes.client_secret,
      publicKey: paymobConfig.publicKey,
    });
  } catch (err) {
    console.error("[create-intention] Paymob API error:", err);

    // Mark payment as failed
    await supabase
      .from("payments")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    return NextResponse.json(
      { error: "Failed to create payment intention" },
      { status: 502 }
    );
  }
}
