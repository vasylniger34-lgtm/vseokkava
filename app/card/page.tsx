'use client';

import { useEffect, useState } from 'react';
import { useTelegram } from '@/hooks/useTelegram';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Coffee, 
  QrCode, 
  ScanLine, 
  User as UserIcon, 
  Settings as SettingsIcon,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Gift,
  Search
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function MiniApp() {
  const { tg, user: tgUser, initData } = useTelegram();
  const [dbUser, setDbUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'client' | 'barista' | 'settings'>('client');
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (initData) {
      fetchUser();
    }
  }, [initData]);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData }),
      });
      const data = await res.json();
      if (data.user) {
        setDbUser(data.user);
        if (data.user.role === 'BARISTA' || data.user.role === 'ADMIN') {
          setActiveTab('barista');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'ADD_COFFEE' | 'REDEEM_FREE', targetId: string) => {
    try {
      const res = await fetch('/api/barista/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, action, targetUserId: targetId }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: action === 'ADD_COFFEE' ? 'Каву додано! ☕️' : 'Бонус використано! 🎁' });
        setScanResult(null);
        setShowScanner(false);
        // Refresh local data if we acted on ourselves (for testing) or just wait for next scan
      } else {
        setMessage({ type: 'error', text: data.error || 'Помилка' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Збій мережі' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#1c120d] text-[#e6d5c3]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        >
          <Coffee size={48} className="text-[#c18c5d]" />
        </motion.div>
        <p className="mt-4 font-medium animate-pulse">Заварюємо додаток...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1c120d] text-[#e6d5c3] font-sans selection:bg-[#c18c5d]/30 overflow-x-hidden pb-24">
      {/* Header */}
      <header className="p-6 flex items-center justify-between border-b border-white/5 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#c18c5d] flex items-center justify-center shadow-lg shadow-[#c18c5d]/20">
            <Coffee className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none">VseOkKava</h1>
            <p className="text-xs text-[#c18c5d] mt-1 uppercase tracking-wider font-semibold">Система лояльності</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {dbUser?.role !== 'CLIENT' && (
            <button 
              onClick={() => setActiveTab(activeTab === 'barista' ? 'client' : 'barista')}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              {activeTab === 'barista' ? <UserIcon size={20} /> : <ScanLine size={20} />}
            </button>
          )}
        </div>
      </header>

      <main className="p-6 max-w-md mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'client' ? (
            <motion.div
              key="client"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Profile Card */}
              <div className="bg-gradient-to-br from-[#2a1d17] to-[#1c120d] rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden group">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#c18c5d] opacity-[0.03] rounded-full blur-3xl group-hover:opacity-10 transition-opacity" />
                
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-2xl font-bold">{dbUser?.name}</h2>
                    <p className="text-sm text-[#a88a74] mt-1">{dbUser?.phone || 'Телефон не вказано'}</p>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-[#c18c5d]/20 border border-[#c18c5d]/30 text-[#c18c5d] text-xs font-bold uppercase tracking-tighter">
                    Клієнт
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#a88a74]">Прогрес до безкоштовної</span>
                    <span className="font-bold text-[#c18c5d]">{dbUser?.balance}/7</span>
                  </div>
                  <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-[#c18c5d] to-[#e6b38a] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(dbUser?.balance / 7) * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <div className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/5 text-center">
                    <p className="text-[10px] text-[#a88a74] uppercase font-bold mb-1">Разом випито</p>
                    <p className="text-xl font-black text-white">{dbUser?.totalCoffees}</p>
                  </div>
                  <div className="flex-1 bg-[#c18c5d]/10 rounded-2xl p-4 border border-[#c18c5d]/20 text-center">
                    <p className="text-[10px] text-[#c18c5d] uppercase font-bold mb-1">Доступно безкоштовно</p>
                    <p className="text-xl font-black text-[#c18c5d] flex items-center justify-center gap-1">
                      {dbUser?.freeCoffees} <Gift size={16} />
                    </p>
                  </div>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-white rounded-3xl shadow-xl shadow-black/40 border-8 border-white/10">
                  <QRCodeSVG value={dbUser?.id || ''} size={200} />
                </div>
                <p className="text-sm text-center text-[#a88a74] max-w-[200px]">
                  Покажіть цей код баристі для нарахування кави
                </p>
                <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl font-mono text-lg tracking-widest text-[#c18c5d] font-bold">
                  {dbUser?.shortCode}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="barista"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold">Панель Баристи</h2>
                <div className="px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-500 text-xs font-bold uppercase tracking-tighter">
                  Зміна відкрита
                </div>
              </div>

              {!showScanner ? (
                <div className="grid grid-cols-1 gap-4">
                  <button 
                    onClick={() => setShowScanner(true)}
                    className="flex flex-col items-center justify-center p-12 bg-[#c18c5d] rounded-3xl text-white shadow-xl shadow-[#c18c5d]/20 group transition-all active:scale-95"
                  >
                    <ScanLine size={48} className="mb-4 group-hover:scale-110 transition-transform" />
                    <span className="text-xl font-bold">Сканувати QR</span>
                    <p className="text-sm text-white/70 mt-2 italic">Наведіть камеру на код клієнта</p>
                  </button>

                  <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
                    <h3 className="text-sm font-bold text-[#a88a74] uppercase mb-4 flex items-center gap-2">
                      <Search size={16} /> Пошук за кодом
                    </h3>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Введіть 6 символів"
                        className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-[#e6d5c3] placeholder:text-[#a88a74] focus:outline-none focus:border-[#c18c5d] transition-colors font-mono"
                        maxLength={6}
                      />
                      <button className="bg-white/5 p-3 rounded-xl hover:bg-white/10 transition-colors">
                        <CheckCircle2 size={24} className="text-[#c18c5d]" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
                    <h3 className="text-sm font-bold text-[#a88a74] uppercase mb-4">Останні транзакції</h3>
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                              <Coffee size={14} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">Клієнт #{i}92</p>
                              <p className="text-[10px] text-[#a88a74]">Сьогодні, 12:45</p>
                            </div>
                          </div>
                          <div className="text-sm font-bold text-green-500">+1</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-3xl overflow-hidden border-2 border-[#c18c5d] shadow-2xl bg-black aspect-square">
                    <Scanner
                      onScan={(result) => {
                        if (result?.[0]?.rawValue) {
                          setScanResult(result[0].rawValue);
                        }
                      }}
                      onError={(err) => console.error(err)}
                    />
                    <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none" />
                    <div className="absolute inset-[40px] border-2 border-[#c18c5d] rounded-xl pointer-events-none animate-pulse" />
                  </div>
                  <button 
                    onClick={() => setShowScanner(false)}
                    className="w-full py-4 text-center text-[#a88a74] font-bold"
                  >
                    Скасувати
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 p-4 bg-[#1c120d]/80 backdrop-blur-xl border-t border-white/5 z-50">
        <div className="max-w-md mx-auto flex justify-around items-center">
          <NavButton 
            active={activeTab === 'client'} 
            onClick={() => setActiveTab('client')}
            icon={<Coffee size={24} />}
            label="Картка"
          />
          {dbUser?.role !== 'CLIENT' && (
            <NavButton 
              active={activeTab === 'barista'} 
              onClick={() => setActiveTab('barista')}
              icon={<ScanLine size={24} />}
              label="Сканер"
            />
          )}
          <NavButton 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')}
            icon={<SettingsIcon size={24} />}
            label="Меню"
          />
        </div>
      </nav>

      {/* Action Modal */}
      <AnimatePresence>
        {scanResult && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#2a1d17] w-full max-w-sm rounded-[40px] p-8 border border-white/10 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-[#c18c5d] rounded-full flex items-center justify-center mb-6 shadow-xl shadow-[#c18c5d]/20">
                  <UserIcon size={32} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-white">Клієнт знайдений</h3>
                <p className="text-[#a88a74] mb-8">Виберіть дію для цього користувача</p>
                
                <div className="grid grid-cols-1 gap-4 w-full">
                  <button 
                    onClick={() => handleAction('ADD_COFFEE', scanResult)}
                    className="w-full py-4 bg-[#c18c5d] rounded-2xl font-bold text-white shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                  >
                    <Coffee size={20} /> Додати 1 каву
                  </button>
                  <button 
                    onClick={() => handleAction('REDEEM_FREE', scanResult)}
                    className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-[#c18c5d] active:scale-95 transition-transform flex items-center justify-center gap-2"
                  >
                    <Gift size={20} /> Використати бонус
                  </button>
                  <button 
                    onClick={() => setScanResult(null)}
                    className="w-full py-4 text-[#a88a74] font-medium"
                  >
                    Закрити
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className={cn(
              "fixed bottom-28 left-6 right-6 p-4 rounded-2xl shadow-2xl flex items-center gap-3 z-[110]",
              message.type === 'success' ? "bg-green-500 text-white" : "bg-red-500 text-white"
            )}
          >
            {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="font-bold">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all",
        active ? "text-[#c18c5d] scale-110" : "text-[#a88a74] hover:text-[#e6d5c3]"
      )}
    >
      <div className={cn(
        "p-2 rounded-xl transition-all",
        active && "bg-[#c18c5d]/10"
      )}>
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
    </button>
  );
}
