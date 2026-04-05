import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { logAdminAction } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const auth = await requireRoleForApi(["super_admin"], request);
  if ("error" in auth) return auth.error;

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("commission_settings")
    .select("*")
    .order("service_type");

  if (error) {
    return NextResponse.json({ error: "فشل في جلب البيانات" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const auth = await requireRoleForApi(["super_admin"], request);
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const {
    service_type,
    commission_type,
    rate,
    label_en,
    label_ar,
    is_active,
    tax_enabled,
    tax_rate,
  } = body;

  if (!service_type || !commission_type || rate == null) {
    return NextResponse.json(
      { error: "يرجى تعبئة جميع الحقول المطلوبة" },
      { status: 400 }
    );
  }

  if (!["percentage", "fixed"].includes(commission_type)) {
    return NextResponse.json(
      { error: "نوع العمولة غير صالح" },
      { status: 400 }
    );
  }

  if (Number(rate) < 0) {
    return NextResponse.json(
      { error: "قيمة العمولة يجب أن تكون أكبر من أو تساوي صفر" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServerClient();

  const { error } = await supabase
    .from("commission_settings")
    .update({
      commission_type,
      rate: Number(rate),
      label_en: label_en || "Platform Commission",
      label_ar: label_ar || "عمولة المنصة",
      is_active: is_active ?? true,
      tax_enabled: tax_enabled ?? false,
      tax_rate: tax_enabled ? Number(tax_rate ?? 0) : 0,
      updated_at: new Date().toISOString(),
    })
    .eq("service_type", service_type);

  if (error) {
    return NextResponse.json(
      { error: "فشل في تحديث الإعدادات" },
      { status: 500 }
    );
  }

  await logAdminAction({
    actorId: auth.userId,
    action: "update_commission_settings",
    entity: "commission_settings",
    entityId: service_type,
    metadata: { commission_type, rate, tax_enabled, tax_rate },
  });

  return NextResponse.json({ success: true });
}
