"use client";

import { motion } from "framer-motion";
import { Shield, Zap, MessageCircle, CheckCircle, Smartphone, Bell, ArrowLeft } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "حماية وضمان",
    description: "نظام ضمان مالي يحمي حقوقك حتى اكتمال الخدمة.",
    gradient: "from-red-500 to-orange-500",
  },
  {
    icon: Zap,
    title: "سرعة التنفيذ",
    description: "إجراءات رقمية سريعة تختصر عليك الوقت والجهد.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: MessageCircle,
    title: "شات مشفر",
    description: "خصوصية تامة في التواصل مع الطرف الآخر.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: CheckCircle,
    title: "موثوقية عالية",
    description: "تحقق إلزامي من الهوية لجميع المستخدمين.",
    gradient: "from-green-500 to-emerald-500",
  },
];

export function WhyUs() {
  return (
    <section id="features" className="py-24 bg-gray-50 relative overflow-hidden">
       {/* Abstract Patterns */}
       <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
         <div className="absolute left-0 top-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-transparent to-transparent"></div>
       </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <motion.div 
                className="max-w-2xl"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
            >
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                    لماذا يختار الجميع <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-l from-red-600 to-purple-600">وسيط الآن؟</span>
                </h2>
                <p className="text-xl text-gray-600 leading-relaxed">
                    صممنا المنصة لتكون الحل الأمثل والآمن لجميع احتياجاتك، 
                    مع تركيز كامل على تجربة المستخدم والحماية.
                </p>
            </motion.div>
            
            <motion.button 
                className="group flex items-center gap-2 text-red-600 font-bold hover:gap-3 transition-all"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
            >
                <span>تعرف على المزيد</span>
                <ArrowLeft className="w-5 h-5" />
            </motion.button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-2xl transition-all duration-500 group border border-gray-100 relative overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ y: -10 }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 text-white`}>
                <feature.icon className="w-7 h-7" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-red-600 transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-500 leading-relaxed group-hover:text-gray-600">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}