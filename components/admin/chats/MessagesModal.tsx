"use client";

import { useEffect, useRef, useState } from "react";
import { formatDate, formatTime } from "@/lib/format";

type Message = {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string | null;
  created_at: string;
};

type MessagesModalProps = {
  open: boolean;
  onClose: () => void;
  conversationId: string;
};

/** Group consecutive messages by date for date separators */
function getDateKey(dateStr: string) {
  return formatDate(dateStr);
}

/** Assign a stable colour per sender so each person gets a distinct bubble colour */
const SENDER_COLORS = [
  { bg: "bg-blue-100", name: "text-blue-700" },
  { bg: "bg-emerald-100", name: "text-emerald-700" },
  { bg: "bg-violet-100", name: "text-violet-700" },
  { bg: "bg-amber-100", name: "text-amber-700" },
  { bg: "bg-rose-100", name: "text-rose-700" },
  { bg: "bg-cyan-100", name: "text-cyan-700" },
];

export function MessagesModal({
  open,
  onClose,
  conversationId,
}: MessagesModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    fetch(`/api/admin/conversations/${conversationId}/messages`, {
      headers: { accept: "application/json" },
    })
      .then((r) => r.json())
      .then((data) => setMessages(data.messages ?? []))
      .catch(() => setMessages([]));
  }, [open, conversationId]);

  // Scroll to bottom when messages load
  useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [messages.length]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  // Assign colours to senders
  const senderIds = [...new Set(messages.map((m) => m.sender_id))];
  const colorMap = new Map(
    senderIds.map((id, i) => [id, SENDER_COLORS[i % SENDER_COLORS.length]])
  );
  const sideMap = new Map(
    senderIds.map((id, i) => [id, i % 2 === 0 ? "right" : "left"])
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-lg flex-col rounded-2xl border border-[var(--border)] bg-white shadow-xl"
        style={{ height: "85vh", maxHeight: "700px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              المحادثة
            </h3>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {`${messages.length} رسالة`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M12 4L4 12M4 4l8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Chat area */}
        <div
          className="flex-1 overflow-y-auto px-4 py-3"
          style={{ background: "#f8f9fb" }}
        >
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              لا توجد رسائل
            </div>
          ) : (
            <div className="space-y-1">
              {messages.map((msg, i) => {
                const dateKey = getDateKey(msg.created_at);
                const prevMsg = i > 0 ? messages[i - 1] : null;
                const prevDateKey = prevMsg ? getDateKey(prevMsg.created_at) : "";
                const showDate = i === 0 || dateKey !== prevDateKey;
                const sameSender = prevMsg?.sender_id === msg.sender_id;
                const color = colorMap.get(msg.sender_id) ?? SENDER_COLORS[0];
                const isRight = (sideMap.get(msg.sender_id) ?? "right") === "right";

                return (
                  <div key={msg.id}>
                    {/* Date separator */}
                    {showDate && (
                      <div className="flex items-center justify-center py-3">
                        <span className="rounded-full bg-slate-200/70 px-3 py-0.5 text-[10px] text-slate-500">
                          {formatDate(msg.created_at)}
                        </span>
                      </div>
                    )}

                    {/* Message bubble */}
                    <div className={`flex flex-col ${!sameSender ? "mt-3" : "mt-0.5"}`}>
                      {/* Sender name — only show at start of a group */}
                      {!sameSender && (
                        <div
                          className={`mb-0.5 flex w-full ${isRight ? "justify-end" : "justify-start"}`}
                        >
                          <span
                            className={`px-3 text-[11px] font-medium ${color.name}`}
                          >
                            {msg.sender_name}
                          </span>
                        </div>
                      )}

                      <div
                        className={`flex w-full ${isRight ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          dir="ltr"
                          className={`flex items-end gap-1.5 ${isRight ? "flex-row-reverse" : "flex-row"}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-3.5 py-2 ${color.bg}`}
                          >
                            <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-slate-800">
                              {msg.content ?? "—"}
                            </p>
                          </div>
                          <span className="flex-shrink-0 pb-0.5 text-[10px] text-slate-400">
                            {formatTime(msg.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
