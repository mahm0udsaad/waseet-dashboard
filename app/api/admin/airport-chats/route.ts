import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const auth = await requireRoleForApi(
    ["super_admin", "admin", "support_agent"],
    request
  );
  if ("error" in auth) return auth.error;

  const supabase = getSupabaseServerClient();

  const { data: requests, error } = await supabase
    .from("airport_inspection_requests")
    .select("id, conversation_id, user_id, sponsor_name, worker_name, status, price, created_at, updated_at")
    .not("conversation_id", "is", null)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const userIds = [...new Set((requests ?? []).map((r) => r.user_id).filter(Boolean))];
  const { data: profiles } = userIds.length > 0
    ? await supabase.from("profiles").select("user_id, display_name, phone").in("user_id", userIds)
    : { data: [] as { user_id: string; display_name: string; phone: string }[] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

  const conversationIds = (requests ?? []).map((r) => r.conversation_id).filter(Boolean);
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

  const chats = (requests ?? []).map((r) => {
    const profile = profileMap.get(r.user_id);
    const lastMsg = lastMsgMap.get(r.conversation_id);
    return {
      request_id: r.id,
      conversation_id: r.conversation_id,
      user_name: profile?.display_name ?? "مستخدم",
      user_phone: profile?.phone ?? null,
      sponsor_name: r.sponsor_name,
      worker_name: r.worker_name,
      status: r.status,
      price: r.price,
      last_message: lastMsg?.content ?? (lastMsg?.attachments ? "[إيصال]" : null),
      last_message_at: lastMsg?.created_at ?? r.updated_at,
      created_at: r.created_at,
    };
  });

  return NextResponse.json({ chats });
}
