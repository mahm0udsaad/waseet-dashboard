import Link from "next/link";
import { AdReorderClient } from "@/components/admin/ads/AdReorderClient";
import { PageHeader } from "@/components/admin/PageHeader";
import { SectionCard } from "@/components/admin/SectionCard";
import { getSupabaseServerClient } from "@/lib/supabase/server";

async function fetchAdsWithOwners(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  type: "tanazul" | "taqib"
) {
  const { data: ads } = await supabase
    .from("ads")
    .select("id, title, price, sort_order, status, owner_id")
    .eq("type", type)
    .eq("status", "active")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (!ads || ads.length === 0) return [];

  const ownerIds = [...new Set(ads.map((a) => a.owner_id).filter(Boolean))];
  const { data: profiles } =
    ownerIds.length > 0
      ? await supabase
          .from("profiles")
          .select("user_id, display_name, phone")
          .in("user_id", ownerIds)
      : { data: [] as { user_id: string; display_name: string; phone: string | null }[] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

  return ads.map((ad) => {
    const profile = profileMap.get(ad.owner_id);
    return {
      ...ad,
      ownerName: profile?.display_name ?? null,
      ownerPhone: profile?.phone ?? null,
    };
  });
}

export default async function AdsReorderPage() {
  const supabase = getSupabaseServerClient();

  const [tanazulAds, taqibAds] = await Promise.all([
    fetchAdsWithOwners(supabase, "tanazul"),
    fetchAdsWithOwners(supabase, "taqib"),
  ]);

  return (
    <>
      <PageHeader
        title="ترتيب الإعلانات"
        subtitle="اسحب الإعلانات لتغيير ترتيب ظهورها في التطبيق."
        actions={
          <Link
            href="/ads"
            className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
          >
            ← العودة للإعلانات
          </Link>
        }
      />

      <SectionCard
        title="ترتيب الإعلانات النشطة"
        description="تظهر الإعلانات للمستخدمين بهذا الترتيب."
      >
        <AdReorderClient
          tanazulAds={tanazulAds}
          taqibAds={taqibAds}
        />
      </SectionCard>
    </>
  );
}
