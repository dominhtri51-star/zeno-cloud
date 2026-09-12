import React, { useState } from 'react';
import { 
  X, Download, QrCode, Smartphone, ShieldCheck, CheckCircle2, 
  ExternalLink, Copy, Check, AlertTriangle, ArrowDownCircle, Info
} from 'lucide-react';

export default function DownloadAppModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);
  const downloadUrl = 'https://storage.googleapis.com/zeno-solar-downloads-718053420093/Zeno-Solar.apk';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(downloadUrl)}`;

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(downloadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn font-['Plus_Jakarta_Sans',sans-serif]">
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl shadow-cyan-500/10 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">Tải Ứng Dụng Zeno Solar</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Android APK
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Phiên bản 1.1.7 (Build 27) • Dung lượng 44.5 MB</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Main Direct Download Action */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-emerald-500/30 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-300">File cài đặt chính thức & an toàn 100%</span>
            </div>

            <a
              href={downloadUrl}
              download="Zeno-Solar.apk"
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/25 transition-all duration-200 cursor-pointer group"
            >
              <ArrowDownCircle className="w-5 h-5 group-hover:translate-y-0.5 transition" />
              <span>TẢI FILE CÀI ĐẶT NGAY (.APK)</span>
            </a>

            <div className="mt-2.5 flex items-center justify-center gap-3 text-[11px] text-slate-400">
              <button
                onClick={handleCopyLink}
                className="hover:text-cyan-300 transition flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã sao chép link tải!' : 'Sao chép link gửi cho khách'}</span>
              </button>
            </div>
          </div>

          {/* QR Code section for Scanning from Phone */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row items-center gap-4">
            <div className="p-2 bg-white rounded-xl shadow-md flex-shrink-0">
              <img 
                src={qrCodeUrl} 
                alt="Mã QR tải ứng dụng Zeno Solar APK" 
                className="w-28 h-28 object-contain"
                loading="lazy"
              />
            </div>
            <div className="text-center sm:text-left space-y-1.5">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-cyan-400 text-xs font-bold">
                <QrCode className="w-4 h-4" />
                <span>Quét mã tải về điện thoại</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Dùng camera trên điện thoại Android (hoặc Zalo) quét mã QR để tải file APK trực tiếp về máy.
              </p>
              <p className="text-[11px] text-slate-500">
                Tương thích: Samsung, Xiaomi, Oppo, Vivo, Realme, v.v. (Android 7.0 - 15+)
              </p>
            </div>
          </div>

          {/* Installation Instructions (3 Steps) */}
          <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>3 Bước cài đặt dễ dàng:</span>
            </h4>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px] mt-0.5">
                  1
                </div>
                <div>
                  <span className="font-semibold text-white">Nhấn Tải Về:</span> Nếu trình duyệt hiện thông báo <em>"Tệp có thể gây hại"</em>, hãy chọn <strong className="text-emerald-400">"Vẫn tải xuống"</strong> (đây là thông báo tiêu chuẩn của Android khi tải file ngoài CH Play).
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px] mt-0.5">
                  2
                </div>
                <div>
                  <span className="font-semibold text-white">Mở file đã tải:</span> Nhấn vào file <strong className="text-white">Zeno-Solar.apk</strong> trong thanh thông báo hoặc mục Tệp đã tải (Downloads).
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px] mt-0.5">
                  3
                </div>
                <div>
                  <span className="font-semibold text-white">Cài đặt & Mở app:</span> Nhấn <strong className="text-white">"Cài đặt"</strong> (cho phép cài đặt từ nguồn trình duyệt nếu được hỏi) là hoàn tất!
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-400">
          <span>Hỗ trợ kỹ thuật: SUNGO SOLAR VIỆT NAM</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
