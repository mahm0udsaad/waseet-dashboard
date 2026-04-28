"use client";

import { useEffect, useState } from "react";
import { SectionCard } from "@/components/admin/SectionCard";

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

const PREVIEW_AMOUNT = 1000;

function calcPreview(setting: CommissionSetting): {
  commission: number;
  total: number;
} {
  const commission =
    setting.commission_type === "percentage"
      ? (PREVIEW_AMOUNT * setting.rate) / 100
      : setting.rate;
  const tax = setting.tax_enabled
    ? (commission * setting.tax_rate) / 100
    : 0;
  return { commission: commission + tax, total: PREVIEW_AMOUNT + commission + tax };
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${
        checked ? "bg-emerald-500" : "bg-slate-300"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "-translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function ServiceCard({ setting, onUpdate }: {
  setting: CommissionSetting;
  onUpdate: (serviceType: string, updates: Partial<CommissionSetting>) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const preview = calcPreview(setting);
  const rateError =
    setting.commission_type === "percentage" && setting.rate > 100
      ? "النسبة لا يمكن أن تتجاوز 100%"
      : "";

  async function handleSave() {
    if (rateError) return;
    setSaving(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/admin/settings/commission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(setting),
      });
      if (res.ok) {
        setStatus("success");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        const body = await res.json().catch(() => ({}));
        setErrorMsg(body?.error || "فشل في حفظ الإعدادات");
        setStatus("error");
      }
    } catch {
      setErrorMsg("خطأ في الاتصال بالخادم");
      setStatus("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard
      title={`عمولة ${SERVICE_LABELS[setting.service_type] ?? setting.service_type}`}
      description={`إعدادات العمولة لخدمة ${SERVICE_LABELS[setting.service_type] ?? setting.service_type}`}
    >
      <div className="space-y-4">
        {/* Active toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm text-slate-600">تفعيل العمولة</label>
          <Toggle
            checked={setting.is_active}
            onChange={(v) => onUpdate(setting.service_type, { is_active: v })}
          />
        </div>

        {/* Commission type */}
        <div>
          <label className="mb-1 block text-sm text-slate-600">نوع العمولة</label>
          <select
            value={setting.commission_type}
            onChange={(e) =>
              onUpdate(setting.service_type, {
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
            max={setting.commission_type === "percentage" ? 100 : undefined}
            step="0.01"
            value={setting.rate}
            onChange={(e) =>
              onUpdate(setting.service_type, { rate: Number(e.target.value) })
            }
            className={`w-full rounded-xl border px-3 py-2 text-sm ${
              rateError ? "border-red-400 bg-red-50" : "border-[var(--border)]"
            }`}
          />
          {rateError && (
            <p className="mt-1 text-xs text-red-500">{rateError}</p>
          )}
        </div>

        {/* Labels */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-slate-600">التسمية (عربي)</label>
            <input
              type="text"
              value={setting.label_ar}
              onChange={(e) =>
                onUpdate(setting.service_type, { label_ar: e.target.value })
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
                onUpdate(setting.service_type, { label_en: e.target.value })
              }
              className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* VAT */}
        <div className="rounded-xl border border-[var(--border)] p-3">
          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-600">تفعيل الضريبة (VAT)</label>
            <Toggle
              checked={setting.tax_enabled}
              onChange={(v) =>
                onUpdate(setting.service_type, { tax_enabled: v })
              }
            />
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
                  onUpdate(setting.service_type, {
                    tax_rate: Number(e.target.value),
                  })
                }
                className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
              />
            </div>
          )}
        </div>

        {/* Live preview */}
        {setting.is_active && setting.rate > 0 && (
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
            <p className="mb-1 font-medium text-slate-700">معاينة على طلب بقيمة {PREVIEW_AMOUNT} ر.س</p>
            <div className="flex justify-between text-slate-500">
              <span>العمولة</span>
              <span>{preview.commission.toFixed(2)} ر.س</span>
            </div>
            <div className="mt-1 flex justify-between font-semibold text-slate-800">
              <span>الإجمالي</span>
              <span>{preview.total.toFixed(2)} ر.س</span>
            </div>
          </div>
        )}

        {/* Save */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={saving || !!rateError}
            onClick={handleSave}
            className="rounded-xl bg-[var(--brand)] px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "جارٍ الحفظ..." : "حفظ التغييرات"}
          </button>
          {status === "success" && (
            <span className="text-sm text-emerald-600">✓ تم الحفظ بنجاح</span>
          )}
          {status === "error" && (
            <span className="text-sm text-red-500">{errorMsg}</span>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

export function CommissionSettings() {
  const [settings, setSettings] = useState<CommissionSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings/commission")
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json();
      })
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => {
        setFetchError(true);
        setLoading(false);
      });
  }, []);

  function updateSetting(serviceType: string, updates: Partial<CommissionSetting>) {
    setSettings((prev) =>
      prev.map((s) => (s.service_type === serviceType ? { ...s, ...updates } : s))
    );
  }

  if (loading) {
    return (
      <SectionCard title="إعدادات العمولة" description="جارٍ التحميل...">
        <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
      </SectionCard>
    );
  }

  if (fetchError) {
    return (
      <SectionCard title="إعدادات العمولة">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          تعذّر تحميل إعدادات العمولة. يرجى إعادة تحميل الصفحة أو التحقق من صلاحياتك.
        </div>
      </SectionCard>
    );
  }

  if (settings.length === 0) {
    return (
      <SectionCard title="إعدادات العمولة">
        <p className="text-sm text-slate-500">لا توجد إعدادات عمولة محفوظة.</p>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-4">
      {settings.map((setting) => (
        <ServiceCard
          key={setting.service_type}
          setting={setting}
          onUpdate={updateSetting}
        />
      ))}
    </div>
  );
}
