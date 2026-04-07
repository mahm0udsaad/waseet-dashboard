import { NextResponse } from "next/server";
import { cookies } from "next/headers";
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

export async function requireRoleForApi(allowed: AdminRole[], _request: Request) {
  // Use cookies() from next/headers — this reads the cookie store that
  // middleware has already updated (token refresh, etc).
  // IMPORTANT: request.headers.get("cookie") returns the ORIGINAL raw header
  // which may contain expired tokens. cookies() returns the refreshed values.
  const cookieStore = await cookies();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // May throw in read-only contexts — safe to ignore,
          // middleware handles token persistence.
        }
      },
    },
  });

  // Debug: log cookie names to diagnose missing session
  const allCookies = cookieStore.getAll();
  const cookieNames = allCookies.map((c) => c.name);
  const authCookies = cookieNames.filter((n) => n.startsWith("sb-"));
  console.log("[requireRoleForApi] cookies:", cookieNames.length, "total,", authCookies.length, "auth. names:", authCookies.join(", ") || "NONE");

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    console.error("[requireRoleForApi] auth failed:", userError?.message ?? "no user", "| auth cookies:", authCookies.join(", ") || "NONE");
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
