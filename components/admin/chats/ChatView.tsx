"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Send,
  CheckCircle,
  ExternalLink,
  Lock,
  Unlock,
  AlertTriangle,
  Paperclip,
  Tag,
  Headphones,
  Info,
  ArrowRight,
  Image as ImageIcon,
  FileText,
  Link as LinkIcon,
} from "lucide-react";
import { LabelPicker } from "@/components/admin/chats/LabelPicker";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Badge } from "@/components/admin/Badge";

// ─── Types ───────────────────────────────────────────────────────────────────

type MessageType = "user" | "system" | "support";

type Attachment = {
  type?: string;
  amount?: number;
  status?: string;
  method?: string;
  methodLabelAr?: string;
  sender_name?: string;
  sender_role?: string;
  path?: string;
  pdf_path?: string;
  name?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  signedUrl?: string;
  url?: string;
  [key: string]: unknown;
};

type Message = {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string | null;
  content: string | null;
  attachments: Attachment[];
  type: MessageType | string;
  created_at: string;
};

type Member = {
  uid: string;
  name: string;
  phone: string | null;
  role: string | null;
};

type Order = {
  id: string;
  status: string;
  amount: number;
  payment_method: string | null;
} | null;

type Props = {
  conversationId: string;
  initialMessages: Message[];
  members: Member[];
  adTitle: string | null;
  adId: string | null;
  adType: string | null;
  conversationStatus: string;
  currentAdminId: string;
  currentAdminName: string;
  initialLabels: string[];
  order: Order;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ar-SA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-SA", {
    day: "numeric",
    month: "short",
  });
}

function roleLabel(role: string | null) {
  if (role === "super_admin") return "مدير النظام";
  if (role === "admin") return "مدير";
  if (role === "support_agent") return "وكيل دعم";
  return null;
}

// ─── Message renderers ────────────────────────────────────────────────────────

function SystemCard({ content }: { content: string }) {
  return (
    <div className="flex justify-center my-3">
      <div className="flex items-start gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2.5 max-w-[85%]">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" />
        <p className="whitespace-pre-wrap text-xs leading-5 text-blue-700">{content}</p>
      </div>
    </div>
  );
}

function SupportCard({ content, senderName, senderRoleRaw }: { content: string; senderName: string; senderRoleRaw: string | null }) {
  const rl = roleLabel(senderRoleRaw);
  return (
    <div className="flex justify-center my-3">
      <div className="w-[88%] rounded-2xl border border-violet-100 bg-violet-50 p-3">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-100">
            <Headphones className="h-3.5 w-3.5 text-violet-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-violet-700">{senderName || "فريق الدعم"}</p>
            {rl && <p className="text-[10px] text-violet-400">{rl}</p>}
          </div>
        </div>
        <div className="h-px bg-violet-100 mb-2" />
        <p className="whitespace-pre-wrap text-xs leading-5 text-slate-700">{content}</p>
      </div>
    </div>
  );
}

function PaymentCard({ att }: { att: Attachment }) {
  const statusTone =
    att.status === "succeeded"
      ? "success"
      : att.status === "rejected"
      ? "danger"
      : "warning";
  return (
    <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
      <Paperclip className="h-3 w-3 text-slate-400 shrink-0" />
      <span className="flex-1 truncate">
        {att.methodLabelAr ?? att.method ?? "إيصال"}{" "}
        {att.amount != null ? `· ${Number(att.amount).toLocaleString()} ر.س` : ""}
      </span>
      {att.status && <Badge label={att.status} tone={statusTone} />}
    </div>
  );
}

function ImageCard({ att }: { att: Attachment }) {
  const src = att.signedUrl;
  if (!src) {
    // No signed URL yet — show a placeholder
    return (
      <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
        <ImageIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        <span className="truncate">{att.name ?? "صورة"}</span>
      </div>
    );
  }
  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-slate-200">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <a href={src} target="_blank" rel="noopener noreferrer">
        <img
          src={src}
          alt={att.name ?? "صورة"}
          className="max-h-64 w-full object-contain bg-slate-50 hover:opacity-95 transition"
          loading="lazy"
        />
      </a>
    </div>
  );
}

function ReceiptCard({ att }: { att: Attachment }) {
  const src = att.signedUrl;
  return (
    <a
      href={src ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      className={`mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs transition ${
        src ? "text-blue-600 hover:bg-blue-50" : "text-slate-400 pointer-events-none"
      }`}
    >
      <FileText className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{att.name ?? "إيصال"}</span>
      {src && <ExternalLink className="h-3 w-3 shrink-0 ml-auto" />}
    </a>
  );
}

function PaymentLinkCard({ att }: { att: Attachment }) {
  const href = (att.url as string) ?? (att.signedUrl as string) ?? "#";
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700 transition hover:bg-blue-100"
    >
      <LinkIcon className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1 truncate">{att.name ?? "رابط دفع"}</span>
      <ExternalLink className="h-3 w-3 shrink-0" />
    </a>
  );
}

