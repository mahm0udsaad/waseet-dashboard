type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "neutral" | "success" | "warning" | "danger";
};

const toneStyles: Record<NonNullable<StatCardProps["tone"]>, string> = {
  neutral:
    "before:from-slate-950 before:to-slate-500 bg-white",
  success:
    "before:from-emerald-700 before:to-emerald-400 bg-[var(--success-soft)]/60",
  warning:
    "before:from-amber-700 before:to-amber-400 bg-[var(--warning-soft)]/75",
  danger:
    "before:from-rose-700 before:to-rose-400 bg-[var(--danger-soft)]/80",
};

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
}: StatCardProps) {
  return (
    <article
      className={`relative overflow-hidden rounded-[26px] border border-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md before:absolute before:inset-x-0 before:top-0 before:h-1.5 before:bg-gradient-to-r ${toneStyles[tone]}`}
    >
      <p className="text-sm font-medium text-[var(--text-muted)]">{label}</p>
      <p className="mt-6 text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
      {hint ? (
        <p className="mt-2 text-xs leading-5 text-[var(--text-subtle)]">{hint}</p>
      ) : null}
    </article>
  );
}
