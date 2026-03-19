import Link from "next/link";
import { buildDaminAppUrl, buildListingAppUrl } from "@/lib/app-links";
import { PublicAd, PublicAdType, PublicDaminOrder, formatDateLabel, formatMoney } from "@/lib/public-content";
import { StoreButtons } from "@/components/public/StoreButtons";

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  if (!value) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-2 text-lg font-semibold text-gray-950">{value}</div>
    </div>
  );
}

export function PublicAdPage({ ad, type }: { ad: PublicAd; type: PublicAdType }) {
  const typeLabel = type === "tanazul" ? "تنازل" : "تعقيب";
  const appUrl = buildListingAppUrl(type, ad.id);
  const price = formatMoney(ad.price);
  const createdAt = formatDateLabel(ad.createdAt);

  const detailRows =
    type === "tanazul"
      ? [
          { label: "المهنة", value: String(ad.metadata.profession_label_ar ?? ad.metadata.profession ?? "") || null },
          { label: "الجنسية", value: String(ad.metadata.nationality ?? "") || null },
          { label: "العمر", value: ad.metadata.age ? `${ad.metadata.age} سنة` : null },
          { label: "الجنس", value: ad.metadata.gender === "female" ? "أنثى" : ad.metadata.gender === "male" ? "ذكر" : null },
        ]
      : [
          { label: "العنوان", value: ad.title || null },
          { label: "الوصف", value: ad.description || null },
          { label: "الفئة", value: String(ad.metadata.category ?? "") || null },
          { label: "الخدمة", value: String(ad.metadata.availableServices ?? "") || null },
        ];

  return (
    <main className="min-h-screen bg-[#f7f4ef] px-4 py-10 text-gray-950 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] bg-gradient-to-br from-[#111827] via-[#1f2937] to-[#7c2d12] p-8 text-white shadow-2xl">
          <div className="inline-flex rounded-full border border-white/20 px-4 py-1 text-sm">
            وسيط الآن • {typeLabel}
          </div>
          <h1 className="mt-6 text-3xl font-bold sm:text-5xl">{ad.title}</h1>
          {ad.description ? (
            <p className="mt-4 max-w-3xl text-base leading-8 text-white/80 sm:text-lg">
              {ad.description}
            </p>
          ) : null}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={appUrl}
              className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-semibold text-gray-950 transition hover:bg-gray-100"
            >
              Open in App
            </Link>
            <Link
              href="#download"
              className="rounded-2xl border border-white/25 px-5 py-4 text-center text-sm font-semibold text-white transition hover:bg-white/10"
            >
              تنزيل التطبيق
            </Link>
          </div>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="النوع" value={typeLabel} />
          <SummaryCard label="السعر" value={price} />
          <SummaryCard label="الموقع" value={ad.location} />
          <SummaryCard label="تاريخ النشر" value={createdAt} />
        </section>

        <section className="mt-8 rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">تفاصيل الإعلان</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {detailRows.map((row) => (
              <SummaryCard key={row.label} label={row.label} value={row.value} />
            ))}
          </div>
        </section>

        <section
          id="download"
          className="mt-8 rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-2xl font-bold">حمّل التطبيق للمتابعة</h2>
          <p className="mt-3 max-w-2xl text-base leading-8 text-gray-600">
            يمكن فتح الرابط مباشرة داخل التطبيق عبر Universal Links وAndroid App Links،
            وإذا لم يكن التطبيق مثبتًا فهذه الصفحة تبقى كواجهة بديلة مع روابط التحميل.
          </p>
          <div className="mt-6">
            <StoreButtons />
          </div>
        </section>
      </div>
    </main>
  );
}

function mapDaminStatus(status: string) {
  switch (status) {
    case "created":
      return "تم الإنشاء";
    case "pending_confirmations":
      return "بانتظار التأكيد";
    case "both_confirmed":
      return "تم التأكيد";
    case "payment_submitted":
      return "تم إرسال الدفع";
    case "awaiting_completion":
      return "بانتظار اكتمال الخدمة";
    case "completion_requested":
      return "طلب اكتمال";
    case "completed":
      return "مكتمل";
    case "cancelled":
      return "ملغي";
    case "disputed":
      return "متنازع عليه";
    default:
      return status;
  }
}

export function PublicDaminPage({ order }: { order: PublicDaminOrder }) {
  const appUrl = buildDaminAppUrl(order.id);

  return (
    <main className="min-h-screen bg-[#fcfaf5] px-4 py-10 text-gray-950 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-[2rem] bg-gradient-to-br from-[#7f1d1d] via-[#991b1b] to-[#111827] p-8 text-white shadow-2xl">
          <div className="inline-flex rounded-full border border-white/20 px-4 py-1 text-sm">
            وسيط الآن • ضامن
          </div>
          <h1 className="mt-6 text-3xl font-bold sm:text-5xl">لديك طلب ضامن جديد</h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-white/80 sm:text-lg">
            راجع ملخص الطلب ثم أكمل المتابعة داخل التطبيق إذا كان مثبتًا على جهازك.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={appUrl}
              className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-semibold text-gray-950 transition hover:bg-gray-100"
            >
              Open in App
            </Link>
            <Link
              href="#download"
              className="rounded-2xl border border-white/25 px-5 py-4 text-center text-sm font-semibold text-white transition hover:bg-white/10"
            >
              تنزيل التطبيق
            </Link>
          </div>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <SummaryCard label="اسم مقدم الطلب" value={order.requesterName} />
          <SummaryCard label="المبلغ" value={formatMoney(order.amount)} />
          <SummaryCard label="ملخص الطلب" value={order.serviceSummary} />
          <SummaryCard label="الحالة" value={mapDaminStatus(order.status)} />
          <SummaryCard label="تاريخ الإنشاء" value={formatDateLabel(order.createdAt)} />
        </section>

        <section
          id="download"
          className="mt-8 rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-2xl font-bold">إذا لم يفتح التطبيق تلقائيًا</h2>
          <p className="mt-3 max-w-2xl text-base leading-8 text-gray-600">
            استخدم زر الفتح داخل التطبيق أو ثبّت التطبيق من المتجر المناسب ثم أعد فتح الرابط.
          </p>
          <div className="mt-6">
            <StoreButtons />
          </div>
        </section>
      </div>
    </main>
  );
}
