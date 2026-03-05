import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/admin/Badge";
import { ActionButton } from "@/components/admin/ActionButton";
import { PageHeader } from "@/components/admin/PageHeader";
import { SectionCard } from "@/components/admin/SectionCard";
import { ReceiptImage } from "@/components/admin/damin-orders/ReceiptImage";
import { formatDate, formatNumber } from "@/lib/format";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const STATUS_MAP: Record<
  string,
  { label: string; tone: "neutral" | "success" | "warning" | "danger" }
> = {
  pending_payment: { label: "بانتظار الدفع", tone: "warning" },
  awaiting_admin_transfer_approval: { label: "بانتظار تأكيد التحويل", tone: "warning" },
  paid: { label: "تم الدفع", tone: "neutral" },
  completed: { label: "مكتمل", tone: "success" },
  cancelled: { label: "ملغي", tone: "danger" },
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = getSupabaseServerClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!order) notFound();

  const userIds = [order.buyer_id, order.seller_id].filter(Boolean) as string[];

  const { data: profiles } =
    userIds.length > 0
      ? await supabase
          .from("profiles")
          .select("user_id, display_name, email")
          .in("user_id", userIds)
      : { data: [] };

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.user_id, p])
  );

  const buyerProfile = profileMap.get(order.buyer_id);
  const sellerProfile = profileMap.get(order.seller_id);

  const statusInfo = STATUS_MAP[order.status] ?? {
    label: order.status,
    tone: "neutral" as const,
  };

  const isBankTransfer = order.payment_method === "bank_transfer";
  const canApproveTransfer = order.status === "awaiting_admin_transfer_approval";
  const canComplete = order.status === "paid";
  const canCancel = !["completed", "cancelled"].includes(order.status);

  const receiptUrl = order.transfer_receipt_url ?? null;

  return (
    <>
      <PageHeader
        title="تفاصيل الطلب"
        subtitle={`رقم الطلب: ${id}`}
        actions={
          <Link
            href="/orders"
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-slate-700 transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
          >
            العودة للقائمة
          </Link>
        }
      />

      {/* Status Banner */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-light)] p-4">
        <span className="text-sm text-slate-600">الحالة الحالية:</span>
        <Badge label={statusInfo.label} tone={statusInfo.tone} />
        {order.payment_method && (
          <>
            <span className="text-sm text-slate-400">|</span>
            {isBankTransfer ? (
              <Badge label="تحويل بنكي - مراجعة يدوية" tone="warning" />
            ) : (
              <Badge label={order.payment_method} tone="neutral" />
            )}
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="المشتري" description="الشخص الذي اشترى الخدمة.">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">الاسم</dt>
              <dd className="text-slate-900">{buyerProfile?.display_name ?? "غير معروف"}</dd>
            </div>
            {buyerProfile?.email && (
              <div className="flex justify-between">
                <dt className="text-slate-500">البريد الإلكتروني</dt>
                <dd className="text-slate-900">{buyerProfile.email}</dd>
              </div>
            )}
          </dl>
        </SectionCard>

        <SectionCard title="البائع" description="الشخص الذي يقدم الخدمة.">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">الاسم</dt>
              <dd className="text-slate-900">{sellerProfile?.display_name ?? "غير معروف"}</dd>
            </div>
            {sellerProfile?.email && (
              <div className="flex justify-between">
                <dt className="text-slate-500">البريد الإلكتروني</dt>
                <dd className="text-slate-900">{sellerProfile.email}</dd>
              </div>
            )}
          </dl>
        </SectionCard>
      </div>

      <SectionCard title="التفاصيل المالية">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">المبلغ</dt>
            <dd className="text-slate-900">
              {formatNumber(order.amount)} {order.currency}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">تاريخ الإنشاء</dt>
            <dd className="text-slate-900">{formatDate(order.created_at)}</dd>
          </div>
        </dl>
      </SectionCard>

      {/* Transfer / Payment Info */}
      {(isBankTransfer || order.transfer_submitted_at) && (
        <SectionCard title="معلومات التحويل البنكي" description="بيانات التحويل المقدمة من المستخدم.">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">طريقة الدفع</dt>
              <dd className="text-slate-900">تحويل بنكي</dd>
            </div>
            {order.transfer_phone && (
              <div className="flex justify-between">
                <dt className="text-slate-500">هاتف التحويل</dt>
                <dd className="font-mono text-lg font-semibold text-[var(--brand)]" dir="ltr">
                  {order.transfer_phone}
                </dd>
              </div>
            )}
            {order.transfer_submitted_at && (
              <div className="flex justify-between">
                <dt className="text-slate-500">تاريخ إرسال التحويل</dt>
                <dd className="text-slate-900">{formatDate(order.transfer_submitted_at)}</dd>
              </div>
            )}
          </dl>

          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-slate-700">إيصال التحويل</p>
            <ReceiptImage receiptUrl={receiptUrl} />
          </div>
        </SectionCard>
      )}

      {/* Admin Actions */}
      {(canApproveTransfer || canComplete || canCancel) && (
        <SectionCard title="إجراءات الإدارة" description="اتخذ إجراءً على هذا الطلب.">
          <div className="flex flex-wrap gap-3">
            {canApproveTransfer && (
              <>
                <form action={`/api/admin/orders/${id}/approve-transfer`} method="post">
                  <ActionButton label="تأكيد التحويل البنكي" variant="primary" />
                </form>
                <form action={`/api/admin/orders/${id}/reject-transfer`} method="post">
                  <ActionButton label="رفض التحويل البنكي" variant="danger" />
                </form>
              </>
            )}
            {canComplete && (
              <form action={`/api/admin/orders/${id}/complete`} method="post">
                <ActionButton label="إكمال الطلب" variant="primary" />
              </form>
            )}
            {canCancel && order.status !== "cancelled" && (
              <form action={`/api/admin/orders/${id}/cancel`} method="post">
                <ActionButton label="إلغاء الطلب" variant="danger" />
              </form>
            )}
          </div>
        </SectionCard>
      )}
    </>
  );
}
