"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function sendOTP(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "فشل إرسال رمز التحقق");
          return;
        }
        setStep("otp");
      } catch (err) {
        setError("حدث خطأ أثناء إرسال رمز التحقق");
      }
    });
  }

  async function verifyOTP(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, token: otp }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "رمز التحقق غير صحيح");
          return;
        }
        router.push("/overview");
        router.refresh();
      } catch (err) {
        setError("حدث خطأ أثناء التحقق");
      }
    });
  }

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-10">
      <div className="mx-auto max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface-light)] p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          تسجيل الدخول
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {step === "phone"
            ? "أدخل رقم هاتفك لإرسال رمز التحقق"
            : "أدخل رمز التحقق المرسل إلى هاتفك"}
        </p>

        {error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {step === "phone" ? (
          <form onSubmit={sendOTP} className="mt-6 space-y-3">
            <input
              name="phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="رقم الهاتف (مثال: +966501234567)"
              className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-full bg-[var(--brand)] px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {isPending ? "جاري الإرسال..." : "إرسال رمز التحقق"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOTP} className="mt-6 space-y-3">
            <input
              name="otp"
              type="text"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="رمز التحقق (6 أرقام)"
              maxLength={6}
              className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm text-center text-2xl tracking-widest"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                  setError("");
                }}
                className="flex-1 rounded-full border border-[var(--border)] px-4 py-2 text-sm"
              >
                رجوع
              </button>
              <button
                type="submit"
                disabled={isPending || otp.length !== 6}
                className="flex-1 rounded-full bg-[var(--brand)] px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {isPending ? "جاري التحقق..." : "تحقق"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

