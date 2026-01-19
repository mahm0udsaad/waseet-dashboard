import { NextResponse } from "next/server";
import { getSupabaseAuthServerClient } from "@/lib/supabase/ssr";

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();
    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { error: "رقم الهاتف مطلوب" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseAuthServerClient();
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        channel: "sms",
      },
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || "فشل إرسال رمز التحقق" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "حدث خطأ أثناء إرسال رمز التحقق" },
      { status: 500 }
    );
  }
}
