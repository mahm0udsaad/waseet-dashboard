"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, MessageSquareText, Circle } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { LabelBadge } from "@/components/admin/chats/LabelPicker";

type ConvRow = {
  id: string;
  status: string;
  ad_id: string | null;
  created_at: string;
  adTitle: string | null;
  memberNames: string[];
  lastMessage: string;
  lastMessageAt: string;
  lastMessageType: string;
  labels: string[];
  unreadByAdmin: boolean;
};

type Props = {
  initialConversations: ConvRow[];
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `${mins}د`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}س`;
  const days = Math.floor(hrs / 24);
  return `${days}ي`;
}

function lastMsgPreview(content: string, type: string): string {
  if (type === "system") return "📋 معلومات الإعلان";
  if (type === "support") return "🎧 رسالة من الدعم";
  if (!content || content.trim() === "") return "📎 مرفق";
  return content.replace(/\n/g, " ").slice(0, 60);
}

export function ConversationsList({ initialConversations }: Props) {
  const pathname = usePathname();
  const [conversations, setConversations] = useState<ConvRow[]>(
    initialConversations.map((c) => ({ ...c, labels: c.labels ?? [] }))
  );
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
  const supabase = getSupabaseBrowserClient();
  const convIdsRef = useRef(new Set(initialConversations.map((c) => c.id)));

  // Realtime: listen for new messages and bubble the conversation to the top
  useEffect(() => {
    const channel = supabase
      .channel("admin-chat-list")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const msg = payload.new as {
            conversation_id: string;
            content: string | null;
            type: string;
            created_at: string;
          };

          setConversations((prev) => {
            const idx = prev.findIndex((c) => c.id === msg.conversation_id);
            if (idx === -1) return prev; // not in current list — ignore
            const updated = { ...prev[idx] };
            updated.lastMessage = msg.content ?? "";
            updated.lastMessageAt = msg.created_at;
            updated.lastMessageType = msg.type ?? "user";
            // mark unread only if it's not a support message we sent
            if (msg.type !== "support") updated.unreadByAdmin = true;
            // bubble to top
            const copy = [...prev];
            copy.splice(idx, 1);
            return [updated, ...copy];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Mark conversation read when opened
  useEffect(() => {
    const match = pathname.match(/\/chats\/([^/]+)/);
    if (!match) return;
    const openId = match[1];
    setConversations((prev) =>
      prev.map((c) => (c.id === openId ? { ...c, unreadByAdmin: false } : c))
    );
  }, [pathname]);

  const filtered = conversations.filter((c) => {
    if (filter === "open" && c.status !== "open") return false;
    if (filter === "closed" && c.status !== "closed") return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.memberNames.some((n) => n.toLowerCase().includes(q)) ||
        (c.adTitle ?? "").toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <aside className="flex h-full w-[340px] shrink-0 flex-col border-l border-[var(--border)] bg-white">
      {/* Header */}
      <div className="border-b border-[var(--border)] px-4 py-3">
        <h2 className="text-sm font-bold text-slate-900">المحادثات</h2>
        <p className="text-xs text-slate-400">{conversations.length} محادثة</p>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
          <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="بحث..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-xs text-slate-700 placeholder:text-slate-400 outline-none min-w-0"
            dir="rtl"
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-[var(--border)] px-3 gap-1 py-1.5">
        {(["all", "open", "closed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
              filter === f
                ? "bg-[var(--brand)] text-white"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            {f === "all" ? "الكل" : f === "open" ? "مفتوحة" : "مغلقة"}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <MessageSquareText className="h-8 w-8 text-slate-300" />
            <p className="text-xs text-slate-400">لا توجد محادثات</p>
          </div>
        ) : (
          filtered.map((conv) => {
            const isActive = pathname === `/chats/${conv.id}`;
            const title =
              conv.memberNames.length > 0
                ? conv.memberNames.join(" · ")
                : "محادثة";

            return (
              <Link
                key={conv.id}
                href={`/chats/${conv.id}`}
                className={`flex items-start gap-3 px-4 py-3 transition border-b border-[var(--border)] ${
                  isActive
                    ? "bg-violet-50 border-r-2 border-r-[var(--brand)]"
                    : "hover:bg-slate-50"
                }`}
              >
                {/* Avatar */}
                <div className="relative mt-0.5 shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                    {title.charAt(0)}
                  </div>
                  {conv.status === "open" && (
                    <Circle
                      className="absolute -bottom-0.5 -left-0.5 h-3 w-3 fill-emerald-400 text-emerald-400"
                    />
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="truncate text-xs font-semibold text-slate-900">
                      {title}
                    </p>
                    <span className="shrink-0 text-[10px] text-slate-400">
                      {conv.lastMessageAt ? timeAgo(conv.lastMessageAt) : ""}
                    </span>
                  </div>

                  {conv.adTitle && (
                    <p className="mt-0.5 truncate text-[10px] text-[var(--brand)] font-medium">
                      {conv.adTitle}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-0.5">
                    <p className="truncate text-[11px] text-slate-500 flex-1">
                      {lastMsgPreview(conv.lastMessage, conv.lastMessageType)}
                    </p>
                    {conv.unreadByAdmin && (
                      <span className="mr-1 h-2 w-2 rounded-full bg-[var(--brand)] shrink-0" />
                    )}
                  </div>
                  {conv.labels.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {conv.labels.map((l) => (
                        <LabelBadge key={l} value={l} />
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </aside>
  );
}
