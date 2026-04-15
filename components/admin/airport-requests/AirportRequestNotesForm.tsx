"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AirportRequestNotesFormProps = {
  requestId: string;
  initialNotes: string;
};

export function AirportRequestNotesForm({
  requestId,
  initialNotes,
}: AirportRequestNotesFormProps) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/airport-requests/${requestId}/notes`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error("Failed");
      setSaved(true);
      router.refresh();
    } catch {
      // leave state, user can retry
    } finally {
      setSaving(false);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="space-y-3">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={4}
        placeholder="أضف ملاحظات داخلية..."
        className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-slate-900 focus:border-[var(--brand)] focus:outline-none"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {saving ? "جارٍ الحفظ..." : "حفظ الملاحظات"}
        </button>
        {saved && (
          <span className="text-xs font-medium text-emerald-600">تم الحفظ</span>
        )}
      </div>
    </div>
  );
}
