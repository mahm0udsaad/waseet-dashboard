"use client";

import { PhoneFrame } from "@/components/PhoneFrame";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowDown, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative min-h-[100dvh] flex items-center pt-32 pb-20 overflow-hidden bg-white">
      {/* Dynamic Background */}
      <div className="absolute inset-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-200/40 rounded-full blur-[120px] mix-blend-multiply animate-blob" />
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-red-200/40 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] bg-blue-200/40 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-4000" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center lg:text-right relative z-10"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-1.5 mb-8 shadow-sm"
            >
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-sm font-medium text-gray-700">المنصة الأولى للخدمات الموثوقة</span>
            </motion.div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-[1.1] mb-6 tracking-tight">
              أنجز معاملاتك <br />
              <span className="text-gradient relative">
                بأمان وثقة
                <svg className="absolute w-full h-3 -bottom-2 left-0 text-red-200 -z-10 opacity-50" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                </svg>
              </span>
            </h1>

            <p className="text-xl text-gray-600 leading-relaxed mb-10 max-w-2xl mx-auto lg:mx-0">
              وسيط الآن هي وجهتك الآمنة للتنازل، التعقيب، والخدمات العامة.
              نضمن لك حقوقك المالية والقانونية في كل خطوة.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <Link 
                href="https://apps.apple.com" 
                target="_blank"
                className="group bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-all hover:scale-105 shadow-xl shadow-gray-900/10 flex items-center gap-3 border border-gray-800"
              >
                 <img src="https://www.svgrepo.com/show/452159/app-store.svg" alt="App Store" className="w-8 h-8 filter invert" />
                 <div className="text-right">
                    <div className="text-[10px] font-medium opacity-80 leading-tight">Download on the</div>
                    <div className="text-lg font-bold leading-tight">App Store</div>
                 </div>
              </Link>
              
              <Link 
                href="https://play.google.com"
                target="_blank" 
                className="group bg-white text-gray-900 px-6 py-3 rounded-xl hover:bg-gray-50 transition-all hover:scale-105 shadow-lg shadow-gray-200/50 border border-gray-200 flex items-center gap-3"
              >
                 <img src="https://www.svgrepo.com/show/452223/google-play.svg" alt="Google Play" className="w-8 h-8" />
                 <div className="text-right">
                    <div className="text-[10px] font-medium text-gray-500 leading-tight">GET IT ON</div>
                    <div className="text-lg font-bold leading-tight">Google Play</div>
                 </div>
              </Link>
            </div>
          </motion.div>

          {/* Visual Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2, type: "spring" }}
            className="relative lg:h-[600px] flex items-center justify-center"
          >
            {/* Main Phone */}
            <motion.div 
              className="relative z-20 transform lg:rotate-[-6deg] lg:translate-x-10"
              animate={{ y: [0, -20, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            >
              <div className="absolute inset-0 bg-black/20 blur-3xl rounded-full transform translate-y-20 scale-90 -z-10" />
              <PhoneFrame imageSrc="/app-images/home-page.png" alt="App Screenshot" priority />
            
              {/* Floating Cards */}
              <motion.div 
                className="absolute -left-12 top-20 bg-white p-4 rounded-2xl shadow-xl shadow-black/10 border border-gray-100/50 backdrop-blur-md hidden sm:block w-48"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
              >
                 <div className="flex items-center gap-3 mb-2">
                    <div className="bg-green-100 p-2 rounded-full">
                        <ShieldCheck className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium">حالة العملية</p>
                        <p className="text-sm font-bold text-gray-900">مضمونة 100%</p>
                    </div>
                 </div>
                 <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-full rounded-full" />
                 </div>
              </motion.div>

              <motion.div 
                className="absolute -right-8 bottom-32 bg-white/90 p-4 rounded-2xl shadow-xl shadow-black/10 border border-gray-100/50 backdrop-blur-md hidden sm:block"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 }}
              >
                  <div className="flex -space-x-3 space-x-reverse">
                      {[1,2,3].map(i => (
                          <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center overflow-hidden">
                              <Image src={`/app-images/home-page.png`} alt="User" width={40} height={40} className="opacity-0" />
                              <Users className="w-5 h-5 text-gray-400 absolute" />
                          </div>
                      ))}
                      <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-900 flex items-center justify-center text-white text-xs font-bold">
                          +2k
                      </div>
                  </div>
                  <p className="text-center text-xs font-medium text-gray-500 mt-2">انضم للمجتمع</p>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <motion.div 
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-gray-400"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <ArrowDown className="w-6 h-6" />
      </motion.div>
    </section>
  );
}
