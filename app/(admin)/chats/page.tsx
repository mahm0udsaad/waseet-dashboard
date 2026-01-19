import { ActionButton } from "@/components/admin/ActionButton";
import { Badge } from "@/components/admin/Badge";
import { DataTable } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { SectionCard } from "@/components/admin/SectionCard";
import { formatDate } from "@/lib/format";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function ChatsPage() {
  const supabase = getSupabaseServerClient();
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, type, status, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  const conversationIds = (conversations ?? []).map((c) => c.id);
  const { data: messages } = await supabase
    .from("messages")
    .select("conversation_id, content, created_at")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false })
    .limit(100);

  const lastMessageMap = new Map<string, string>();
  (messages ?? []).forEach((message) => {
    if (!lastMessageMap.has(message.conversation_id ?? "")) {
      lastMessageMap.set(message.conversation_id ?? "", message.content ?? "—");
    }
  });

  const rows =
    conversations?.map((conversation) => ({
      ...conversation,
      lastMessage: lastMessageMap.get(conversation.id) ?? "—",
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
        subtitle="مراقبة المحادثات مع آخر رسالة."
      />
      <SectionCard
        title="قائمة المحادثات"
        description="أحدث المحادثات مع إمكانية الإغلاق."
      >
        <DataTable
          columns={[
            { key: "id", label: "المعرف" },
            { key: "type", label: "النوع" },
            { key: "lastMessage", label: "آخر رسالة" },
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
                <form
                  action={`/api/admin/conversations/${row.id}/close`}
                  method="post"
                >
                  <ActionButton label="إغلاق المحادثة" variant="danger" />
                </form>
              ),
            },
          ]}
          getRowKey={(row) => row.id as string}
          rows={rows}
        />
      </SectionCard>
    </>
  );
}
