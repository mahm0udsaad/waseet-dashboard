"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type ToggleSwitchProps = {
  checked: boolean;
  entityId: string;
  onEndpoint: string;
  offEndpoint: string;
  labelOn?: string;
  labelOff?: string;
  disabled?: boolean;
};

export function ToggleSwitch({
  checked: initialChecked,
  entityId,
  onEndpoint,
  offEndpoint,
  labelOn,
  labelOff,
  disabled = false,
}: ToggleSwitchProps) {
  const router = useRouter();
  const [checked, setChecked] = useState(initialChecked);
  const [isPending, startTransition] = useTransition();

  const label = checked ? labelOn : labelOff;

  async function handleToggle() {
    if (disabled || isPending) return;
    const newChecked = !checked;
    setChecked(newChecked);

    const endpoint = newChecked
      ? onEndpoint.replace("{id}", entityId)
      : offEndpoint.replace("{id}", entityId);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { accept: "application/json" },
      });
      if (!res.ok) throw new Error("Failed");
      startTransition(() => router.refresh());
    } catch {
      setChecked(!newChecked);
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled || isPending}
      onClick={handleToggle}
      className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:opacity-50"
    >
      <span
        dir="ltr"
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center overflow-hidden rounded-full transition-colors duration-200 ${
          checked ? "bg-rose-500" : "bg-emerald-500"
        } ${isPending ? "opacity-60" : ""}`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? "translate-x-1" : "translate-x-6"
          }`}
        />
      </span>
      {label && <span className="text-xs text-slate-600">{label}</span>}
    </button>
  );
}
