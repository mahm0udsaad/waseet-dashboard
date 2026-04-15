"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AirportStartButton({ requestId }: { requestId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleStart = async () => {
    setLoading(true);
    try {
      // Start endpoint now handles: status change + conversation creation + receipt message
      await fetch(`/api/admin/airport-requests/${requestId}/start`, {
        method: "POST",
        headers: { accept: "application/json" },
      });

      // Redirect to the dedicated chat page
      router.push(`/airport-chats/${requestId}`);
    } catch {
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleStart}
      disabled={loading}
      className="rounded-full bg-[var(--brand)] px-5 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
    >
      {loading ? "جارٍ البدء..." : "بدء التنفيذ"}
    </button>
  );
}
