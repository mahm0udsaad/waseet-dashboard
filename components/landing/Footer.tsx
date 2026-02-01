import Link from "next/link";
import { Instagram, Twitter, Linkedin, Facebook, MapPin, Mail, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer dir="ltr" className="bg-white pt-20 pb-10 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-4 gap-12 mb-16">
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900">وسيط الآن</span>
            </div>
            <p className="text-gray-500 leading-relaxed">
              منصتك الأولى للخدمات الرقمية الآمنة. نجمع بين السرعة والموثوقية لنقدم لك تجربة استثنائية.
            </p>
            <div className="flex gap-4">
              {[Twitter, Instagram, Linkedin, Facebook].map((Icon, i) => (
                <Link key={i} href="#" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                  <Icon className="w-5 h-5" />
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 text-lg mb-6">الشركة</h4>
            <ul className="space-y-4">
              {['من نحن', 'الوظائف', 'المدونة', 'الشركاء'].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-gray-500 hover:text-red-600 transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 text-lg mb-6">الدعم</h4>
            <ul className="space-y-4">
              <li>
                <Link href="#" className="text-gray-500 hover:text-red-600 transition-colors">مركز المساعدة</Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-500 hover:text-red-600 transition-colors">شروط الاستخدام</Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-500 hover:text-red-600 transition-colors">سياسة الخصوصية</Link>
              </li>
              <li>
                <Link href="#" className="text-gray-500 hover:text-red-600 transition-colors">الأسئلة الشائعة</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 text-lg mb-6">تواصل معنا</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-gray-500">
                <Mail className="w-5 h-5 text-red-600" />
                <span>support@waseetalaan.com</span>
              </li>
              <li className="flex items-center gap-3 text-gray-500">
                <Phone className="w-5 h-5 text-red-600" />
                <span>+966 50 123 4567</span>
              </li>
              <li className="flex items-center gap-3 text-gray-500">
                <MapPin className="w-5 h-5 text-red-600" />
                <span>الرياض، طريق الملك فهد</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} وسيط الآن. جميع الحقوق محفوظة.
          </p>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/privacy" className="hover:text-gray-900">الخصوصية</Link>
            <Link href="/terms" className="hover:text-gray-900">الشروط</Link>
            <Link href="#" className="hover:text-gray-900">ملفات الارتباط</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
