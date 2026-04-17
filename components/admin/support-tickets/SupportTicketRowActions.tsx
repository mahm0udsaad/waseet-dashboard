"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createPortal } from "react-dom";
import { ActionDropdown } from "@/components/admin/ActionDropdown";

type Props = {
  ticketId: string;
  status: string;
  priority: string;
  currentResponse: string;
};

type ActionKind = "reply" | "in_progress" | "resolve" | "close" | "priority";

const PRIORITIES = [
  { value: "low", label: "منخفضة" },
  { value: "normal", label: "عادية" },
  { value: "high", label: "عالية" },
  { value: "urgent", label: "عاجلة" },
];

export function SupportTicketRowActions({
  ticketId,
  status,
  priority,
  currentResponse,
}: Props) {
  const router = useRouter();
  const [openAction, setOpenAction] = useState<ActionKind | null>(null);
  const [response, setResponse] = useState(currentResponse);
  const [newPriority, setNewPriority] = useState(priority);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!openAction) return;
    setLoading(true);
    try {
      const payload: Record<string, unknown> = { action: openAction };
      if (openAction === "reply" || openAction === "resolve" || openAction === "close") {
        payload.admin_response = response;
      }
      if (openAction === "priority") payload.priority = newPriority;

      const res = await fetch(`/api/admin/support-tickets/${ticketId}`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
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
    { label: "إرسال رد للمستخدم", onClick: () => setOpenAction("reply") },
    ...(status !== "in_progress" && status !== "resolved" && status !== "closed"
      ? [{ label: "وضع قيد المعالجة", onClick: () => setOpenAction("in_progress") }]
      : []),
    ...(status !== "resolved"
      ? [{ label: "تحديد كمحلولة", onClick: () => setOpenAction("resolve") }]
      : []),
    ...(status !== "closed"
      ? [
          {
            label: "إغلاق التذكرة",
            variant: "danger" as const,
            onClick: () => setOpenAction("close"),
          },
        ]
      : []),
    { label: "تعديل الأولوية", onClick: () => setOpenAction("priority") },
  ];

  const requiresResponse =
    openAction === "reply" || openAction === "resolve" || openAction === "close";

  const titleMap: Record<ActionKind, string> = {
    reply: "إرسال رد للمستخدم",
    in_progress: "وضع التذكرة قيد المعالجة",
    resolve: "تحديد التذكرة كمحلولة",
    close: "إغلاق التذكرة",
    priority: "تعديل الأولوية",
  };

  const subtitleMap: Record<ActionKind, string> = {
    reply: "سيصل الرد للمستخدم كإشعار فوري داخل التطبيق.",
    in_progress: "سيتم تغيير حالة التذكرة لـ\"قيد المعالجة\".",
    resolve: "سيتم وضع التذكرة كمحلولة وإرسال الرد للمستخدم.",
    close: "سيتم إغلاق التذكرة وإشعار المستخدم.",
    priority: "تحديث الأولوية لتنظيم العمل الداخلي.",
  };

  return (
    <>
      <ActionDropdown items={items} />

      {openAction &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-slate-900">
                {titleMap[openAction]}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {subtitleMap[openAction]}
              </p>

              {requiresResponse ? (
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="نص الرد"
                  className="mt-3 min-h-[110px] w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
                />
              ) : null}

              {openAction === "priority" ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {PRIORITIES.map((p) => {
                    const active = newPriority === p.value;
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setNewPriority(p.value)}
                        className={`rounded-full border px-3 py-1.5 text-xs ${
                          active
                            ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                            : "border-[var(--border)] text-slate-700 hover:border-[var(--brand)]"
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
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
                  onClick={submit}
                  className={`rounded-full px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50 ${
                    openAction === "close"
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
