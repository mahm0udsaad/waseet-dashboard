import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function SectionCard({
  title,
  description,
  actions,
  children,
}: SectionCardProps) {
  return (
    <section className="admin-panel rounded-[28px] p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
          {description ? (
            <p className="text-sm leading-6 text-[var(--text-muted)]">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      <div className="mt-5 h-px bg-gradient-to-l from-transparent via-slate-200 to-transparent" />
      <div className="mt-5">{children}</div>
    </section>
  );
}
