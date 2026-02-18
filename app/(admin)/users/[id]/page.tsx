import Link from "next/link";
import { Badge } from "@/components/admin/Badge";
import { DataTable } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { SectionCard } from "@/components/admin/SectionCard";
import { UserRowActions } from "@/components/admin/users/UserRowActions";
import { formatDate, formatNumber } from "@/lib/format";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

const roleLabels: Record<string, string> = {
  admin: "مدير",
  support_agent: "وكيل دعم",
  user: "مستخدم",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function UserDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = getSupabaseServerClient();

  const { data: user } = await supabase
    .from("profiles")
    .select("user_id, display_name, email, phone, avatar_url, role, status, created_at, banned_until")
    .eq("user_id", id)
    .maybeSingle();

  if (!user) notFound();

  // Fetch all related data in parallel
  const [
    { data: ads },
    { data: conversations },
    { data: orders },
    { data: daminOrders },
    { data: receipts },
    { data: notifications },
  ] = await Promise.all([
    supabase
      .from("ads")
      .select("id, title, type, status, price, created_at")
      .eq("owner_id", id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("conversation_members")
      .select("conversation_id, conversations!inner(id, type, status, created_at)")
      .eq("user_id", id)
      .order("joined_at", { ascending: false })
      .limit(5),
    supabase
      .from("orders")
      .select("id, amount, currency, status, created_at, buyer_id, seller_id")
      .or(`buyer_id.eq.${id},seller_id.eq.${id}`)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("damin_orders")
      .select("id, total_amount, status, created_at, payer_user_id, beneficiary_user_id")
      .or(`payer_user_id.eq.${id},beneficiary_user_id.eq.${id}`)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("receipts")
      .select("id, amount, currency, status, created_at, buyer_id, seller_id")
      .or(`buyer_id.eq.${id},seller_id.eq.${id}`)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("notifications")
      .select("id, type, title, read_at, created_at")
      .eq("recipient_id", id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const typeLabels: Record<string, string> = {
    tanazul: "تنازل",
    taqib: "تعقيب",
    dhamen: "ضامن",
  };

  return (
    <>
      <PageHeader
        title={user.display_name}
        subtitle="تفاصيل المستخدم والسجلات المرتبطة."
      />

      {/* Profile Card */}
      <SectionCard
        title="معلومات الحساب"
        actions={
          <UserRowActions
            userId={user.user_id}
            displayName={user.display_name}
            status={user.status}
          />
        }
      >
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs text-slate-500">الاسم</dt>
            <dd className="text-sm font-medium text-slate-900">
              {user.display_name}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">البريد الإلكتروني</dt>
            <dd className="text-sm text-slate-900">{user.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">رقم الجوال</dt>
            <dd className="text-sm text-slate-900">{user.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">الدور</dt>
            <dd className="text-sm text-slate-900">
              {roleLabels[user.role] ?? user.role}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">الحالة</dt>
            <dd>
              <Badge
                label={user.status === "banned" ? "محظور" : user.status === "deleted" ? "محذوف" : "نشط"}
                tone={user.status === "banned" ? "danger" : user.status === "deleted" ? "neutral" : "success"}
              />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">تاريخ التسجيل</dt>
            <dd className="text-sm text-slate-900">
              {formatDate(user.created_at)}
            </dd>
          </div>
          {user.banned_until && (
            <div>
              <dt className="text-xs text-slate-500">محظور حتى</dt>
              <dd className="text-sm text-rose-600">
                {formatDate(user.banned_until)}
              </dd>
            </div>
          )}
        </dl>
      </SectionCard>

      {/* User's Ads */}
      <SectionCard
        title="إعلانات المستخدم"
        actions={
          <Link
            href={`/ads?q=&status=&type=`}
            className="text-xs text-[var(--brand)] hover:underline"
          >
            عرض الكل
          </Link>
        }
      >
        <DataTable
          columns={[
            { key: "title", label: "العنوان" },
            {
              key: "type",
              label: "النوع",
              render: (row) => typeLabels[row.type as string] ?? (row.type as string),
            },
            {
              key: "status",
              label: "الحالة",
              render: (row) => (
                <Badge
                  label={row.status === "blocked" ? "محجوب" : "نشط"}
                  tone={row.status === "blocked" ? "danger" : "success"}
                />
              ),
            },
            {
              key: "created_at",
              label: "التاريخ",
              render: (row) => formatDate(row.created_at as string),
            },
          ]}
          getRowKey={(row) => row.id as string}
          rows={ads ?? []}
        />
      </SectionCard>

      {/* User's Conversations */}
      <SectionCard
        title="محادثات المستخدم"
        actions={
          <Link href="/chats" className="text-xs text-[var(--brand)] hover:underline">
            عرض الكل
          </Link>
        }
      >
        <DataTable
          columns={[
            {
              key: "id",
              label: "المعرف",
              render: (row) => {
                const conv = row.conversations as unknown as Record<string, unknown> | null;
                const convId = conv?.id as string ?? "";
                return convId.slice(0, 8) + "...";
              },
            },
            {
              key: "type",
              label: "النوع",
              render: (row) => {
                const conv = row.conversations as unknown as Record<string, unknown> | null;
                return (conv?.type as string) ?? "—";
              },
            },
            {
              key: "status",
              label: "الحالة",
              render: (row) => {
                const conv = row.conversations as unknown as Record<string, unknown> | null;
                const s = conv?.status as string;
                return (
                  <Badge
                    label={s === "closed" ? "مغلقة" : "مفتوحة"}
                    tone={s === "closed" ? "warning" : "success"}
                  />
                );
              },
            },
          ]}
          getRowKey={(row) => row.conversation_id as string}
          rows={conversations ?? []}
        />
      </SectionCard>

      {/* User's Orders */}
      <SectionCard
        title="طلبات المستخدم"
        actions={
          <Link href="/orders" className="text-xs text-[var(--brand)] hover:underline">
            عرض الكل
          </Link>
        }
      >
        <DataTable
          columns={[
            {
              key: "id",
              label: "المعرف",
              render: (row) => (row.id as string).slice(0, 8) + "...",
            },
            {
              key: "role",
              label: "الدور",
              render: (row) =>
                row.buyer_id === id ? "مشتري" : "بائع",
            },
            {
              key: "amount",
              label: "المبلغ",
              render: (row) =>
                `${formatNumber(row.amount as number)} ${row.currency as string}`,
            },
            {
              key: "status",
              label: "الحالة",
              render: (row) => {
                const s = row.status as string;
                const map: Record<string, { l: string; t: "neutral" | "success" | "warning" | "danger" }> = {
                  pending_payment: { l: "بانتظار الدفع", t: "warning" },
                  paid: { l: "تم الدفع", t: "neutral" },
                  completed: { l: "مكتمل", t: "success" },
                  cancelled: { l: "ملغي", t: "danger" },
                };
                const info = map[s] ?? { l: s, t: "neutral" as const };
                return <Badge label={info.l} tone={info.t} />;
              },
            },
            {
              key: "created_at",
              label: "التاريخ",
              render: (row) => formatDate(row.created_at as string),
            },
          ]}
          getRowKey={(row) => row.id as string}
          rows={orders ?? []}
        />
      </SectionCard>

      {/* User's Damin Orders */}
      <SectionCard
        title="طلبات الضامن"
        actions={
          <Link href="/damin-orders" className="text-xs text-[var(--brand)] hover:underline">
            عرض الكل
          </Link>
        }
      >
        <DataTable
          columns={[
            {
              key: "id",
              label: "المعرف",
              render: (row) => (
                <Link
                  href={`/damin-orders/${row.id}`}
                  className="text-[var(--brand)] underline underline-offset-2"
                >
                  {(row.id as string).slice(0, 8)}...
                </Link>
              ),
            },
            {
              key: "role",
              label: "الدور",
              render: (row) =>
                row.payer_user_id === id ? "دافع" : "مستفيد",
            },
            {
              key: "total_amount",
              label: "الإجمالي",
              render: (row) => `${formatNumber(row.total_amount as number)} ر.س`,
            },
            {
              key: "status",
              label: "الحالة",
              render: (row) => {
                const s = row.status as string;
                const map: Record<string, { l: string; t: "neutral" | "success" | "warning" | "danger" }> = {
                  created: { l: "تم الإنشاء", t: "neutral" },
                  pending_confirmations: { l: "بانتظار التأكيد", t: "warning" },
                  both_confirmed: { l: "تم التأكيد", t: "neutral" },
                  payment_submitted: { l: "تم إرسال الدفع", t: "warning" },
                  completed: { l: "مكتمل", t: "success" },
                  cancelled: { l: "ملغي", t: "danger" },
                  disputed: { l: "متنازع عليه", t: "danger" },
                };
                const info = map[s] ?? { l: s, t: "neutral" as const };
                return <Badge label={info.l} tone={info.t} />;
              },
            },
            {
              key: "created_at",
              label: "التاريخ",
              render: (row) => formatDate(row.created_at as string),
            },
          ]}
          getRowKey={(row) => row.id as string}
          rows={daminOrders ?? []}
        />
      </SectionCard>

      {/* User's Receipts */}
      <SectionCard
        title="إيصالات المستخدم"
        actions={
          <Link href="/receipts" className="text-xs text-[var(--brand)] hover:underline">
            عرض الكل
          </Link>
        }
      >
        <DataTable
          columns={[
            {
              key: "id",
              label: "المعرف",
              render: (row) => (row.id as string).slice(0, 8) + "...",
            },
            {
              key: "role",
              label: "الدور",
              render: (row) =>
                row.buyer_id === id ? "مشتري" : "بائع",
            },
            {
              key: "amount",
              label: "المبلغ",
              render: (row) =>
                row.amount
                  ? `${formatNumber(row.amount as number)} ${row.currency as string}`
                  : "—",
            },
            {
              key: "status",
              label: "الحالة",
              render: (row) => {
                const s = row.status as string;
                const map: Record<string, { l: string; t: "neutral" | "success" | "warning" }> = {
                  draft: { l: "مسودة", t: "neutral" },
                  seller_signed: { l: "توقيع البائع", t: "warning" },
                  final: { l: "نهائي", t: "success" },
                };
                const info = map[s] ?? { l: s, t: "neutral" as const };
                return <Badge label={info.l} tone={info.t} />;
              },
            },
            {
              key: "created_at",
              label: "التاريخ",
              render: (row) => formatDate(row.created_at as string),
            },
          ]}
          getRowKey={(row) => row.id as string}
          rows={receipts ?? []}
        />
      </SectionCard>

      {/* User's Notifications */}
      <SectionCard title="آخر الإشعارات">
        <DataTable
          columns={[
            { key: "type", label: "النوع" },
            { key: "title", label: "العنوان" },
            {
              key: "read_at",
              label: "الحالة",
              render: (row) => (
                <Badge
                  label={row.read_at ? "مقروء" : "غير مقروء"}
                  tone={row.read_at ? "neutral" : "warning"}
                />
              ),
            },
            {
              key: "created_at",
              label: "التاريخ",
              render: (row) => formatDate(row.created_at as string),
            },
          ]}
          getRowKey={(row) => row.id as string}
          rows={notifications ?? []}
        />
      </SectionCard>
    </>
  );
}
