"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ActionDropdown } from "@/components/admin/ActionDropdown";
import { ConfirmationModal } from "@/components/admin/ConfirmationModal";
import { NotificationModal } from "@/components/admin/NotificationModal";
import { UserInfoModal } from "@/components/admin/UserInfoModal";

type DaminOrderRowActionsProps = {
  orderId: string;
  status: string;
  payerUserId?: string | null;
  beneficiaryUserId?: string | null;
  payerName: string;
  beneficiaryName: string;
  metadata?: Record<string, string>;
};

export function DaminOrderRowActions({
  orderId,
  status,
  payerUserId,
  beneficiaryUserId,
  payerName,
  beneficiaryName,
  metadata,
}: DaminOrderRowActionsProps) {
  const router = useRouter();
  const [showCancel, setShowCancel] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [showNotify, setShowNotify] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const userIds = [payerUserId, beneficiaryUserId].filter(Boolean) as string[];

  const recipients = [
    ...(payerUserId
      ? [{ id: payerUserId, label: `الدافع: ${payerName}` }]
      : []),
    ...(beneficiaryUserId
      ? [{ id: beneficiaryUserId, label: `المستفيد: ${beneficiaryName}` }]
      : []),
  ];

  async function handleCancel() {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/damin-orders/${orderId}/cancel`, {
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

  async function handleVerifyPayment() {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/damin-orders/${orderId}/resolve`, {
        method: "POST",
        headers: { accept: "application/json" },
      });
      if (!res.ok) throw new Error("Failed");
      setShowVerify(false);
      router.refresh();
    } catch {
      // keep modal open
    } finally {
      setActionLoading(false);
    }
  }

  async function handleComplete() {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/damin-orders/${orderId}/complete`, {
        method: "POST",
        headers: { accept: "application/json" },
      });
      if (!res.ok) throw new Error("Failed");
      setShowComplete(false);
      router.refresh();
    } catch {
      // keep modal open
    } finally {
      setActionLoading(false);
    }
  }

  const canCancel = status !== "completed" && status !== "cancelled";
  const canVerify = status === "payment_submitted" && metadata?.payment_method === "bank_transfer";
  const canComplete = status === "awaiting_completion" || status === "payment_submitted";

  const items = [
    { label: "عرض التفاصيل", href: `/damin-orders/${orderId}` },
    {
      label: "عرض معلومات الأطراف",
      onClick: () => setShowUsers(true),
    },
    ...(canVerify
      ? [{ label: "تأكيد الدفع", onClick: () => setShowVerify(true) }]
      : []),
    ...(canComplete
      ? [{ label: "إكمال الطلب", onClick: () => setShowComplete(true) }]
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
        open={showVerify}
        onClose={() => setShowVerify(false)}
        onConfirm={handleVerifyPayment}
        title="تأكيد الدفع"
        message="هل تم التحقق من إيصال التحويل البنكي؟ سيتم تأكيد استلام المبلغ في الضمان."
        confirmLabel="تأكيد الدفع"
        variant="warning"
        loading={actionLoading}
      />

      <ConfirmationModal
        open={showComplete}
        onClose={() => setShowComplete(false)}
        onConfirm={handleComplete}
        title="إكمال الطلب"
        message="سيتم إكمال الطلب وإطلاق المبلغ لمقدم الخدمة. هل أنت متأكد؟"
        confirmLabel="إكمال الطلب"
        variant="warning"
        loading={actionLoading}
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
        entityType="damin_order"
        entityId={orderId}
      />
    </>
  );
}
