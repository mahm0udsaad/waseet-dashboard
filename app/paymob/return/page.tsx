"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

type PaymentStatus =
  | "created"
  | "pending"
  | "succeeded"
  | "failed"
  | "canceled";

interface StatusResult {
  paymentId: string;
  status: PaymentStatus;
  amountMinor: number;
  currency: string;
}

const STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; color: string; icon: string }
> = {
  created: { label: "جاري التحميل…", color: "text-gray-500", icon: "⏳" },
  pending: { label: "جاري المعالجة…", color: "text-amber-600", icon: "⏳" },
  succeeded: { label: "تم الدفع بنجاح", color: "text-emerald-600", icon: "✓" },
  failed: { label: "فشل الدفع", color: "text-red-600", icon: "✗" },
  canceled: { label: "تم إلغاء الدفع", color: "text-gray-500", icon: "✗" },
};

function PaymentReturn() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("payment_id") ?? searchParams.get("merchant_order_id");
  const [result, setResult] = useState<StatusResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!paymentId) {
      setError("لم يتم العثور على معرف الدفع");
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 30; // ~60s at 2s interval

    async function poll() {
      while (!cancelled && attempts < maxAttempts) {
        try {
          const res = await fetch(
            `/api/paymob/payment-status?paymentId=${paymentId}`
          );
          if (!res.ok) {
            // If 401/404, stop polling
            if (res.status === 401 || res.status === 404) {
              setError("الدفع غير موجود أو غير مصرح");
              return;
            }
            throw new Error(`HTTP ${res.status}`);
          }
          const data: StatusResult = await res.json();
          setResult(data);

          // Stop polling if terminal
          if (["succeeded", "failed", "canceled"].includes(data.status)) {
            return;
          }
        } catch {
          // Ignore transient errors, keep polling
        }

        attempts++;
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [paymentId]);

  const status = result?.status ?? "pending";
  const config = STATUS_CONFIG[status];

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-lg">
          <div className="mb-4 text-4xl">⚠️</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="mb-4 text-5xl">{config.icon}</div>
        <h1 className={`mb-2 text-xl font-bold ${config.color}`}>
          {config.label}
        </h1>

        {result && status === "succeeded" && (
          <p className="mt-2 text-gray-500">
            {(result.amountMinor / 100).toFixed(2)} {result.currency}
          </p>
        )}

        {["created", "pending"].includes(status) && (
          <div className="mt-6 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-red-500" />
          </div>
        )}

        {["succeeded", "failed", "canceled"].includes(status) && (
          <p className="mt-6 text-sm text-gray-400">
            يمكنك إغلاق هذه الصفحة
          </p>
        )}
      </div>
    </div>
  );
}

export default function PaymobReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-red-500" />
        </div>
      }
    >
      <PaymentReturn />
    </Suspense>
  );
}
