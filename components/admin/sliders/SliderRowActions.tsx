"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ActionDropdown } from "@/components/admin/ActionDropdown";
import { ConfirmationModal } from "@/components/admin/ConfirmationModal";

type SliderRowActionsProps = {
  sliderId: string;
  isActive: boolean;
};

export function SliderRowActions({ sliderId, isActive }: SliderRowActionsProps) {
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    await fetch(`/api/admin/banners/${sliderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({ is_active: !isActive }),
    });
    router.refresh();
  }

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/banners/${sliderId}`, {
        method: "DELETE",
        headers: { accept: "application/json" },
      });
      if (!res.ok) throw new Error("Failed");
      setShowDelete(false);
      router.refresh();
    } catch {
      // keep modal open
    } finally {
      setLoading(false);
    }
  }

  const items = [
    { label: "تعديل", href: `/sliders/${sliderId}/edit` },
    {
      label: isActive ? "إيقاف" : "تفعيل",
      onClick: handleToggle,
    },
    {
      label: "حذف",
      variant: "danger" as const,
      onClick: () => setShowDelete(true),
    },
  ];

  return (
    <>
      <ActionDropdown items={items} />

      <ConfirmationModal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="حذف السلايدر"
        message="هل أنت متأكد من حذف هذا السلايدر؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف"
        variant="danger"
        loading={loading}
      />
    </>
  );
}
