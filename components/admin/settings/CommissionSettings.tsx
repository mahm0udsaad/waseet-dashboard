"use client";

import { useEffect, useState } from "react";
import { SectionCard } from "@/components/admin/SectionCard";
import { ActionButton } from "@/components/admin/ActionButton";

type CommissionSetting = {
  id: string;
  service_type: string;
  commission_type: "percentage" | "fixed";
  rate: number;
  label_en: string;
  label_ar: string;
  is_active: boolean;
  tax_enabled: boolean;
  tax_rate: number;
};

const SERVICE_LABELS: Record<string, string> = {
  damin: "ضامن",
  tanazul: "تنازل",
  taqib: "تعقيب",
};

export function CommissionSettings() {
  const [settings, setSettings] = useState<CommissionSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings/commission")
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave(setting: CommissionSetting) {
    setSaving(setting.service_type);
    setSuccess(null);
    try {
      const res = await fetch("/api/admin/settings/commission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(setting),
      });
      if (res.ok) {
        setSuccess(setting.service_type);
        setTimeout(() => setSuccess(null), 2000);
      }
    } finally {
      setSaving(null);
    }
  }

  function updateSetting(serviceType: string, updates: Partial<CommissionSetting>) {
    setSettings((prev) =>
      prev.map((s) =>
        s.service_type === serviceType ? { ...s, ...updates } : s
      )
    );
  }

  if (loading) {
    return (
      <SectionCard title="إعدادات العمولة" description="جارٍ التحميل...">
        <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
      </SectionCard>
    );
  }

  return (
    <div className="space-y-4">
      {settings.map((setting) => (
        <SectionCard
          key={setting.service_type}
          title={`عمولة ${SERVICE_LABELS[setting.service_type] ?? setting.service_type}`}
          description={`إعدادات العمولة لخدمة ${SERVICE_LABELS[setting.service_type] ?? setting.service_type}`}
        >
          <div className="space-y-4">
            {/* Active toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-600">تفعيل</label>
              <button
                type="button"
                onClick={() =>
                  updateSetting(setting.service_type, {
                    is_active: !setting.is_active,
                  })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  setting.is_active ? "bg-emerald-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    setting.is_active ? "-translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Commission type */}
            <div>
              <label className="mb-1 block text-sm text-slate-600">نوع العمولة</label>
              <select
                value={setting.commission_type}
                onChange={(e) =>
                  updateSetting(setting.service_type, {
                    commission_type: e.target.value as "percentage" | "fixed",
                  })
                }
                className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
              >
                <option value="percentage">نسبة مئوية (%)</option>
                <option value="fixed">مبلغ ثابت (ر.س)</option>
              </select>
            </div>

            {/* Rate */}
            <div>
              <label className="mb-1 block text-sm text-slate-600">
                {setting.commission_type === "percentage" ? "النسبة (%)" : "المبلغ (ر.س)"}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={setting.rate}
                onChange={(e) =>
                  updateSetting(setting.service_type, {
                    rate: Number(e.target.value),
                  })
                }
                className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
              />
            </div>

            {/* Labels */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-slate-600">التسمية (عربي)</label>
                <input
                  type="text"
                  value={setting.label_ar}
                  onChange={(e) =>
                    updateSetting(setting.service_type, {
                      label_ar: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-600">التسمية (إنجليزي)</label>
                <input
                  type="text"
                  dir="ltr"
                  value={setting.label_en}
                  onChange={(e) =>
                    updateSetting(setting.service_type, {
                      label_en: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* Tax toggle + rate */}
            <div className="rounded-xl border border-[var(--border)] p-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-slate-600">تفعيل الضريبة (VAT)</label>
                <button
                  type="button"
                  onClick={() =>
                    updateSetting(setting.service_type, {
                      tax_enabled: !setting.tax_enabled,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    setting.tax_enabled ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      setting.tax_enabled ? "-translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              {setting.tax_enabled && (
                <div className="mt-3">
                  <label className="mb-1 block text-sm text-slate-600">نسبة الضريبة (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={setting.tax_rate}
                    onChange={(e) =>
                      updateSetting(setting.service_type, {
                        tax_rate: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
                  />
                </div>
              )}
            </div>

            {/* Save button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={saving === setting.service_type}
                onClick={() => handleSave(setting)}
                className="rounded-xl bg-[var(--brand)] px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {saving === setting.service_type ? "جارٍ الحفظ..." : "حفظ التغييرات"}
              </button>
              {success === setting.service_type && (
                <span className="text-sm text-emerald-600">تم الحفظ بنجاح</span>
              )}
            </div>
          </div>
        </SectionCard>
      ))}
    </div>
  );
}
