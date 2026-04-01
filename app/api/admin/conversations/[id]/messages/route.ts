import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoleForApi(["super_admin", "admin", "support_agent"]);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const supabase = getSupabaseServerClient();

  const { data: msgs } = await supabase
    .from("messages")
    .select("id, sender_id, content, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })
    .limit(200);

  // Fetch sender profiles
  const senderIds = [
    ...new Set((msgs ?? []).map((m) => m.sender_id).filter(Boolean)),
  ];

  const { data: profiles } =
    senderIds.length > 0
      ? await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", senderIds)
      : { data: [] as { user_id: string; display_name: string }[] };

  const nameMap = new Map(
    (profiles ?? []).map((p) => [p.user_id, p.display_name])
  );

  const messages = (msgs ?? []).map((m) => ({
    id: m.id,
    sender_id: m.sender_id ?? "",
    sender_name: nameMap.get(m.sender_id ?? "") ?? "مستخدم",
    content: m.content,
    created_at: m.created_at,
  }));

  return NextResponse.json({ messages });
}
