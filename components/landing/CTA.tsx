"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function CTA() {
  return (
    <section id="download" className="py-24 px-4 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
            <motion.div 
                className="relative rounded-[3rem] overflow-hidden bg-gray-900 text-white py-20 px-8 text-center"
                initial={{ scale: 0.95, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
            >
                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-3xl bg-red-600/20 blur-[100px] rounded-full pointer-events-none" />
                
                <div className="relative z-10 max-w-3xl mx-auto">
                    <h2 className="text-5xl md:text-6xl font-bold mb-8 tracking-tight">
                        حمل التطبيق <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400">واستمتع بالراحة</span>
                    </h2>
                    <p className="text-xl text-gray-300 mb-12 leading-relaxed">
                        لا تضيع وقتك في الإجراءات التقليدية. انضم الآن إلى وسيط الآن 
                        واستمتع بتجربة سلسة، آمنة، وسريعة من هاتفك مباشرة.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Link 
                            href="https://apps.apple.com" 
                            target="_blank"
                            className="bg-white text-gray-900 px-8 py-4 rounded-2xl hover:bg-gray-100 transition-all hover:scale-105 shadow-xl shadow-black/20 flex items-center gap-4 w-full sm:w-auto justify-center sm:justify-start"
                        >
                            <img src="https://www.svgrepo.com/show/452159/app-store.svg" alt="App Store" className="w-10 h-10" />
                            <div className="text-right">
                                <div className="text-xs font-medium text-gray-500 leading-tight">Download on the</div>
                                <div className="text-2xl font-bold leading-tight">App Store</div>
                            </div>
                        </Link>
                        
                        <Link 
                            href="https://play.google.com" 
                            target="_blank"
                            className="bg-transparent border-2 border-white/20 text-white px-8 py-4 rounded-2xl hover:bg-white/10 transition-all hover:scale-105 flex items-center gap-4 w-full sm:w-auto justify-center sm:justify-start"
                        >
                            <img src="https://www.svgrepo.com/show/452223/google-play.svg" alt="Google Play" className="w-10 h-10" />
                            <div className="text-right">
                                <div className="text-xs font-medium text-gray-400 leading-tight">GET IT ON</div>
                                <div className="text-2xl font-bold leading-tight">Google Play</div>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -bottom-24 -left-24 w-64 h-64 border border-gray-800 rounded-full opacity-50" />
                <div className="absolute -top-24 -right-24 w-64 h-64 border border-gray-800 rounded-full opacity-50" />
            </motion.div>
        </div>
    </section>
  );
}
