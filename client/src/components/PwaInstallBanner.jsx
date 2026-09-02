import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X, Smartphone, Sparkles, Check } from 'lucide-react';

export default function PwaInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [platform, setPlatform] = useState('other'); // 'ios' | 'android' | 'other'
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Kiểm tra nếu app đã được cài đặt hoặc đang chạy ở chế độ standalone
    const isStandalone = window.navigator.standalone === true || 
                         window.matchMedia('(display-mode: standalone)').matches ||
                         window.matchMedia('(display-mode: fullscreen)').matches;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Kiểm tra nếu người dùng đã đóng banner gần đây (trong 24h)
    const dismissedTime = localStorage.getItem('pwa_banner_dismissed_time');
    if (dismissedTime && Date.now() - Number(dismissedTime) < 24 * 60 * 60 * 1000) {
      return;
    }

    // 3. Nhận diện nền tảng thiết bị
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroidDevice = /android/i.test(ua);

    if (isIOSDevice) {
      setPlatform('ios');
      // Hiển thị sau 1.5 giây khi vào trang
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    } else if (isAndroidDevice) {
      setPlatform('android');
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    }

    // Lắng nghe sự kiện beforeinstallprompt trên Android/Chrome
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setPlatform('android');
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Lắng nghe khi app đã cài đặt xong
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowBanner(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa_banner_dismissed_time', Date.now().toString());
  };

  const handleInstallAndroid = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      // Hướng dẫn nếu trình duyệt không tự kích hoạt
      alert('Vui lòng bấm vào biểu tượng 3 dấu chấm (⋮) ở góc trên Chrome và chọn "Cài đặt ứng dụng"!');
    }
  };

  if (!showBanner || isInstalled) return null;

  return (
    <div className="fixed bottom-3 sm:bottom-5 left-3 right-3 sm:left-auto sm:right-5 sm:max-w-md z-50 animate-bounce-in">
      <div className="bg-[#161922]/95 backdrop-blur-xl border border-emerald-500/40 shadow-2xl shadow-emerald-950/50 rounded-3xl p-4 sm:p-5 text-white relative overflow-hidden">
        
        {/* Glow Decor */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#00d084]/20 rounded-full blur-2xl pointer-events-none"></div>

        {/* Nút đóng banner */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-3.5 right-3.5 text-slate-400 hover:text-slate-200 p-1 rounded-full hover:bg-slate-800 transition cursor-pointer"
          title="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header App Info */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-emerald-500/30 shrink-0">
            ☀️
          </div>
          <div className="pr-6">
            <div className="flex items-center gap-1.5">
              <h4 className="font-extrabold text-sm text-slate-100">Cài Đặt App Zeno Solar</h4>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#00d084]/20 text-[#00d084] border border-[#00d084]/30">
                1 Chạm
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
              Trải nghiệm toàn màn hình mượt mà, tiện lợi như App Store!
            </p>
          </div>
        </div>

        {/* HƯỚNG DẪN DÀNH CHO IPHONE (iOS) */}
        {platform === 'ios' && (
          <div className="bg-slate-900/90 rounded-2xl p-3 border border-slate-800/80 space-y-2.5">
            <div className="flex items-center gap-2.5 text-xs text-slate-200">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-black text-[11px] flex items-center justify-center shrink-0 border border-cyan-500/40">
                1
              </span>
              <span>
                Chạm nút <strong>Chia sẻ</strong> <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-400 font-bold mx-1 align-middle"><Share className="w-3 h-3 inline mr-1" /> ⬆️</span> ở thanh dưới Safari
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-slate-200">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-[11px] flex items-center justify-center shrink-0 border border-emerald-500/40">
                2
              </span>
              <span>
                Cuộn xuống chọn <strong>"Thêm vào MH chính"</strong> <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-emerald-400 font-bold mx-1 align-middle"><PlusSquare className="w-3 h-3 inline mr-1" /></span>
              </span>
            </div>

            <div className="pt-1 flex items-center justify-between border-t border-slate-800/60 text-[11px]">
              <span className="text-[#00d084] flex items-center gap-1 font-medium">
                <Sparkles className="w-3 h-3" /> Mở full màn hình không cần trình duyệt
              </span>
              <button
                type="button"
                onClick={handleDismiss}
                className="text-slate-400 hover:text-slate-200 font-bold cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        )}

        {/* HƯỚNG DẪN DÀNH CHO ANDROID */}
        {platform === 'android' && (
          <div>
            <button
              type="button"
              onClick={handleInstallAndroid}
              className="w-full py-2.5 rounded-xl bg-[#00d084] hover:bg-[#00b875] text-[#0d1117] font-extrabold text-xs shadow-lg shadow-[#00d084]/20 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Download className="w-4 h-4" /> Cài Đặt Ứng Dụng Ngay (1 Chạm)
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
