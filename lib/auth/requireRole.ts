import { redirect } from "next/navigation";
import { getSupabaseAuthServerClient } from "@/lib/supabase/ssr";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminRole } from "./permissions";
import { ADMIN_ROLES } from "./permissions";

export type { AdminRole };

export async function requireRole(allowed: AdminRole[]) {
  const supabase = await getSupabaseAuthServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const adminClient = getSupabaseServerClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  const role = (profile?.role ?? "user") as string;

  // Only allow users who have been explicitly assigned an admin role
  if (!ADMIN_ROLES.includes(role as AdminRole)) {
    redirect("/login?error=unauthorized");
  }

  if (!allowed.includes(role as AdminRole)) {
    redirect("/login?error=forbidden");
  }

  return { userId: userData.user.id, role: role as AdminRole };
}
