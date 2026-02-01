"use client";

import Image from "next/image";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";

export function Navbar() {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 20);
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4 pointer-events-none"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div 
        className={`pointer-events-auto transition-all duration-300 ease-in-out rounded-full border ${
          isScrolled 
            ? "bg-white/80 backdrop-blur-xl border-gray-200/50 shadow-lg shadow-black/5 py-3 px-6 w-full max-w-5xl" 
            : "bg-transparent border-transparent py-4 px-0 w-full max-w-7xl"
        }`}
      >
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative size-10 overflow-hidden rounded-xl">
               <Image
                  src="/KAFEL.png"
                  alt="وسيط الآن"
                  width={40}
                  height={40}
                  className="object-cover"
                />
            </div>
            <span className="font-bold text-xl text-gray-900 tracking-tight">
              وسيط <span className="text-red-600">الآن</span>
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            {["الرئيسية", "المميزات", "الخدمات"].map((item, i) => (
              <Link 
                key={i} 
                href={`#${item === "الرئيسية" ? "" : item === "الخدمات" ? "categories" : "features"}`}
                className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors relative group"
              >
                {item}
                <span className="absolute -bottom-1 right-0 w-0 h-0.5 bg-red-600 transition-all group-hover:w-full" />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="#download"
              className="bg-gray-900 hover:bg-red-600 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 group shadow-lg shadow-gray-900/10 hover:shadow-red-600/20"
            >
              حمل التطبيق
              <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
