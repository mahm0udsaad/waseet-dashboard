"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ActionDropdown } from "@/components/admin/ActionDropdown";
import { ConfirmationModal } from "@/components/admin/ConfirmationModal";
import { NotificationModal } from "@/components/admin/NotificationModal";
import { ToggleSwitch } from "@/components/admin/ToggleSwitch";

type UserRowActionsProps = {
  userId: string;
  displayName: string;
  status: string;
};

export function UserRowActions({
  userId,
  displayName,
  status,
}: UserRowActionsProps) {
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);
  const [showNotify, setShowNotify] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/delete`, {
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

  return (
    <div className="flex items-center gap-3">
      <ToggleSwitch
        checked={status === "banned"}
        entityId={userId}
        onEndpoint={`/api/admin/users/${userId}/ban`}
        offEndpoint={`/api/admin/users/${userId}/unban`}
        labelOn="محظور"
        labelOff="نشط"
      />

      <ActionDropdown
        items={[
          {
            label: "عرض التفاصيل",
            href: `/users/${userId}`,
          },
          {
            label: "إرسال إشعار",
            onClick: () => setShowNotify(true),
          },
          {
            label: "حذف المستخدم",
            variant: "danger",
            onClick: () => setShowDelete(true),
          },
        ]}
      />

      <ConfirmationModal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="حذف المستخدم"
        message={`هل أنت متأكد من حذف المستخدم "${displayName}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="حذف"
        variant="danger"
        loading={deleteLoading}
      />

      <NotificationModal
        open={showNotify}
        onClose={() => setShowNotify(false)}
        recipients={[{ id: userId, label: displayName }]}
        entityType="user"
        entityId={userId}
      />
    </div>
  );
}
