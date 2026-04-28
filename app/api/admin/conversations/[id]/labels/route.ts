import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const VALID_LABELS = [
  "dispute",
  "pending_transfer",
  "needs_followup",
  "vip",
  "urgent",
  "resolved",
  "spam",
];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoleForApi(
    ["super_admin", "admin", "support_agent"],
    request
  );
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await request.json();
  const incoming: unknown = body.labels;

  if (!Array.isArray(incoming)) {
    return NextResponse.json({ error: "labels must be an array" }, { status: 400 });
  }

  const labels = incoming.filter(
    (l): l is string => typeof l === "string" && VALID_LABELS.includes(l)
  );

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("conversations")
    .update({ labels })
    .eq("id", id)
    .select("id, labels")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ conversation: data });
}
