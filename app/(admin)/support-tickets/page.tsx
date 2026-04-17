import { Badge } from "@/components/admin/Badge";
import { PageHeader } from "@/components/admin/PageHeader";
import { PaginationControls } from "@/components/admin/PaginationControls";
import { SectionCard } from "@/components/admin/SectionCard";
import { SupportTicketRowActions } from "@/components/admin/support-tickets/SupportTicketRowActions";
import { formatDate, formatTime } from "@/lib/format";
import { getPaginationRange, parsePageParam } from "@/lib/pagination";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const PAGE_SIZE = 20;

const STATUS_TONE: Record<string, "neutral" | "warning" | "success" | "danger"> = {
  open: "warning",
  in_progress: "neutral",
  resolved: "success",
  closed: "danger",
};

const STATUS_LABEL: Record<string, string> = {
  open: "مفتوحة",
  in_progress: "قيد المعالجة",
  resolved: "محلولة",
  closed: "مغلقة",
};

const PRIORITY_LABEL: Record<string, string> = {
  low: "منخفضة",
  normal: "عادية",
  high: "عالية",
  urgent: "عاجلة",
};

const PRIORITY_TONE: Record<string, "neutral" | "warning" | "danger"> = {
  low: "neutral",
  normal: "neutral",
  high: "warning",
  urgent: "danger",
};

const CATEGORY_LABEL: Record<string, string> = {
  account: "الحساب",
  payments: "المدفوعات",
  wallet: "المحفظة",
  orders: "الطلبات",
  damin: "الضامن",
  technical: "مشكلة تقنية",
  other: "أخرى",
};

type SearchParams = Promise<{ page?: string; status?: string }>;

export default async function SupportTicketsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { page: pageParam, status } = await searchParams;
  const page = parsePageParam(pageParam);
  const { from, to } = getPaginationRange(page, PAGE_SIZE);
  const supabase = getSupabaseServerClient();

  const baseQuery = supabase
    .from("support_tickets")
    .select(
      "id, user_id, category, subject, description, contact_email, contact_phone, status, priority, assigned_to, admin_response, created_at, resolved_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  const filtered =
    status && STATUS_LABEL[status] ? baseQuery.eq("status", status) : baseQuery;

  const { data: tickets, count } = await filtered;

  const userIds = Array.from(
    new Set(
      (tickets ?? [])
        .flatMap((t) => [t.user_id, t.assigned_to])
        .filter((v): v is string => Boolean(v))
    )
  );

  const { data: profiles } =
    userIds.length > 0
      ? await supabase
          .from("profiles")
          .select("user_id, display_name, phone")
          .in("user_id", userIds)
      : {
          data: [] as {
            user_id: string;
            display_name: string | null;
            phone: string | null;
          }[],
        };

  const profileMap = new Map(
    (profiles ?? []).map((p) => [
      p.user_id,
      {
        name: p.display_name ?? "—",
        phone: p.phone ?? "",
      },
    ])
  );

  const statusFilters = [
    { value: "", label: "الكل" },
    { value: "open", label: "مفتوحة" },
    { value: "in_progress", label: "قيد المعالجة" },
    { value: "resolved", label: "محلولة" },
    { value: "closed", label: "مغلقة" },
  ];

  return (
    <>
      <PageHeader
        title="تذاكر الدعم"
        subtitle={`${count ?? 0} تذكرة — يقدّمها المستخدمون من شاشة مركز المساعدة.`}
      />

      <SectionCard
        title="صندوق التذاكر"
        description="يمكنك تغيير حالة التذكرة، تحديد الأولوية، وإرسال رد للمستخدم — يصل كإشعار فوري."
        actions={
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((f) => {
              const active = (status ?? "") === f.value;
              const href = f.value
                ? `/support-tickets?status=${f.value}`
                : `/support-tickets`;
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
        {(tickets ?? []).length === 0 ? (
          <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50 p-8 text-center">
            <p className="text-base font-medium text-emerald-700">لا توجد تذاكر</p>
            <p className="mt-1 text-sm text-emerald-600">
              ستظهر هنا كل التذاكر التي يفتحها المستخدمون من مركز المساعدة.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {(tickets ?? []).map((ticket) => {
              const user = profileMap.get(ticket.user_id);
              return (
                <div
                  key={ticket.id}
                  className="rounded-xl border border-[var(--border)] p-4 transition hover:border-[var(--brand)]/30 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {ticket.subject}
                        </span>
                        <Badge
                          label={STATUS_LABEL[ticket.status] ?? ticket.status}
                          tone={STATUS_TONE[ticket.status] ?? "neutral"}
                        />
                        <Badge
                          label={PRIORITY_LABEL[ticket.priority] ?? ticket.priority}
                          tone={PRIORITY_TONE[ticket.priority] ?? "neutral"}
                        />
                        <Badge
                          label={CATEGORY_LABEL[ticket.category] ?? ticket.category}
                        />
                      </div>

                      <p className="text-sm text-slate-600 line-clamp-3 whitespace-pre-wrap">
                        {ticket.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>
                          من:{" "}
                          <span className="font-medium text-slate-700">
                            {user?.name ?? "—"}
                          </span>
                          {user?.phone ? ` (${user.phone})` : ""}
                        </span>
                        {ticket.contact_email ? (
                          <a
                            href={`mailto:${ticket.contact_email}`}
                            className="text-[var(--brand)] underline"
                          >
                            {ticket.contact_email}
                          </a>
                        ) : null}
                        {ticket.contact_phone ? (
                          <span>{ticket.contact_phone}</span>
                        ) : null}
                        <span>
                          {formatDate(ticket.created_at)} · {formatTime(ticket.created_at)}
                        </span>
                      </div>

                      {ticket.admin_response ? (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                          <span className="font-semibold">رد الدعم:</span>{" "}
                          {ticket.admin_response}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex-shrink-0">
                      <SupportTicketRowActions
                        ticketId={ticket.id}
                        status={ticket.status}
                        priority={ticket.priority}
                        currentResponse={ticket.admin_response ?? ""}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <PaginationControls
          pathname="/support-tickets"
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={count ?? 0}
          query={{ status: status ?? undefined }}
        />
      </SectionCard>
    </>
  );
}
