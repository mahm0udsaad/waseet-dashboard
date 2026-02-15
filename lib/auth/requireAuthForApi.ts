import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Lightweight auth helper for API routes called by both web (cookies)
 * and mobile (Bearer token). Unlike requireRoleForApi, this does NOT
 * enforce admin roles — any authenticated user can access the endpoint.
 *
 * Checks Authorization header first (mobile), then falls back to cookies (web).
 */
export async function requireAuthForApi(
  request: Request
): Promise<{ userId: string } | { error: NextResponse }> {
  const supabase = getSupabaseServerClient();

  // 1. Try Bearer token from Authorization header (mobile app)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return {
        error: NextResponse.json({ error: "Invalid token" }, { status: 401 }),
      };
    }
    return { userId: user.id };
  }

  // 2. Fall back to cookie-based auth (web dashboard)
  //    We import dynamically to avoid issues in non-cookie contexts
  try {
    const { getSupabaseAuthServerClient } = await import(
      "@/lib/supabase/ssr"
    );
    const authClient = await getSupabaseAuthServerClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return {
        error: NextResponse.json(
          { error: "Not authenticated" },
          { status: 401 }
        ),
      };
    }
    return { userId: user.id };
  } catch {
    return {
      error: NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      ),
    };
  }
}
