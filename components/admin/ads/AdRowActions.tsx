"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ActionDropdown } from "@/components/admin/ActionDropdown";
import { ConfirmationModal } from "@/components/admin/ConfirmationModal";
import { NotificationModal } from "@/components/admin/NotificationModal";
import { ToggleSwitch } from "@/components/admin/ToggleSwitch";
import { UserInfoModal } from "@/components/admin/UserInfoModal";

type AdRowActionsProps = {
  adId: string;
  adTitle: string;
  status: string;
  ownerId: string;
  ownerName: string;
  conversationId?: string | null;
};

export function AdRowActions({
  adId,
  adTitle,
  status,
  ownerId,
  ownerName,
  conversationId,
}: AdRowActionsProps) {
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);
  const [showNotify, setShowNotify] = useState(false);
  const [showOwner, setShowOwner] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/ads/${adId}/delete`, {
        method: "POST",
        headers: { accept: "application/json" },
      });
      if (!res.ok) throw new Error("Failed");
      setShowDelete(false);
      router.refresh();
    } catch {
      // keep modal open
    } finally {
      setDeleteLoading(false);
    }
  }

  const dropdownItems = [
    { label: "عرض التفاصيل", href: `/ads/${adId}` },
    ...(conversationId
      ? [{ label: "عرض المحادثة", href: `/chats?conversation=${conversationId}` }]
      : []),
    {
      label: "عرض معلومات المالك",
      onClick: () => setShowOwner(true),
    },
    {
      label: "إرسال إشعار للمالك",
      onClick: () => setShowNotify(true),
    },
    {
      label: "حذف الإعلان",
      variant: "danger" as const,
      onClick: () => setShowDelete(true),
    },
  ];

  return (
    <div className="flex items-center gap-3">
      <ToggleSwitch
        checked={status === "blocked"}
        entityId={adId}
        onEndpoint={`/api/admin/ads/${adId}/block`}
        offEndpoint={`/api/admin/ads/${adId}/unblock`}
        labelOn="محجوب"
        labelOff="نشط"
      />

      <ActionDropdown items={dropdownItems} />

      <ConfirmationModal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="حذف الإعلان"
        message={`هل أنت متأكد من حذف الإعلان "${adTitle}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="حذف"
        variant="danger"
        loading={deleteLoading}
      />

      <UserInfoModal
        open={showOwner}
        onClose={() => setShowOwner(false)}
        userIds={[ownerId]}
      />

      <NotificationModal
        open={showNotify}
        onClose={() => setShowNotify(false)}
        recipients={[{ id: ownerId, label: ownerName }]}
        entityType="ad"
        entityId={adId}
      />
    </div>
  );
}
