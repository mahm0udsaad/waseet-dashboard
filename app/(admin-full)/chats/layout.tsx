import type { ReactNode } from "react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ConversationsList } from "@/components/admin/chats/ConversationsList";

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

export default async function ChatsLayout({ children }: { children: ReactNode }) {
  const supabase = getSupabaseServerClient();

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, status, ad_id, created_at, labels")
    .order("created_at", { ascending: false })
    .limit(300);

  const convIds = (conversations ?? []).map((c) => c.id);
  const adIds = (conversations ?? [])
    .map((c) => c.ad_id)
    .filter((id): id is string => !!id);

  const [{ data: lastMsgs }, { data: members }, { data: ads }] = await Promise.all([
    convIds.length > 0
      ? supabase
          .from("messages")
          .select("conversation_id, content, type, created_at")
          .in("conversation_id", convIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    convIds.length > 0
      ? supabase
          .from("conversation_members")
          .select("conversation_id, user_id")
          .in("conversation_id", convIds)
      : Promise.resolve({ data: [] }),
    adIds.length > 0
      ? supabase.from("ads").select("id, title").in("id", adIds)
      : Promise.resolve({ data: [] }),
  ]);

  const allMemberIds = [...new Set((members ?? []).map((m) => m.user_id))];
  const { data: profiles } =
    allMemberIds.length > 0
      ? await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", allMemberIds)
      : { data: [] };

  const profileNameMap = new Map(
    (profiles ?? []).map((p) => [p.user_id, p.display_name ?? "مستخدم"])
  );
  const adTitleMap = new Map((ads ?? []).map((a) => [a.id, a.title]));

  const membersMap = new Map<string, string[]>();
  (members ?? []).forEach((m) => {
    if (!membersMap.has(m.conversation_id)) membersMap.set(m.conversation_id, []);
    membersMap.get(m.conversation_id)!.push(profileNameMap.get(m.user_id) ?? "مستخدم");
  });

  const lastMsgMap = new Map<string, { content: string | null; at: string; type: string | null }>();
  (lastMsgs ?? []).forEach((m) => {
    const cid = m.conversation_id ?? "";
    if (!lastMsgMap.has(cid)) {
      lastMsgMap.set(cid, { content: m.content, at: m.created_at, type: m.type });
    }
  });

  const rows: ConvRow[] = (conversations ?? []).map((c) => {
    const lm = lastMsgMap.get(c.id);
    return {
      id: c.id,
      status: c.status ?? "open",
      ad_id: c.ad_id,
      created_at: c.created_at,
      labels: (c.labels as string[]) ?? [],
      adTitle: c.ad_id ? (adTitleMap.get(c.ad_id) ?? null) : null,
      memberNames: membersMap.get(c.id) ?? [],
      lastMessage: lm?.content ?? "",
      lastMessageAt: lm?.at ?? c.created_at,
      lastMessageType: lm?.type ?? "user",
      unreadByAdmin: false,
    };
  });

  return (
    // Full-height split pane: conversations sidebar | chat content
    <div
      className="flex overflow-hidden rounded-2xl border border-[var(--border)] bg-white"
      style={{ height: "calc(100vh - 160px)" }}
    >
      <ConversationsList initialConversations={rows} />
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
