import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionButton } from "@/components/admin/ActionButton";
import { Badge } from "@/components/admin/Badge";
import { PageHeader } from "@/components/admin/PageHeader";
import { SectionCard } from "@/components/admin/SectionCard";
import { AirportRequestDocument } from "@/components/admin/airport-requests/AirportRequestDocument";
import { AirportRequestChat } from "@/components/admin/airport-requests/AirportRequestChat";
import { AirportRequestNotesForm } from "@/components/admin/airport-requests/AirportRequestNotesForm";
import { AirportStartButton } from "@/components/admin/airport-requests/AirportStartButton";
import { formatDate, formatNumber } from "@/lib/format";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const STATUS_MAP: Record<
  string,
  { label: string; tone: "neutral" | "success" | "warning" | "danger" }
> = {
  pending_payment: { label: "بانتظار الدفع", tone: "neutral" },
  awaiting_admin_transfer_approval: { label: "بانتظار اعتماد التحويل", tone: "warning" },
  paid: { label: "مدفوع", tone: "success" },
  in_progress: { label: "قيد التنفيذ", tone: "warning" },
  completed: { label: "مكتمل", tone: "success" },
  cancelled: { label: "ملغي", tone: "danger" },
  rejected: { label: "مرفوض", tone: "danger" },
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AirportRequestDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = getSupabaseServerClient();

  const { data: request } = await supabase
    .from("airport_inspection_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!request) notFound();

  const { data: profile } = request.user_id
    ? await supabase
        .from("profiles")
        .select("user_id, display_name, email, phone")
        .eq("user_id", request.user_id)
        .maybeSingle()
    : { data: null };

  // Generate signed URLs for documents (1h TTL)
  const signedUrls: { visa?: string; ticket?: string; receipt?: string } = {};
  if (request.exit_visa_path) {
    const { data } = await supabase.storage
      .from("airport-requests")
      .createSignedUrl(request.exit_visa_path, 3600);
    if (data?.signedUrl) signedUrls.visa = data.signedUrl;
  }
  if (request.ticket_path) {
    const { data } = await supabase.storage
      .from("airport-requests")
      .createSignedUrl(request.ticket_path, 3600);
    if (data?.signedUrl) signedUrls.ticket = data.signedUrl;
  }
  if (request.payment_ref && request.payment_method === "bank_transfer") {
    const { data } = await supabase.storage
      .from("receipts")
      .createSignedUrl(request.payment_ref, 3600);
    if (data?.signedUrl) signedUrls.receipt = data.signedUrl;
  }

  const statusInfo = STATUS_MAP[request.status] ?? {
    label: request.status,
    tone: "neutral" as const,
  };

  const canApprove = request.status === "awaiting_admin_transfer_approval";
  const canStart = request.status === "paid";
  const canComplete = ["paid", "in_progress"].includes(request.status);
  const canReject = ["pending_payment", "awaiting_admin_transfer_approval"].includes(
    request.status
  );
  const canCancel = !["completed", "cancelled", "rejected"].includes(request.status);

  return (
    <>
      <PageHeader
        title="تفاصيل طلب خدمة المطار"
        subtitle={`رقم الطلب: ${id}`}
        actions={
          <Link
            href="/airport-requests"
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-slate-700 transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
          >
            العودة للقائمة
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-light)] p-4">
        <span className="text-sm text-slate-600">الحالة الحالية:</span>
        <Badge label={statusInfo.label} tone={statusInfo.tone} />
        {request.payment_method && (
          <>
            <span className="text-sm text-slate-400">|</span>
            {request.payment_method === "card" ? (
              <Badge label="بطاقة - تأكيد تلقائي" tone="success" />
            ) : (
              <Badge label="تحويل بنكي - مراجعة يدوية" tone="warning" />
            )}
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="بيانات الكفيل" description="معلومات التواصل مع الكفيل.">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">الاسم</dt>
              <dd className="text-slate-900">{request.sponsor_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">رقم الجوال</dt>
              <dd className="font-mono text-slate-900" dir="ltr">
                {request.sponsor_phone}
              </dd>
            </div>
            {request.sponsor_alt_phone && (
              <div className="flex justify-between">
                <dt className="text-slate-500">رقم بديل</dt>
                <dd className="font-mono text-slate-900" dir="ltr">
                  {request.sponsor_alt_phone}
                </dd>
              </div>
            )}
          </dl>
        </SectionCard>

        <SectionCard title="بيانات العاملة والرحلة" description="معلومات العاملة وموعد الرحلة.">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">الاسم</dt>
              <dd className="text-slate-900">{request.worker_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">الجنسية</dt>
              <dd className="text-slate-900">{request.worker_nationality}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">تاريخ الرحلة</dt>
              <dd className="text-slate-900">{request.flight_date}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">وقت الرحلة</dt>
              <dd className="font-mono text-slate-900" dir="ltr">
                {request.flight_time
                  ? String(request.flight_time).slice(0, 5)
                  : "—"}
              </dd>
            </div>
          </dl>
        </SectionCard>
      </div>

      <SectionCard title="مقدم الطلب" description="حساب المستخدم الذي أنشأ الطلب.">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">الاسم</dt>
            <dd className="text-slate-900">{profile?.display_name ?? "غير معروف"}</dd>
          </div>
          {profile?.phone && (
            <div className="flex justify-between">
              <dt className="text-slate-500">الهاتف</dt>
              <dd className="font-mono text-slate-900" dir="ltr">
                {profile.phone}
              </dd>
            </div>
          )}
          {profile?.email && (
            <div className="flex justify-between">
              <dt className="text-slate-500">البريد الإلكتروني</dt>
              <dd className="text-slate-900">{profile.email}</dd>
            </div>
          )}
        </dl>
      </SectionCard>

      <SectionCard title="المستندات المرفقة" description="صورة التأشيرة النهائية وتذكرة الرحلة.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">تأشيرة الخروج النهائية</p>
            <AirportRequestDocument url={signedUrls.visa ?? null} label="تأشيرة الخروج" />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">تذكرة الرحلة</p>
            <AirportRequestDocument url={signedUrls.ticket ?? null} label="تذكرة الرحلة" />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="المعلومات المالية">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">قيمة الخدمة</dt>
            <dd className="text-slate-900">{formatNumber(request.price)} ر.س</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">طريقة الدفع</dt>
            <dd className="text-slate-900">
              {request.payment_method === "card"
                ? "بطاقة"
                : request.payment_method === "bank_transfer"
                  ? "تحويل بنكي"
                  : "—"}
            </dd>
          </div>
          {request.payment_method === "card" && request.payment_ref && (
            <div className="flex justify-between">
              <dt className="text-slate-500">معرف عملية Paymob</dt>
              <dd className="font-mono text-sm text-slate-900" dir="ltr">
                {request.payment_ref}
              </dd>
            </div>
          )}
        </dl>
      </SectionCard>

      {/* Bank Transfer Review — shown prominently when pending approval */}
      {request.payment_method === "bank_transfer" && (
        <SectionCard
          title="مراجعة التحويل البنكي"
          description={
            canApprove
              ? "يرجى مراجعة إيصال التحويل والتأكد من صحة البيانات قبل الاعتماد."
              : "تفاصيل التحويل البنكي المقدم من العميل."
          }
        >
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Receipt image */}
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">إيصال التحويل</p>
              <AirportRequestDocument
                url={signedUrls.receipt ?? null}
                label="إيصال التحويل"
              />
              {!signedUrls.receipt && (
                <p className="mt-2 text-xs text-slate-400">لم يرفع العميل إيصالاً بعد.</p>
              )}
            </div>

            {/* Actions */}
            {canApprove ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-slate-700">إجراء التحويل</p>

                {/* Approve */}
                <form action={`/api/admin/airport-requests/${id}/approve`} method="post">
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    ✅ اعتماد التحويل — تحويل الحالة إلى مدفوع
                  </button>
                </form>

                {/* Reject with reason */}
                <form
                  action={`/api/admin/airport-requests/${id}/reject`}
                  method="post"
                  className="space-y-2"
                >
                  <textarea
                    name="reason"
                    placeholder="سبب الرفض (اختياري — سيُحفظ في ملاحظات الطلب)"
                    rows={2}
                    className="w-full resize-none rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
                  />
                  <button
                    type="submit"
                    className="w-full rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                  >
                    ❌ رفض التحويل
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-start">
                <div className="rounded-xl border border-[var(--border)] bg-slate-50 p-3 text-sm text-slate-600">
                  {request.status === "paid" || request.status === "in_progress" || request.status === "completed"
                    ? "✅ تم اعتماد هذا التحويل مسبقاً."
                    : request.status === "rejected"
                      ? "❌ تم رفض هذا التحويل."
                      : "لم يتم البت في هذا التحويل بعد."}
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      <SectionCard title="المخطط الزمني">
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-slate-400" />
            <span className="text-slate-900">تم إنشاء الطلب</span>
            <span className="text-xs text-slate-400">{formatDate(request.created_at)}</span>
          </div>
          {request.updated_at && request.updated_at !== request.created_at && (
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-900">آخر تحديث</span>
              <span className="text-xs text-slate-400">{formatDate(request.updated_at)}</span>
            </div>
          )}
        </div>
      </SectionCard>

      <div id="airport-chat-section">
        <AirportRequestChat requestId={id} />
      </div>

      <SectionCard
        title="ملاحظات الإدارة"
        description="ملاحظات داخلية يطلع عليها فريق الإدارة."
      >
        <AirportRequestNotesForm requestId={id} initialNotes={request.admin_notes ?? ""} />
      </SectionCard>

      {(canStart || canComplete || canCancel) && (
        <SectionCard title="إجراءات الإدارة" description="تحديث حالة الطلب.">
          <div className="flex flex-wrap gap-3">
            {canStart && (
              <AirportStartButton requestId={id} />
            )}
            {canComplete && (
              <form action={`/api/admin/airport-requests/${id}/complete`} method="post">
                <ActionButton label="إكمال الطلب" variant="primary" />
              </form>
            )}
            {canCancel && (
              <form action={`/api/admin/airport-requests/${id}/cancel`} method="post">
                <ActionButton label="إلغاء الطلب" variant="danger" />
              </form>
            )}
          </div>
        </SectionCard>
      )}
    </>
  );
}
