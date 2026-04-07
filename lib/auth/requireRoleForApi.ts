import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminRole } from "./permissions";
import { ADMIN_ROLES } from "./permissions";

export type { AdminRole };

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  "";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  "";

export async function requireRoleForApi(allowed: AdminRole[], request: Request) {
  // In Route Handlers cookies() from next/headers can be read-only and
  // prevent token refresh.  Build a Supabase client from the raw request
  // cookies using @supabase/ssr which reassembles chunked tokens.
  const cookieHeader = request.headers.get("cookie") ?? "";
  const parsedCookies = Object.fromEntries(
    cookieHeader
      .split(";")
      .filter(Boolean)
      .map((pair) => {
        const eqIdx = pair.indexOf("=");
        return [pair.slice(0, eqIdx).trim(), pair.slice(eqIdx + 1).trim()];
      })
  );

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return Object.entries(parsedCookies).map(([name, value]) => ({
          name,
          value,
        }));
      },
      setAll() {
        // No-op in Route Handlers — middleware handles token refresh
      },
    },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    // Fallback: try cookies() from next/headers (works in Server Components
    // and some Route Handler runtimes where the request-based parsing fails)
    try {
      const { getSupabaseAuthServerClient } = await import(
        "@/lib/supabase/ssr"
      );
      const fallback = await getSupabaseAuthServerClient();
      const { data: fb } = await fallback.auth.getUser();
      if (fb.user) {
        return checkRole(fb.user.id, allowed);
      }
    } catch {
      // ignore
    }

    return { error: NextResponse.json({ error: "غير مصرح" }, { status: 401 }) };
  }

  return checkRole(userData.user.id, allowed);
}

async function checkRole(userId: string, allowed: AdminRole[]) {
  const adminClient = getSupabaseServerClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  const role = (profile?.role ?? "user") as string;

  if (!ADMIN_ROLES.includes(role as AdminRole)) {
    return { error: NextResponse.json({ error: "غير مصرح — ليس لديك صلاحية" }, { status: 403 }) };
  }

  if (!allowed.includes(role as AdminRole)) {
    return { error: NextResponse.json({ error: "غير مصرح — صلاحيات غير كافية" }, { status: 403 }) };
  }

  return { userId, role: role as AdminRole };
}
