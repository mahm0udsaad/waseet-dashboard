import { PageHeader } from "@/components/admin/PageHeader";
import { SectionCard } from "@/components/admin/SectionCard";
import { SliderForm } from "@/components/admin/sliders/SliderForm";
import Link from "next/link";

export default function NewSliderPage() {
  return (
    <>
      <PageHeader
        title="إنشاء سلايدر جديد"
        subtitle="إضافة بانر جديد للصفحة الرئيسية."
        actions={
          <Link
            href="/sliders"
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-slate-700 transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
          >
            العودة للقائمة
          </Link>
        }
      />
      <SectionCard title="بيانات السلايدر">
        <SliderForm mode="create" />
      </SectionCard>
    </>
  );
}
