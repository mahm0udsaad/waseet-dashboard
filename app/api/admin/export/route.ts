import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { logAdminAction } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const ENTITY_CONFIG: Record<
  string,
  { table: string; columns: string; filename: string }
> = {
  users: {
    table: "profiles",
    columns: "user_id, display_name, email, role, status, created_at",
    filename: "users",
  },
  ads: {
    table: "ads",
    columns: "id, title, type, status, price, location, created_at",
    filename: "ads",
  },
  orders: {
    table: "orders",
    columns: "id, buyer_id, seller_id, amount, currency, status, created_at",
    filename: "orders",
  },
  damin_orders: {
    table: "damin_orders",
    columns:
      "id, payer_phone, beneficiary_phone, service_value, commission, total_amount, status, created_at",
    filename: "damin_orders",
  },
  receipts: {
    table: "receipts",
    columns: "id, amount, currency, status, description, created_at",
    filename: "receipts",
  },
  payments: {
    table: "payments",
    columns: "id, user_id, amount, currency, provider, status, created_at",
    filename: "payments",
  },
};

export async function GET(request: Request) {
  const auth = await requireRoleForApi(["super_admin", "admin", "finance"], request);
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const entity = url.searchParams.get("entity");

  if (!entity || !ENTITY_CONFIG[entity]) {
    return NextResponse.json(
      { error: "نوع البيانات غير صالح" },
      { status: 400 }
    );
  }

  const config = ENTITY_CONFIG[entity];
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from(config.table)
    .select(config.columns)
    .order("created_at", { ascending: false })
    .limit(10000);

  if (error) {
    return NextResponse.json(
      { error: "فشل في جلب البيانات" },
      { status: 500 }
    );
  }

  if (!data || data.length === 0) {
    return new Response("No data", { status: 204 });
  }

  // Convert to CSV
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = (row as unknown as Record<string, unknown>)[h];
          const str = val === null || val === undefined ? "" : String(val);
          // Escape commas and quotes
          if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(",")
    ),
  ];

  const csv = csvRows.join("\n");

  await logAdminAction({
    actorId: auth.userId,
    action: "export_data",
    entity: config.table,
    metadata: { rowCount: data.length },
  });

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=${config.filename}_${new Date().toISOString().slice(0, 10)}.csv`,
    },
  });
}
