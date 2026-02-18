import { Badge } from "@/components/admin/Badge";
import { PageHeader } from "@/components/admin/PageHeader";
import { PaginationControls } from "@/components/admin/PaginationControls";
import { SectionCard } from "@/components/admin/SectionCard";
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
      .select("id, status, created_at")
      .eq("status", "open")
      .order("created_at", { ascending: true })
      .range(from, to),
    supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
  ]);

  const conversationIds = (conversations ?? []).map((c) => c.id);
  const { data: messages } =
    conversationIds.length > 0
      ? await supabase
          .from("messages")
          .select("conversation_id, content, created_at")
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: false })
          .limit(100)
      : { data: [] };

  const lastMessageMap = new Map<string, string>();
  (messages ?? []).forEach((message) => {
    if (!lastMessageMap.has(message.conversation_id ?? "")) {
      lastMessageMap.set(message.conversation_id ?? "", message.content ?? "—");
    }
  });

  return (
    <>
      <PageHeader
        title="صندوق دعم وسيط"
        subtitle="محادثات الدعم المفتوحة مرتبة حسب وقت الانتظار."
      />
      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <SectionCard title="قائمة الانتظار" description="محادثات لم يتم الرد عليها بعد.">
          <div className="space-y-3">
            {(conversations ?? []).map((conversation) => (
              <div
                key={conversation.id}
                className="rounded-xl border border-[var(--border)] p-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span>محادثة #{conversation.id.slice(0, 6)}</span>
                  <Badge label="بانتظار" tone="warning" />
                </div>
                <p className="mt-2 text-slate-600">
                  {lastMessageMap.get(conversation.id) ?? "لا توجد رسائل بعد."}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatDate(conversation.created_at as string)}
                </p>
              </div>
            ))}
            {(conversations ?? []).length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-slate-500">
                لا توجد محادثات مفتوحة حالياً.
              </div>
            ) : null}
          </div>
          <PaginationControls
            pathname="/support-inbox"
            page={page}
            pageSize={PAGE_SIZE}
            totalItems={count ?? 0}
          />
        </SectionCard>
        <SectionCard
          title="تفاصيل المحادثة"
          description="اختر محادثة لعرض الرسائل والرد."
        >
          <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-slate-500">
            سيتم عرض تفاصيل المحادثة هنا عند اختيارها.
          </div>
        </SectionCard>
      </section>
    </>
  );
}
