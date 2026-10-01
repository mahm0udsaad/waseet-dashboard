import Link from "next/link";
import { Settings } from "lucide-react";
import { Badge } from "@/components/admin/Badge";
import { DataTable } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { PaginationControls } from "@/components/admin/PaginationControls";
import { SearchFilter } from "@/components/admin/SearchFilter";
import { SectionCard } from "@/components/admin/SectionCard";
import { StatCard } from "@/components/admin/StatCard";
import {
  AIRPORT_SERVICE_PAGES,
  airportServiceTypeFilter,
  getAirportServiceLabel,
  type AirportServiceType,
} from "@/lib/airport";
import { formatDate, formatNumber } from "@/lib/format";
import { getPaginationRange, parsePageParam } from "@/lib/pagination";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const PAGE_SIZE = 20;

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
  serviceType: AirportServiceType;
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
  }>;
};

export async function AirportRequestsList({ serviceType, searchParams }: Props) {
  const { page: pageParam, q, status } = await searchParams;
  const { href: pathname, title, subtitle } = AIRPORT_SERVICE_PAGES[serviceType];
  const serviceTypes = airportServiceTypeFilter(serviceType);
  const page = parsePageParam(pageParam);
  const { from, to } = getPaginationRange(page, PAGE_SIZE);
  const supabase = getSupabaseServerClient();

  const [pendingCount, awaitingCount, paidCount, completedCount] = await Promise.all([
    supabase
      .from("airport_inspection_requests")
      .select("id", { count: "exact", head: true })
      .in("service_type", serviceTypes)
      .eq("status", "pending_payment"),
    supabase
      .from("airport_inspection_requests")
      .select("id", { count: "exact", head: true })
      .in("service_type", serviceTypes)
      .eq("status", "awaiting_admin_transfer_approval"),
    supabase
      .from("airport_inspection_requests")
      .select("id", { count: "exact", head: true })
      .in("service_type", serviceTypes)
      .eq("status", "paid"),
    supabase
      .from("airport_inspection_requests")
      .select("id", { count: "exact", head: true })
      .in("service_type", serviceTypes)
      .eq("status", "completed"),
  ]);

  let query = supabase
    .from("airport_inspection_requests")
    .select(
      "id, user_id, service_type, sponsor_name, sponsor_phone, sponsor_alt_phone, worker_name, worker_nationality, flight_date, flight_time, status, price, payment_method, created_at"
    )
    .in("service_type", serviceTypes);

  let countQuery = supabase
    .from("airport_inspection_requests")
    .select("id", { count: "exact", head: true })
    .in("service_type", serviceTypes);

  if (q) {
    const pattern = `%${q}%`;
    const orFilter = `sponsor_name.ilike.${pattern},worker_name.ilike.${pattern},sponsor_phone.ilike.${pattern}`;
    query = query.or(orFilter);
    countQuery = countQuery.or(orFilter);
  }
  if (status) {
    query = query.eq("status", status);
    countQuery = countQuery.eq("status", status);
  }

  const [{ data: requests }, { count }] = await Promise.all([
    query.order("created_at", { ascending: false }).range(from, to),
    countQuery,
  ]);

  const rows =
    requests?.map((req) => {
      const statusInfo = STATUS_MAP[req.status] ?? {
        label: req.status,
        tone: "neutral" as const,
      };
      return {
        ...req,
        statusBadge: <Badge label={statusInfo.label} tone={statusInfo.tone} />,
        flightWhen: `${req.flight_date ?? "—"} ${req.flight_time ? String(req.flight_time).slice(0, 5) : ""}`.trim(),
      };
    }) ?? [];

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <Link
            href="/airport-requests/settings"
            className="flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm text-slate-700 transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
          >
            <Settings size={14} />
            إعدادات الخدمة
          </Link>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="بانتظار الدفع"
          value={formatNumber(pendingCount.count ?? 0)}
          hint="لم يكمل العميل الدفع"
        />
        <StatCard
          label="بانتظار اعتماد التحويل"
          value={formatNumber(awaitingCount.count ?? 0)}
          hint="مراجعة تحويل بنكي"
        />
        <StatCard
          label="مدفوع"
          value={formatNumber(paidCount.count ?? 0)}
          hint="جاهز للتنفيذ"
        />
        <StatCard
          label="مكتمل"
          value={formatNumber(completedCount.count ?? 0)}
          hint="تم تسليم الخدمة"
        />
      </section>

      <div className="mb-4">
        <SearchFilter
          pathname={pathname}
          currentQuery={{ q, status }}
          fields={[
            {
              key: "q",
              label: "بحث",
              type: "text",
              placeholder:
                serviceType === "inspection"
                  ? "رقم الجوال"
                  : "اسم الكفيل أو العاملة أو الهاتف",
            },
            {
              key: "status",
              label: "الحالة",
              type: "select",
              options: [
                { value: "pending_payment", label: "بانتظار الدفع" },
                {
                  value: "awaiting_admin_transfer_approval",
                  label: "بانتظار اعتماد التحويل",
                },
                { value: "paid", label: "مدفوع" },
                { value: "in_progress", label: "قيد التنفيذ" },
                { value: "completed", label: "مكتمل" },
                { value: "cancelled", label: "ملغي" },
                { value: "rejected", label: "مرفوض" },
              ],
            },
          ]}
        />
      </div>

      <SectionCard
        title="قائمة الطلبات"
        description={`عدد النتائج: ${formatNumber(count ?? 0)}`}
      >
        <DataTable
          columns={[
            {
              key: "id",
              label: "المعرف",
              render: (row) => (
                <Link
                  href={`/airport-requests/${row.id as string}`}
                  className="text-[var(--brand)] underline underline-offset-2"
                >
                  {(row.id as string).slice(0, 8)}...
                </Link>
              ),
            },
            {
              key: "service_type",
              label: "الخدمة",
              render: (row) => (
                <Badge
                  label={getAirportServiceLabel(row.service_type as string)}
                  tone={row.service_type === serviceType ? "success" : "neutral"}
                />
              ),
            },
            ...(serviceType === "inspection"
              ? [
                  {
                    key: "sponsor_phone",
                    label: "رقم الجوال",
                    render: (row: Record<string, unknown>) => (
                      <span className="font-mono" dir="ltr">
                        {row.sponsor_phone as string}
                      </span>
                    ),
                  },
                  {
                    key: "flight",
                    label: "موعد التفتيش",
                    render: (row: Record<string, unknown>) => row.flightWhen as string,
                  },
                ]
              : [
                  { key: "sponsor_name", label: "الكفيل" },
                  {
                    key: "sponsor_phone",
                    label: "هاتف الكفيل",
                    render: (row: Record<string, unknown>) => (
                      <span className="font-mono" dir="ltr">
                        {row.sponsor_phone as string}
                      </span>
                    ),
                  },
                  { key: "worker_name", label: "العاملة" },
                  { key: "worker_nationality", label: "الجنسية" },
                  {
                    key: "flight",
                    label: "موعد الرحلة",
                    render: (row: Record<string, unknown>) => row.flightWhen as string,
                  },
                  ]),
            {
              key: "price",
              label: "المبلغ",
              render: (row) => `${formatNumber(row.price as number)} ر.س`,
            },
            {
              key: "payment_method",
              label: "طريقة الدفع",
              render: (row) => {
                if (!row.payment_method) {
                  return <span className="text-slate-400">—</span>;
                }
                return row.payment_method === "card" ? (
                  <Badge label="بطاقة" tone="success" />
                ) : (
                  <Badge label="تحويل بنكي" tone="warning" />
                );
              },
            },
            {
              key: "status",
              label: "الحالة",
              render: (row) => row.statusBadge,
            },
            {
              key: "created_at",
              label: "تاريخ الطلب",
              render: (row) => formatDate(row.created_at as string),
            },
          ]}
          getRowKey={(row) => row.id as string}
          rows={rows}
        />
        <PaginationControls
          pathname={pathname}
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={count ?? 0}
          query={{ q, status }}
        />
      </SectionCard>
    </>
  );
}
