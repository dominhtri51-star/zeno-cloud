import React, { useState } from 'react';
import { X, KeyRound, CheckCircle2, AlertCircle, Lock, Eye, EyeOff, Copy, Globe, Shield, Sparkles } from 'lucide-react';
import { customerService } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

export default function ResetPasswordModal({ isOpen, onClose, customer, onSuccess }) {
  const { isDark } = useTheme();
  const [targetPasswordType, setTargetPasswordType] = useState('zeno'); // 'zeno' | 'cloud' | 'both'
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showCurrentZeno, setShowCurrentZeno] = useState(false);
  const [showCurrentCloud, setShowCurrentCloud] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen || !customer) return null;

  const currentZenoPass = customer.zenoPassword || customer.password || 'sungo123';
  const currentCloudPass = customer.cloudPassword || '123456';

  const handlePresetClick = (preset) => {
    setNewPassword(preset);
    setConfirmPassword(preset);
    setError('');
  };

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setSuccessMsg(`Đã sao chép ${label}: ${text}`);
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (newPassword.length < 6) {
      return setError('Mật khẩu mới phải từ 6 ký tự trở lên');
    }
    if (newPassword !== confirmPassword) {
      return setError('Mật khẩu xác nhận không khớp');
    }

    setLoading(true);
    try {
      const res = await customerService.resetPassword(
        customer.userId || customer.account,
        newPassword,
        targetPasswordType,
        customer.account
      );
      if (res.success) {
        setSuccessMsg(res.message || `Đã cập nhật mật khẩu cho @${customer.account} thành công!`);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1300);
      } else {
        setError(res.message || 'Lỗi cập nhật mật khẩu');
      }
    } catch (err) {
      setError(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in font-['Plus_Jakarta_Sans',sans-serif]">
      <div className={`w-full max-w-lg rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl transition-colors duration-300 ${
        isDark ? 'bg-[#0b101e] border border-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-900 shadow-2xl'
      }`}>
        {/* Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
          isDark ? 'border-slate-800 bg-[#0d1424]' : 'border-slate-200 bg-slate-50/90'
        }`}>
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className={`font-extrabold text-sm sm:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Quản Lý & Đặt Lại Mật Khẩu
              </h3>
              <p className={`text-[11px] sm:text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} truncate mt-0.5`}>
                Tài khoản: <strong className="text-cyan-400 font-mono">@{customer.account}</strong> ({customer.userName || customer.account})
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className={`p-1.5 sm:p-2 rounded-xl transition cursor-pointer shrink-0 ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Password Overview: 2 Types of Passwords Saved in Zeno Cloud */}
        <div className={`p-3.5 sm:p-4 border-b ${isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            Mật Khẩu Đang Lưu Trữ Trên Hệ Thống:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* 1. Mật khẩu Zeno Cloud */}
            <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-900/80 border-cyan-500/30' : 'bg-white border-cyan-300 shadow-sm'}`}>
              <div className="flex items-center justify-between text-[11px] text-cyan-500 font-bold mb-1">
                <span className="flex items-center gap-1">⚡ Mật Khẩu Zeno Cloud</span>
                <button
                  type="button"
                  onClick={() => setShowCurrentZeno(!showCurrentZeno)}
                  className="hover:text-cyan-400 cursor-pointer"
                >
                  {showCurrentZeno ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-200">
                  {showCurrentZeno ? currentZenoPass : '••••••••'}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(currentZenoPass, 'Mật Khẩu Zeno Cloud')}
                  className="text-[10px] text-slate-400 hover:text-cyan-400 flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
              </div>
            </div>

            {/* 2. Mật khẩu Máy Chủ Hãng */}
            <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-900/80 border-emerald-500/30' : 'bg-white border-emerald-300 shadow-sm'}`}>
              <div className="flex items-center justify-between text-[11px] text-emerald-500 font-bold mb-1">
                <span className="flex items-center gap-1">🌐 Mật Khẩu Cloud Hãng</span>
                <button
                  type="button"
                  onClick={() => setShowCurrentCloud(!showCurrentCloud)}
                  className="hover:text-emerald-400 cursor-pointer"
                >
                  {showCurrentCloud ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-200">
                  {showCurrentCloud ? currentCloudPass : '••••••••'}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(currentCloudPass, 'Mật Khẩu Máy Chủ Hãng')}
                  className="text-[10px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="p-3.5 sm:p-5 space-y-3.5">
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => { setTargetPasswordType('zeno'); setError(''); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                targetPasswordType === 'zeno'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⚡ Đổi Pass Zeno Cloud (Khách Quên)
            </button>
            <button
              type="button"
              onClick={() => { setTargetPasswordType('cloud'); setError(''); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                targetPasswordType === 'cloud'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🌐 Đổi Pass Cloud Hãng
            </button>
          </div>

          {/* Explanation Alert */}
          {targetPasswordType === 'zeno' ? (
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-cyan-300 flex items-start gap-2">
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
              <span>
                <strong>Khách quên mật khẩu:</strong> Tài khoản Tổng đặt lại mật khẩu Zeno Cloud mới để khách đăng nhập ngay. Hệ thống vẫn lưu Mật khẩu Máy Chủ Hãng để duy trì đồng bộ viễn trắc live ngầm!
              </span>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-start gap-2">
              <Globe className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>
                <strong>Mật khẩu Máy Chủ Hãng (Sun Wise / Siseli):</strong> Sử dụng để Zeno Cloud liên kết và giao tiếp dữ liệu với máy chủ hãng. Cập nhật khi khách hàng đã đổi mật khẩu bên ứng dụng hãng.
              </span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Preset Quick Buttons */}
          <div>
            <div className="text-[11px] text-slate-400 mb-1 font-semibold">Chọn nhanh mật khẩu mẫu:</div>
            <div className="flex gap-1.5 flex-wrap">
              {['sungo123', 'zeno123', '123456', 'sungo@100%'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePresetClick(p)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-mono font-bold transition cursor-pointer ${
                    newPassword === p
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : isDark
                      ? 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                      : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            <div>
              <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                {targetPasswordType === 'zeno' ? 'Mật khẩu Zeno Cloud mới *' : 'Mật khẩu Cloud Hãng mới *'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type={showPass ? "text" : "password"}
                  required
                  placeholder="Tối thiểu 6 ký tự"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full pl-9 pr-10 py-2.5 ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  } border rounded-xl text-xs focus:outline-none focus:border-cyan-500 transition`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                Nhập lại mật khẩu mới *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type={showPass ? "text" : "password"}
                  required
                  placeholder="Xác nhận mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full pl-9 pr-10 py-2.5 ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  } border rounded-xl text-xs focus:outline-none focus:border-cyan-500 transition`}
                />
              </div>
            </div>

            <div className={`pt-3 flex items-center justify-end gap-2.5 sm:gap-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-5 py-2.5 rounded-xl font-black text-xs text-slate-950 shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${
                  targetPasswordType === 'zeno'
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-cyan-500/20 hover:from-cyan-300 hover:to-blue-400'
                    : 'bg-gradient-to-r from-emerald-400 to-teal-500 shadow-emerald-500/20 hover:from-emerald-300 hover:to-teal-400'
                }`}
              >
                {loading ? 'Đang cập nhật...' : (targetPasswordType === 'zeno' ? 'Xác Nhận Đổi Pass Zeno Cloud' : 'Xác Nhận Đổi Pass Cloud Hãng')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
