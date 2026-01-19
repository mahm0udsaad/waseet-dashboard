import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { logAdminAction } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const auth = await requireRoleForApi(["admin"]);
  if ("error" in auth) return auth.error;
  const supabase = getSupabaseServerClient();

  const formData = await request.formData();
  const key = String(formData.get("key") ?? "").trim();
  const enabled = String(formData.get("enabled") ?? "false") === "true";
  const text = String(formData.get("text") ?? "").trim();

  if (!key) {
    return NextResponse.json({ error: "المفتاح غير صالح." }, { status: 400 });
  }

  const value =
    key === "maintenance"
      ? { enabled }
      : { enabled, text };

  await supabase.from("app_settings").upsert({
    key,
    value,
    updated_at: new Date().toISOString(),
  });

  await logAdminAction({
    actorId: auth.userId,
    action: "update_settings",
    entity: "app_settings",
    entityId: key,
    metadata: value,
  });

  return NextResponse.redirect(request.headers.get("referer") ?? "/settings");
}
