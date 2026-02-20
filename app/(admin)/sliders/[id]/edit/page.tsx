import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { SectionCard } from "@/components/admin/SectionCard";
import { SliderForm } from "@/components/admin/sliders/SliderForm";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditSliderPage({ params }: Props) {
  const { id } = await params;
  const supabase = getSupabaseServerClient();

  const { data: banner } = await supabase
    .from("home_sliders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!banner) notFound();

  return (
    <>
      <PageHeader
        title="تعديل السلايدر"
        subtitle={`تعديل بانر #${id.slice(0, 8)}`}
        actions={
          <Link
            href="/sliders"
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-slate-700 transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
          >
            العودة للقائمة
          </Link>
        }
      />
      <SectionCard title="بيانات السلايدر">
        <SliderForm
          mode="edit"
          initialData={{
            id: banner.id,
            title_ar: banner.title_ar ?? "",
            title_en: banner.title_en ?? null,
            subtitle_ar: banner.subtitle_ar ?? "",
            subtitle_en: banner.subtitle_en ?? null,
            badge_ar: banner.badge_ar ?? "",
            badge_en: banner.badge_en ?? null,
            gradient_palette: banner.gradient_palette ?? null,
            gradient_from: banner.gradient_from ?? null,
            gradient_to: banner.gradient_to ?? null,
            icon_name: banner.icon_name ?? null,
            background_image_url: banner.background_image_url ?? null,
            use_image: banner.use_image ?? false,
            sort_order: banner.sort_order ?? 0,
            is_active: banner.is_active ?? true,
          }}
        />
      </SectionCard>
    </>
  );
}
