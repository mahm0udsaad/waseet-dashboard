import { NextResponse } from "next/server";
import { fillMissingUserContacts } from "@/lib/admin/user-contact";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const auth = await requireRoleForApi(["super_admin", "admin", "support_agent"], request);
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const ids = url.searchParams.get("ids")?.split(",").filter(Boolean) ?? [];

  if (ids.length === 0 || ids.length > 10) {
    return NextResponse.json(
      { error: "يرجى تحديد 1-10 معرفات" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServerClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("user_id, display_name, email, phone, role, status, created_at")
    .in("user_id", ids);
  const usersWithContacts = await fillMissingUserContacts(users ?? []);

  const { data: withdrawals } = await supabase
    .from("withdrawal_requests")
    .select(
      "user_id, iban, bank_name, account_holder_name, admin_note, created_at, processed_at, status"
    )
    .in("user_id", ids)
    .order("created_at", { ascending: false });

  const latestWithdrawalMap = new Map<
    string,
    {
      iban: string | null;
      bank_name: string | null;
      account_holder_name: string | null;
      admin_note: string | null;
      created_at: string;
      processed_at: string | null;
      status: string;
    }
  >();

  for (const withdrawal of withdrawals ?? []) {
    if (!withdrawal.user_id || latestWithdrawalMap.has(withdrawal.user_id)) {
      continue;
    }

    latestWithdrawalMap.set(withdrawal.user_id, {
      iban: withdrawal.iban,
      bank_name: withdrawal.bank_name,
      account_holder_name: withdrawal.account_holder_name,
      admin_note: withdrawal.admin_note,
      created_at: withdrawal.created_at,
      processed_at: withdrawal.processed_at,
      status: withdrawal.status,
    });
  }

  return NextResponse.json({
    users:
      usersWithContacts.map((user) => ({
        ...user,
        latest_withdrawal: latestWithdrawalMap.get(user.user_id) ?? null,
      })) ?? [],
  });
}
