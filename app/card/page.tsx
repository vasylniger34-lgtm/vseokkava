'use client';

import { useEffect, useState, useRef } from 'react';
import { useTelegram } from '@/hooks/useTelegram';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Coffee, 
  QrCode, 
  ScanLine, 
  User as UserIcon, 
  Crown,
  CheckCircle2,
  AlertCircle,
  Gift,
  Plus,
  Trash2,
  UserPlus,
  Shield
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = 'card' | 'scanner' | 'admin';

export default function MiniApp() {
  const { tg, user: tgUser, initData } = useTelegram();
  const [dbUser, setDbUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('card');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Scanner
  const [scanResult, setScanResult] = useState<any>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<any>(null);

  // Admin
  const [baristas, setBaristas] = useState<any[]>([]);
  const [newBaristaUsername, setNewBaristaUsername] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  const isOwner = dbUser?.role === 'OWNER';
  const isBarista = dbUser?.role === 'BARISTA';
  const canScan = isOwner || isBarista;

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
        if (data.user.role === 'OWNER') {
          setActiveTab('card');
        } else if (data.user.role === 'BARISTA') {
          setActiveTab('scanner');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // === QR Scanner via native camera ===
  const startScanner = async () => {
    setScannerActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        // Start scanning frames
        scanIntervalRef.current = setInterval(() => {
          scanFrame();
        }, 500);
      }
    } catch (err) {
      console.error('Camera error:', err);
      showMsg('error', 'Не вдалося запустити камеру');
      setScannerActive(false);
    }
  };

  const stopScanner = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setScannerActive(false);
  };

  const scanFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.readyState !== video.HAVE_ENOUGH_DATA) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    // Use BarcodeDetector API (available in modern browsers/Telegram WebView)
    if ('BarcodeDetector' in window) {
      try {
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        const barcodes = await detector.detect(canvas);
        if (barcodes.length > 0) {
          const value = barcodes[0].rawValue;
          if (value) {
            stopScanner();
            handleScanResult(value);
          }
        }
      } catch (e) {
        // BarcodeDetector failed, will try next frame
      }
    }
  };

  const handleScanResult = async (userId: string) => {
    // Look up user info
    try {
      const res = await fetch('/api/barista/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, action: 'LOOKUP', targetUserId: userId }),
      });
      // For now, just set the result with the userId
      setScanResult({ userId });
    } catch (err) {
      setScanResult({ userId });
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
        showMsg('success', action === 'ADD_COFFEE' ? 'Каву додано! ☕️' : 'Бонус використано! 🎁');
        setScanResult(null);
      } else {
        showMsg('error', data.error || 'Помилка');
      }
    } catch (err) {
      showMsg('error', 'Збій мережі');
    }
  };

  // === Admin functions ===
  const fetchBaristas = async () => {
    if (!isOwner || !initData) return;
    setAdminLoading(true);
    try {
      const res = await fetch(`/api/admin/baristas?initData=${encodeURIComponent(initData)}`);
      const data = await res.json();
      if (data.baristas) setBaristas(data.baristas);
    } catch (err) {
      console.error(err);
    } finally {
      setAdminLoading(false);
    }
  };

  const addBarista = async () => {
    if (!newBaristaUsername.trim()) return;
    try {
      const res = await fetch('/api/admin/baristas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, username: newBaristaUsername }),
      });
      const data = await res.json();
      if (data.success) {
        showMsg('success', `@${newBaristaUsername.replace('@', '')} — тепер бариста!`);
        setNewBaristaUsername('');
        fetchBaristas();
      } else {
        showMsg('error', data.error || 'Помилка');
      }
    } catch (err) {
      showMsg('error', 'Збій мережі');
    }
  };

  const removeBarista = async (userId: string) => {
    try {
      const res = await fetch('/api/admin/baristas', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, userId }),
      });
      const data = await res.json();
      if (data.success) {
        showMsg('success', 'Баристу видалено');
        fetchBaristas();
      }
    } catch (err) {
      showMsg('error', 'Збій мережі');
    }
  };

  useEffect(() => {
    if (activeTab === 'admin' && isOwner) {
      fetchBaristas();
    }
    // Cleanup scanner when switching tabs
    if (activeTab !== 'scanner') {
      stopScanner();
    }
  }, [activeTab]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopScanner();
  }, []);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
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
      <header className="p-5 flex items-center justify-between border-b border-white/5 backdrop-blur-md sticky top-0 z-50 bg-[#1c120d]/90">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#c18c5d] flex items-center justify-center shadow-lg shadow-[#c18c5d]/20">
            <Coffee className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none">VseOkKava</h1>
            <p className="text-[10px] text-[#c18c5d] mt-0.5 uppercase tracking-wider font-semibold">
              {isOwner ? '👑 Власник' : isBarista ? '☕ Бариста' : 'Клієнт'}
            </p>
          </div>
        </div>
      </header>

      <main className="p-5 max-w-md mx-auto">
        <AnimatePresence mode="wait">
          {/* ===== CARD TAB ===== */}
          {activeTab === 'card' && (
            <motion.div
              key="card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-5"
            >
              {/* Profile */}
              <div className="bg-gradient-to-br from-[#2a1d17] to-[#1c120d] rounded-3xl p-5 border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#c18c5d] opacity-[0.03] rounded-full blur-3xl" />
                
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-bold">{dbUser?.name}</h2>
                    <p className="text-xs text-[#a88a74] mt-1">@{dbUser?.username || '—'}</p>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tighter border",
                    isOwner ? "bg-amber-500/20 border-amber-500/30 text-amber-400" :
                    isBarista ? "bg-blue-500/20 border-blue-500/30 text-blue-400" :
                    "bg-[#c18c5d]/20 border-[#c18c5d]/30 text-[#c18c5d]"
                  )}>
                    {isOwner ? '👑 Власник' : isBarista ? 'Бариста' : 'Клієнт'}
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#a88a74]">Прогрес до безкоштовної</span>
                    <span className="font-bold text-[#c18c5d]">{dbUser?.balance || 0}/7</span>
                  </div>
                  <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-[#c18c5d] to-[#e6b38a] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${((dbUser?.balance || 0) / 7) * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <div className="flex-1 bg-white/5 rounded-2xl p-3 border border-white/5 text-center">
                    <p className="text-[10px] text-[#a88a74] uppercase font-bold mb-1">Разом</p>
                    <p className="text-xl font-black text-white">{dbUser?.totalCoffees || 0}</p>
                  </div>
                  <div className="flex-1 bg-[#c18c5d]/10 rounded-2xl p-3 border border-[#c18c5d]/20 text-center">
                    <p className="text-[10px] text-[#c18c5d] uppercase font-bold mb-1">Безкоштовно</p>
                    <p className="text-xl font-black text-[#c18c5d] flex items-center justify-center gap-1">
                      {dbUser?.freeCoffees || 0} <Gift size={14} />
                    </p>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center space-y-3">
                <div className="p-4 bg-white rounded-3xl shadow-xl shadow-black/40 border-4 border-white/10">
                  <QRCodeSVG value={dbUser?.id || ''} size={180} />
                </div>
                <p className="text-xs text-center text-[#a88a74] max-w-[200px]">
                  Покажіть код баристі
                </p>
                <div className="px-5 py-2 bg-white/5 border border-white/10 rounded-2xl font-mono text-base tracking-widest text-[#c18c5d] font-bold">
                  {dbUser?.shortCode}
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== SCANNER TAB (Barista/Owner only) ===== */}
          {activeTab === 'scanner' && canScan && (
            <motion.div
              key="scanner"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-5"
            >
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ScanLine size={24} className="text-[#c18c5d]" /> Сканер
              </h2>

              {!scannerActive ? (
                <button 
                  onClick={startScanner}
                  className="w-full flex flex-col items-center justify-center p-12 bg-[#c18c5d] rounded-3xl text-white shadow-xl shadow-[#c18c5d]/20 active:scale-95 transition-transform"
                >
                  <ScanLine size={48} className="mb-4" />
                  <span className="text-xl font-bold">Сканувати QR</span>
                  <p className="text-sm text-white/70 mt-2">Наведіть камеру на код клієнта</p>
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-3xl overflow-hidden border-2 border-[#c18c5d] shadow-2xl bg-black aspect-square">
                    <video 
                      ref={videoRef} 
                      className="w-full h-full object-cover"
                      playsInline 
                      muted
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none" />
                    <div className="absolute inset-[40px] border-2 border-[#c18c5d] rounded-xl pointer-events-none animate-pulse" />
                  </div>
                  <button 
                    onClick={stopScanner}
                    className="w-full py-4 text-center text-[#a88a74] font-bold"
                  >
                    Скасувати
                  </button>
                </div>
              )}

              {/* Manual input */}
              <div className="bg-white/5 rounded-3xl p-5 border border-white/10">
                <h3 className="text-sm font-bold text-[#a88a74] uppercase mb-3">Або введіть код</h3>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Код клієнта (6 символів)"
                    className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-[#e6d5c3] placeholder:text-[#a88a74]/50 focus:outline-none focus:border-[#c18c5d] transition-colors font-mono uppercase"
                    maxLength={6}
                    id="shortcode-input"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const input = document.getElementById('shortcode-input') as HTMLInputElement;
                        if (input.value.length === 6) {
                          // TODO: lookup by shortcode
                        }
                      }
                    }}
                  />
                  <button className="bg-[#c18c5d] p-3 rounded-xl active:scale-95 transition-transform">
                    <CheckCircle2 size={24} className="text-white" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== ADMIN TAB (Owner only) ===== */}
          {activeTab === 'admin' && isOwner && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-5"
            >
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Crown size={24} className="text-amber-400" /> Адмін панель
              </h2>

              {/* Add barista */}
              <div className="bg-white/5 rounded-3xl p-5 border border-white/10">
                <h3 className="text-sm font-bold text-[#a88a74] uppercase mb-3 flex items-center gap-2">
                  <UserPlus size={16} /> Додати баристу
                </h3>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newBaristaUsername}
                    onChange={(e) => setNewBaristaUsername(e.target.value)}
                    placeholder="@username"
                    className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-[#e6d5c3] placeholder:text-[#a88a74]/50 focus:outline-none focus:border-amber-400 transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && addBarista()}
                  />
                  <button 
                    onClick={addBarista}
                    className="bg-amber-500 p-3 rounded-xl active:scale-95 transition-transform"
                  >
                    <Plus size={24} className="text-white" />
                  </button>
                </div>
                <p className="text-[10px] text-[#a88a74] mt-2">
                  Людина має спочатку запустити бота (/start)
                </p>
              </div>

              {/* Barista list */}
              <div className="bg-white/5 rounded-3xl p-5 border border-white/10">
                <h3 className="text-sm font-bold text-[#a88a74] uppercase mb-3 flex items-center gap-2">
                  <Shield size={16} /> Баристи ({baristas.length})
                </h3>
                {adminLoading ? (
                  <p className="text-sm text-[#a88a74] animate-pulse">Завантаження...</p>
                ) : baristas.length === 0 ? (
                  <p className="text-sm text-[#a88a74]">Немає барист. Додайте першого!</p>
                ) : (
                  <div className="space-y-2">
                    {baristas.map((b: any) => (
                      <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                        <div>
                          <p className="text-sm font-bold text-white">{b.name || 'Без імені'}</p>
                          <p className="text-xs text-[#a88a74]">@{b.username}</p>
                        </div>
                        <button 
                          onClick={() => removeBarista(b.id)}
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 p-3 bg-[#1c120d]/90 backdrop-blur-xl border-t border-white/5 z-50">
        <div className="max-w-md mx-auto flex justify-around items-center">
          <NavBtn 
            active={activeTab === 'card'} 
            onClick={() => setActiveTab('card')}
            icon={<Coffee size={22} />}
            label="Картка"
          />
          {canScan && (
            <NavBtn 
              active={activeTab === 'scanner'} 
              onClick={() => setActiveTab('scanner')}
              icon={<ScanLine size={22} />}
              label="Сканер"
            />
          )}
          {isOwner && (
            <NavBtn 
              active={activeTab === 'admin'} 
              onClick={() => setActiveTab('admin')}
              icon={<Crown size={22} />}
              label="Адмін"
            />
          )}
        </div>
      </nav>

      {/* Scan Result Modal */}
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
              className="bg-[#2a1d17] w-full max-w-sm rounded-[32px] p-6 border border-white/10 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-[#c18c5d] rounded-full flex items-center justify-center mb-4 shadow-xl shadow-[#c18c5d]/20">
                  <UserIcon size={28} className="text-white" />
                </div>
                <h3 className="text-lg font-bold mb-1 text-white">Клієнт знайдений</h3>
                <p className="text-xs text-[#a88a74] mb-6">Виберіть дію</p>
                
                <div className="grid grid-cols-1 gap-3 w-full">
                  <button 
                    onClick={() => handleAction('ADD_COFFEE', scanResult.userId)}
                    className="w-full py-4 bg-[#c18c5d] rounded-2xl font-bold text-white active:scale-95 transition-transform flex items-center justify-center gap-2"
                  >
                    <Coffee size={20} /> +1 Кава
                  </button>
                  <button 
                    onClick={() => handleAction('REDEEM_FREE', scanResult.userId)}
                    className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-[#c18c5d] active:scale-95 transition-transform flex items-center justify-center gap-2"
                  >
                    <Gift size={20} /> Безкоштовна
                  </button>
                  <button 
                    onClick={() => setScanResult(null)}
                    className="w-full py-3 text-[#a88a74] font-medium"
                  >
                    Закрити
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className={cn(
              "fixed bottom-28 left-4 right-4 p-4 rounded-2xl shadow-2xl flex items-center gap-3 z-[110]",
              message.type === 'success' ? "bg-green-500 text-white" : "bg-red-500 text-white"
            )}
          >
            {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="font-bold text-sm">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavBtn({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all px-4 py-1",
        active ? "text-[#c18c5d] scale-105" : "text-[#a88a74] hover:text-[#e6d5c3]"
      )}
    >
      <div className={cn("p-2 rounded-xl transition-all", active && "bg-[#c18c5d]/10")}>
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
    </button>
  );
}
