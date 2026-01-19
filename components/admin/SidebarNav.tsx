import Link from "next/link";

type NavItem = {
  href: string;
  label: string;
};

type SidebarNavProps = {
  items: NavItem[];
};

export function SidebarNav({ items }: SidebarNavProps) {
  return (
    <aside className="rounded-2xl border border-[var(--border)] bg-[var(--surface-light)] p-4 shadow-sm">
      <p className="mb-3 text-sm font-semibold text-slate-700">الأقسام</p>
      <nav className="flex flex-wrap gap-2 sm:flex-col">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-slate-700 transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
