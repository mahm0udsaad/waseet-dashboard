import { getSupabaseServerClient } from "./server";

export async function logAdminAction(params: {
  actorId: string;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getSupabaseServerClient();
  await supabase.from("admin_audit_logs").insert({
    actor_id: params.actorId,
    action: params.action,
    entity: params.entity,
    entity_id: params.entityId ?? null,
    metadata: params.metadata ?? {},
  });
}
