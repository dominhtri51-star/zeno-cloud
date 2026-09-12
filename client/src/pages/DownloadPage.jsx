import React, { useState } from 'react';
import { 
  Download, QrCode, Smartphone, ShieldCheck, CheckCircle2, 
  Copy, Check, ArrowDownCircle, Info, Sun, ArrowLeft, Globe, Zap
} from 'lucide-react';

export default function DownloadPage({ onBackToHome }) {
  const [copied, setCopied] = useState(false);
  const downloadUrl = 'https://storage.googleapis.com/zeno-solar-downloads-718053420093/Zeno-Solar.apk';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=12&data=${encodeURIComponent(downloadUrl)}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(downloadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 flex flex-col justify-between font-['Plus_Jakarta_Sans',sans-serif] px-4 py-8 sm:py-12">
      {/* Top Brand Bar */}
      <div className="max-w-xl mx-auto w-full flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-amber-400 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sun className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-cyan-400 via-teal-300 to-amber-400 bg-clip-text text-transparent">
                ZENO SOLAR
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                APP
              </span>
            </div>
            <p className="text-xs text-slate-400">Nền tảng Quản lý & Giám sát Điện Mặt Trời</p>
          </div>
        </div>

        {onBackToHome && (
          <button
            onClick={onBackToHome}
            className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Về trang chủ
          </button>
        )}
      </div>

      {/* Main Download Card */}
      <div className="max-w-xl mx-auto w-full bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl shadow-cyan-500/5 overflow-hidden p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Bản Cài Đặt Chính Thức Cho Khách Hàng & Đại Lý</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Tải Ứng Dụng Zeno Solar
          </h1>
          <p className="text-sm text-slate-400">
            Giám sát thời gian thực, chẩn đoán biến tần Siseli, cảnh báo sự cố 24/7.
          </p>
        </div>

        {/* Primary Download Button */}
        <div className="space-y-3">
          <a
            href={downloadUrl}
            download="Zeno-Solar.apk"
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-base flex items-center justify-center gap-3 shadow-2xl shadow-emerald-500/30 transition duration-200 cursor-pointer group"
          >
            <ArrowDownCircle className="w-6 h-6 group-hover:translate-y-0.5 transition" />
            <span>TẢI XUỐNG FILE CÀI ĐẶT (.APK)</span>
          </a>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
            <span>📦 Dung lượng: <strong className="text-white">44.5 MB</strong></span>
            <span>⚡ Phiên bản: <strong className="text-white">1.1.8</strong></span>
            <span>📱 Hỗ trợ: <strong className="text-white">Android 7.0+</strong></span>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-center gap-5">
          <div className="p-2.5 bg-white rounded-2xl shadow-md flex-shrink-0">
            <img 
              src={qrCodeUrl} 
              alt="QR Code Tải Zeno Solar APK" 
              className="w-32 h-32 object-contain"
            />
          </div>
          <div className="text-center sm:text-left space-y-2">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-cyan-400 text-sm font-bold">
              <QrCode className="w-4 h-4" />
              <span>Quét mã bằng Camera điện thoại</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Dùng máy ảnh điện thoại Samsung, Xiaomi, Oppo, iPhone hoặc Zalo quét mã để mở link và tải ngay về máy.
            </p>
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã sao chép link!' : 'Sao chép link tải'}</span>
            </button>
          </div>
        </div>

        {/* 3 Steps Guide */}
        <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>3 Bước cài đặt nhanh trên điện thoại Android:</span>
          </h3>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px] mt-0.5">1</span>
              <div>
                <strong className="text-white">Nhấn nút "Tải xuống":</strong> Nếu trình duyệt Chrome/Cốc Cốc cảnh báo <em>"Tệp có thể gây hại"</em>, hãy chọn <strong className="text-emerald-400">"Vẫn tải xuống"</strong> (đây là cảnh báo bảo mật mặc định của Android đối với file cài ngoài Store).
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px] mt-0.5">2</span>
              <div>
                <strong className="text-white">Mở file đã tải:</strong> Sau khi tải xong, nhấn vào thông báo tải hoàn thành hoặc mở mục <strong>Tệp đã tải xuống (Downloads)</strong> và chọn file <strong>Zeno-Solar.apk</strong>.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px] mt-0.5">3</span>
              <div>
                <strong className="text-white">Cài đặt & Đăng nhập:</strong> Chọn <strong>"Cài đặt"</strong> (nếu điện thoại hỏi <em>"Cho phép từ nguồn này"</em>, hãy gạt Bật). Mở ứng dụng và đăng nhập bằng tài khoản Zeno Solar của bạn.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-xl mx-auto w-full text-center text-xs text-slate-500 mt-8 space-y-1">
        <p>Phát triển bởi Đội ngũ Công nghệ SUNGO SOLAR VIỆT NAM</p>
        <p className="text-[11px]">Hỗ trợ kỹ thuật: 090.123.4567 • info@sungo.vn</p>
      </div>
    </div>
  );
}
