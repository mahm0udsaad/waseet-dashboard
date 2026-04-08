import { Badge } from "@/components/admin/Badge";
import { DataTable } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { PaginationControls } from "@/components/admin/PaginationControls";
import { SearchFilter } from "@/components/admin/SearchFilter";
import { SectionCard } from "@/components/admin/SectionCard";
import { ChatRowActions } from "@/components/admin/chats/ChatRowActions";
import { formatDate } from "@/lib/format";
import { getPaginationRange, parsePageParam } from "@/lib/pagination";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const PAGE_SIZE = 20;

type Props = {
  searchParams: Promise<{ page?: string; type?: string; status?: string }>;
};

export default async function ChatsPage({ searchParams }: Props) {
  const { page: pageParam, type, status } = await searchParams;
  const page = parsePageParam(pageParam);
  const { from, to } = getPaginationRange(page, PAGE_SIZE);
  const supabase = getSupabaseServerClient();

  let query = supabase
    .from("conversations")
    .select("id, type, status, ad_id, created_at");

  let countQuery = supabase
    .from("conversations")
    .select("id", { count: "exact", head: true });

  if (type) {
    query = query.eq("type", type);
    countQuery = countQuery.eq("type", type);
  }
  if (status) {
    query = query.eq("status", status);
    countQuery = countQuery.eq("status", status);
  }

  const [{ data: conversations }, { count }] = await Promise.all([
    query.order("created_at", { ascending: false }).range(from, to),
    countQuery,
  ]);

  const conversationIds = (conversations ?? []).map((c) => c.id);
  const adIds = (conversations ?? [])
    .map((c) => c.ad_id)
    .filter((id): id is string => !!id);

  const [{ data: messages }, { data: members }, { data: ads }] =
    await Promise.all([
      conversationIds.length > 0
        ? supabase
            .from("messages")
            .select("conversation_id, content, created_at")
            .in("conversation_id", conversationIds)
            .order("created_at", { ascending: false })
        : Promise.resolve({
            data: [] as {
              conversation_id: string | null;
              content: string | null;
              created_at: string;
            }[],
          }),
      conversationIds.length > 0
        ? supabase
            .from("conversation_members")
            .select("conversation_id, user_id")
            .in("conversation_id", conversationIds)
        : Promise.resolve({
            data: [] as { conversation_id: string; user_id: string }[],
          }),
      adIds.length > 0
        ? supabase
            .from("ads")
            .select("id, title")
            .in("id", adIds)
        : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    ]);

  // Fetch member profiles
  const allMemberIds = [
    ...new Set((members ?? []).map((m) => m.user_id)),
  ];
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

  const adTitleMap = new Map(
    (ads ?? []).map((a) => [a.id, a.title])
  );

  // Build last message + message count per conversation
  const lastMessageMap = new Map<string, string>();
  const msgCountMap = new Map<string, number>();
  (messages ?? []).forEach((message) => {
    const convId = message.conversation_id ?? "";
    if (!lastMessageMap.has(convId)) {
      lastMessageMap.set(convId, message.content ?? "—");
    }
    msgCountMap.set(convId, (msgCountMap.get(convId) ?? 0) + 1);
  });

  // Build members map with names
  const membersMap = new Map<string, string[]>();
  const memberIdsMap = new Map<string, string[]>();
  (members ?? []).forEach((m) => {
    const convId = m.conversation_id;
    if (!membersMap.has(convId)) membersMap.set(convId, []);
    if (!memberIdsMap.has(convId)) memberIdsMap.set(convId, []);
    membersMap
      .get(convId)!
      .push(profileNameMap.get(m.user_id) ?? "مستخدم");
    memberIdsMap.get(convId)!.push(m.user_id);
  });

  const rows =
    conversations?.map((conversation) => ({
      ...conversation,
      lastMessage: lastMessageMap.get(conversation.id) ?? "—",
      memberIds: memberIdsMap.get(conversation.id) ?? [],
      memberNames: membersMap.get(conversation.id) ?? [],
      messageCount: msgCountMap.get(conversation.id) ?? 0,
      adTitle: conversation.ad_id
        ? adTitleMap.get(conversation.ad_id) ?? null
        : null,
      statusBadge: (
        <Badge
          label={conversation.status === "closed" ? "مغلقة" : "مفتوحة"}
          tone={conversation.status === "closed" ? "warning" : "success"}
        />
      ),
    })) ?? [];

  return (
    <>
      <PageHeader
        title="المحادثات"
        subtitle="مراقبة المحادثات مع تفاصيل الأعضاء والرسائل."
      />

      <div className="mb-4">
        <SearchFilter
          pathname="/chats"
          currentQuery={{ type, status }}
          fields={[
            {
              key: "type",
              label: "النوع",
              type: "select",
              options: [
                { value: "dm", label: "خاصة" },
                { value: "group", label: "مجموعة" },
              ],
            },
            {
              key: "status",
              label: "الحالة",
              type: "select",
              options: [
                { value: "open", label: "مفتوحة" },
                { value: "closed", label: "مغلقة" },
              ],
            },
          ]}
        />
      </div>

      <SectionCard
        title="قائمة المحادثات"
        description="محادثات العملاء مع تفاصيل الأعضاء والرسائل."
      >
        <DataTable
          columns={[
            {
              key: "memberNames",
              label: "الأعضاء",
              render: (row) => {
                const names = row.memberNames as string[];
                return names.length > 0 ? names.join("، ") : "—";
              },
            },
            {
              key: "adTitle",
              label: "الإعلان",
              render: (row) => (row.adTitle as string | null) ?? "—",
            },
            { key: "type", label: "النوع" },
            { key: "lastMessage", label: "آخر رسالة" },
            {
              key: "messageCount",
              label: "الرسائل",
              render: (row) => String(row.messageCount),
            },
            {
              key: "status",
              label: "الحالة",
              render: (row) => row.statusBadge,
            },
            {
              key: "created_at",
              label: "تاريخ الإنشاء",
              render: (row) => formatDate(row.created_at as string),
            },
            {
              key: "actions",
              label: "إجراءات",
              render: (row) => (
                <ChatRowActions
                  conversationId={row.id as string}
                  status={row.status as string}
                  adId={row.ad_id as string | null}
                  memberIds={row.memberIds as string[]}
                />
              ),
            },
          ]}
          getRowKey={(row) => row.id as string}
          rows={rows}
        />
        <PaginationControls
          pathname="/chats"
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={count ?? 0}
          query={{ type, status }}
        />
      </SectionCard>
    </>
  );
}
