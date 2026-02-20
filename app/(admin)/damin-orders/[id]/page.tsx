import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/admin/Badge";
import { ActionButton } from "@/components/admin/ActionButton";
import { PageHeader } from "@/components/admin/PageHeader";
import { SectionCard } from "@/components/admin/SectionCard";
import { DisputeChat } from "@/components/admin/damin-orders/DisputeChat";
import { ReceiptImage } from "@/components/admin/damin-orders/ReceiptImage";
import { formatDate, formatNumber } from "@/lib/format";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const STATUS_MAP: Record<
  string,
  { label: string; tone: "neutral" | "success" | "warning" | "danger" }
> = {
  created: { label: "تم الإنشاء", tone: "neutral" },
  pending_confirmations: { label: "بانتظار التأكيد", tone: "warning" },
  both_confirmed: { label: "تم التأكيد", tone: "neutral" },
  payment_submitted: { label: "تم إرسال الدفع", tone: "warning" },
  awaiting_completion: { label: "بانتظار اكتمال الخدمة", tone: "warning" },
  completion_requested: { label: "طلب اكتمال", tone: "warning" },
  completed: { label: "مكتمل", tone: "success" },
  cancelled: { label: "ملغي", tone: "danger" },
  disputed: { label: "متنازع عليه", tone: "danger" },
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function DaminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = getSupabaseServerClient();

  const { data: order } = await supabase
    .from("damin_orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!order) notFound();

  const userIds = [order.payer_user_id, order.beneficiary_user_id, order.creator_id].filter(
    Boolean
  ) as string[];

  const { data: profiles } = userIds.length > 0
    ? await supabase
        .from("profiles")
        .select("user_id, display_name, email")
        .in("user_id", userIds)
    : { data: [] };

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.user_id, p])
  );

  const payerProfile = profileMap.get(order.payer_user_id);
  const beneficiaryProfile = profileMap.get(order.beneficiary_user_id);

  const meta = (order.metadata ?? {}) as Record<string, string>;
  const statusInfo = STATUS_MAP[order.status] ?? {
    label: order.status,
    tone: "neutral" as const,
  };

  const paymentMethod = meta.payment_method;
  const isCardPayment = paymentMethod === "card_paymob";
  const isBankTransfer = paymentMethod === "bank_transfer";

  // Build timeline
  const timeline: { label: string; date: string | null; tone: "neutral" | "success" | "warning" | "danger" }[] = [
    { label: "تم الإنشاء", date: order.created_at, tone: "neutral" },
    { label: "تأكيد صاحب الطلب", date: order.payer_confirmed_at, tone: "neutral" },
    { label: "تأكيد مقدم الخدمة", date: order.beneficiary_confirmed_at, tone: "neutral" },
    { label: "تم إرسال الدفع", date: order.payment_submitted_at, tone: "warning" },
    { label: "تم التحقق من الدفع (ضمان)", date: order.escrow_deposit_at, tone: "neutral" },
  ];

  if (order.status === "completion_requested") {
    timeline.push({ label: "طلب اكتمال الخدمة", date: order.updated_at, tone: "warning" });
  }
  if (order.status === "completed") {
    timeline.push({ label: "مكتمل", date: order.escrow_released_at ?? order.updated_at, tone: "success" });
  }
  if (order.status === "cancelled") {
    timeline.push({ label: "ملغي", date: order.updated_at, tone: "danger" });
  }
  if (order.status === "disputed") {
    timeline.push({ label: "متنازع عليه", date: order.disputed_at ?? order.updated_at, tone: "danger" });
  }

  const canVerifyPayment = order.status === "payment_submitted";
  const canComplete = ["awaiting_completion", "payment_submitted"].includes(order.status);
  const canDispute = ["payment_submitted", "both_confirmed", "awaiting_completion", "completion_requested"].includes(order.status);
  const canResolveDispute = order.status === "disputed";
  const canCancel = !["completed", "cancelled"].includes(order.status);

  return (
    <>
      <PageHeader
        title="تفاصيل طلب الضامن"
        subtitle={`رقم الطلب: ${id}`}
        actions={
          <Link
            href="/damin-orders"
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
        {paymentMethod && (
          <>
            <span className="text-sm text-slate-400">|</span>
            {isCardPayment ? (
              <Badge label="بطاقة - تأكيد تلقائي" tone="success" />
            ) : isBankTransfer ? (
              <Badge label="تحويل بنكي - مراجعة يدوية" tone="warning" />
            ) : (
              <Badge label={paymentMethod} tone="neutral" />
            )}
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="صاحب الطلب (الدافع)" description="الشخص الذي أنشأ الطلب ويدفع المبلغ.">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">الاسم</dt>
              <dd className="text-slate-900">{payerProfile?.display_name ?? "غير معروف"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">الهاتف</dt>
              <dd className="font-mono text-slate-900" dir="ltr">{order.payer_phone ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">تاريخ التأكيد</dt>
              <dd className="text-slate-900">
                {order.payer_confirmed_at ? formatDate(order.payer_confirmed_at) : "لم يتم التأكيد"}
              </dd>
            </div>
          </dl>
        </SectionCard>

        <SectionCard title="مقدم الخدمة (المستفيد)" description="الشخص الذي يقدم الخدمة ويستلم المبلغ.">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">الاسم</dt>
              <dd className="text-slate-900">{beneficiaryProfile?.display_name ?? "غير معروف"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">الهاتف</dt>
              <dd className="font-mono text-slate-900" dir="ltr">{order.beneficiary_phone ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">تاريخ التأكيد</dt>
              <dd className="text-slate-900">
                {order.beneficiary_confirmed_at ? formatDate(order.beneficiary_confirmed_at) : "لم يتم التأكيد"}
              </dd>
            </div>
          </dl>
        </SectionCard>
      </div>

      <SectionCard title="تفاصيل الخدمة">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-slate-500">وصف الخدمة</dt>
            <dd className="mt-1 whitespace-pre-wrap text-slate-900">{order.service_type_or_details ?? "—"}</dd>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex justify-between">
              <dt className="text-slate-500">تاريخ بدء الخدمة</dt>
              <dd className="text-slate-900">{order.service_period_start ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">مدة الإنجاز (أيام)</dt>
              <dd className="text-slate-900">{order.completion_days ? formatNumber(order.completion_days) : "—"}</dd>
            </div>
          </div>
        </dl>
      </SectionCard>

      <SectionCard title="التفاصيل المالية">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">قيمة الخدمة</dt>
            <dd className="text-slate-900">{formatNumber(order.service_value)} ر.س</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">عمولة المنصة ({formatNumber(order.commission_rate)}%)</dt>
            <dd className="text-slate-900">{formatNumber(order.commission)} ر.س</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">الضريبة</dt>
            <dd className="text-slate-900">{formatNumber(order.tax)} ر.س</dd>
          </div>
          <div className="flex justify-between border-t border-[var(--border)] pt-2 font-semibold">
            <dt className="text-slate-700">الإجمالي (يدفعه صاحب الطلب)</dt>
            <dd className="text-slate-900">{formatNumber(order.total_amount)} ر.س</dd>
          </div>
          <div className="flex justify-between text-emerald-700">
            <dt>يستلمه مقدم الخدمة</dt>
            <dd>{formatNumber(order.service_value)} ر.س</dd>
          </div>
          <div className="flex justify-between text-[var(--brand)]">
            <dt>ربح المنصة</dt>
            <dd>{formatNumber(order.commission)} ر.س</dd>
          </div>
        </dl>
      </SectionCard>

      {/* Payment Info */}
      {(order.payment_submitted_at || order.escrow_deposit_at || paymentMethod) && (
        <SectionCard title="معلومات الدفع" description="بيانات الدفع والتحويل.">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">طريقة الدفع</dt>
              <dd className="text-slate-900">
                {isCardPayment ? (
                  <Badge label="بطاقة - تأكيد تلقائي" tone="success" />
                ) : isBankTransfer ? (
                  "تحويل بنكي"
                ) : (
                  meta.payment_method ?? "—"
                )}
              </dd>
            </div>
            {isBankTransfer && (
              <div className="flex justify-between">
                <dt className="text-slate-500">هاتف التحويل (مرجع التطابق)</dt>
                <dd className="font-mono text-lg font-semibold text-[var(--brand)]" dir="ltr">
                  {meta.transfer_phone ?? "—"}
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-slate-500">تاريخ إرسال الدفع</dt>
              <dd className="text-slate-900">{formatDate(order.payment_submitted_at)}</dd>
            </div>
            {meta.payment_submitted_at_client && (
              <div className="flex justify-between">
                <dt className="text-slate-500">تاريخ الإرسال (جهاز العميل)</dt>
                <dd className="text-slate-900">{formatDate(meta.payment_submitted_at_client)}</dd>
              </div>
            )}
            {isCardPayment && meta.paymob_payment_id && (
              <div className="flex justify-between">
                <dt className="text-slate-500">معرف عملية Paymob</dt>
                <dd className="font-mono text-sm text-slate-900" dir="ltr">
                  {meta.paymob_payment_id}
                </dd>
              </div>
            )}
            {isCardPayment && meta.payment_completed_at && (
              <div className="flex justify-between">
                <dt className="text-slate-500">تاريخ تأكيد الدفع (Paymob)</dt>
                <dd className="text-slate-900">{formatDate(meta.payment_completed_at)}</dd>
              </div>
            )}
          </dl>

          {isBankTransfer && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-slate-700">إيصال التحويل</p>
              <ReceiptImage receiptUrl={meta.transfer_receipt_url ?? null} />
            </div>
          )}
        </SectionCard>
      )}

      {/* Timeline */}
      <SectionCard title="مراحل الطلب" description="المخطط الزمني لحالة الطلب.">
        <div className="space-y-3">
          {timeline.map((step) => (
            <div key={step.label} className="flex items-center gap-3 text-sm">
              <div
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                  step.date
                    ? step.tone === "success"
                      ? "bg-emerald-500"
                      : step.tone === "danger"
                        ? "bg-rose-500"
                        : step.tone === "warning"
                          ? "bg-amber-500"
                          : "bg-slate-400"
                    : "bg-slate-200"
                }`}
              />
              <span className={step.date ? "text-slate-900" : "text-slate-400"}>{step.label}</span>
              <span className="text-xs text-slate-400">{step.date ? formatDate(step.date) : "—"}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Dispute Info & Chat */}
      {order.status === "disputed" && (
        <>
          {order.dispute_reason && (
            <SectionCard title="معلومات النزاع">
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-slate-500">سبب النزاع</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-slate-900">{order.dispute_reason}</dd>
                </div>
                {order.disputed_at && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">تاريخ فتح النزاع</dt>
                    <dd className="text-slate-900">{formatDate(order.disputed_at)}</dd>
                  </div>
                )}
              </dl>
            </SectionCard>
          )}
          <DisputeChat orderId={id} />
        </>
      )}

      {/* Admin Actions */}
      {(canVerifyPayment || canComplete || canDispute || canResolveDispute || canCancel) && (
        <SectionCard title="إجراءات الإدارة" description="اتخذ إجراءً على هذا الطلب.">
          <div className="flex flex-wrap gap-3">
            {canVerifyPayment && (
              <form action={`/api/admin/damin-orders/${id}/resolve`} method="post">
                <ActionButton label="تأكيد الدفع (نقل لانتظار اكتمال الخدمة)" variant="primary" />
              </form>
            )}
            {canComplete && (
              <form action={`/api/admin/damin-orders/${id}/complete`} method="post">
                <ActionButton label="إكمال الطلب (إطلاق المبلغ)" variant="primary" />
              </form>
            )}
            {canResolveDispute && (
              <>
                <form action={`/api/admin/damin-orders/${id}/resolve-dispute`} method="post">
                  <input type="hidden" name="resolution" value="completed" />
                  <ActionButton label="حل النزاع: إكمال وإطلاق المبلغ" variant="primary" />
                </form>
                <form action={`/api/admin/damin-orders/${id}/resolve-dispute`} method="post">
                  <input type="hidden" name="resolution" value="cancelled" />
                  <ActionButton label="حل النزاع: إلغاء واسترداد" variant="danger" />
                </form>
              </>
            )}
            {canDispute && (
              <form action={`/api/admin/damin-orders/${id}/dispute`} method="post">
                <ActionButton label="فتح نزاع" variant="outline" />
              </form>
            )}
            {canCancel && order.status !== "cancelled" && !canResolveDispute && (
              <form action={`/api/admin/damin-orders/${id}/cancel`} method="post">
                <ActionButton label="إلغاء الطلب" variant="danger" />
              </form>
            )}
          </div>
        </SectionCard>
      )}
    </>
  );
}
