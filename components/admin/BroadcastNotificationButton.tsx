"use client";

import { useEffect, useState } from "react";

export function BroadcastNotificationButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
      >
        إرسال إشعار للجميع
      </button>

      {open && <BroadcastModal onClose={() => setOpen(false)} />}
    </>
  );
}

function BroadcastModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    count?: number;
  } | null>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function handleSend() {
    if (!title.trim() || !body.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: body.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult({ success: true, count: data.recipientCount });
      setTimeout(() => onClose(), 2000);
    } catch {
      setResult({ success: false });
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
        <h3 className="text-lg font-semibold text-slate-900">
          إرسال إشعار لجميع المستخدمين
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          سيتم إرسال الإشعار لجميع المستخدمين النشطين.
        </p>

        {result ? (
          <div
            className={`mt-4 rounded-xl p-4 text-center text-sm ${
              result.success
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            {result.success
              ? `تم إرسال الإشعار بنجاح إلى ${result.count} مستخدم`
              : "فشل في إرسال الإشعار"}
          </div>
        ) : (
          <>
            <div className="mt-4 space-y-3">
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
                disabled={loading || !title.trim() || !body.trim()}
                className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {loading ? "جارٍ الإرسال..." : "إرسال للجميع"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
