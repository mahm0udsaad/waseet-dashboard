import Image from "next/image";
import Link from "next/link";

export function TopBar() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-light)] px-4 py-4 shadow-sm sm:px-6">
      <Link href="/overview" className="flex items-center gap-3">
        <Image src="/KAFEL.png" alt="وسيط الآن" width={48} height={48} priority />
        <div>
          <p className="text-sm text-slate-500">لوحة تحكم</p>
          <h1 className="text-lg font-semibold text-slate-900">وسيط الآن</h1>
        </div>
      </Link>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button className="rounded-full border border-[var(--border)] px-4 py-2 text-slate-700">
          إضافة إعلان
        </button>
        <button className="rounded-full bg-[var(--brand)] px-4 py-2 text-white">
          إنشاء وكيل
        </button>
        <Link
          href="/api/logout"
          className="rounded-full border border-[var(--border)] px-4 py-2 text-slate-700"
        >
          تسجيل خروج
        </Link>
      </div>
    </header>
  );
}
