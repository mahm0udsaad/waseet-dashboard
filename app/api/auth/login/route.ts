import { NextResponse } from "next/server";
import { getSupabaseAuthServerClient } from "@/lib/supabase/ssr";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ADMIN_ROLES, type AdminRole } from "@/lib/auth/permissions";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: "البريد الإلكتروني وكلمة المرور مطلوبان" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseAuthServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message || "بيانات الدخول غير صحيحة" },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "ليس لديك صلاحية للوصول إلى لوحة التحكم" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, user: data.user });
  } catch {
    return NextResponse.json(
      { error: "حدث خطأ أثناء تسجيل الدخول" },
      { status: 500 }
    );
  }
}
