import { NextResponse } from "next/server";
import { getSupabaseAuthServerClient } from "@/lib/supabase/ssr";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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

    // Ensure user has admin role in profile
    const adminClient = getSupabaseServerClient();
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (!existingProfile) {
      // Create profile with admin role
      await adminClient.from("profiles").upsert({
        user_id: data.user.id,
        display_name: data.user.phone || "Admin",
        email: data.user.email,
        role: "admin",
        status: "active",
      });
    } else if (existingProfile.role !== "admin" && existingProfile.role !== "support_agent") {
      // Update existing profile to admin
      await adminClient
        .from("profiles")
        .update({ role: "admin" })
        .eq("user_id", data.user.id);
    }

    return NextResponse.json({ success: true, user: data.user });
  } catch (err) {
    return NextResponse.json(
      { error: "حدث خطأ أثناء التحقق" },
      { status: 500 }
    );
  }
}
