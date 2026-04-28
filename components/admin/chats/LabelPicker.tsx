"use client";

import { useState } from "react";
import { Tag, X, ChevronDown } from "lucide-react";

export const CHAT_LABELS: { value: string; labelAr: string; color: string; bg: string }[] = [
  { value: "dispute",         labelAr: "نزاع",           color: "text-red-700",    bg: "bg-red-50 border-red-200"    },
  { value: "pending_transfer",labelAr: "تحويل معلق",     color: "text-amber-700",  bg: "bg-amber-50 border-amber-200"},
  { value: "needs_followup",  labelAr: "يحتاج متابعة",   color: "text-blue-700",   bg: "bg-blue-50 border-blue-200"  },
  { value: "vip",             labelAr: "VIP",             color: "text-violet-700", bg: "bg-violet-50 border-violet-200"},
  { value: "urgent",          labelAr: "عاجل",            color: "text-orange-700", bg: "bg-orange-50 border-orange-200"},
  { value: "resolved",        labelAr: "محلول",           color: "text-emerald-700",bg: "bg-emerald-50 border-emerald-200"},
  { value: "spam",            labelAr: "مزعج",            color: "text-slate-600",  bg: "bg-slate-100 border-slate-200"},
];

export function LabelBadge({ value }: { value: string }) {
  const cfg = CHAT_LABELS.find((l) => l.value === value);
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cfg.bg} ${cfg.color}`}>
      {cfg.labelAr}
    </span>
  );
}

type Props = {
  conversationId: string;
  initialLabels: string[];
};

export function LabelPicker({ conversationId, initialLabels }: Props) {
  const [labels, setLabels] = useState<string[]>(initialLabels);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggle = async (value: string) => {
    const next = labels.includes(value)
      ? labels.filter((l) => l !== value)
      : [...labels, value];

    setLabels(next);
    setSaving(true);
    try {
      await fetch(`/api/admin/conversations/${conversationId}/labels`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labels: next }),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
      >
        <Tag className="h-3.5 w-3.5" />
        تصنيف
        {labels.length > 0 && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--brand)] text-[9px] font-bold text-white">
            {labels.length}
          </span>
        )}
        <ChevronDown className={`h-3 w-3 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Active labels strip */}
      {labels.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {labels.map((l) => {
            const cfg = CHAT_LABELS.find((x) => x.value === l);
            if (!cfg) return null;
            return (
              <button
                key={l}
                onClick={() => toggle(l)}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold transition hover:opacity-70 ${cfg.bg} ${cfg.color}`}
              >
                {cfg.labelAr}
                <X className="h-2.5 w-2.5" />
              </button>
            );
          })}
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full z-20 mt-1.5 w-48 rounded-2xl border border-[var(--border)] bg-white p-2 shadow-lg">
            <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              التصنيفات
            </p>
            {CHAT_LABELS.map((cfg) => {
              const active = labels.includes(cfg.value);
              return (
                <button
                  key={cfg.value}
                  onClick={() => toggle(cfg.value)}
                  disabled={saving}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs transition disabled:opacity-50 ${
                    active
                      ? `${cfg.bg} ${cfg.color} font-semibold`
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {cfg.labelAr}
                  {active && <span className="text-[10px]">✓</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
