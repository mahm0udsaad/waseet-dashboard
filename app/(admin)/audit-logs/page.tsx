import { DataTable } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { SectionCard } from "@/components/admin/SectionCard";
import { formatDate } from "@/lib/format";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function AuditLogsPage() {
  const supabase = getSupabaseServerClient();
  const { data: logs } = await supabase
    .from("admin_audit_logs")
    .select("id, actor_id, action, entity, entity_id, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <>
      <PageHeader
        title="سجل التدقيق"
        subtitle="جميع الأنشطة الإدارية الأخيرة."
      />
      <SectionCard title="السجل" description="آخر 50 إجراء إداري.">
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
      </SectionCard>
    </>
  );
}
