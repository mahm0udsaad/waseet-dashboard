import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function getRequiredEnv(primary: string, fallback?: string) {
  const value =
    process.env[primary] ?? (fallback ? process.env[fallback] : undefined);
  if (!value) {
    throw new Error(`Missing required env var: ${primary}`);
  }
  return value;
}

const supabaseUrl = getRequiredEnv(
  "NEXT_PUBLIC_SUPABASE_URL",
  "EXPO_PUBLIC_SUPABASE_URL"
);
const supabaseAnonKey = getRequiredEnv(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY"
);

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: getUser() refreshes the session token if expired.
  // Do not remove this call or the session will expire.
  await supabase.auth.getUser();

  return response;
}
