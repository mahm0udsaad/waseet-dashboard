type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
};

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="admin-panel rounded-[28px] p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-subtle)]">
            إدارة وتشغيل
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
              {subtitle}
            </p>
          ) : null}
        </div>

        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
      <div className="mt-5 h-px bg-gradient-to-l from-transparent via-slate-200 to-transparent" />
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[var(--text-subtle)]">
        <span className="rounded-full bg-slate-100 px-3 py-1">أولوية الوضوح</span>
        <span className="rounded-full bg-slate-100 px-3 py-1">تنقل أسرع</span>
        <span className="rounded-full bg-slate-100 px-3 py-1">عرض عملي للبيانات</span>
      </div>
    </div>
  );
}