function UserBubble({
  msg,
  isAdmin,
}: {
  msg: Message;
  isAdmin: boolean;
}) {
  const rl = roleLabel(msg.sender_role);

  // Separate attachment types
  const imageAtts = msg.attachments.filter((a) => a.type === "image");
  const paymentAtts = msg.attachments.filter((a) => a.type === "payment_receipt");
  const receiptAtts = msg.attachments.filter((a) => a.type === "receipt");
  const linkAtts = msg.attachments.filter((a) => a.type === "payment_link");

  return (
    <div className={`flex mb-3 ${isAdmin ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-[72%] ${isAdmin ? "items-start" : "items-end"} flex flex-col`}>
        {/* Sender label */}
        <div className={`flex items-center gap-1.5 mb-1 ${isAdmin ? "" : "flex-row-reverse"}`}>
          <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-semibold text-slate-600 shrink-0">
            {(msg.sender_name ?? "م").charAt(0)}
          </div>
          <span className="text-[11px] font-medium text-slate-600 truncate max-w-[120px]">
            {msg.sender_name}
          </span>
          {rl && (
            <span className="text-[10px] text-slate-400">{rl}</span>
          )}
          <span className="text-[10px] text-slate-400">{formatTime(msg.created_at)}</span>
        </div>

        {/* Bubble */}
        {msg.content ? (
          <div
            className={`rounded-2xl px-3.5 py-2.5 text-xs leading-5 whitespace-pre-wrap break-words ${
              isAdmin
                ? "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"
                : "bg-[var(--brand)] text-white rounded-tr-sm"
            }`}
          >
            {msg.content}
          </div>
        ) : null}

        {/* Image attachments */}
        {imageAtts.map((att, i) => (
          <ImageCard key={`img-${i}`} att={att} />
        ))}

        {/* Receipt (PDF) attachments */}
        {receiptAtts.map((att, i) => (
          <ReceiptCard key={`rec-${i}`} att={att} />
        ))}

        {/* Payment link attachments */}
        {linkAtts.map((att, i) => (
          <PaymentLinkCard key={`lnk-${i}`} att={att} />
        ))}

        {/* Payment receipt attachments */}
        {paymentAtts.map((att, i) => (
          <PaymentCard key={`pay-${i}`} att={att} />
        ))}
      </div>
    </div>
  );
}

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-slate-100" />
      <span className="text-[10px] text-slate-400 font-medium">{label}</span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

// ─── Action Bar ───────────────────────────────────────────────────────────────

