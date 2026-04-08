import Image from "next/image";
import Link from "next/link";
import { BellRing, LogOut, ShieldCheck, WalletCards } from "lucide-react";

type TopBarProps = {
  roleLabel: string;
  pendingCount: number;
  sectionCount: number;
};

export function TopBar({ roleLabel, pendingCount, sectionCount }: TopBarProps) {
  const formattedDate = new Intl.DateTimeFormat("ar-SA", {
    dateStyle: "full",
  }).format(new Date());

  return (
    <header className="admin-panel relative overflow-hidden rounded-[28px] p-5 sm:p-6">
      <div className="absolute inset-y-0 left-0 hidden w-40 bg-gradient-to-r from-rose-50 to-transparent lg:block" />
      <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            مركز العمليات الإدارية
          </div>

          <Link href="/overview" className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950/5 ring-1 ring-slate-200">
              <Image
                src="/KAFEL.png"
                alt="وسيط الآن"
                width={52}
                height={52}
                priority
              />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                لوحة تحكم وسيط الآن
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
                واجهة متابعة موحدة للطلبات، المدفوعات، الدعم، وأعمال الإدارة اليومية.
              </p>
            </div>
          </Link>

          <div className="flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
            <span className="admin-chip inline-flex items-center rounded-full px-3 py-1.5">
              {roleLabel}
            </span>
            <span className="admin-chip inline-flex items-center rounded-full px-3 py-1.5">
              {formattedDate}
            </span>
            <span className="admin-chip inline-flex items-center rounded-full px-3 py-1.5">
              {sectionCount} أقسام متاحة
            </span>
            <span className="admin-chip inline-flex items-center rounded-full px-3 py-1.5 text-rose-700">
              {pendingCount} عناصر جديدة أو غير مقروءة
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 xl:w-[420px]">
          <Link
            href="/support-inbox"
            className="admin-panel-muted flex min-h-24 flex-col justify-between rounded-3xl p-4 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <BellRing className="h-4 w-4 text-[var(--warning)]" />
            <div>
              <p className="text-sm font-semibold text-slate-900">صندوق الدعم</p>
              <p className="mt-1 text-xs leading-5 text-[var(--text-subtle)]">
                راقب المحادثات المفتوحة ورتّب الأولويات.
              </p>
            </div>
          </Link>

          <Link
            href="/orders?status=awaiting_admin_transfer_approval"
            className="admin-panel-muted flex min-h-24 flex-col justify-between rounded-3xl p-4 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <WalletCards className="h-4 w-4 text-[var(--info)]" />
            <div>
              <p className="text-sm font-semibold text-slate-900">التحويلات</p>
              <p className="mt-1 text-xs leading-5 text-[var(--text-subtle)]">
                افتح الطلبات التي تنتظر موافقة الإدارة.
              </p>
            </div>
          </Link>

          <a
            href="/api/logout"
            className="admin-panel-muted flex min-h-24 flex-col justify-between rounded-3xl p-4 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <LogOut className="h-4 w-4 text-slate-500" />
            <div>
              <p className="text-sm font-semibold text-slate-900">تسجيل الخروج</p>
              <p className="mt-1 text-xs leading-5 text-[var(--text-subtle)]">
                إنهاء الجلسة الحالية بأمان.
              </p>
            </div>
          </a>
        </div>
      </div>
    </header>
  );
}
