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
  // Read cookies directly from the request object.
  // next/headers cookies() in Route Handlers may not reflect tokens refreshed by middleware.
  const cookieHeader = request.headers.get("cookie") ?? "";
  const parsedCookies = cookieHeader
    .split(";")
    .filter(Boolean)
    .map((pair) => {
      const eqIdx = pair.indexOf("=");
      return {
        name: pair.slice(0, eqIdx).trim(),
        value: pair.slice(eqIdx + 1).trim(),
      };
    });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parsedCookies;
      },
      setAll() {
        // No-op: we only need to validate, not refresh, in these route handlers
      },
    },
  });

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return { error: NextResponse.json({ error: "غير مصرح" }, { status: 401 }) };
  }

  const adminClient = getSupabaseServerClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  const role = (profile?.role ?? "user") as string;

  if (!ADMIN_ROLES.includes(role as AdminRole)) {
    return { error: NextResponse.json({ error: "غير مصرح — ليس لديك صلاحية" }, { status: 403 }) };
  }

  if (!allowed.includes(role as AdminRole)) {
    return { error: NextResponse.json({ error: "غير مصرح — صلاحيات غير كافية" }, { status: 403 }) };
  }

  return { userId: userData.user.id, role: role as AdminRole };
}
