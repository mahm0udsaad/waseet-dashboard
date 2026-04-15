import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { logAdminAction } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// GET: Fetch messages for this airport request's conversation
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoleForApi(
    ["super_admin", "admin", "support_agent"],
    request
  );
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const supabase = getSupabaseServerClient();

  // Get the airport request to find conversation_id and user info
  const { data: airportReq } = await supabase
    .from("airport_inspection_requests")
    .select("conversation_id, user_id")
    .eq("id", id)
    .single();

  if (!airportReq) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (!airportReq.conversation_id) {
    return NextResponse.json({ conversation_id: null, messages: [] });
  }

  // Fetch messages
  const { data: msgs } = await supabase
    .from("messages")
    .select("id, sender_id, content, attachments, created_at")
    .eq("conversation_id", airportReq.conversation_id)
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
    attachments: m.attachments ?? [],
    created_at: m.created_at,
  }));

  return NextResponse.json({
    conversation_id: airportReq.conversation_id,
    user_id: airportReq.user_id,
    messages,
  });
}

// POST: Create or get conversation for this airport request
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoleForApi(
    ["super_admin", "admin", "support_agent"],
    request
  );
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase.rpc("admin_create_airport_chat", {
    p_request_id: id,
    p_admin_user_id: auth.userId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logAdminAction({
    actorId: auth.userId,
    action: "start_airport_chat",
    entity: "airport_inspection_requests",
    entityId: id,
  });

  return NextResponse.json(data);
}
