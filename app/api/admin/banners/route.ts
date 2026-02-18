import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { logAdminAction } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const auth = await requireRoleForApi(["super_admin", "admin"]);
  if ("error" in auth) return auth.error;
  const supabase = getSupabaseServerClient();

  const contentType = request.headers.get("content-type") ?? "";
  let payload: Record<string, unknown>;

  if (contentType.includes("application/json")) {
    const body = await request.json();
    payload = {
      title_ar: body.title_ar ?? "",
      title_en: body.title_en || null,
      subtitle_ar: body.subtitle_ar ?? "",
      subtitle_en: body.subtitle_en || null,
      badge_ar: body.badge_ar ?? "",
      badge_en: body.badge_en || null,
      image_path: body.image_path || null,
      gradient_from: body.gradient_from || null,
      gradient_to: body.gradient_to || null,
      gradient_palette: body.gradient_palette || null,
      icon_name: body.icon_name || "shield",
      background_image_url: body.background_image_url || null,
      use_image: body.use_image ?? false,
      sort_order: Number(body.sort_order ?? 0),
      is_active: body.is_active ?? true,
    };
  } else {
    const formData = await request.formData();
    payload = {
      title_ar: String(formData.get("title_ar") ?? ""),
      title_en: String(formData.get("title_en") ?? "") || null,
      subtitle_ar: String(formData.get("subtitle_ar") ?? ""),
      subtitle_en: String(formData.get("subtitle_en") ?? "") || null,
      badge_ar: String(formData.get("badge_ar") ?? ""),
      badge_en: String(formData.get("badge_en") ?? "") || null,
      image_path: String(formData.get("image_path") ?? "") || null,
      gradient_from: String(formData.get("gradient_from") ?? "") || null,
      gradient_to: String(formData.get("gradient_to") ?? "") || null,
      gradient_palette: String(formData.get("gradient_palette") ?? "") || null,
      icon_name: String(formData.get("icon_name") ?? "") || "shield",
      background_image_url: String(formData.get("background_image_url") ?? "") || null,
      use_image: String(formData.get("use_image") ?? "false") === "true",
      sort_order: Number(formData.get("sort_order") ?? 0),
      is_active: true,
    };
  }

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

  if (request.headers.get("accept")?.includes("application/json")) {
    return NextResponse.json({ success: true, id: data.id });
  }
  return NextResponse.redirect(request.headers.get("referer") ?? "/sliders");
}
