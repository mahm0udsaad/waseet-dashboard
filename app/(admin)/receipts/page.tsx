import { Badge } from "@/components/admin/Badge";
import { DataTable } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { PaginationControls } from "@/components/admin/PaginationControls";
import { SearchFilter } from "@/components/admin/SearchFilter";
import { SectionCard } from "@/components/admin/SectionCard";
import { formatDate, formatNumber } from "@/lib/format";
import { getPaginationRange, parsePageParam } from "@/lib/pagination";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const STATUS_MAP: Record<
  string,
  { label: string; tone: "neutral" | "success" | "warning" | "danger" }
> = {
  draft: { label: "مسودة", tone: "neutral" },
  seller_signed: { label: "توقيع البائع", tone: "warning" },
  final: { label: "نهائي", tone: "success" },
};

const PAGE_SIZE = 20;

type Props = {
  searchParams: Promise<{ page?: string; status?: string }>;
};

export default async function ReceiptsPage({ searchParams }: Props) {
  const { page: pageParam, status } = await searchParams;
  const page = parsePageParam(pageParam);
  const { from, to } = getPaginationRange(page, PAGE_SIZE);
  const supabase = getSupabaseServerClient();

  let query = supabase
    .from("receipts")
    .select(
      "id, description, amount, currency, status, seller_id, buyer_id, pdf_path, conversation_id, ad_id, created_at"
    );

  let countQuery = supabase
    .from("receipts")
    .select("id", { count: "exact", head: true });

  if (status) {
    query = query.eq("status", status);
    countQuery = countQuery.eq("status", status);
  }

  const [{ data: receipts }, { count }] = await Promise.all([
    query.order("created_at", { ascending: false }).range(from, to),
    countQuery,
  ]);

  // Fetch profiles for buyers and sellers
  const userIds = Array.from(
    new Set(
      (receipts ?? [])
        .flatMap((r) => [r.seller_id, r.buyer_id])
        .filter(Boolean)
    )
  ) as string[];

  const { data: profiles } =
    userIds.length > 0
      ? await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", userIds)
      : { data: [] };

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.user_id, p.display_name])
  );

  // Generate signed URLs for PDFs (chat bucket is private)
  const pdfPaths = (receipts ?? []).map((r) => r.pdf_path).filter(Boolean) as string[];
  const signedUrlMap = new Map<string, string>();
  if (pdfPaths.length > 0) {
    const { data: signedUrls } = await supabase.storage
      .from("chat")
      .createSignedUrls(pdfPaths, 60 * 60); // 1 hour expiry
    (signedUrls ?? []).forEach(({ path, signedUrl }) => {
      if (path && signedUrl) signedUrlMap.set(path, signedUrl);
    });
  }

  const rows =
    receipts?.map((receipt) => {
      const statusInfo = STATUS_MAP[receipt.status ?? "draft"] ?? {
        label: receipt.status,
        tone: "neutral" as const,
      };
      return {
        ...receipt,
        sellerName: profileMap.get(receipt.seller_id ?? "") ?? "—",
        buyerName: profileMap.get(receipt.buyer_id ?? "") ?? "—",
        statusBadge: <Badge label={statusInfo.label} tone={statusInfo.tone} />,
        pdfUrl: receipt.pdf_path ? (signedUrlMap.get(receipt.pdf_path) ?? null) : null,
      };
    }) ?? [];

  return (
    <>
      <PageHeader
        title="الإيصالات"
        subtitle="عرض ومتابعة إيصالات المعاملات."
        actions={
          <a
            href="/api/admin/export?entity=receipts&format=csv"
            className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-slate-700"
          >
            تصدير البيانات
          </a>
        }
      />

      <div className="mb-4">
        <SearchFilter
          pathname="/receipts"
          currentQuery={{ status }}
          fields={[
            {
              key: "status",
              label: "الحالة",
              type: "select",
              options: [
                { value: "draft", label: "مسودة" },
                { value: "seller_signed", label: "توقيع البائع" },
                { value: "final", label: "نهائي" },
              ],
            },
          ]}
        />
      </div>

      <SectionCard
        title="قائمة الإيصالات"
        description={`عدد النتائج: ${formatNumber(count ?? 0)}`}
      >
        <DataTable
          columns={[
            {
              key: "id",
              label: "المعرف",
              render: (row) => (
                <span className="font-mono text-xs">
                  {(row.id as string).slice(0, 8)}...
                </span>
              ),
            },
            { key: "description", label: "الوصف" },
            { key: "sellerName", label: "البائع" },
            { key: "buyerName", label: "المشتري" },
            {
              key: "amount",
              label: "المبلغ",
              render: (row) =>
                row.amount
                  ? `${formatNumber(row.amount as number)} ${row.currency as string}`
                  : "—",
            },
            {
              key: "status",
              label: "الحالة",
              render: (row) => row.statusBadge,
            },
            {
              key: "pdf_path",
              label: "PDF",
              render: (row) =>
                row.pdfUrl ? (
                  <a
                    href={row.pdfUrl as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--brand)] underline underline-offset-2 text-xs"
                  >
                    عرض
                  </a>
                ) : (
                  <span className="text-slate-400">—</span>
                ),
            },
            {
              key: "created_at",
              label: "التاريخ",
              render: (row) => formatDate(row.created_at as string),
            },
          ]}
          getRowKey={(row) => row.id as string}
          rows={rows}
        />
        <PaginationControls
          pathname="/receipts"
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={count ?? 0}
          query={{ status }}
        />
      </SectionCard>
    </>
  );
}
