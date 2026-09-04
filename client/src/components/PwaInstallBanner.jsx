import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, MoreVertical, Smartphone, CheckCircle, Sparkles } from 'lucide-react';

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Kiểm tra xem app đã được cài đặt và đang chạy ở chế độ standalone chưa
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandaloneMode) {
      setIsStandalone(true);
      return;
    }

    // 2. Kiểm tra thiết bị iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // 3. Bắt sự kiện beforeinstallprompt của Chrome / Android / Edge
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Hiển thị banner sau 1.5 giây
      setTimeout(() => {
        const isDismissed = sessionStorage.getItem('pwa_banner_dismissed') === 'true';
        if (!isDismissed) {
          setIsVisible(true);
        }
      }, 1500);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Đối với iOS hoặc các trình duyệt khác: Tự động hiển thị sau 1.5 giây nếu chưa bị đóng
    const timer = setTimeout(() => {
      const isDismissed = sessionStorage.getItem('pwa_banner_dismissed') === 'true';
      if (!isDismissed && !isStandaloneMode) {
        setIsVisible(true);
      }
    }, 1500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Kích hoạt hộp thoại cài đặt gốc của Chrome / Android
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[PWA] User choice:', outcome);
      setDeferredPrompt(null);
      setIsVisible(false);
    } else if (isIos) {
      // Hiển thị popup hướng dẫn 2 bước cho iOS Safari
      setShowIosGuide(true);
    } else {
      // Hướng dẫn mở menu 3 chấm Chrome
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  };

  if (isStandalone || !isVisible) return null;

  return (
    <>
      {/* Smart Bottom Install Banner */}
      <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-5 sm:bottom-5 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-500">
        <div className="bg-slate-900/95 backdrop-blur-xl border border-cyan-500/40 hover:border-cyan-400/70 p-3.5 sm:p-4 rounded-2xl shadow-2xl shadow-cyan-950/60 text-white relative">
          {/* Nút đóng */}
          <button
            onClick={handleDismiss}
            className="absolute top-2.5 right-2.5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3">
            {/* Logo Zeno Solar */}
            <div className="relative flex-shrink-0">
              <img
                src="/icon-192.png"
                alt="Zeno Solar Logo"
                className="w-12 h-12 rounded-xl object-contain shadow-lg shadow-amber-500/20 bg-slate-950 p-1 border border-amber-500/30"
              />
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500"></span>
              </span>
            </div>

            {/* Nội dung thông báo */}
            <div className="flex-1 pr-5">
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-extrabold text-white leading-tight">
                  Cài Đặt App Zeno Solar
                </h4>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30">
                  PWA
                </span>
              </div>
              <p className="text-[11.5px] text-slate-300 mt-1 leading-snug">
                Dùng toàn màn hình, mượt mà & mở ngay từ màn hình chính điện thoại.
              </p>

              {/* Nút Cài Đặt Ngay */}
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  onClick={handleInstallClick}
                  className="flex-1 py-2 px-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-200 cursor-pointer active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CÀI ĐẶT NGAY</span>
                </button>
              </div>

              {/* Mẹo cài đặt nhanh */}
              <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10.5px] text-slate-400 flex items-center gap-1">
                <span>💡 Hoặc bấm biểu tượng</span>
                <span className="font-bold text-slate-200 inline-flex items-center">
                  {isIos ? <Share className="w-3 h-3 text-cyan-400 inline mx-0.5" /> : '⋮'}
                </span>
                <span>{isIos ? '→ Thêm vào MH chính' : '→ Cài đặt ứng dụng'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Step-by-Step Installation Modal Guide */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl max-w-sm w-full p-5 text-white shadow-2xl relative">
            <button
              onClick={() => setShowIosGuide(false)}
              className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center">
              <img
                src="/icon-192.png"
                alt="Zeno Solar"
                className="w-14 h-14 rounded-2xl mx-auto shadow-xl bg-slate-950 p-1 border border-amber-500/30 object-contain"
              />
              <h3 className="text-base font-bold text-white mt-2.5">
                Cài Đặt App Zeno Solar
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Chỉ mất 5 giây để đưa ứng dụng ra màn hình chính
              </p>
            </div>

            <div className="mt-4 space-y-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs">
              {isIos ? (
                <>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">1</span>
                    <div className="text-slate-200">
                      Chạm vào biểu tượng <strong className="text-cyan-400 inline-flex items-center gap-0.5">Chia sẻ <Share className="w-3 h-3 inline" /></strong> ở thanh công cụ dưới cùng của trình duyệt Safari.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">2</span>
                    <div className="text-slate-200">
                      Cuộn xuống và chọn <strong className="text-cyan-400 inline-flex items-center gap-0.5">"Thêm vào MH chính" <PlusSquare className="w-3 h-3 inline" /></strong> (Add to Home Screen).
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">1</span>
                    <div className="text-slate-200">
                      Bấm vào biểu tượng <strong className="text-cyan-400">3 dấu chấm ⋮</strong> ở góc trên bên phải trình duyệt Chrome.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">2</span>
                    <div className="text-slate-200">
                      Chọn <strong className="text-cyan-400">"Cài đặt ứng dụng" (Install app)</strong> hoặc <strong className="text-cyan-400">"Thêm vào màn hình chính"</strong>.
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full mt-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition cursor-pointer"
            >
              ĐÃ HIỂU
            </button>
          </div>
        </div>
      )}
    </>
  );
}
