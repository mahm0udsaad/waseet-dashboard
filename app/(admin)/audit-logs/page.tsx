import { DataTable } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { PaginationControls } from "@/components/admin/PaginationControls";
import { SectionCard } from "@/components/admin/SectionCard";
import { formatDate } from "@/lib/format";
import { getPaginationRange, parsePageParam } from "@/lib/pagination";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const PAGE_SIZE = 50;

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function AuditLogsPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);
  const { from, to } = getPaginationRange(page, PAGE_SIZE);
  const supabase = getSupabaseServerClient();
  const [{ data: logs }, { count }] = await Promise.all([
    supabase
      .from("admin_audit_logs")
      .select("id, actor_id, action, entity, entity_id, created_at")
      .order("created_at", { ascending: false })
      .range(from, to),
    supabase
      .from("admin_audit_logs")
      .select("id", { count: "exact", head: true }),
  ]);

  return (
    <>
      <PageHeader
        title="سجل التدقيق"
        subtitle="جميع الأنشطة الإدارية الأخيرة."
      />
      <SectionCard title="السجل" description="سجل الأنشطة الإدارية مع تقسيم صفحات.">
        <DataTable
          columns={[
            { key: "action", label: "الإجراء" },
            { key: "entity", label: "الكيان" },
            { key: "entity_id", label: "المعرف" },
            { key: "actor_id", label: "المنفّذ" },
            {
              key: "created_at",
              label: "التاريخ",
              render: (row) => formatDate(row.created_at as string),
            },
          ]}
          rows={logs ?? []}
        />
        <PaginationControls
          pathname="/audit-logs"
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={count ?? 0}
        />
      </SectionCard>
    </>
  );
}
