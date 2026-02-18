"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
};

export function OrderRowActions({
  orderId,
  status,
  buyerId,
  sellerId,
  buyerName,
  sellerName,
  conversationId,
  receiptId,
}: OrderRowActionsProps) {
  const router = useRouter();
  const [showCancel, setShowCancel] = useState(false);
  const [showNotify, setShowNotify] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const userIds = [buyerId, sellerId].filter(Boolean) as string[];

  const recipients = [
    ...(buyerId ? [{ id: buyerId, label: `المشتري: ${buyerName}` }] : []),
    ...(sellerId ? [{ id: sellerId, label: `البائع: ${sellerName}` }] : []),
  ];

  async function handleCancel() {
    setCancelLoading(true);
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
      setCancelLoading(false);
    }
  }

  const canCancel = status !== "completed" && status !== "cancelled";

  const items = [
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
        open={showCancel}
        onClose={() => setShowCancel(false)}
        onConfirm={handleCancel}
        title="إلغاء الطلب"
        message="هل أنت متأكد من إلغاء هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="إلغاء الطلب"
        variant="danger"
        loading={cancelLoading}
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
