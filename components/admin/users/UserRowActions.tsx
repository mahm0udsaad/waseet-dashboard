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
  canManageUsers?: boolean;
};

export function UserRowActions({
  userId,
  displayName,
  status,
  canManageUsers = false,
}: UserRowActionsProps) {
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);
  const [showNotify, setShowNotify] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function handleDelete() {
    setDeleteError("");
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/delete`, {
        method: "POST",
        headers: { accept: "application/json" },
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error || "تعذر حذف المستخدم");
      }
      setShowDelete(false);
      router.refresh();
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "تعذر حذف المستخدم"
      );
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
        disabled={!canManageUsers}
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
          ...(canManageUsers
            ? [
                {
                  label: "حذف المستخدم",
                  variant: "danger" as const,
                  onClick: () => setShowDelete(true),
                },
              ]
            : []),
        ]}
      />

      <ConfirmationModal
        open={showDelete}
        onClose={() => {
          setShowDelete(false);
          setDeleteError("");
        }}
        onConfirm={handleDelete}
        title="حذف المستخدم"
        message={`هل أنت متأكد من حذف المستخدم "${displayName}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        errorMessage={deleteError}
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
