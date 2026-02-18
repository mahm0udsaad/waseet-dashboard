"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ActionDropdown } from "@/components/admin/ActionDropdown";
import { ConfirmationModal } from "@/components/admin/ConfirmationModal";

type CompletionRequestRowActionsProps = {
  requestId: string;
  orderId: string;
  status: string;
};

export function CompletionRequestRowActions({
  requestId,
  orderId,
  status,
}: CompletionRequestRowActionsProps) {
  const router = useRouter();
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rejectComment, setRejectComment] = useState("");

  const isPending = status === "pending";

  async function handleApprove() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/completion-requests/${requestId}/approve`, {
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

  async function handleReject() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/completion-requests/${requestId}/reject`, {
        method: "POST",
        headers: { accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ admin_comment: rejectComment }),
      });
      if (!res.ok) throw new Error("Failed");
      setShowReject(false);
      setRejectComment("");
      router.refresh();
    } catch {
      // keep modal open
    } finally {
      setLoading(false);
    }
  }

  // Escape key for reject modal
  useEffect(() => {
    if (!showReject) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShowReject(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [showReject]);

  const items = [
    { label: "عرض الطلب الأصلي", href: `/damin-orders/${orderId}` },
    ...(isPending
      ? [
          { label: "قبول الطلب", onClick: () => setShowApprove(true) },
          {
            label: "رفض الطلب",
            variant: "danger" as const,
            onClick: () => setShowReject(true),
          },
        ]
      : []),
  ];

  return (
    <>
      <ActionDropdown items={items} />

      <ConfirmationModal
        open={showApprove}
        onClose={() => setShowApprove(false)}
        onConfirm={handleApprove}
        title="قبول طلب الاكتمال"
        message="سيتم اكتمال الطلب وإطلاق مبلغ الخدمة للمستفيد. هل أنت متأكد؟"
        confirmLabel="قبول وإطلاق المبلغ"
        variant="warning"
        loading={loading}
      />

      {/* Custom reject modal with comment */}
      {showReject && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowReject(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-900">رفض طلب الاكتمال</h3>
            <p className="mt-2 text-sm text-slate-600">
              سيتم إرجاع الطلب لحالة &quot;بانتظار اكتمال الخدمة&quot;. يمكنك إضافة سبب الرفض.
            </p>
            <textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="سبب الرفض (اختياري)"
              className="mt-3 w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
              rows={3}
            />
            <div className="mt-4 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowReject(false)}
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
                {loading ? "جارٍ..." : "رفض الطلب"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
