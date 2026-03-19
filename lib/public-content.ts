import { cache } from "react";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type PublicAdType = "tanazul" | "taqib";

type RawAdImage = {
  storage_path: string;
  sort_order: number | null;
};

type RawAd = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  price: number | null;
  location: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  ad_images?: RawAdImage[] | null;
};

export type PublicAd = {
  id: string;
  type: PublicAdType;
  title: string;
  description: string | null;
  price: number | null;
  location: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  imageUrl: string | null;
};

export type PublicDaminOrder = {
  id: string;
  requesterName: string;
  amount: number | null;
  serviceSummary: string;
  status: string;
  createdAt: string | null;
};

function getStoragePublicUrl(path: string) {
  const supabase = getSupabaseServerClient();
  const { data } = supabase.storage.from("ads").getPublicUrl(path);
  return data.publicUrl;
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return `${new Intl.NumberFormat("ar-SA").format(value)} ر.س`;
}

export function formatDateLabel(value: string | null | undefined) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trim()}…`;
}

export function buildAdTitle(ad: PublicAd) {
  if (ad.type === "tanazul") {
    const profession =
      cleanText(ad.metadata.profession_label_ar) ||
      cleanText(ad.metadata.profession_label_ar_short) ||
      cleanText(ad.metadata.profession);
    return profession || ad.title;
  }

  return ad.title;
}

export function buildAdDescription(ad: PublicAd) {
  const parts: string[] = [];

  if (ad.type === "tanazul") {
    const profession =
      cleanText(ad.metadata.profession_label_ar) ||
      cleanText(ad.metadata.profession);
    if (profession) parts.push(profession);
  } else {
    const summary = cleanText(ad.description);
    if (summary) parts.push(summary);
  }

  const price = formatMoney(ad.price);
  if (price) parts.push(price);

  if (ad.location) parts.push(ad.location);

  return truncateText(parts.join(" • ") || "اعرض التفاصيل في وسيط الآن", 160);
}

function mapAd(ad: RawAd): PublicAd {
  const images = [...(ad.ad_images ?? [])].sort(
    (left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0)
  );

  return {
    id: ad.id,
    type: ad.type as PublicAdType,
    title: ad.title,
    description: ad.description,
    price: ad.price === null ? null : Number(ad.price),
    location: ad.location,
    metadata: ad.metadata ?? {},
    createdAt: ad.created_at,
    imageUrl: images[0]?.storage_path ? getStoragePublicUrl(images[0].storage_path) : null,
  };
}

export const getPublicAd = cache(async (type: PublicAdType, id: string) => {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("ads")
    .select("id, type, title, description, price, location, metadata, created_at, ad_images(storage_path, sort_order)")
    .eq("id", id)
    .eq("type", type)
    .maybeSingle();

  if (!data) return null;
  return mapAd(data as RawAd);
});

export const getPublicDaminOrder = cache(async (orderId: string) => {
  const supabase = getSupabaseServerClient();
  const { data: order } = await supabase
    .from("damin_orders")
    .select("id, creator_id, payer_user_id, service_type_or_details, total_amount, status, created_at")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return null;

  const requesterUserId = order.creator_id ?? order.payer_user_id;
  let requesterName = "مستخدم وسيط الآن";

  if (requesterUserId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", requesterUserId)
      .maybeSingle();

    if (profile?.display_name) {
      requesterName = profile.display_name;
    }
  }

  return {
    id: order.id,
    requesterName,
    amount:
      order.total_amount === null || order.total_amount === undefined
        ? null
        : Number(order.total_amount),
    serviceSummary: cleanText(order.service_type_or_details) || "طلب ضامن",
    status: order.status,
    createdAt: order.created_at,
  } satisfies PublicDaminOrder;
});
