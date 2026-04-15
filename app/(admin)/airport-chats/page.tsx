import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/admin/Badge";
import { formatDate } from "@/lib/format";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const STATUS_MAP: Record<string, { label: string; tone: "neutral" | "success" | "warning" | "danger" }> = {
  pending_payment: { label: "بانتظار الدفع", tone: "neutral" },
  awaiting_admin_transfer_approval: { label: "بانتظار اعتماد التحويل", tone: "warning" },
  paid: { label: "مدفوع", tone: "success" },
  in_progress: { label: "قيد التنفيذ", tone: "warning" },
  completed: { label: "مكتمل", tone: "success" },
  cancelled: { label: "ملغي", tone: "danger" },
  rejected: { label: "مرفوض", tone: "danger" },
};

export default async function AirportChatsPage() {
  const supabase = getSupabaseServerClient();

  // Get all airport requests with conversations
  const { data: requests } = await supabase
    .from("airport_inspection_requests")
    .select("id, conversation_id, user_id, sponsor_name, worker_name, status, price, created_at, updated_at")
    .not("conversation_id", "is", null)
    .order("updated_at", { ascending: false });

  const items = requests ?? [];

  // Fetch user profiles
  const userIds = [...new Set(items.map((r) => r.user_id).filter(Boolean))];
  const { data: profiles } = userIds.length > 0
    ? await supabase.from("profiles").select("user_id, display_name, phone").in("user_id", userIds)
    : { data: [] as { user_id: string; display_name: string; phone: string }[] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

  // Fetch last message per conversation
  const conversationIds = items.map((r) => r.conversation_id).filter(Boolean);
  const { data: lastMessages } = conversationIds.length > 0
    ? await supabase
        .from("messages")
        .select("conversation_id, content, attachments, created_at")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false })
    : { data: [] as { conversation_id: string; content: string | null; attachments: unknown; created_at: string }[] };

  const lastMsgMap = new Map<string, { content: string | null; attachments: unknown; created_at: string }>();
  for (const msg of lastMessages ?? []) {
    if (!lastMsgMap.has(msg.conversation_id)) {
      lastMsgMap.set(msg.conversation_id, msg);
    }
  }

  const activeCount = items.filter((r) => r.status === "in_progress").length;
  const paidCount = items.filter((r) => r.status === "paid").length;

  return (
    <>
      <PageHeader
        title="محادثات خدمة المطار"
        subtitle={`${items.length} محادثة — ${activeCount} قيد التنفيذ — ${paidCount} بانتظار البدء`}
      />

      {items.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-light)] p-8 text-center text-sm text-slate-500">
          لا توجد محادثات بعد. ستظهر هنا بمجرد بدء التنفيذ لأي طلب خدمة مطار.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((r) => {
            const profile = profileMap.get(r.user_id);
            const lastMsg = lastMsgMap.get(r.conversation_id);
            const statusInfo = STATUS_MAP[r.status] ?? { label: r.status, tone: "neutral" as const };
            const lastContent = lastMsg?.content ?? (lastMsg?.attachments ? "[إيصال]" : "لا توجد رسائل");

            return (
              <Link
                key={r.id}
                href={`/airport-chats/${r.id}`}
                className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-light)] p-4 transition hover:border-[var(--brand)] hover:shadow-sm"
              >
                {/* Avatar */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-600">
                  {(profile?.display_name ?? "م").charAt(0)}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-slate-900">
                      {profile?.display_name ?? "مستخدم"}
                    </span>
                    <Badge label={statusInfo.label} tone={statusInfo.tone} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    الكفيل: {r.sponsor_name} — العاملة: {r.worker_name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">
                    {lastContent}
                  </p>
                </div>

                {/* Time */}
                <div className="shrink-0 text-left text-xs text-slate-400">
                  {formatDate(lastMsg?.created_at ?? r.updated_at)}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
