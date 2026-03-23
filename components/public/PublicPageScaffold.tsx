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

function DaminStatusPill({ status }: { status: string }) {
  const label = mapDaminStatus(status);
  const tone =
    status === "completed"
      ? "bg-emerald-100 text-emerald-800"
      : status === "disputed" || status === "cancelled"
        ? "bg-rose-100 text-rose-800"
        : "bg-[#dbe7ff] text-[#1e3a8a]";

  return (
    <div
      className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${tone}`}
    >
      {label}
    </div>
  );
}

export function PublicDaminPage({ order }: { order: PublicDaminOrder }) {
  const appUrl = buildDaminAppUrl(order.id);
  const amount = formatMoney(order.amount);
  const createdAt = formatDateLabel(order.createdAt);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eef4ff_0%,#f7f4ef_42%,#fcfaf5_100%)] px-4 py-10 text-gray-950 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="overflow-hidden rounded-[2rem] border border-[#c8d7f5] bg-white shadow-[0_24px_80px_rgba(30,58,138,0.12)]">
          <div className="bg-gradient-to-br from-[#1e3a8a] via-[#2848a8] to-[#0f172a] p-8 text-white sm:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1 text-sm">
                  وسيط الآن • خدمة الضامن
                </div>
                <h1 className="mt-6 text-3xl font-bold sm:text-5xl">
                  لديك طلب ضامن جديد
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-8 text-white/80 sm:text-lg">
                  هذه الصفحة تعرض لك ملخصًا سريعًا للطلب. إذا كان التطبيق مثبتًا على
                  جهازك فافتح الطلب مباشرة من خلاله، وإن لم يكن مثبتًا ستجد روابط
                  التحميل بالأسفل.
                </p>
              </div>
              <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                <div className="text-sm text-white/70">حالة الطلب</div>
                <div className="mt-3">
                  <DaminStatusPill status={order.status} />
                </div>
                {amount ? (
                  <>
                    <div className="mt-5 text-sm text-white/70">إجمالي المبلغ</div>
                    <div className="mt-2 text-3xl font-bold">{amount}</div>
                  </>
                ) : null}
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={appUrl}
                className="group inline-flex items-center justify-center gap-3 rounded-[1.4rem] bg-white px-6 py-4 text-center text-base font-bold text-[#1e3a8a] shadow-[0_18px_40px_rgba(15,23,42,0.14)] ring-1 ring-white/70 transition hover:-translate-y-0.5 hover:bg-[#f8fbff] hover:shadow-[0_24px_50px_rgba(15,23,42,0.18)]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f0ff] text-xl transition group-hover:bg-[#dbe7ff]">
                  ←
                </span>
                <span>فتح الطلب في التطبيق</span>
              </Link>
              <Link
                href="#download"
                className="rounded-2xl border border-white/25 px-5 py-4 text-center text-sm font-semibold text-white transition hover:bg-white/10"
              >
                تحميل التطبيق
              </Link>
            </div>
          </div>

          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-[1.75rem] border border-[#d9e4fb] bg-[#f8fbff] p-6">
              <h2 className="text-2xl font-bold text-[#102a67]">ملخص الطلب</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                المعلومات الظاهرة هنا مخصصة للمعاينة السريعة قبل الانتقال للتطبيق.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <SummaryCard label="اسم مقدم الطلب" value={order.requesterName} />
                <SummaryCard label="الحالة" value={mapDaminStatus(order.status)} />
                <SummaryCard label="المبلغ" value={amount} />
                <SummaryCard label="تاريخ الإنشاء" value={createdAt} />
              </div>

              <div className="mt-4 rounded-2xl border border-[#d9e4fb] bg-white p-5">
                <div className="text-sm text-slate-500">وصف الطلب</div>
                <div className="mt-3 text-lg font-semibold leading-8 text-slate-900">
                  {order.serviceSummary}
                </div>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-gray-200 bg-white p-6">
              <h2 className="text-2xl font-bold">كيف تتابع الطلب؟</h2>
              <div className="mt-6 space-y-4">
                {[
                  "افتح الطلب داخل التطبيق لمراجعة التفاصيل الكاملة واتخاذ الإجراء المناسب.",
                  "إذا لم يفتح التطبيق تلقائيًا فاستخدم زر التحميل بالأسفل ثم أعد فتح الرابط.",
                  "ننصح بعدم مشاركة رابط الطلب خارج الأطراف المعنيين به.",
                ].map((item, index) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl bg-[#f8fafc] p-4"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#dbe7ff] text-sm font-bold text-[#1e3a8a]">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-7 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-[#d9e4fb] bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_100%)] p-5">
                <div className="text-sm text-slate-500">الانتقال السريع</div>
                <Link
                  href={appUrl}
                  className="mt-3 inline-flex items-center gap-3 rounded-[1.25rem] bg-[#1e3a8a] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(30,58,138,0.24)] transition hover:-translate-y-0.5 hover:bg-[#2446a6]"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-base">
                    ←
                  </span>
                  فتح داخل التطبيق
                </Link>
              </div>
            </section>
          </div>
        </div>

        <section
          id="download"
          className="mt-8 rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-2xl font-bold">تحميل التطبيق</h2>
          <p className="mt-3 max-w-2xl text-base leading-8 text-gray-600">
            إذا لم يفتح التطبيق تلقائيًا، حمّله من المتجر المناسب ثم ارجع إلى هذا
            الرابط مرة أخرى.
          </p>
          <div className="mt-6">
            <StoreButtons locale="ar" variant="badge" />
          </div>
        </section>
      </div>
    </main>
  );
}
