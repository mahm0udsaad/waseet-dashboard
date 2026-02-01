import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-32">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 pb-4 border-b border-gray-100">
            شروط وأحكام الاستخدام
          </h1>

          <div className="prose prose-lg max-w-none text-gray-600 space-y-8">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">1. مقدمة</h2>
              <p>
                مرحباً بك في تطبيق وسيط الآن. تحكم هذه الشروط والأحكام استخدامك لتطبيقنا والخدمات المقدمة من خلاله.
                بتحميلك للتطبيق أو استخدامك للخدمات، فإنك توافق على الالتزام بهذه الشروط.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">2. الحساب والتسجيل</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>يجب أن تكون المعلومات المقدمة أثناء التسجيل دقيقة وكاملة.</li>
                <li>أنت مسؤول عن الحفاظ على سرية معلومات حسابك وكلمة المرور.</li>
                <li>يجب ألا يقل عمر المستخدم عن 18 عاماً لاستخدام خدماتنا المالية.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">3. خدمات الوساطة والضمان</h2>
              <p>
                نقدم خدمات وساطة لضمان حقوق الأطراف المتعاقدة. يتم الاحتفاظ بالمبالغ المالية في حسابات وسيطة
                حتى يتم تأكيد تنفيذ الخدمة المتفق عليها من قبل جميع الأطراف.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">4. الرسوم والمدفوعات</h2>
              <p>
                قد نفرض رسوماً على بعض الخدمات المقدمة. سيتم توضيح جميع الرسوم المطبقة بوضوح قبل إتمام أي معاملة.
                جميع المدفوعات تتم عبر قنوات آمنة ومعتمدة.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">5. الاستخدام المحظور</h2>
              <p>يحظر استخدام التطبيق لأي أغراض غير قانونية أو احتيالية، بما في ذلك:</p>
              <ul className="list-disc list-inside space-y-2 mt-2">
                <li>نشر معلومات مضللة أو كاذبة.</li>
                <li>انتحال شخصية أي شخص أو كيان.</li>
                <li>انتهاك حقوق الملكية الفكرية.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">6. التعديلات</h2>
              <p>
                نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إشعار المستخدمين بأي تغييرات جوهرية
                عبر التطبيق أو البريد الإلكتروني.
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
