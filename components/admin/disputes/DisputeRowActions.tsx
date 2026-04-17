"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createPortal } from "react-dom";
import { ActionDropdown } from "@/components/admin/ActionDropdown";

type DisputeRowActionsProps = {
  disputeId: string;
  status: string;
  currentNotes: string;
};

type ActionKind = "in_review" | "resolve" | "reject" | "note";

const ACTION_LABEL: Record<ActionKind, string> = {
  in_review: "وضع قيد المراجعة",
  resolve: "تم حل البلاغ",
  reject: "رفض البلاغ",
  note: "تحديث ملاحظات الإدارة",
};

const ACTION_TITLE: Record<ActionKind, string> = {
  in_review: "تأكيد بدء المراجعة",
  resolve: "حل البلاغ",
  reject: "رفض البلاغ",
  note: "تحديث الملاحظات الداخلية",
};

export function DisputeRowActions({
  disputeId,
  status,
  currentNotes,
}: DisputeRowActionsProps) {
  const router = useRouter();
  const [openAction, setOpenAction] = useState<ActionKind | null>(null);
  const [note, setNote] = useState(currentNotes);
  const [loading, setLoading] = useState(false);

  async function submit(kind: ActionKind) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/disputes/${disputeId}`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({ action: kind, admin_notes: note }),
      });
      if (!res.ok) throw new Error("Failed");
      setOpenAction(null);
      router.refresh();
    } catch {
      // keep modal open
    } finally {
      setLoading(false);
    }
  }

  const items = [
    ...(status !== "in_review" && status !== "resolved" && status !== "rejected"
      ? [{ label: ACTION_LABEL.in_review, onClick: () => setOpenAction("in_review") }]
      : []),
    ...(status !== "resolved"
      ? [{ label: ACTION_LABEL.resolve, onClick: () => setOpenAction("resolve") }]
      : []),
    ...(status !== "rejected"
      ? [
          {
            label: ACTION_LABEL.reject,
            variant: "danger" as const,
            onClick: () => setOpenAction("reject"),
          },
        ]
      : []),
    { label: ACTION_LABEL.note, onClick: () => setOpenAction("note") },
  ];

  const requiresNote = openAction === "resolve" || openAction === "reject" || openAction === "note";

  return (
    <>
      <ActionDropdown items={items} />

      {openAction &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-slate-900">
                {ACTION_TITLE[openAction]}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {openAction === "in_review"
                  ? "سيتم إخطار المُبلِّغ بأن البلاغ قيد المراجعة الآن."
                  : openAction === "resolve"
                  ? "سيتم وضع البلاغ كـ \"تم الحل\" وإرسال الملاحظات للمستخدم."
                  : openAction === "reject"
                  ? "سيتم رفض البلاغ وإشعار المستخدم بالسبب."
                  : "تحديث الملاحظات الداخلية فقط (دون تغيير الحالة)."}
              </p>

              {requiresNote ? (
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="ملاحظات الإدارة"
                  className="mt-3 min-h-[110px] w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
                />
              ) : null}

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpenAction(null)}
                  className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-slate-700 transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => submit(openAction)}
                  className={`rounded-full px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50 ${
                    openAction === "reject"
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "bg-[var(--brand)] hover:opacity-90"
                  }`}
                >
                  {loading ? "جارٍ التنفيذ..." : "تأكيد"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
