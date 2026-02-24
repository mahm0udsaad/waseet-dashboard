import crypto from "crypto";

// ── Env helpers ──────────────────────────────────────────────────────

function env(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}

function envOptional(key: string): string | undefined {
  return process.env[key] || undefined;
}

export const paymobConfig = {
  get baseUrl() {
    return env("PAYMOB_BASE_URL"); // https://ksa.paymob.com
  },
  get secretKey() {
    return env("PAYMOB_SECRET_KEY");
  },
  get publicKey() {
    return env("PAYMOB_PUBLIC_KEY");
  },
  get integrationIdCard() {
    return parseInt(env("PAYMOB_INTEGRATION_ID_CARD"), 10);
  },
  get integrationIdApplePay() {
    return parseInt(env("PAYMOB_INTEGRATION_ID_APPLE_PAY"), 10);
  },
  get currency() {
    return env("PAYMOB_CURRENCY");
  },
  get webhookUrl() {
    return envOptional("PAYMOB_WEBHOOK_URL");
  },
  get returnUrl() {
    return envOptional("PAYMOB_RETURN_URL");
  },
  get hmacSecret() {
    return envOptional("PAYMOB_HMAC_SECRET");
  },
};

// ── Paymob Intention API ─────────────────────────────────────────────

export interface CreateIntentionInput {
  amount: number; // minor units (halala)
  currency: string;
  paymentMethods: number[];
  billingData: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    country?: string;
    city?: string;
  };
  items?: Array<{ name: string; amount: number; quantity?: number }>;
  notificationUrl?: string;
  redirectionUrl?: string;
  extras?: Record<string, string>;
  specialReference?: string;
}

export interface PaymobIntentionResponse {
  id: string;
  client_secret: string;
  intention_order_id?: string;
  payment_keys?: Array<{ key: string; integration: number }>;
  status?: string;
  [key: string]: unknown;
}

export async function createPaymobIntention(
  input: CreateIntentionInput
): Promise<PaymobIntentionResponse> {
  const url = `${paymobConfig.baseUrl}/v1/intention/`;

  const body = {
    amount: input.amount,
    currency: input.currency,
    payment_methods: input.paymentMethods,
    billing_data: {
      first_name: input.billingData.first_name,
      last_name: input.billingData.last_name,
      email: input.billingData.email,
      phone_number: input.billingData.phone_number,
      country: input.billingData.country ?? "SA",
      city: input.billingData.city ?? "Riyadh",
    },
    items: input.items ?? [
      { name: "Payment", amount: input.amount, quantity: 1 },
    ],
    notification_url: input.notificationUrl ?? paymobConfig.webhookUrl,
    redirection_url: input.redirectionUrl ?? paymobConfig.returnUrl,
    extras: input.extras ?? {},
    special_reference: input.specialReference,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Token ${paymobConfig.secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Paymob intention failed (${res.status}): ${text}`);
  }

  return res.json();
}

// ── HMAC Verification ────────────────────────────────────────────────
// Paymob sends an `hmac` query parameter on callbacks.
// Verification: concatenate specific fields from the transaction object
// in alphabetical order, then HMAC-SHA512 with your HMAC secret.

const HMAC_FIELDS = [
  "amount_cents",
  "created_at",
  "currency",
  "error_occured",
  "has_parent_transaction",
  "id",
  "integration_id",
  "is_3d_secure",
  "is_auth",
  "is_capture",
  "is_refunded",
  "is_standalone_payment",
  "is_voided",
  "order.id",
  "owner",
  "pending",
  "source_data.pan",
  "source_data.sub_type",
  "source_data.type",
  "success",
] as const;

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return "";
    current = (current as Record<string, unknown>)[part];
  }
  return String(current ?? "");
}

export function verifyPaymobHmac(
  transactionObj: Record<string, unknown>,
  receivedHmac: string
): boolean {
  const secret = paymobConfig.hmacSecret;
  if (!secret) {
    console.warn(
      "[paymob] PAYMOB_HMAC_SECRET not set — skipping HMAC verification"
    );
    return true; // Accept but log warning
  }

  const concatenated = HMAC_FIELDS.map((field) =>
    getNestedValue(transactionObj, field)
  ).join("");

  const calculated = crypto
    .createHmac("sha512", secret)
    .update(concatenated)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(calculated, "hex"),
    Buffer.from(receivedHmac, "hex")
  );
}
