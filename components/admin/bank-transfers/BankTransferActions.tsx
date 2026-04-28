"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import { ConfirmationModal } from "@/components/admin/ConfirmationModal";

type Props = {
  orderId: string;
  showLabels?: boolean;
};

function RejectModal({
  open,
  onClose,
  orderId,
}: {
  open: boolean;
  onClose: () => void;
  orderId: string;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  async function handleReject() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/reject-transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", accept: "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error("Failed");
      onClose();
      setReason("");
      router.refresh();
    } catch {
      // keep modal open
    } finally {
      setLoading(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-slate-900">رفض التحويل البنكي</h3>
        <p className="mt-2 text-sm text-slate-600">
          سيتم رفض التحويل وإعادة الطلب لحالة انتظار الدفع. سيتم إشعار المستخدم.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="سبب الرفض (اختياري)"
          className="mt-3 w-full rounded-xl border border-[var(--border)] p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[var(--brand)] focus:outline-none"
          rows={3}
        />
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
            onClick={handleReject}
            disabled={loading}
            className="rounded-full bg-rose-500 px-4 py-2 text-sm text-white hover:bg-rose-600 disabled:opacity-50"
          >
            {loading ? "جارٍ..." : "رفض التحويل"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function BankTransferActions({ orderId, showLabels = true }: Props) {
  const router = useRouter();
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/approve-transfer`, {
        method: "POST",
        headers: { accept: "application/json" },
      });
      if (!res.ok) throw new Error("Failed");
      setShowApprove(false);
      router.refresh();
    } catch {
      // keep modal open
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowApprove(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <Check className="h-3.5 w-3.5" />
          {showLabels ? "تأكيد التحويل" : null}
        </button>
        <button
          type="button"
          onClick={() => setShowReject(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-rose-600 transition hover:border-rose-400 hover:bg-rose-50"
        >
          <X className="h-3.5 w-3.5" />
          {showLabels ? "رفض" : null}
        </button>
      </div>

      <ConfirmationModal
        open={showApprove}
        onClose={() => setShowApprove(false)}
        onConfirm={handleApprove}
        title="تأكيد التحويل البنكي"
        message="هل تم التحقق من إيصال التحويل البنكي؟ سيتم تأكيد استلام المبلغ وإشعار المستخدمين."
        confirmLabel="تأكيد التحويل"
        variant="warning"
        loading={loading}
      />

      <RejectModal
        open={showReject}
        onClose={() => setShowReject(false)}
        orderId={orderId}
      />
    </>
  );
}
