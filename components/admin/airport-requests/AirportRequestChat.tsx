"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SectionCard } from "@/components/admin/SectionCard";
import { formatDate } from "@/lib/format";

type Message = {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string | null;
  attachments?: Array<{ type: string; receipt_id?: string; amount?: number; description?: string; status?: string }>;
  created_at: string;
};

export function AirportRequestChat({ requestId }: { requestId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Receipt form state
  const [showReceiptForm, setShowReceiptForm] = useState(false);
  const [receiptDesc, setReceiptDesc] = useState("");
  const [receiptAmount, setReceiptAmount] = useState("");
  const [sendingReceipt, setSendingReceipt] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [receiptSuccess, setReceiptSuccess] = useState(false);

  const fetchChat = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/airport-requests/${requestId}/chat`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setConversationId(data.conversation_id);
      setUserId(data.user_id);
      setMessages(data.messages ?? []);
    } catch {
      setError("تعذر تحميل المحادثة");
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => { fetchChat(); }, [fetchChat]);

  useEffect(() => {
    if (!conversationId) return;
    const interval = setInterval(fetchChat, 15_000);
    return () => clearInterval(interval);
  }, [conversationId, fetchChat]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const startChat = async () => {
    setStarting(true);
    try {
      const res = await fetch(`/api/admin/airport-requests/${requestId}/chat`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setConversationId(data.conversation_id);
      await fetchChat();
    } catch {
      setError("تعذر بدء المحادثة");
    } finally {
      setStarting(false);
    }
  };

  const sendMessage = async () => {
    const content = newMessage.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/airport-requests/${requestId}/send-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error();
      setNewMessage("");
      await fetchChat();
    } catch {
      setError("تعذر إرسال الرسالة");
    } finally {
      setSending(false);
    }
  };

  const sendReceipt = async () => {
    if (!receiptDesc.trim() || !receiptAmount) return;
    setSendingReceipt(true);
    setReceiptError(null);
    try {
      const res = await fetch(`/api/admin/airport-requests/${requestId}/create-receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: receiptDesc.trim(), amount: parseFloat(receiptAmount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "فشل إنشاء الإيصال");
      setReceiptDesc("");
      setReceiptAmount("");
      setShowReceiptForm(false);
      setReceiptSuccess(true);
      setTimeout(() => setReceiptSuccess(false), 3000);
      await fetchChat();
    } catch (e: unknown) {
      setReceiptError(e instanceof Error ? e.message : "فشل إنشاء الإيصال");
    } finally {
      setSendingReceipt(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (loading) {
    return (
      <SectionCard title="محادثة مع المستخدم — فريق وسيط" description="جارٍ تحميل المحادثة...">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      </SectionCard>
    );
  }

  if (!conversationId) {
    return (
      <SectionCard
        title="محادثة مع المستخدم — فريق وسيط"
        description="لم يتم بدء محادثة بعد مع صاحب الطلب"
      >
        {error && (
          <p className="mb-3 text-xs text-rose-500">{error}</p>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={startChat}
            disabled={starting}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {starting ? "جارٍ بدء المحادثة..." : "بدء محادثة"}
          </button>
          <button
            onClick={() => { setError(null); setLoading(true); fetchChat(); }}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            إعادة المحاولة
          </button>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="محادثة مع المستخدم — فريق وسيط"
      description={`${messages.length} رسالة`}
    >
      {/* Legend */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
            <span className="text-slate-600">فريق وسيط الآن</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-600">المستخدم</span>
          </span>
        </div>
        {/* Create receipt button */}
        <button
          onClick={() => { setShowReceiptForm((v) => !v); setReceiptError(null); }}
          className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-100"
        >
          {showReceiptForm ? "إلغاء" : "＋ إنشاء إيصال"}
        </button>
      </div>

      {/* Receipt creation form */}
      {showReceiptForm && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
          <p className="text-sm font-semibold text-amber-800">إنشاء إيصال جديد — فريق وسيط الآن (البائع)</p>
          <input
            type="text"
            value={receiptDesc}
            onChange={(e) => setReceiptDesc(e.target.value)}
            placeholder="وصف الخدمة (مثال: خدمة تفتيش المطار)"
            className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={receiptAmount}
              onChange={(e) => setReceiptAmount(e.target.value)}
              placeholder="المبلغ"
              min={0}
              step={0.01}
              className="flex-1 rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
            <span className="text-sm font-medium text-amber-700">ر.س</span>
          </div>
          {receiptError && <p className="text-xs text-rose-500">{receiptError}</p>}
          <button
            onClick={sendReceipt}
            disabled={sendingReceipt || !receiptDesc.trim() || !receiptAmount}
            className="w-full rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
          >
            {sendingReceipt ? "جارٍ الإرسال..." : "إرسال الإيصال للمستخدم"}
          </button>
        </div>
      )}

      {receiptSuccess && (
        <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          ✅ تم إرسال الإيصال للمستخدم بنجاح.
        </div>
      )}

      {/* Messages */}
      {messages.length === 0 ? (
        <p className="mb-4 text-sm text-slate-400">لا توجد رسائل بعد. أرسل أول رسالة للمستخدم.</p>
      ) : (
        <div
          ref={scrollRef}
          className="mb-4 max-h-[28rem] space-y-2 overflow-y-auto rounded-xl border border-[var(--border)] bg-slate-50 p-3"
        >
          {messages.map((msg) => {
            const isUser = msg.sender_id === userId;
            const dotColor = isUser ? "bg-emerald-500" : "bg-blue-500";
            const senderLabel = isUser ? (msg.sender_name || "المستخدم") : "فريق وسيط الآن";
            const receiptAttachment = msg.attachments?.find((a) => a.type === "receipt");

            return (
              <div key={msg.id} className="rounded-lg bg-white p-2.5 shadow-sm">
                <div className="flex items-center gap-2 text-xs">
                  <span className={`inline-block h-2 w-2 rounded-full ${dotColor}`} />
                  <span className="font-medium text-slate-700">{senderLabel}</span>
                  <span className="text-slate-400">{formatDate(msg.created_at)}</span>
                </div>
                {msg.content && (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{msg.content}</p>
                )}
                {receiptAttachment && (
                  <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs">
                    <p className="font-semibold text-amber-800">إيصال دفع</p>
                    <p className="text-amber-700">{receiptAttachment.description}</p>
                    <p className="mt-0.5 font-mono text-amber-900">{receiptAttachment.amount} ر.س</p>
                    <p className="mt-0.5 text-amber-500">
                      {receiptAttachment.status === "final" ? "✅ مقبول من المستخدم" : "⏳ بانتظار قبول المستخدم"}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {error && <p className="mb-2 text-xs text-rose-500">{error}</p>}

      {/* Message input */}
      <div className="flex gap-2">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="اكتب رسالتك بوصفك فريق وسيط الآن..."
          rows={2}
          className="flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <button
          onClick={sendMessage}
          disabled={sending || !newMessage.trim()}
          className="self-end rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {sending ? "..." : "إرسال"}
        </button>
      </div>
    </SectionCard>
  );
}
