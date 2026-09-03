import React from 'react';
import { Shield, Lock, Eye, Smartphone, HardDrive, Mail, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy({ onBack }) {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-['Plus_Jakarta_Sans',sans-serif] py-10 px-4 sm:px-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 font-black text-lg shadow-lg shadow-emerald-500/30">
            ☀️
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">Chính Sách Quyền Riêng Tư (Privacy Policy)</h1>
            <p className="text-xs text-slate-400 mt-0.5">Ứng Dụng Zeno Solar • Cập nhật lần cuối: 03/09/2026</p>
          </div>
        </div>

        {onBack && (
          <button
            onClick={onBack}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại</span>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
        
        {/* Section 1 */}
        <section className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-2 text-emerald-400">
            <Shield className="w-4 h-4" /> 1. Giới Thiệu & Mục Đích Thu Thập
          </h2>
          <p>
            Ứng dụng <strong>Zeno Solar</strong> (được phát triển và vận hành bởi SUNGO SOLAR VIỆT NAM) là nền tảng quản lý và giám sát hệ thống điện mặt trời, biến tần Inverter Hybrid và pin lưu trữ lithium BMS.
            Chúng tôi cam kết bảo vệ tối đa quyền riêng tư và dữ liệu cá nhân của người dùng theo các tiêu chuẩn bảo mật quốc tế và quy định của Google Play & Apple App Store.
          </p>
        </section>

        {/* Section 2 */}
        <section className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-2 text-cyan-400">
            <Smartphone className="w-4 h-4" /> 2. Quyền Truy Cập Thiết Bị (Device Permissions)
          </h2>
          <div className="space-y-3 mt-3">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <strong className="text-white block mb-1">📶 Quyền Bluetooth BLE (BLUETOOTH_SCAN & BLUETOOTH_CONNECT):</strong>
              <p className="text-xs text-slate-400">
                Chỉ được sử dụng để quét tìm và kết nối trực tiếp với cục Datalogger Wi-Fi của Biến Tần Inverter ở khoảng cách gần nhằm truyền cấu hình tên mạng Wi-Fi và mật khẩu. Chúng tôi <strong>không sử dụng Bluetooth để theo dõi vị trí GPS</strong> của người dùng.
              </p>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <strong className="text-white block mb-1">📷 Quyền Camera (CAMERA):</strong>
              <p className="text-xs text-slate-400">
                Chỉ được kích hoạt khi người dùng chọn tính năng quét mã QR / mã vạch trên thân Inverter hoặc Datalogger để tự động điền Mã DTU / Số Serial Number (SN). Ứng dụng không chụp ảnh cá nhân hay lưu trữ hình ảnh riêng tư.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-2 text-amber-400">
            <HardDrive className="w-4 h-4" /> 3. Dữ Liệu Thu Thập & Xử Lý
          </h2>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300">
            <li><strong>Thông tin tài khoản:</strong> Tên đăng nhập, Email, Số điện thoại (dùng để đăng nhập, nhận mã xác thực OTP và khôi phục mật khẩu).</li>
            <li><strong>Dữ liệu viễn trắc Inverter:</strong> Công suất phát quang điện (PV), trạng thái pin BMS (SOC %, Điện áp), lượng điện tiêu thụ và lưới điện EVN.</li>
            <li><strong>Bảo mật mật khẩu:</strong> Toàn bộ mật khẩu được băm mã hóa một chiều bằng thuật toán PBKDF2 (100.000 vòng lặp) và mã hóa AES-256-GCM.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-2 text-rose-400">
            <Lock className="w-4 h-4" /> 4. Quyền Yêu Cầu Xóa Tài Khoản & Dữ Liệu (Account Deletion)
          </h2>
          <p>
            Người dùng có toàn quyền yêu cầu xóa vĩnh viễn tài khoản và toàn bộ dữ liệu liên quan khỏi hệ thống bất kỳ lúc nào:
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs text-slate-300 mt-2">
            <li>Thực hiện trực tiếp trong ứng dụng tại mục <strong>Quản Lý Tài Khoản $\rightarrow$ Xóa Tài Khoản</strong>.</li>
            <li>Hoặc gửi email yêu cầu xóa dữ liệu tới ban quản trị: <strong className="text-cyan-400">admin@sungo.vn</strong>.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-2 text-indigo-400">
            <Mail className="w-4 h-4" /> 5. Thông Tin Liên Hệ Đơn Vị Phát Hành
          </h2>
          <p className="text-xs text-slate-300 space-y-1">
            <span className="block"><strong>Đơn vị:</strong> SUNGO SOLAR VIỆT NAM (Zeno Solar Energy Tech)</span>
            <span className="block"><strong>Email hỗ trợ:</strong> admin@sungo.vn / support@sungo.vn</span>
            <span className="block"><strong>Website chính thức:</strong> <a href="https://zeno-cloud.onrender.com" className="text-cyan-400 underline" target="_blank" rel="noreferrer">https://zeno-cloud.onrender.com</a></span>
          </p>
        </section>

      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-slate-800 text-center text-[11px] text-slate-500">
        © 2026 Zeno Solar • SUNGO Solar Vietnam. All rights reserved.
      </div>
    </div>
  );
}
