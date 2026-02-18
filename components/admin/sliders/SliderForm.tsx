"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const GRADIENT_PALETTES = [
  { value: "amber_burst", label: "Amber Burst", colors: "from-amber-400 to-orange-600" },
  { value: "emerald_flow", label: "Emerald Flow", colors: "from-emerald-400 to-teal-600" },
  { value: "violet_rush", label: "Violet Rush", colors: "from-violet-400 to-purple-600" },
  { value: "ocean_wave", label: "Ocean Wave", colors: "from-blue-400 to-cyan-600" },
  { value: "rose_glow", label: "Rose Glow", colors: "from-rose-400 to-pink-600" },
  { value: "slate_night", label: "Slate Night", colors: "from-slate-500 to-slate-800" },
];

const ICON_OPTIONS = [
  { value: "trending_up", label: "ترند صاعد" },
  { value: "check_circle", label: "تم" },
  { value: "zap", label: "برق" },
  { value: "shield", label: "درع" },
];

type SliderFormProps = {
  mode: "create" | "edit";
  initialData?: {
    id: string;
    title_ar: string;
    title_en: string | null;
    subtitle_ar: string;
    subtitle_en: string | null;
    badge_ar: string;
    badge_en: string | null;
    gradient_palette: string | null;
    gradient_from: string | null;
    gradient_to: string | null;
    icon_name: string | null;
    background_image_url: string | null;
    use_image: boolean;
    sort_order: number;
    is_active: boolean;
  };
};

export function SliderForm({ mode, initialData }: SliderFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [titleAr, setTitleAr] = useState(initialData?.title_ar ?? "");
  const [titleEn, setTitleEn] = useState(initialData?.title_en ?? "");
  const [subtitleAr, setSubtitleAr] = useState(initialData?.subtitle_ar ?? "");
  const [subtitleEn, setSubtitleEn] = useState(initialData?.subtitle_en ?? "");
  const [badgeAr, setBadgeAr] = useState(initialData?.badge_ar ?? "");
  const [badgeEn, setBadgeEn] = useState(initialData?.badge_en ?? "");
  const [gradientPalette, setGradientPalette] = useState(initialData?.gradient_palette ?? "amber_burst");
  const [gradientFrom, setGradientFrom] = useState(initialData?.gradient_from ?? "");
  const [gradientTo, setGradientTo] = useState(initialData?.gradient_to ?? "");
  const [iconName, setIconName] = useState(initialData?.icon_name ?? "shield");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(initialData?.background_image_url ?? "");
  const [useImage, setUseImage] = useState(initialData?.use_image ?? false);
  const [sortOrder, setSortOrder] = useState(initialData?.sort_order ?? 0);
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titleAr.trim()) {
      setError("العنوان بالعربية مطلوب");
      return;
    }

    setLoading(true);
    setError("");

    const payload = {
      title_ar: titleAr,
      title_en: titleEn || null,
      subtitle_ar: subtitleAr,
      subtitle_en: subtitleEn || null,
      badge_ar: badgeAr,
      badge_en: badgeEn || null,
      gradient_palette: gradientPalette || null,
      gradient_from: gradientFrom || null,
      gradient_to: gradientTo || null,
      icon_name: iconName || "shield",
      background_image_url: backgroundImageUrl || null,
      use_image: useImage,
      sort_order: sortOrder,
      is_active: isActive,
    };

    try {
      const url = mode === "edit"
        ? `/api/admin/banners/${initialData!.id}`
        : "/api/admin/banners";
      const method = mode === "edit" ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", accept: "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "حدث خطأ");
      }

      router.push("/sliders");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">العنوان بالعربية *</label>
          <input value={titleAr} onChange={(e) => setTitleAr(e.target.value)} className={inputClass} placeholder="العنوان بالعربية" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">العنوان بالإنجليزية</label>
          <input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} className={inputClass} placeholder="Title in English" dir="ltr" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">الوصف بالعربية</label>
          <input value={subtitleAr} onChange={(e) => setSubtitleAr(e.target.value)} className={inputClass} placeholder="الوصف بالعربية" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">الوصف بالإنجليزية</label>
          <input value={subtitleEn} onChange={(e) => setSubtitleEn(e.target.value)} className={inputClass} placeholder="Subtitle in English" dir="ltr" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">الوسم بالعربية</label>
          <input value={badgeAr} onChange={(e) => setBadgeAr(e.target.value)} className={inputClass} placeholder="الوسم" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">الوسم بالإنجليزية</label>
          <input value={badgeEn} onChange={(e) => setBadgeEn(e.target.value)} className={inputClass} placeholder="Badge" dir="ltr" />
        </div>
      </div>

      {/* Gradient Palette */}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">لوحة الألوان</label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {GRADIENT_PALETTES.map((palette) => (
            <button
              key={palette.value}
              type="button"
              onClick={() => setGradientPalette(palette.value)}
              className={`rounded-xl border-2 p-2 text-center transition ${
                gradientPalette === palette.value
                  ? "border-[var(--brand)] ring-2 ring-[var(--brand)]/20"
                  : "border-[var(--border)]"
              }`}
            >
              <div className={`mx-auto h-8 w-full rounded-lg bg-gradient-to-r ${palette.colors}`} />
              <span className="mt-1 block text-xs text-slate-600">{palette.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Gradients (optional fallback) */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">لون البداية (اختياري)</label>
          <input value={gradientFrom} onChange={(e) => setGradientFrom(e.target.value)} className={inputClass} placeholder="#0A1A2F" dir="ltr" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">لون النهاية (اختياري)</label>
          <input value={gradientTo} onChange={(e) => setGradientTo(e.target.value)} className={inputClass} placeholder="#10233D" dir="ltr" />
        </div>
      </div>

      {/* Icon */}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">الأيقونة</label>
        <select value={iconName} onChange={(e) => setIconName(e.target.value)} className={inputClass}>
          {ICON_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Image */}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">رابط صورة الخلفية (اختياري)</label>
        <input value={backgroundImageUrl} onChange={(e) => setBackgroundImageUrl(e.target.value)} className={inputClass} placeholder="https://..." dir="ltr" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">النوع</label>
          <select value={useImage ? "true" : "false"} onChange={(e) => setUseImage(e.target.value === "true")} className={inputClass}>
            <option value="false">نصي</option>
            <option value="true">بصورة</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">الترتيب</label>
          <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">الحالة</label>
          <select value={isActive ? "true" : "false"} onChange={(e) => setIsActive(e.target.value === "true")} className={inputClass}>
            <option value="true">نشط</option>
            <option value="false">متوقف</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-[var(--brand)] px-6 py-2 text-sm text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "جارٍ الحفظ..." : mode === "edit" ? "تحديث" : "إنشاء"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/sliders")}
          className="rounded-full border border-[var(--border)] px-6 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}
