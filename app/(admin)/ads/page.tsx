import Link from "next/link";
import { Badge } from "@/components/admin/Badge";
import { DataTable } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { PaginationControls } from "@/components/admin/PaginationControls";
import { SearchFilter } from "@/components/admin/SearchFilter";
import { SectionCard } from "@/components/admin/SectionCard";
import { AdRowActions } from "@/components/admin/ads/AdRowActions";
import { formatDate } from "@/lib/format";
import { getPaginationRange, parsePageParam } from "@/lib/pagination";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const PAGE_SIZE = 20;

const typeLabels: Record<string, string> = {
  tanazul: "تنازل",
  taqib: "تعقيب",
  dhamen: "ضامن",
};

type Props = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    type?: string;
    status?: string;
  }>;
};

export default async function AdsPage({ searchParams }: Props) {
  const { page: pageParam, q, type, status } = await searchParams;
  const page = parsePageParam(pageParam);
  const { from, to } = getPaginationRange(page, PAGE_SIZE);
  const supabase = getSupabaseServerClient();

  let query = supabase
    .from("ads")
    .select("id, title, type, status, created_at, price, owner_id");

  let countQuery = supabase
    .from("ads")
    .select("id", { count: "exact", head: true });

  if (q) {
    query = query.ilike("title", `%${q}%`);
    countQuery = countQuery.ilike("title", `%${q}%`);
  }
  if (type) {
    query = query.eq("type", type);
    countQuery = countQuery.eq("type", type);
  }
  if (status) {
    query = query.eq("status", status);
    countQuery = countQuery.eq("status", status);
  }

  const [{ data: ads }, { count }] = await Promise.all([
    query.order("created_at", { ascending: false }).range(from, to),
    countQuery,
  ]);

  // Fetch owner profiles and conversation stats separately
  const adIds = ads?.map((a) => a.id) ?? [];
  const ownerIds = [...new Set((ads ?? []).map((a) => a.owner_id).filter(Boolean))];

  const [{ data: profiles }, { data: conversations }] =
    await Promise.all([
      ownerIds.length > 0
        ? supabase
            .from("profiles")
            .select("user_id, display_name, email")
            .in("user_id", ownerIds)
        : Promise.resolve({ data: [] as { user_id: string; display_name: string; email: string | null }[] }),
      adIds.length > 0
        ? supabase
            .from("conversations")
            .select("id, ad_id")
            .in("ad_id", adIds)
        : Promise.resolve({ data: [] as { id: string; ad_id: string | null }[] }),
    ]);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.user_id, p])
  );

  // Build conversation count per ad and collect conversation IDs
  const convCountMap = new Map<string, number>();
  const convIdMap = new Map<string, string>();
  const convToAdMap = new Map<string, string>();
  (conversations ?? []).forEach((c) => {
    if (c.ad_id) {
      convCountMap.set(c.ad_id, (convCountMap.get(c.ad_id) ?? 0) + 1);
      if (!convIdMap.has(c.ad_id)) convIdMap.set(c.ad_id, c.id);
      convToAdMap.set(c.id, c.ad_id);
    }
  });

  // Fetch message counts for these conversations
  const convIds = (conversations ?? []).map((c) => c.id);
  const { data: msgRows } =
    convIds.length > 0
      ? await supabase
          .from("messages")
          .select("conversation_id")
          .in("conversation_id", convIds)
      : { data: [] as { conversation_id: string | null }[] };

  // Build message count per ad
  const msgCountMap = new Map<string, number>();
  (msgRows ?? []).forEach((m) => {
    const adId = convToAdMap.get(m.conversation_id ?? "");
    if (adId) {
      msgCountMap.set(adId, (msgCountMap.get(adId) ?? 0) + 1);
    }
  });

  const rows =
    ads?.map((ad) => {
      const profile = profileMap.get(ad.owner_id);
      return {
        ...ad,
        ownerName: profile?.display_name ?? "غير معروف",
        typeLabel: typeLabels[ad.type] ?? ad.type,
        statusBadge: (
          <Badge
            label={ad.status === "blocked" ? "محجوب" : "نشط"}
            tone={ad.status === "blocked" ? "danger" : "success"}
          />
        ),
        conversationId: convIdMap.get(ad.id) ?? null,
        conversationCount: convCountMap.get(ad.id) ?? 0,
        messageCount: msgCountMap.get(ad.id) ?? 0,
      };
    }) ?? [];

  return (
    <>
      <PageHeader
        title="الإعلانات"
        subtitle="إدارة الإعلانات وحالة النشر."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/ads/reorder"
              className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
            >
              ترتيب الإعلانات
            </Link>
            <a
              href="/api/admin/export?entity=ads&format=csv"
              className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-slate-700"
            >
              تصدير البيانات
            </a>
          </div>
        }
      />

      <div className="mb-4">
        <SearchFilter
          pathname="/ads"
          currentQuery={{ q, type, status }}
          fields={[
            {
              key: "q",
              label: "بحث",
              type: "text",
              placeholder: "عنوان الإعلان",
            },
            {
              key: "type",
              label: "النوع",
              type: "select",
              options: [
                { value: "tanazul", label: "تنازل" },
                { value: "taqib", label: "تعقيب" },
                { value: "dhamen", label: "ضامن" },
              ],
            },
            {
              key: "status",
              label: "الحالة",
              type: "select",
              options: [
                { value: "active", label: "نشط" },
                { value: "blocked", label: "محجوب" },
                { value: "removed", label: "محذوف" },
              ],
            },
          ]}
        />
      </div>

      <SectionCard
        title="قائمة الإعلانات"
        description="إدارة الإعلانات مع تنقل سريع بين الصفحات."
      >
        <DataTable
          columns={[
            { key: "title", label: "العنوان" },
            { key: "ownerName", label: "المالك" },
            {
              key: "type",
              label: "النوع",
              render: (row) => row.typeLabel as string,
            },
            {
              key: "status",
              label: "الحالة",
              render: (row) => row.statusBadge,
            },
            {
              key: "conversationCount",
              label: "المحادثات",
              render: (row) => String(row.conversationCount),
            },
            {
              key: "messageCount",
              label: "الرسائل",
              render: (row) => String(row.messageCount),
            },
            {
              key: "created_at",
              label: "تاريخ الإنشاء",
              render: (row) => formatDate(row.created_at as string),
            },
            {
              key: "actions",
              label: "إجراءات",
              render: (row) => (
                <AdRowActions
                  adId={row.id as string}
                  adTitle={row.title as string}
                  status={row.status as string}
                  ownerId={row.owner_id as string}
                  ownerName={row.ownerName as string}
                  conversationId={row.conversationId as string | null}
                />
              ),
            },
          ]}
          getRowKey={(row) => row.id as string}
          rows={rows}
        />
        <PaginationControls
          pathname="/ads"
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={count ?? 0}
        />
      </SectionCard>
    </>
  );
}
