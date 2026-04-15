import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { logAdminAction } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const auth = await requireRoleForApi(["super_admin", "admin"], request);
  if ("error" in auth) return auth.error;

  const formData = await request.formData();
  const price = parseFloat(String(formData.get("price") ?? "0"));
  const active = String(formData.get("active") ?? "true") === "true";

  if (isNaN(price) || price < 0) {
    return NextResponse.json({ error: "السعر غير صالح" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  await Promise.all([
    supabase.from("app_settings").upsert({
      key: "airport_service_price",
      value: { amount: price },
      updated_at: new Date().toISOString(),
    }),
    supabase.from("app_settings").upsert({
      key: "airport_service_active",
      value: { enabled: active },
      updated_at: new Date().toISOString(),
    }),
  ]);

  await logAdminAction({
    actorId: auth.userId,
    action: "update_airport_service_settings",
    entity: "app_settings",
    entityId: "airport_service",
    metadata: { price, active },
  });

  return NextResponse.redirect(
    request.headers.get("referer") ?? "/airport-requests/settings"
  );
}
