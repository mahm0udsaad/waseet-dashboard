import { Badge } from "@/components/admin/Badge";
import { DataTable } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { PaginationControls } from "@/components/admin/PaginationControls";
import { SearchFilter } from "@/components/admin/SearchFilter";
import { SectionCard } from "@/components/admin/SectionCard";
import { formatDate } from "@/lib/format";
import { getPaginationRange, parsePageParam } from "@/lib/pagination";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const PAGE_SIZE = 50;

const ACTION_LABELS: Record<string, string> = {
  send_notification: "إرسال إشعار",
  broadcast_notification: "إشعار عام",
  update_role: "تحديث الدور",
  remove_role: "إزالة الدور",
  ban_user: "حظر مستخدم",
  unban_user: "إلغاء حظر",
  delete_user: "حذف مستخدم",
  block_ad: "حجب إعلان",
  unblock_ad: "إلغاء حجب",
  delete_ad: "حذف إعلان",
  approve_transfer: "موافقة تحويل",
  reject_transfer: "رفض تحويل",
  complete_order: "إكمال طلب",
  cancel_order: "إلغاء طلب",
  approve_withdrawal: "موافقة سحب",
  reject_withdrawal: "رفض سحب",
  verify_payment: "تحقق دفع",
  resolve_dispute: "حل نزاع",
  close_conversation: "إغلاق محادثة",
  update_commission: "تحديث العمولة",
  update_settings: "تحديث الإعدادات",
};

const ENTITY_LABELS: Record<string, string> = {
  user: "مستخدم",
  ad: "إعلان",
  order: "طلب",
  damin_order: "طلب ضامن",
  withdrawal: "سحب",
  conversation: "محادثة",
  settings: "إعدادات",
  commission: "عمولة",
  notification: "إشعار",
};

const ACTION_TONES: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  ban_user: "danger",
  delete_user: "danger",
  block_ad: "danger",
  delete_ad: "danger",
  reject_transfer: "danger",
  cancel_order: "danger",
  reject_withdrawal: "danger",
  approve_transfer: "success",
  complete_order: "success",
  approve_withdrawal: "success",
  verify_payment: "success",
  resolve_dispute: "success",
  unban_user: "success",
  unblock_ad: "success",
};

type Props = {
  searchParams: Promise<{ page?: string; action?: string; entity?: string }>;
};

export default async function AuditLogsPage({ searchParams }: Props) {
  const { page: pageParam, action, entity } = await searchParams;
  const page = parsePageParam(pageParam);
  const { from, to } = getPaginationRange(page, PAGE_SIZE);
  const supabase = getSupabaseServerClient();

  let query = supabase
    .from("admin_audit_logs")
    .select("id, actor_id, action, entity, entity_id, metadata, created_at");

  let countQuery = supabase
    .from("admin_audit_logs")
    .select("id", { count: "exact", head: true });

  if (action) {
    query = query.eq("action", action);
    countQuery = countQuery.eq("action", action);
  }
  if (entity) {
    query = query.eq("entity", entity);
    countQuery = countQuery.eq("entity", entity);
  }

  const [{ data: logs }, { count }] = await Promise.all([
    query.order("created_at", { ascending: false }).range(from, to),
    countQuery,
  ]);

  // Resolve actor names
  const actorIds = [...new Set((logs ?? []).map((l) => l.actor_id).filter(Boolean))];
  const { data: actorProfiles } =
    actorIds.length > 0
      ? await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", actorIds)
      : { data: [] as { user_id: string; display_name: string }[] };

  const actorNameMap = new Map(
    (actorProfiles ?? []).map((p) => [p.user_id, p.display_name])
  );

  const rows = (logs ?? []).map((log) => ({
    ...log,
    actorName: actorNameMap.get(log.actor_id) ?? "غير معروف",
    actionLabel: ACTION_LABELS[log.action] ?? log.action,
    entityLabel: ENTITY_LABELS[log.entity] ?? log.entity,
    actionTone: ACTION_TONES[log.action] ?? ("neutral" as const),
    metadataStr: log.metadata && Object.keys(log.metadata as object).length > 0
      ? JSON.stringify(log.metadata, null, 0)
      : null,
  }));

  return (
    <>
      <PageHeader
        title="سجل التدقيق"
        subtitle="جميع الأنشطة الإدارية مع تفاصيل المنفّذ والإجراء."
      />

      <div className="mb-4">
        <SearchFilter
          pathname="/audit-logs"
          currentQuery={{ action, entity }}
          fields={[
            {
              key: "action",
              label: "الإجراء",
              type: "select",
              options: Object.entries(ACTION_LABELS).map(([value, label]) => ({
                value,
                label,
              })),
            },
            {
              key: "entity",
              label: "الكيان",
              type: "select",
              options: Object.entries(ENTITY_LABELS).map(([value, label]) => ({
                value,
                label,
              })),
            },
          ]}
        />
      </div>

      <SectionCard
        title="السجل"
        description={`${count ?? 0} سجل — مرتبة من الأحدث.`}
      >
        <DataTable
          columns={[
            {
              key: "action",
              label: "الإجراء",
              render: (row) => (
                <Badge
                  label={row.actionLabel as string}
                  tone={row.actionTone as "neutral" | "success" | "warning" | "danger"}
                />
              ),
            },
            {
              key: "entity",
              label: "الكيان",
              render: (row) => (
                <span className="text-sm">{row.entityLabel as string}</span>
              ),
            },
            {
              key: "entity_id",
              label: "المعرف",
              render: (row) =>
                row.entity_id ? (
                  <span className="font-mono text-xs text-slate-500">
                    {(row.entity_id as string).slice(0, 8)}...
                  </span>
                ) : (
                  <span className="text-slate-300">—</span>
                ),
            },
            {
              key: "actor_id",
              label: "المنفّذ",
              render: (row) => (
                <span className="text-sm font-medium text-slate-900">
                  {row.actorName as string}
                </span>
              ),
            },
            {
              key: "metadata",
              label: "التفاصيل",
              render: (row) =>
                row.metadataStr ? (
                  <span className="text-xs text-slate-500 line-clamp-1 max-w-[200px] block">
                    {row.metadataStr as string}
                  </span>
                ) : (
                  <span className="text-slate-300">—</span>
                ),
            },
            {
              key: "created_at",
              label: "التاريخ",
              render: (row) => formatDate(row.created_at as string),
            },
          ]}
          rows={rows}
        />
        <PaginationControls
          pathname="/audit-logs"
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={count ?? 0}
          query={{ ...(action ? { action } : {}), ...(entity ? { entity } : {}) }}
        />
      </SectionCard>
    </>
  );
}
