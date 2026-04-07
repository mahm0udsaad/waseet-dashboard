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

/**
 * Extract the Supabase project ref from the URL (used as cookie name prefix).
 * URL format: https://<project-ref>.supabase.co
 */
function getProjectRef(): string {
  try {
    const hostname = new URL(supabaseUrl).hostname; // e.g. "abcdef.supabase.co"
    return hostname.split(".")[0];
  } catch {
    return "";
  }
}

/**
 * Reassemble a possibly-chunked Supabase auth cookie from raw cookie entries.
 * Supabase SSR splits large JWTs into sb-<ref>-auth-token.0, .1, .2, …
 * and also stores a single sb-<ref>-auth-token (non-chunked) for small tokens.
 */
function extractSessionFromCookies(
  allCookies: { name: string; value: string }[]
): string | null {
  const ref = getProjectRef();
  if (!ref) return null;

  const baseName = `sb-${ref}-auth-token`;

  // Try non-chunked cookie first
  const single = allCookies.find((c) => c.name === baseName);
  if (single?.value) return single.value;

  // Try chunked cookies (.0, .1, .2, …)
  const chunks: { idx: number; value: string }[] = [];
  for (const c of allCookies) {
    if (c.name.startsWith(`${baseName}.`)) {
      const idx = parseInt(c.name.slice(baseName.length + 1), 10);
      if (!isNaN(idx)) chunks.push({ idx, value: c.value });
    }
  }

  if (chunks.length === 0) return null;

  chunks.sort((a, b) => a.idx - b.idx);
  return chunks.map((c) => c.value).join("");
}

/**
 * Parse Supabase session JSON and extract the access_token.
 */
function extractAccessToken(sessionStr: string): string | null {
  try {
    // Cookie value may be URL-encoded
    const decoded = decodeURIComponent(sessionStr);
    // The cookie stores base64url-encoded JSON
    // Try parsing directly first (newer @supabase/ssr stores plain JSON)
    try {
      const parsed = JSON.parse(decoded);
      return parsed.access_token ?? null;
    } catch {
      // Try base64 decode
      const json = Buffer.from(decoded, "base64").toString("utf-8");
      const parsed = JSON.parse(json);
      return parsed.access_token ?? null;
    }
  } catch {
    return null;
  }
}

export async function requireRoleForApi(
  allowed: AdminRole[],
  request: Request
) {
  // ── Strategy 1: Use cookies() from next/headers with @supabase/ssr ──
  let userId: string | null = null;

  try {
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
            // read-only context
          }
        },
      },
    });

    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      userId = userData.user.id;
    }
  } catch {
    // Strategy 1 failed
  }

  // ── Strategy 2: Parse raw request cookies + verify JWT via admin client ──
  if (!userId) {
    try {
      const cookieHeader = request.headers.get("cookie") ?? "";
      const rawCookies = cookieHeader
        .split(";")
        .filter(Boolean)
        .map((pair) => {
          const eqIdx = pair.indexOf("=");
          return {
            name: pair.slice(0, eqIdx).trim(),
            value: pair.slice(eqIdx + 1).trim(),
          };
        });

      const sessionStr = extractSessionFromCookies(rawCookies);
      if (sessionStr) {
        const accessToken = extractAccessToken(sessionStr);
        if (accessToken) {
          // Verify the JWT using the admin/service-role client
          const adminClient = getSupabaseServerClient();
          const { data: tokenUser } =
            await adminClient.auth.getUser(accessToken);
          if (tokenUser.user) {
            userId = tokenUser.user.id;
          }
        }
      }
    } catch {
      // Strategy 2 failed
    }
  }

  // ── Strategy 3: Read cookies from request via @supabase/ssr ──
  if (!userId) {
    try {
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
            // no-op
          },
        },
      });

      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        userId = userData.user.id;
      }
    } catch {
      // Strategy 3 failed
    }
  }

  if (!userId) {
    return {
      error: NextResponse.json({ error: "غير مصرح" }, { status: 401 }),
    };
  }

  // ── Role check ──
  const adminClient = getSupabaseServerClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  const role = (profile?.role ?? "user") as string;

  if (!ADMIN_ROLES.includes(role as AdminRole)) {
    return {
      error: NextResponse.json(
        { error: "غير مصرح — ليس لديك صلاحية" },
        { status: 403 }
      ),
    };
  }

  if (!allowed.includes(role as AdminRole)) {
    return {
      error: NextResponse.json(
        { error: "غير مصرح — صلاحيات غير كافية" },
        { status: 403 }
      ),
    };
  }

  return { userId, role: role as AdminRole };
}
