import { NextResponse } from "next/server";
import { getSupabaseAuthServerClient } from "@/lib/supabase/ssr";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ADMIN_ROLES, type AdminRole } from "@/lib/auth/permissions";

export async function POST(request: Request) {
  try {
    const { phone, token } = await request.json();
    if (!phone || !token) {
      return NextResponse.json(
        { error: "رقم الهاتف ورمز التحقق مطلوبان" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseAuthServerClient();
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: "sms",
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message || "رمز التحقق غير صحيح" },
        { status: 400 }
      );
    }

    // Check if user has an admin role — do NOT auto-promote
    const adminClient = getSupabaseServerClient();
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("user_id", data.user.id)
      .maybeSingle();

    const role = existingProfile?.role ?? "user";

    if (!ADMIN_ROLES.includes(role as AdminRole)) {
      // Sign them out — they are not an admin
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: "ليس لديك صلاحية للوصول إلى لوحة التحكم" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, user: data.user });
  } catch (err) {
    return NextResponse.json(
      { error: "حدث خطأ أثناء التحقق" },
      { status: 500 }
    );
  }
}
