"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ActionDropdown } from "@/components/admin/ActionDropdown";

type TargetStatus = "succeeded" | "failed" | "refunded" | "canceled";

type Props = {
  paymentId: string;
  status: string;
};

const TARGETS: Record<
  TargetStatus,
  { label: string; description: string; confirmLabel: string; tone: "success" | "danger" | "neutral" }
> = {
  succeeded: {
    label: "تأكيد العملية يدوياً (نجحت)",
    description:
      "سيتم تعليم العملية بأنها ناجحة. استخدم هذا فقط إذا تأكدت من وصول المبلغ.",
    confirmLabel: "تأكيد النجاح",
    tone: "success",
  },
  failed: {
    label: "تعليم العملية كفاشلة",
    description: "سيتم تعليم العملية بأنها فاشلة. لن يتم استرداد أي مبلغ تلقائياً.",
    confirmLabel: "تأكيد الفشل",
    tone: "danger",
  },
  refunded: {
    label: "تسجيل استرداد المبلغ",
    description:
      "سيتم تسجيل أن المبلغ تم استرداده. هذا الإجراء يسجّل الحالة فقط ولا ينفذ تحويلاً مالياً.",
    confirmLabel: "تأكيد الاسترداد",
    tone: "neutral",
  },
  canceled: {
    label: "إلغاء العملية",
    description: "سيتم إلغاء العملية وتعليمها كملغاة.",
    confirmLabel: "تأكيد الإلغاء",
    tone: "danger",
  },
};

function ActionModal({
  open,
  onClose,
  paymentId,
  target,
}: {
  open: boolean;
  onClose: () => void;
  paymentId: string;
  target: TargetStatus | null;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setNote("");
    setError(null);
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open || !target || typeof document === "undefined") return null;
  const meta = TARGETS[target];

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/update-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json", accept: "application/json" },
        body: JSON.stringify({ targetStatus: target, note }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "فشل تنفيذ الإجراء");
      }
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل تنفيذ الإجراء");
    } finally {
      setLoading(false);
    }
  }

  const confirmClass =
    meta.tone === "success"
      ? "bg-emerald-600 hover:bg-emerald-700"
      : meta.tone === "danger"
        ? "bg-rose-600 hover:bg-rose-700"
        : "bg-slate-900 hover:bg-slate-800";

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-slate-900">{meta.label}</h3>
        <p className="mt-2 text-sm text-slate-600">{meta.description}</p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="ملاحظة الإدارة (اختياري — تُحفظ للتدقيق)"
          className="mt-3 w-full rounded-xl border border-[var(--border)] p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[var(--brand)] focus:outline-none"
          rows={3}
        />
        {error ? (
          <p className="mt-2 text-xs text-rose-600">{error}</p>
        ) : null}
        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className={`rounded-full px-4 py-2 text-sm text-white disabled:opacity-50 ${confirmClass}`}
          >
            {loading ? "جارٍ..." : meta.confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function PaymentRowActions({ paymentId, status }: Props) {
  const [target, setTarget] = useState<TargetStatus | null>(null);

  // What targets are valid given current status
  const candidates: TargetStatus[] = (() => {
    const base: TargetStatus[] = [];
    if (status !== "succeeded") base.push("succeeded");
    if (status !== "failed") base.push("failed");
    if (status === "succeeded") base.push("refunded");
    if (status !== "canceled" && status !== "succeeded") base.push("canceled");
    return base;
  })();

  if (candidates.length === 0) {
    return <span className="text-xs text-slate-300">—</span>;
  }

  const items = candidates.map((c) => ({
    label: TARGETS[c].label,
    onClick: () => setTarget(c),
    variant: (TARGETS[c].tone === "danger" ? "danger" : undefined) as
      | "danger"
      | undefined,
  }));

  return (
    <>
      <ActionDropdown items={items} />
      <ActionModal
        open={target !== null}
        onClose={() => setTarget(null)}
        paymentId={paymentId}
        target={target}
      />
    </>
  );
}
