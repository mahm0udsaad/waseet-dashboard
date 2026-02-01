import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-32">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 pb-4 border-b border-gray-100">
            سياسة الخصوصية
          </h1>

          <div className="prose prose-lg max-w-none text-gray-600 space-y-8">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">1. جمع المعلومات</h2>
              <p>
                نحن في وسيط الآن نأخذ خصوصيتك بجدية. نقوم بجمع المعلومات التي تقدمها لنا طوعاً
                عند إنشاء حساب أو استخدام خدماتنا، مثل الاسم، رقم الهاتف، والبريد الإلكتروني.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">2. استخدام المعلومات</h2>
              <p>نستخدم المعلومات التي نجمعها للأغراض التالية:</p>
              <ul className="list-disc list-inside space-y-2 mt-2">
                <li>تقديم وتحسين خدماتنا.</li>
                <li>معالجة المعاملات والمدفوعات.</li>
                <li>التواصل معك بخصوص حسابك أو تحديثات الخدمة.</li>
                <li>منع الاحتيال وضمان أمان المنصة.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">3. مشاركة المعلومات</h2>
              <p>
                لا نقوم ببيع أو تأجير بياناتك الشخصية لأطراف ثالثة. قد نشارك معلوماتك فقط مع:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-2">
                <li>مقدمي الخدمات الذين يساعدوننا في تشغيل التطبيق (مثل معالجة المدفوعات).</li>
                <li>الجهات القانونية إذا كان ذلك مطلوباً بموجب القانون.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">4. أمان البيانات</h2>
              <p>
                نستخدم تقنيات تشفير متقدمة وإجراءات أمنية صارمة لحماية بياناتك من الوصول غير المصرح به
                أو التغيير أو الإفصاح أو الإتلاف.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">5. حقوق المستخدم</h2>
              <p>
                لديك الحق في الوصول إلى بياناتك الشخصية، تصحيحها، أو طلب حذفها. يمكنك إدارة إعدادات
                الخصوصية الخاصة بك من خلال إعدادات التطبيق أو التواصل مع فريق الدعم.
              </p>
            </section>

             <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">6. الاتصال بنا</h2>
              <p>
                إذا كان لديك أي أسئلة حول سياسة الخصوصية هذه، يرجى التواصل معنا عبر البريد الإلكتروني:
                privacy@waseetalaan.com
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
