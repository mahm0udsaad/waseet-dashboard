import { Badge } from "@/components/admin/Badge";
import { PageHeader } from "@/components/admin/PageHeader";
import { PaginationControls } from "@/components/admin/PaginationControls";
import { SectionCard } from "@/components/admin/SectionCard";
import { DisputeRowActions } from "@/components/admin/disputes/DisputeRowActions";
import { formatDate, formatTime } from "@/lib/format";
import { getPaginationRange, parsePageParam } from "@/lib/pagination";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const PAGE_SIZE = 20;

const STATUS_TONE: Record<string, "neutral" | "warning" | "success" | "danger"> = {
  open: "warning",
  in_review: "neutral",
  resolved: "success",
  rejected: "danger",
};

const STATUS_LABEL: Record<string, string> = {
  open: "مفتوح",
  in_review: "قيد المراجعة",
  resolved: "تم الحل",
  rejected: "مرفوض",
};

const CATEGORY_LABEL: Record<string, string> = {
  fraud: "احتيال",
  no_response: "عدم الرد",
  service_not_delivered: "لم تتم الخدمة",
  inappropriate_behavior: "تصرفات غير لائقة",
  payment_issue: "مشكلة في الدفع",
  other: "أخرى",
};

type SearchParams = Promise<{ page?: string; status?: string }>;

export default async function DisputesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { page: pageParam, status } = await searchParams;
  const page = parsePageParam(pageParam);
  const { from, to } = getPaginationRange(page, PAGE_SIZE);
  const supabase = getSupabaseServerClient();

  const baseQuery = supabase
    .from("disputes")
    .select(
      "id, reporter_id, reported_user_id, conversation_id, order_id, damin_order_id, category, subject, description, status, admin_notes, created_at, resolved_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  const filtered = status && STATUS_LABEL[status] ? baseQuery.eq("status", status) : baseQuery;

  const { data: disputes, count } = await filtered;

  const userIds = Array.from(
    new Set(
      (disputes ?? [])
        .flatMap((d) => [d.reporter_id, d.reported_user_id])
        .filter((v): v is string => Boolean(v))
    )
  );

  const { data: profiles } =
    userIds.length > 0
      ? await supabase
          .from("profiles")
          .select("user_id, display_name, phone")
          .in("user_id", userIds)
      : { data: [] as { user_id: string; display_name: string | null; phone: string | null }[] };

  const profileMap = new Map(
    (profiles ?? []).map((p) => [
      p.user_id,
      { name: p.display_name ?? "—", phone: p.phone ?? "" },
    ])
  );

  const statusFilters = [
    { value: "", label: "الكل" },
    { value: "open", label: "مفتوح" },
    { value: "in_review", label: "قيد المراجعة" },
    { value: "resolved", label: "تم الحل" },
    { value: "rejected", label: "مرفوض" },
  ];

  return (
    <>
      <PageHeader
        title="بلاغات المستخدمين"
        subtitle={`${count ?? 0} بلاغ — يقدّمها المستخدمون من شاشة المحادثة أو من ملفهم الشخصي.`}
      />

      <SectionCard
        title="قائمة البلاغات"
        description="يمكنك تغيير حالة البلاغ وإضافة ملاحظات داخلية ترسل تلقائياً للمستخدم."
        actions={
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((f) => {
              const active = (status ?? "") === f.value;
              const href = f.value
                ? `/disputes?status=${f.value}`
                : `/disputes`;
              return (
                <a
                  key={f.value || "all"}
                  href={href}
                  className={`rounded-full border px-3 py-1.5 text-xs ${
                    active
                      ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                      : "border-[var(--border)] text-slate-600 hover:border-[var(--brand)] hover:text-[var(--brand)]"
                  }`}
                >
                  {f.label}
                </a>
              );
            })}
          </div>
        }
      >
        {(disputes ?? []).length === 0 ? (
          <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50 p-8 text-center">
            <p className="text-base font-medium text-emerald-700">لا توجد بلاغات</p>
            <p className="mt-1 text-sm text-emerald-600">سيظهر هنا أي بلاغ يقدمه المستخدمون.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(disputes ?? []).map((dispute) => {
              const reporter = profileMap.get(dispute.reporter_id);
              const reported = dispute.reported_user_id
                ? profileMap.get(dispute.reported_user_id)
                : null;

              return (
                <div
                  key={dispute.id}
                  className="rounded-xl border border-[var(--border)] p-4 transition hover:border-[var(--brand)]/30 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {dispute.subject}
                        </span>
                        <Badge
                          label={STATUS_LABEL[dispute.status] ?? dispute.status}
                          tone={STATUS_TONE[dispute.status] ?? "neutral"}
                        />
                        <Badge label={CATEGORY_LABEL[dispute.category] ?? dispute.category} />
                      </div>

                      <p className="text-sm text-slate-600 line-clamp-3 whitespace-pre-wrap">
                        {dispute.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>
                          المُبلِّغ:{" "}
                          <span className="font-medium text-slate-700">
                            {reporter?.name ?? "—"}
                          </span>
                          {reporter?.phone ? ` (${reporter.phone})` : ""}
                        </span>
                        {reported ? (
                          <span>
                            ضد:{" "}
                            <span className="font-medium text-slate-700">{reported.name}</span>
                          </span>
                        ) : null}
                        {dispute.conversation_id ? (
                          <span>
                            محادثة:{" "}
                            <a
                              href={`/chats?conversation=${dispute.conversation_id}`}
                              className="text-[var(--brand)] underline"
                            >
                              فتح
                            </a>
                          </span>
                        ) : null}
                        <span>
                          {formatDate(dispute.created_at)} · {formatTime(dispute.created_at)}
                        </span>
                      </div>

                      {dispute.admin_notes ? (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                          <span className="font-semibold text-slate-900">ملاحظات الإدارة:</span>{" "}
                          {dispute.admin_notes}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex-shrink-0">
                      <DisputeRowActions
                        disputeId={dispute.id}
                        status={dispute.status}
                        currentNotes={dispute.admin_notes ?? ""}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <PaginationControls
          pathname="/disputes"
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={count ?? 0}
          query={{ status: status ?? undefined }}
        />
      </SectionCard>
    </>
  );
}
