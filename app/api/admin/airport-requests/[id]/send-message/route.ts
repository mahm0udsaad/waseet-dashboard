import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { logAdminAction } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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
  const { content } = await request.json();

  if (!content?.trim()) {
    return NextResponse.json(
      { error: "Message content is required" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServerClient();

  // Get airport request to find conversation_id
  const { data: airportReq } = await supabase
    .from("airport_inspection_requests")
    .select("conversation_id")
    .eq("id", id)
    .single();

  if (!airportReq?.conversation_id) {
    return NextResponse.json(
      { error: "No conversation found. Start a chat first." },
      { status: 400 }
    );
  }

  // Send message via RPC (existing DB trigger handles notification + push automatically)
  const { data, error } = await supabase.rpc("admin_send_airport_message", {
    p_conversation_id: airportReq.conversation_id,
    p_sender_id: auth.userId,
    p_content: content.trim(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logAdminAction({
    actorId: auth.userId,
    action: "send_airport_message",
    entity: "airport_inspection_requests",
    entityId: id,
    metadata: { message_id: data?.message_id },
  });

  return NextResponse.json({ success: true, message_id: data?.message_id });
}
