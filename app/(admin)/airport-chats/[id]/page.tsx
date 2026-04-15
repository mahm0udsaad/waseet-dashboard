import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/admin/Badge";
import { AirportRequestChat } from "@/components/admin/airport-requests/AirportRequestChat";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const STATUS_MAP: Record<string, { label: string; tone: "neutral" | "success" | "warning" | "danger" }> = {
  pending_payment: { label: "بانتظار الدفع", tone: "neutral" },
  awaiting_admin_transfer_approval: { label: "بانتظار اعتماد التحويل", tone: "warning" },
  paid: { label: "مدفوع", tone: "success" },
  in_progress: { label: "قيد التنفيذ", tone: "warning" },
  completed: { label: "مكتمل", tone: "success" },
  cancelled: { label: "ملغي", tone: "danger" },
  rejected: { label: "مرفوض", tone: "danger" },
};

type Props = { params: Promise<{ id: string }> };

export default async function AirportChatDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = getSupabaseServerClient();

  const { data: request } = await supabase
    .from("airport_inspection_requests")
    .select("id, conversation_id, user_id, sponsor_name, worker_name, worker_nationality, flight_date, flight_time, status, price, payment_method")
    .eq("id", id)
    .maybeSingle();

  if (!request) notFound();

  const { data: profile } = request.user_id
    ? await supabase.from("profiles").select("display_name, phone").eq("user_id", request.user_id).maybeSingle()
    : { data: null };

  const statusInfo = STATUS_MAP[request.status] ?? { label: request.status, tone: "neutral" as const };

  return (
    <>
      <PageHeader
        title={`محادثة — ${profile?.display_name ?? "مستخدم"}`}
        subtitle={`الكفيل: ${request.sponsor_name} — العاملة: ${request.worker_name}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/airport-requests/${id}`}
              className="rounded-full bg-[var(--brand)] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
            >
              عرض تفاصيل الطلب
            </Link>
            <Link
              href="/airport-chats"
              className="rounded-full border border-[var(--border)] px-4 py-2 text-xs text-slate-700 transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
            >
              العودة للمحادثات
            </Link>
          </div>
        }
      />

      {/* Quick info bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-light)] p-4">
        <Badge label={statusInfo.label} tone={statusInfo.tone} />
        <span className="text-xs text-slate-400">|</span>
        <span className="text-xs text-slate-600">
          {request.worker_nationality} — {request.flight_date}
          {request.flight_time ? ` ${String(request.flight_time).slice(0, 5)}` : ""}
        </span>
        <span className="text-xs text-slate-400">|</span>
        <span className="text-xs font-semibold text-slate-700">{request.price} ر.س</span>
        {profile?.phone && (
          <>
            <span className="text-xs text-slate-400">|</span>
            <span className="font-mono text-xs text-slate-600" dir="ltr">{profile.phone}</span>
          </>
        )}
      </div>

      {/* Full-height chat */}
      <AirportRequestChat requestId={id} />
    </>
  );
}
