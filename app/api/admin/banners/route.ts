import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { logAdminAction } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const auth = await requireRoleForApi(["admin"]);
  if ("error" in auth) return auth.error;
  const supabase = getSupabaseServerClient();
  const formData = await request.formData();

  const payload = {
    title_ar: String(formData.get("title_ar") ?? ""),
    subtitle_ar: String(formData.get("subtitle_ar") ?? ""),
    badge_ar: String(formData.get("badge_ar") ?? ""),
    image_path: String(formData.get("image_path") ?? "") || null,
    gradient_from: String(formData.get("gradient_from") ?? "") || null,
    gradient_to: String(formData.get("gradient_to") ?? "") || null,
    use_image: String(formData.get("use_image") ?? "false") === "true",
    sort_order: Number(formData.get("sort_order") ?? 0),
    is_active: true,
  };

  const { data, error } = await supabase
    .from("promotional_banners")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logAdminAction({
    actorId: auth.userId,
    action: "create_banner",
    entity: "promotional_banners",
    entityId: data.id,
    metadata: payload,
  });

  return NextResponse.redirect(request.headers.get("referer") ?? "/sliders");
}