function ActionBar({
  conversationId,
  conversationStatus,
  order,
  adId,
  onStatusChange,
}: {
  conversationId: string;
  conversationStatus: string;
  order: Order;
  adId: string | null;
  onStatusChange: (status: string) => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  const doAction = async (label: string, fn: () => Promise<Response>) => {
    setLoading(label);
    try {
      const res = await fn();
      if (!res.ok) throw new Error(await res.text());
    } catch (e) {
      alert("حدث خطأ: " + (e instanceof Error ? e.message : "unknown"));
    } finally {
      setLoading(null);
    }
  };

  const toggleConversation = () =>
    doAction("toggle", async () => {
      const res = await fetch(
        `/api/admin/conversations/${conversationId}/close`,
        { method: "POST" }
      );
      if (res.ok) {
        onStatusChange(conversationStatus === "open" ? "closed" : "open");
      }
      return res;
    });

  const isOpen = conversationStatus === "open";
  const hasPendingTransfer =
    order?.payment_method === "bank_transfer" &&
    ["awaiting_admin_transfer_approval", "payment_submitted"].includes(
      order?.status ?? ""
    );

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border)] bg-white px-4 py-2.5">
      {/* Toggle open/closed */}
      <button
        onClick={toggleConversation}
        disabled={loading === "toggle"}
        className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
          isOpen
            ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
        }`}
      >
        {isOpen ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
        {isOpen ? "إغلاق المحادثة" : "إعادة فتح"}
      </button>

      {/* Approve bank transfer */}
      {hasPendingTransfer && order && (
        <Link
          href={`/bank-transfers?order=${order.id}`}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
        >
          <CheckCircle className="h-3.5 w-3.5" />
          مراجعة التحويل
        </Link>
      )}

      {/* View order */}
      {order && (
        <Link
          href={`/orders/${order.id}`}
          className="flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          عرض الطلب
        </Link>
      )}

      {/* View ad */}
      {adId && (
        <Link
          href={`/ads/${adId}`}
          className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
        >
          <Tag className="h-3.5 w-3.5" />
          عرض الإعلان
        </Link>
      )}

      {/* Disputes */}
      <Link
        href={`/disputes?conversation=${conversationId}`}
        className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-100"
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        النزاعات
      </Link>
    </div>
  );
}

// ─── Main ChatView ────────────────────────────────────────────────────────────

export function ChatView({
  conversationId,
  initialMessages,
  members,
  adTitle,
  adId,
  adType,
  conversationStatus: initialStatus,
  currentAdminId,
  currentAdminName,
  initialLabels,
  order,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [convStatus, setConvStatus] = useState(initialStatus);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = getSupabaseBrowserClient();

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chat-view-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const raw = payload.new as {
            id: string;
            sender_id: string;
            content: string | null;
            attachments: Attachment[];
            type: string;
            created_at: string;
          };

          // Get sender name
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, role")
            .eq("user_id", raw.sender_id)
            .maybeSingle();

          // Generate signed URLs for image/receipt attachments via API
          // image → uses `path`, receipt → uses `pdf_path`
          let attachments: Attachment[] = raw.attachments ?? [];
          const storagePaths = attachments
            .filter((a) => {
              if (a.type === "image") return typeof a.path === "string" && !!a.path;
              if (a.type === "receipt") return typeof a.pdf_path === "string" && !!a.pdf_path;
              return false;
            })
            .map((a) => (a.type === "receipt" ? a.pdf_path! : a.path) as string);

          if (storagePaths.length > 0) {
            try {
              const res = await fetch("/api/admin/storage/sign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paths: storagePaths }),
              });
              if (res.ok) {
                const { signedUrls } = await res.json() as { signedUrls: Record<string, string> };
                attachments = attachments.map((a) => {
                  const storagePath = a.type === "receipt" ? a.pdf_path : a.path;
                  if (storagePath && signedUrls[storagePath]) {
                    return { ...a, signedUrl: signedUrls[storagePath] };
                  }
                  return a;
                });
              }
            } catch {
              // non-fatal — image will show placeholder
            }
          }

          const newMsg: Message = {
            id: raw.id,
            sender_id: raw.sender_id,
            sender_name: profile?.display_name ?? "مستخدم",
            sender_role: profile?.role ?? null,
            content: raw.content,
            attachments,
            type: (raw.type ?? "user") as MessageType,
            created_at: raw.created_at,
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    try {
      const res = await fetch(
        `/api/admin/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "فشل الإرسال");
        setInput(text); // restore
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date for separators
  const rendered: React.ReactNode[] = [];
  let lastDate = "";

  messages.forEach((msg) => {
    const d = formatDate(msg.created_at);
    if (d !== lastDate) {
      rendered.push(<DateSeparator key={`sep-${d}`} label={d} />);
      lastDate = d;
    }

    if (msg.type === "system") {
      rendered.push(<SystemCard key={msg.id} content={msg.content ?? ""} />);
      return;
    }

    if (msg.type === "support") {
      const meta = msg.attachments.find((a) => a.type === "support_metadata");
      rendered.push(
        <SupportCard
          key={msg.id}
          content={msg.content ?? ""}
          senderName={(meta?.sender_name as string) ?? msg.sender_name}
          senderRoleRaw={(meta?.sender_role as string) ?? msg.sender_role}
        />
      );
      return;
    }

    const isAdminMsg = msg.sender_id === currentAdminId;
    rendered.push(
      <UserBubble key={msg.id} msg={msg} isAdmin={!isAdminMsg} />
    );
  });

  return (
    <div className="flex flex-col rounded-2xl border border-[var(--border)] bg-white overflow-hidden" style={{ minHeight: "calc(100vh - 160px)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[var(--border)] bg-white px-4 py-3 shrink-0">
        {/* Avatar + info */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
          {members[0]?.name.charAt(0) ?? "م"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">
            {members.map((m) => m.name).join(" · ") || "محادثة"}
          </p>
          {adTitle && (
            <p className="truncate text-xs text-[var(--brand)]">{adTitle}</p>
          )}
        </div>

        {/* Status badges + label picker */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
              convStatus === "open"
                ? "bg-emerald-50 text-emerald-600"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {convStatus === "open" ? "مفتوحة" : "مغلقة"}
          </span>
          {order && (
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-600">
              {order.status}
            </span>
          )}
          <LabelPicker
            conversationId={conversationId}
            initialLabels={initialLabels}
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <Headphones className="h-7 w-7 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-400">
              لا توجد رسائل بعد
            </p>
            <p className="text-xs text-slate-300">
              أرسل رسالة دعم للمحادثة
            </p>
          </div>
        ) : (
          rendered
        )}
        <div ref={bottomRef} />
      </div>

      {/* Action Bar */}
      <ActionBar
        conversationId={conversationId}
        conversationStatus={convStatus}
        order={order}
        adId={adId}
        onStatusChange={setConvStatus}
      />

      {/* Input */}
      <div className="flex items-end gap-2 border-t border-[var(--border)] bg-white px-4 py-3 shrink-0">
        <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
          <textarea
            rows={2}
            placeholder="اكتب رسالة دعم... (Enter للإرسال، Shift+Enter لسطر جديد)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            dir="rtl"
            className="w-full resize-none bg-transparent text-xs leading-5 text-slate-800 placeholder:text-slate-400 outline-none"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand)] text-white shadow-sm transition hover:opacity-90 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
