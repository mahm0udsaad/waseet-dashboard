"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createPortal } from "react-dom";
import { Check, Info, X } from "lucide-react";
import { ConfirmationModal } from "@/components/admin/ConfirmationModal";
import { UserInfoModal } from "@/components/admin/UserInfoModal";

type WithdrawalRowActionsProps = {
  withdrawalId: string;
  status: string;
  userId: string;
  amount: number;
};

export function WithdrawalRowActions({
  withdrawalId,
  status,
  userId,
  amount,
}: WithdrawalRowActionsProps) {
  const router = useRouter();
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNote, setAdminNote] = useState("");

  async function handleApprove() {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/withdrawals/${withdrawalId}/approve`, {
        method: "POST",
        headers: { accept: "application/json" },
      });
      if (!res.ok) throw new Error("Failed");
      setShowApprove(false);
      router.refresh();
    } catch {
      // keep modal open
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/withdrawals/${withdrawalId}/reject`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({ admin_note: adminNote }),
      });
      if (!res.ok) throw new Error("Failed");
      setShowReject(false);
      setAdminNote("");
      router.refresh();
    } catch {
      // keep modal open
    } finally {
      setActionLoading(false);
    }
  }

  const canProcess = status === "pending";

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {canProcess ? (
          <>
            <button
              type="button"
              onClick={() => setShowApprove(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <Check className="h-3.5 w-3.5" />
              موافقة
            </button>
            <button
              type="button"
              onClick={() => setShowReject(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:border-rose-400 hover:bg-rose-50"
            >
              <X className="h-3.5 w-3.5" />
              رفض
            </button>
          </>
        ) : null}
        <button
          type="button"
          onClick={() => setShowUser(true)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-slate-500 transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
          aria-label="عرض معلومات المستخدم"
          title="عرض معلومات المستخدم"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </div>

      <ConfirmationModal
        open={showApprove}
        onClose={() => setShowApprove(false)}
        onConfirm={handleApprove}
        title="الموافقة على طلب السحب"
        message={`هل أنت متأكد من الموافقة على سحب مبلغ ${amount} ر.س؟ سيتم إشعار المستخدم.`}
        confirmLabel="الموافقة"
        variant="warning"
        loading={actionLoading}
      />

      {/* Reject modal with note */}
      {showReject &&
        createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">رفض طلب السحب</h3>
            <p className="mt-1 text-sm text-slate-600">
              سيتم رفض طلب سحب بمبلغ {amount} ر.س وإشعار المستخدم.
            </p>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="سبب الرفض (اختياري)"
              className="mt-3 min-h-[100px] w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowReject(false);
                  setAdminNote("");
                }}
                className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-slate-700 transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleReject}
                className="rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-50"
              >
                {actionLoading ? "جارٍ الرفض..." : "رفض الطلب"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <UserInfoModal
        open={showUser}
        onClose={() => setShowUser(false)}
        userIds={[userId]}
      />
    </>
  );
}
