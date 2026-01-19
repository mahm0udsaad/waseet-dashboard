type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
};

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface-dark)] to-[var(--surface-dark-2)] p-4 text-white shadow-sm">
      <p className="text-sm text-white/70">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-white/60">{hint}</p> : null}
    </div>
  );
}
