import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { logAdminAction } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const auth = await requireRoleForApi(["super_admin", "admin"], request);
  if ("error" in auth) return auth.error;

  const formData = await request.formData();
  const now = new Date().toISOString();
  const upserts: { key: string; value: Record<string, unknown>; updated_at: string }[] = [];
  const metadata: Record<string, unknown> = {};

  // Each form posts only the fields it edits.
  for (const [field, key] of [
    ["delivery_price", "airport_delivery_price"],
    ["inspection_price", "airport_inspection_price"],
  ] as const) {
    if (!formData.has(field)) continue;
    const price = parseFloat(String(formData.get(field)));
    if (isNaN(price) || price < 0) {
      return NextResponse.json({ error: "السعر غير صالح" }, { status: 400 });
    }
    upserts.push({ key, value: { amount: price }, updated_at: now });
    metadata[field] = price;
  }

  if (formData.has("active")) {
    const active = String(formData.get("active")) === "true";
    upserts.push({ key: "airport_service_active", value: { enabled: active }, updated_at: now });
    metadata.active = active;
  }

  if (upserts.length === 0) {
    return NextResponse.json({ error: "لا توجد بيانات للحفظ" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("app_settings").upsert(upserts);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAdminAction({
    actorId: auth.userId,
    action: "update_airport_service_settings",
    entity: "app_settings",
    entityId: "airport_service",
    metadata,
  });

  return NextResponse.redirect(
    request.headers.get("referer") ?? "/airport-requests/settings"
  );
}
