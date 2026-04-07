import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ADMIN_ROLES, type AdminRole } from "@/lib/auth/permissions";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  "";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  "";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: "البريد الإلكتروني وكلمة المرور مطلوبان" },
        { status: 400 }
      );
    }

    // Build a response object FIRST so Supabase can write cookies directly
    // onto it. Using cookies() from next/headers can silently fail to attach
    // Set-Cookie headers when we return NextResponse.json().
    let response = NextResponse.json({ success: true });

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          const header = request.headers.get("cookie") ?? "";
          return header
            .split(";")
            .filter(Boolean)
            .map((pair) => {
              const eqIdx = pair.indexOf("=");
              return {
                name: pair.slice(0, eqIdx).trim(),
                value: pair.slice(eqIdx + 1).trim(),
              };
            });
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

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

    // Return the response that already has Set-Cookie headers from signIn
    return response;
  } catch {
    return NextResponse.json(
      { error: "حدث خطأ أثناء تسجيل الدخول" },
      { status: 500 }
    );
  }
}
