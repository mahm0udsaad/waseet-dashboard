import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/admin/Badge";
import { PageHeader } from "@/components/admin/PageHeader";
import { SectionCard } from "@/components/admin/SectionCard";
import { fillMissingUserContacts } from "@/lib/admin/user-contact";
import { formatDate, formatNumber } from "@/lib/format";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const typeLabels: Record<string, string> = {
  tanazul: "تنازل",
  taqib: "تعقيب",
  dhamen: "ضامن",
};

function getAdImageUrl(path: string) {
  const supabase = getSupabaseServerClient();
  const { data } = supabase.storage.from("ads").getPublicUrl(path);
  return data.publicUrl;
}

function getStatusBadge(status: string) {
  if (status === "blocked") {
    return <Badge label="محجوب" tone="danger" />;
  }
  if (status === "removed") {
    return <Badge label="محذوف" tone="warning" />;
  }
  return <Badge label="نشط" tone="success" />;
}

function formatMetadataValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join("، ");
  }
  return JSON.stringify(value);
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = getSupabaseServerClient();

  const { data: ad } = await supabase
    .from("ads")
    .select(
      "id, title, description, type, status, price, location, metadata, owner_id, created_at, ad_images(storage_path, sort_order)"
    )
    .eq("id", id)
    .maybeSingle();

  if (!ad) notFound();

  const [{ data: owner }, { data: conversations }, { data: messages }] =
    await Promise.all([
      ad.owner_id
        ? supabase
            .from("profiles")
            .select("user_id, display_name, email, phone")
            .eq("user_id", ad.owner_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("conversations")
        .select("id, status")
        .eq("ad_id", ad.id),
      supabase
        .from("conversations")
        .select("id")
        .eq("ad_id", ad.id),
    ]);
  const [ownerWithContacts] = owner
    ? await fillMissingUserContacts([owner])
    : [null];

  const conversationIds = (messages ?? []).map((conversation) => conversation.id);
  const { count: messageCount } =
    conversationIds.length > 0
      ? await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .in("conversation_id", conversationIds)
      : { count: 0 };

  const sortedImages = [...(((ad.ad_images as { storage_path: string; sort_order: number | null }[] | null) ?? []))]
    .sort((left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0));
  const imageUrls = sortedImages
    .map((image) => image.storage_path)
    .filter(Boolean)
    .map((path) => getAdImageUrl(path));

  const metadataEntries = Object.entries((ad.metadata ?? {}) as Record<string, unknown>);
  const openConversationCount = (conversations ?? []).filter(
    (conversation) => conversation.status === "open"
  ).length;

  return (
    <>
      <PageHeader
        title="تفاصيل الإعلان"
        subtitle={`معرف الإعلان: ${ad.id}`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/ads?ad_id=${ad.id}`}
              className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-slate-700 transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
            >
              العودة للقائمة
            </Link>
          </div>
        }
      />

      <SectionCard
        title={ad.title ?? "إعلان"}
        description="البيانات الأساسية والحالة الحالية للإعلان."
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_360px]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge label={typeLabels[ad.type] ?? ad.type} />
              {getStatusBadge(ad.status)}
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-500">العنوان</dt>
                <dd className="text-sm font-medium text-slate-900">{ad.title ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">النوع</dt>
                <dd className="text-sm text-slate-900">{typeLabels[ad.type] ?? ad.type}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">السعر</dt>
                <dd className="text-sm text-slate-900">
                  {ad.price === null ? "—" : `${formatNumber(Number(ad.price))} ر.س`}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">الموقع</dt>
                <dd className="text-sm text-slate-900">{ad.location ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">تاريخ الإنشاء</dt>
                <dd className="text-sm text-slate-900">{formatDate(ad.created_at)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">المحادثات</dt>
                <dd className="text-sm text-slate-900">
                  {formatNumber((conversations ?? []).length)} إجماليًا · {formatNumber(openConversationCount)} مفتوحة
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">الرسائل</dt>
                <dd className="text-sm text-slate-900">{formatNumber(messageCount ?? 0)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">صاحب الإعلان</dt>
                <dd className="text-sm text-slate-900">
                  {owner ? (
                    <Link
                      href={`/users/${owner.user_id}`}
                      className="text-[var(--brand)] underline underline-offset-2"
                    >
                      {owner.display_name ?? "—"}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
            </dl>

            <div>
              <h3 className="text-sm font-semibold text-slate-900">الوصف</h3>
              <div className="mt-2 rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                {ad.description ?? "لا يوجد وصف لهذا الإعلان."}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-900">صاحب الإعلان</h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">الاسم</dt>
                  <dd className="text-slate-900">{ownerWithContacts?.display_name ?? "—"}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">البريد</dt>
                  <dd className="text-slate-900">{ownerWithContacts?.email ?? "—"}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">الجوال</dt>
                  <dd className="text-slate-900" dir="ltr">
                    {ownerWithContacts?.phone ?? "—"}
                  </dd>
                </div>
              </dl>
            </div>

            {imageUrls.length > 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">صور الإعلان</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {imageUrls.map((src, index) => (
                    <a
                      key={`${src}-${index}`}
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block overflow-hidden rounded-2xl border border-slate-200 bg-white"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`صورة الإعلان ${index + 1}`}
                        className="h-40 w-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="البيانات الإضافية"
        description="تفاصيل الحقول المحفوظة داخل بيانات الإعلان."
      >
        {metadataEntries.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {metadataEntries.map(([key, value]) => (
              <div
                key={key}
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <p className="text-xs text-slate-500">{key}</p>
                <p className="mt-2 break-words text-sm text-slate-900">
                  {formatMetadataValue(value)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-slate-500">
            لا توجد بيانات إضافية محفوظة لهذا الإعلان.
          </div>
        )}
      </SectionCard>
    </>
  );
}
