import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { TRACKED_BADGE_PATHS, normalizeAdminPageKey } from "@/lib/admin/sidebar";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const trackedPathSet = new Set<string>(TRACKED_BADGE_PATHS);

export async function POST(request: Request) {
  const auth = await requireRoleForApi([
    "super_admin",
    "admin",
    "finance",
    "support_agent",
    "viewer",
  ], request);
  if ("error" in auth) return auth.error;

  let page = "";
  try {
    const body = (await request.json()) as { page?: string };
    page = String(body.page ?? "");
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }

  const pageKey = normalizeAdminPageKey(page);
  if (!pageKey || !trackedPathSet.has(pageKey)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from("admin_page_reads").upsert(
    {
      user_id: auth.userId,
      page_key: pageKey,
      last_seen_at: now,
      updated_at: now,
    },
    { onConflict: "user_id,page_key" }
  );

  if (error) {
    return NextResponse.json({ error: "تعذر تحديث حالة القراءة." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, pageKey });
}
