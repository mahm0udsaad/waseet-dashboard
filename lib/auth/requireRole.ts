import { redirect } from "next/navigation";
import { getSupabaseAuthServerClient } from "@/lib/supabase/ssr";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type AdminRole = "admin" | "support_agent";

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

  let role: AdminRole | "user" = (profile?.role ?? "user") as AdminRole | "user";

  // Auto-assign admin role if profile doesn't exist or has user role
  if (!profile || role === "user") {
    if (!profile) {
      await adminClient.from("profiles").upsert({
        user_id: userData.user.id,
        display_name: userData.user.phone || userData.user.email || "Admin",
        email: userData.user.email,
        role: "admin",
        status: "active",
      });
    } else {
      await adminClient
        .from("profiles")
        .update({ role: "admin" })
        .eq("user_id", userData.user.id);
    }
    role = "admin";
  }

  if (!allowed.includes(role as AdminRole)) {
    redirect("/login");
  }

  return { userId: userData.user.id, role: role as AdminRole };
}
