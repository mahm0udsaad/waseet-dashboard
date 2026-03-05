"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ActionDropdown } from "@/components/admin/ActionDropdown";
import { ConfirmationModal } from "@/components/admin/ConfirmationModal";
import { NotificationModal } from "@/components/admin/NotificationModal";
import { UserInfoModal } from "@/components/admin/UserInfoModal";

type OrderRowActionsProps = {
  orderId: string;
  status: string;
  buyerId?: string | null;
  sellerId?: string | null;
  buyerName: string;
  sellerName: string;
  conversationId?: string | null;
  receiptId?: string | null;
  paymentMethod?: string | null;
};

function RejectTransferModal({
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

  if (!open) return null;

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

  return (
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
        <div className="mt-4 flex gap-3 justify-end">
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
    </div>
  );
}

export function OrderRowActions({
  orderId,
  status,
  buyerId,
  sellerId,
  buyerName,
  sellerName,
  conversationId,
  receiptId,
  paymentMethod,
}: OrderRowActionsProps) {
  const router = useRouter();
  const [showCancel, setShowCancel] = useState(false);
  const [showApproveTransfer, setShowApproveTransfer] = useState(false);
  const [showRejectTransfer, setShowRejectTransfer] = useState(false);
  const [showNotify, setShowNotify] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const userIds = [buyerId, sellerId].filter(Boolean) as string[];

  const recipients = [
    ...(buyerId ? [{ id: buyerId, label: `المشتري: ${buyerName}` }] : []),
    ...(sellerId ? [{ id: sellerId, label: `البائع: ${sellerName}` }] : []),
  ];

  async function handleCancel() {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { accept: "application/json" },
      });
      if (!res.ok) throw new Error("Failed");
      setShowCancel(false);
      router.refresh();
    } catch {
      // keep modal open
    } finally {
      setActionLoading(false);
    }
  }

  async function handleApproveTransfer() {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/approve-transfer`, {
        method: "POST",
        headers: { accept: "application/json" },
      });
      if (!res.ok) throw new Error("Failed");
      setShowApproveTransfer(false);
      router.refresh();
    } catch {
      // keep modal open
    } finally {
      setActionLoading(false);
    }
  }

  const canCancel = status !== "completed" && status !== "cancelled";
  const canApproveTransfer =
    status === "awaiting_admin_transfer_approval" &&
    paymentMethod === "bank_transfer";

  const items = [
    { label: "عرض التفاصيل", href: `/orders/${orderId}` },
    ...(conversationId
      ? [{ label: "عرض المحادثة", href: `/chats?conversation=${conversationId}` }]
      : []),
    ...(receiptId
      ? [{ label: "عرض الإيصال", href: `/receipts?id=${receiptId}` }]
      : []),
    {
      label: "عرض معلومات الأطراف",
      onClick: () => setShowUsers(true),
    },
    ...(canApproveTransfer
      ? [
          { label: "تأكيد التحويل البنكي", onClick: () => setShowApproveTransfer(true) },
          {
            label: "رفض التحويل البنكي",
            variant: "danger" as const,
            onClick: () => setShowRejectTransfer(true),
          },
        ]
      : []),
    ...(recipients.length > 0
      ? [{ label: "إرسال إشعار", onClick: () => setShowNotify(true) }]
      : []),
    ...(canCancel
      ? [
          {
            label: "إلغاء الطلب",
            variant: "danger" as const,
            onClick: () => setShowCancel(true),
          },
        ]
      : []),
  ];

  return (
    <>
      <ActionDropdown items={items} />

      <ConfirmationModal
        open={showApproveTransfer}
        onClose={() => setShowApproveTransfer(false)}
        onConfirm={handleApproveTransfer}
        title="تأكيد التحويل البنكي"
        message="هل تم التحقق من إيصال التحويل البنكي؟ سيتم تأكيد استلام المبلغ وإشعار المستخدمين."
        confirmLabel="تأكيد التحويل"
        variant="warning"
        loading={actionLoading}
      />

      <RejectTransferModal
        open={showRejectTransfer}
        onClose={() => setShowRejectTransfer(false)}
        orderId={orderId}
      />

      <ConfirmationModal
        open={showCancel}
        onClose={() => setShowCancel(false)}
        onConfirm={handleCancel}
        title="إلغاء الطلب"
        message="هل أنت متأكد من إلغاء هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="إلغاء الطلب"
        variant="danger"
        loading={actionLoading}
      />

      <UserInfoModal
        open={showUsers}
        onClose={() => setShowUsers(false)}
        userIds={userIds}
      />

      <NotificationModal
        open={showNotify}
        onClose={() => setShowNotify(false)}
        recipients={recipients}
        entityType="order"
        entityId={orderId}
      />
    </>
  );
}
