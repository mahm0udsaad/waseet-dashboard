"use server";

import { getSupabaseAuthServerClient } from "@/lib/supabase/ssr";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ADMIN_ROLES, type AdminRole } from "@/lib/auth/permissions";

export async function loginAction(email: string, password: string) {
  if (!email || !password) {
    return { error: "البريد الإلكتروني وكلمة المرور مطلوبان" };
  }

  const supabase = await getSupabaseAuthServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: error?.message || "بيانات الدخول غير صحيحة" };
  }

  // Check if user has an admin role
  const adminClient = getSupabaseServerClient();
  const { data: existingProfile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("user_id", data.user.id)
    .maybeSingle();

  const role = existingProfile?.role ?? "user";

  if (!ADMIN_ROLES.includes(role as AdminRole)) {
    await supabase.auth.signOut();
    return { error: "ليس لديك صلاحية للوصول إلى لوحة التحكم" };
  }

  return { success: true };
}
