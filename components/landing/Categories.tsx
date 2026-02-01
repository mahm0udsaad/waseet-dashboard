"use client";

import { PhoneFrame } from "@/components/PhoneFrame";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Check } from "lucide-react";

const categories = [
  {
    id: "tanazul",
    title: "خدمات التنازل",
    subtitle: "نقل كفالة العمالة المنزلية",
    description: "منصة متخصصة لنقل وتنازل العمالة المنزلية بطريقة قانونية وآمنة. نوفر لك جميع التفاصيل الضرورية.",
    features: ["بيانات موثقة", "عقود إلكترونية", "دفع آمن"],
    image: "/app-images/tanazul-list.png",
    color: "bg-purple-600",
    gradient: "from-purple-100 to-purple-50"
  },
  {
    id: "taqip",
    title: "خدمات التعقيب",
    subtitle: "تعقيب، جوازات، وسفر",
    description: "مجموعة شاملة من الخدمات الاحترافية التي تحتاجها في حياتك اليومية، من خدمات السفر والجوازات.",
    features: ["معقبين محترفين", "تتبع المعاملة", "أسعار تنافسية"],
    image: "/app-images/taqip-list.png",
    color: "bg-blue-600",
    gradient: "from-blue-100 to-blue-50"
  },
  {
    id: "guarantee",
    title: "خدمة ضامن",
    subtitle: "حقك محفوظ 100%",
    description: "نظام ضمان متطور يحمي حقوق جميع الأطراف. نحتفظ بالمبلغ حتى إتمام الخدمة بنجاح.",
    features: ["حماية الأموال", "تحكيم نزاعات", "دعم فوري"],
    image: "/app-images/tanazul-details.png",
    color: "bg-green-600",
    gradient: "from-green-100 to-green-50"
  }
];

export function Categories() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  return (
    <section id="categories" ref={containerRef} className="bg-white py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">خدمات تغطي جميع احتياجاتك</h2>
          <p className="text-xl text-gray-500">منصة واحدة.. حلول متعددة</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-32">
        {categories.map((category, index) => (
          <CategoryCard key={category.id} category={category} index={index} />
        ))}
      </div>
    </section>
  );
}

function CategoryCard({ category, index }: { category: any, index: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 100 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`rounded-[3rem] overflow-hidden bg-gradient-to-br ${category.gradient} border border-white/50 shadow-2xl`}
    >
      <div className="grid lg:grid-cols-2 gap-12 p-8 lg:p-16 items-center">
        <div className={`order-2 ${index % 2 === 0 ? "lg:order-1" : "lg:order-2"}`}>
           <div className="relative mx-auto w-fit">
              <div className={`absolute inset-0 ${category.color} blur-[60px] opacity-20 rounded-full`} />
              <PhoneFrame imageSrc={category.image} alt={category.title} />
           </div>
        </div>
        
        <div className={`order-1 ${index % 2 === 0 ? "lg:order-2" : "lg:order-1"} text-center lg:text-right`}>
          <div className={`inline-block px-4 py-2 rounded-full ${category.color} bg-opacity-10 text-gray-900 mb-6 font-bold`}>
            {category.subtitle}
          </div>
          <h3 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">{category.title}</h3>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            {category.description}
          </p>
          
          <div className="grid gap-4">
            {category.features.map((feature: string, i: number) => (
              <div key={i} className="flex items-center gap-4 bg-white/50 p-4 rounded-xl backdrop-blur-sm border border-white">
                <div className={`w-8 h-8 rounded-full ${category.color} flex items-center justify-center text-white shrink-0`}>
                  <Check className="w-5 h-5" />
                </div>
                <span className="text-lg font-medium text-gray-800">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}