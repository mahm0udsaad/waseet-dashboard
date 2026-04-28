import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const CHAT_BUCKET = "chat";

/**
 * POST /api/admin/storage/sign
 * Body: { paths: string[] }
 * Returns: { signedUrls: Record<string, string> }  (path -> signedUrl)
 *
 * Used by the ChatView realtime subscription to get signed URLs for
 * newly received image/receipt attachments without a full page reload.
 */
export async function POST(request: Request) {
  const auth = await requireRoleForApi(["super_admin", "admin", "support_agent"], request);
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const paths: unknown[] = Array.isArray(body?.paths) ? body.paths : [];
  const validPaths = paths.filter((p): p is string => typeof p === "string" && p.length > 0);

  if (validPaths.length === 0) {
    return NextResponse.json({ signedUrls: {} });
  }

  const supabase = getSupabaseServerClient();

  const results = await Promise.all(
    validPaths.map((path) =>
      supabase.storage.from(CHAT_BUCKET).createSignedUrl(path, 3600).then((r) => ({
        path,
        signedUrl: r.data?.signedUrl ?? null,
      }))
    )
  );

  const signedUrls: Record<string, string> = {};
  results.forEach(({ path, signedUrl }) => {
    if (signedUrl) signedUrls[path] = signedUrl;
  });

  return NextResponse.json({ signedUrls });
}
