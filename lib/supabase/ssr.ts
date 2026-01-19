import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

export async function getSupabaseAuthServerClient() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      },
    },
  });
}
