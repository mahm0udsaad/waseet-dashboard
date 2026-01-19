import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { logAdminAction } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireRoleForApi(["admin", "support_agent"]);
  if ("error" in auth) return auth.error;
  const supabase = getSupabaseServerClient();

  await supabase
    .from("conversations")
    .update({
      status: "closed",
      closed_at: new Date().toISOString(),
      closed_by: auth.userId,
    })
    .eq("id", params.id);

  await logAdminAction({
    actorId: auth.userId,
    action: "close_conversation",
    entity: "conversations",
    entityId: params.id,
  });

  return NextResponse.redirect(request.headers.get("referer") ?? "/chats");
}
