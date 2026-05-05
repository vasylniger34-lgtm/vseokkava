'use client';

import { Coffee, ArrowRight, QrCode, Smartphone, Gift } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#1c120d] text-[#e6d5c3] selection:bg-[#c18c5d]/30 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-screen overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#c18c5d] opacity-[0.05] rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -right-24 w-64 h-64 bg-[#c18c5d] opacity-[0.03] rounded-full blur-[100px]" />
      </div>

      <nav className="p-6 flex items-center justify-between border-b border-white/5 relative z-10 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#c18c5d] flex items-center justify-center">
            <Coffee className="text-white" size={16} />
          </div>
          <span className="font-bold text-lg">VseOkKava</span>
        </div>
        <button className="bg-white/5 px-4 py-2 rounded-xl text-sm font-bold hover:bg-white/10 transition-colors">
          Контакти
        </button>
      </nav>

      <main className="relative z-10">
        <div className="container mx-auto px-6 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="px-4 py-1.5 rounded-full bg-[#c18c5d]/20 text-[#c18c5d] text-xs font-bold uppercase tracking-widest mb-6 inline-block border border-[#c18c5d]/30">
              Програма лояльності
            </span>
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              Кожна <span className="text-[#c18c5d]">8-ма</span> кава <br />за наш рахунок!
            </h1>
            <p className="text-lg md:text-xl text-[#a88a74] max-w-2xl mx-auto mb-10 leading-relaxed">
              Приєднуйтесь до нашої спільноти поціновувачів кави. <br className="hidden md:block" /> 
              Отримуйте бонуси, стежте за прогресом та насолоджуйтесь улюбленими напоями.
            </p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <a 
                href="https://t.me/VseOkKavaBot" 
                className="group bg-[#c18c5d] text-white px-8 py-5 rounded-2xl font-bold text-lg shadow-xl shadow-[#c18c5d]/20 hover:scale-105 transition-all flex items-center gap-3 w-full md:w-auto justify-center"
              >
                Приєднатися в Telegram
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </a>
              <p className="text-sm text-[#a88a74] flex items-center gap-2">
                <Smartphone size={16} /> Працює прямо у вашому смартфоні
              </p>
            </div>
          </motion.div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 max-w-5xl mx-auto">
            <FeatureCard 
              icon={<QrCode className="text-[#c18c5d]" size={32} />}
              title="QR Картка"
              description="Забудьте про паперові картки. Ваш персональний QR-код завжди під рукою в Telegram."
            />
            <FeatureCard 
              icon={<Smartphone className="text-[#c18c5d]" size={32} />}
              title="Mini App"
              description="Зручний та швидкий додаток прямо всередині месенджера. Жодних зайвих завантажень."
            />
            <FeatureCard 
              icon={<Gift className="text-[#c18c5d]" size={32} />}
              title="Реальні Бонуси"
              description="Накопичуйте стаканчики та отримуйте безкоштовні напої. Прозоро та просто."
            />
          </div>
        </div>

        {/* Floating Coffee Image Placeholder */}
        <div className="py-20 bg-gradient-to-t from-black/20 to-transparent">
          <div className="max-w-4xl mx-auto px-6 rounded-[40px] overflow-hidden aspect-[16/9] relative shadow-2xl border border-white/5 bg-white/5 flex items-center justify-center group">
             <div className="absolute inset-0 bg-[#c18c5d]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
             <Coffee size={120} className="text-[#c18c5d] opacity-20" />
             <div className="absolute bottom-10 left-10 text-left">
                <p className="text-3xl font-black text-white">VseOkKava</p>
                <p className="text-[#a88a74]">Ваша ідеальна кава чекає на вас</p>
             </div>
          </div>
        </div>
      </main>

      <footer className="p-10 text-center border-t border-white/5">
        <p className="text-[#a88a74] text-sm">&copy; 2026 VseOkKava Loyalty. Всі права захищено.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="bg-white/5 p-8 rounded-3xl border border-white/5 hover:border-[#c18c5d]/30 transition-colors text-left group">
      <div className="mb-6 bg-[#c18c5d]/10 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-[#a88a74] leading-relaxed">{description}</p>
    </div>
  );
}
