import Link from "next/link";
import { Badge } from "@/components/admin/Badge";
import { DataTable } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { PaginationControls } from "@/components/admin/PaginationControls";
import { SectionCard } from "@/components/admin/SectionCard";
import { StatCard } from "@/components/admin/StatCard";
import { SliderRowActions } from "@/components/admin/sliders/SliderRowActions";
import { formatNumber } from "@/lib/format";
import { getPaginationRange, parsePageParam } from "@/lib/pagination";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const PALETTE_LABELS: Record<string, string> = {
  amber_burst: "Amber Burst",
  emerald_flow: "Emerald Flow",
  violet_rush: "Violet Rush",
  ocean_wave: "Ocean Wave",
  rose_glow: "Rose Glow",
  slate_night: "Slate Night",
};

const ICON_LABELS: Record<string, string> = {
  trending_up: "ترند صاعد",
  check_circle: "تم",
  zap: "برق",
  shield: "درع",
};

const PAGE_SIZE = 20;

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function SlidersPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);
  const { from, to } = getPaginationRange(page, PAGE_SIZE);
  const supabase = getSupabaseServerClient();

  const [{ data: banners }, { count }, activeResult] = await Promise.all([
    supabase
      .from("home_sliders")
      .select(
        "id, title_ar, title_en, subtitle_ar, badge_ar, use_image, gradient_palette, icon_name, sort_order, is_active, created_at"
      )
      .order("sort_order", { ascending: true })
      .range(from, to),
    supabase
      .from("home_sliders")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("home_sliders")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
  ]);

  const rows =
    banners?.map((banner) => ({
      ...banner,
      statusBadge: (
        <Badge
          label={banner.is_active ? "نشط" : "متوقف"}
          tone={banner.is_active ? "success" : "neutral"}
        />
      ),
      typeBadge: (
        <Badge label={banner.use_image ? "صورة" : "نصي"} tone="neutral" />
      ),
      paletteName: banner.gradient_palette
        ? PALETTE_LABELS[banner.gradient_palette] ?? banner.gradient_palette
        : "—",
      iconLabel: banner.icon_name
        ? ICON_LABELS[banner.icon_name] ?? banner.icon_name
        : "—",
    })) ?? [];

  return (
    <>
      <PageHeader
        title="السلايدر"
        subtitle="إدارة بانرات الصفحة الرئيسية وترتيبها."
        actions={
          <Link
            href="/sliders/new"
            className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm text-white transition hover:opacity-90"
          >
            إضافة سلايدر
          </Link>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="إجمالي السلايدرات"
          value={formatNumber(count ?? 0)}
          hint="كل البانرات"
        />
        <StatCard
          label="نشط"
          value={formatNumber(activeResult.count ?? 0)}
          hint="معروض حالياً"
        />
      </section>

      <SectionCard
        title="قائمة السلايدرات"
        description={`عدد النتائج: ${formatNumber(count ?? 0)}`}
      >
        <DataTable
          columns={[
            { key: "title_ar", label: "العنوان" },
            {
              key: "title_en",
              label: "العنوان (EN)",
              render: (row) => (
                <span dir="ltr" className="text-slate-600">
                  {(row.title_en as string) || "—"}
                </span>
              ),
            },
            {
              key: "type",
              label: "النوع",
              render: (row) => row.typeBadge,
            },
            {
              key: "palette",
              label: "اللوحة",
              render: (row) => (
                <span className="text-xs text-slate-600">{row.paletteName as string}</span>
              ),
            },
            {
              key: "icon",
              label: "الأيقونة",
              render: (row) => (
                <span className="text-xs text-slate-600">{row.iconLabel as string}</span>
              ),
            },
            {
              key: "status",
              label: "الحالة",
              render: (row) => row.statusBadge,
            },
            { key: "sort_order", label: "الترتيب" },
            {
              key: "actions",
              label: "إجراءات",
              render: (row) => (
                <SliderRowActions
                  sliderId={row.id as string}
                  isActive={row.is_active as boolean}
                />
              ),
            },
          ]}
          getRowKey={(row) => row.id as string}
          rows={rows}
        />
        <PaginationControls
          pathname="/sliders"
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={count ?? 0}
        />
      </SectionCard>
    </>
  );
}
