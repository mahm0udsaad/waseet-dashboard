import { Badge } from "@/components/admin/Badge";
import { PageHeader } from "@/components/admin/PageHeader";
import { PaginationControls } from "@/components/admin/PaginationControls";
import { SectionCard } from "@/components/admin/SectionCard";
import { ChatRowActions } from "@/components/admin/chats/ChatRowActions";
import { formatDate } from "@/lib/format";
import { getPaginationRange, parsePageParam } from "@/lib/pagination";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const PAGE_SIZE = 20;

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function SupportInboxPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);
  const { from, to } = getPaginationRange(page, PAGE_SIZE);
  const supabase = getSupabaseServerClient();

  const [{ data: conversations }, { count }] = await Promise.all([
    supabase
      .from("conversations")
      .select("id, type, status, ad_id, created_at")
      .eq("status", "open")
      .order("created_at", { ascending: true })
      .range(from, to),
    supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
  ]);

  const conversationIds = (conversations ?? []).map((c) => c.id);

  const [{ data: messages }, { data: members }] = await Promise.all([
    conversationIds.length > 0
      ? supabase
          .from("messages")
          .select("conversation_id, content, created_at")
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({
          data: [] as { conversation_id: string | null; content: string | null; created_at: string }[],
        }),
    conversationIds.length > 0
      ? supabase
          .from("conversation_members")
          .select("conversation_id, user_id")
          .in("conversation_id", conversationIds)
      : Promise.resolve({
          data: [] as { conversation_id: string; user_id: string }[],
        }),
  ]);

  // Fetch member profiles
  const allMemberIds = [...new Set((members ?? []).map((m) => m.user_id))];
  const { data: memberProfiles } =
    allMemberIds.length > 0
      ? await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", allMemberIds)
      : { data: [] as { user_id: string; display_name: string }[] };

  const profileNameMap = new Map(
    (memberProfiles ?? []).map((p) => [p.user_id, p.display_name])
  );

  // Build last message + count per conversation
  const lastMessageMap = new Map<string, string>();
  const msgCountMap = new Map<string, number>();
  (messages ?? []).forEach((message) => {
    const convId = message.conversation_id ?? "";
    if (!lastMessageMap.has(convId)) {
      lastMessageMap.set(convId, message.content ?? "—");
    }
    msgCountMap.set(convId, (msgCountMap.get(convId) ?? 0) + 1);
  });

  // Build members map
  const membersMap = new Map<string, string[]>();
  const memberIdsMap = new Map<string, string[]>();
  (members ?? []).forEach((m) => {
    const convId = m.conversation_id;
    if (!membersMap.has(convId)) membersMap.set(convId, []);
    if (!memberIdsMap.has(convId)) memberIdsMap.set(convId, []);
    membersMap.get(convId)!.push(profileNameMap.get(m.user_id) ?? "مستخدم");
    memberIdsMap.get(convId)!.push(m.user_id);
  });

  const rows =
    conversations?.map((conversation) => ({
      ...conversation,
      lastMessage: lastMessageMap.get(conversation.id) ?? "لا توجد رسائل",
      memberNames: membersMap.get(conversation.id) ?? [],
      memberIds: memberIdsMap.get(conversation.id) ?? [],
      messageCount: msgCountMap.get(conversation.id) ?? 0,
    })) ?? [];

  return (
    <>
      <PageHeader
        title="صندوق دعم وسيط"
        subtitle={`${count ?? 0} محادثة مفتوحة بانتظار المتابعة — مرتبة حسب أقدم انتظار.`}
      />

      <SectionCard
        title="قائمة الانتظار"
        description="المحادثات المفتوحة التي تحتاج إلى متابعة."
      >
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50 p-8 text-center">
            <p className="text-base font-medium text-emerald-700">لا توجد محادثات مفتوحة</p>
            <p className="mt-1 text-sm text-emerald-600">جميع المحادثات تمت متابعتها.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((conversation) => (
              <div
                key={conversation.id}
                className="rounded-xl border border-[var(--border)] p-4 transition hover:border-[var(--brand)]/30 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-slate-900">
                        {conversation.memberNames.join(" ↔ ")}
                      </span>
                      <Badge label="بانتظار" tone="warning" />
                      <span className="text-xs text-slate-400">
                        {conversation.messageCount} رسالة
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-slate-600 line-clamp-2">
                      {conversation.lastMessage}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatDate(conversation.created_at)}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <ChatRowActions
                      conversationId={conversation.id}
                      status={conversation.status}
                      adId={conversation.ad_id}
                      memberIds={conversation.memberIds}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <PaginationControls
          pathname="/support-inbox"
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={count ?? 0}
        />
      </SectionCard>
    </>
  );
}
