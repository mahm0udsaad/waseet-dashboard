"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Recipient = {
  id: string;
  label: string;
};

type NotificationModalProps = {
  open: boolean;
  onClose: () => void;
  recipients: Recipient[];
  entityType?: string;
  entityId?: string;
};

export function NotificationModal({
  open,
  onClose,
  recipients,
  entityType,
  entityId,
}: NotificationModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setSelectedIds(recipients.map((r) => r.id));
      setTitle("");
      setBody("");
      setSuccess(false);
    }
  }, [open, recipients]);

  if (!open || typeof document === "undefined") return null;

  function toggleRecipient(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleAll() {
    if (selectedIds.length === recipients.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(recipients.map((r) => r.id));
    }
  }

  async function handleSend() {
    if (selectedIds.length === 0 || !title.trim() || !body.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientIds: selectedIds,
          title: title.trim(),
          body: body.trim(),
          entityType,
          entityId,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setSuccess(true);
      setTimeout(() => onClose(), 1200);
    } catch {
      // stay open on error
    } finally {
      setLoading(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-slate-900">إرسال إشعار</h3>

        {success ? (
          <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-center text-sm text-emerald-700">
            تم إرسال الإشعار بنجاح
          </div>
        ) : (
          <>
            <div className="mt-4 space-y-3">
              <div>
                <p className="mb-1.5 text-xs text-slate-500">المستلمون</p>
                <div className="flex flex-wrap gap-2">
                  {recipients.length > 1 && (
                    <label className="flex items-center gap-1.5 rounded-full border border-[var(--border)] px-2.5 py-1 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === recipients.length}
                        onChange={toggleAll}
                        className="accent-[var(--brand)]"
                      />
                      الكل
                    </label>
                  )}
                  {recipients.map((r) => (
                    <label
                      key={r.id}
                      className="flex items-center gap-1.5 rounded-full border border-[var(--border)] px-2.5 py-1 text-xs cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(r.id)}
                        onChange={() => toggleRecipient(r.id)}
                        className="accent-[var(--brand)]"
                      />
                      {r.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-xs text-slate-500">عنوان الإشعار</p>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="عنوان الإشعار"
                  className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
                />
              </div>

              <div>
                <p className="mb-1.5 text-xs text-slate-500">نص الإشعار</p>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="نص الإشعار"
                  rows={3}
                  className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)] resize-none"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
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
                onClick={handleSend}
                disabled={
                  loading ||
                  selectedIds.length === 0 ||
                  !title.trim() ||
                  !body.trim()
                }
                className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {loading ? "جارٍ الإرسال..." : "إرسال"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
