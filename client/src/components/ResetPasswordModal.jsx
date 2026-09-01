import React, { useState } from 'react';
import { X, KeyRound, CheckCircle2, AlertCircle, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { customerService } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

export default function ResetPasswordModal({ isOpen, onClose, customer, onSuccess }) {
  const { isDark } = useTheme();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen || !customer) return null;

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
        'zeno',
        customer.account
      );
      if (res.success) {
        setSuccessMsg(res.message || `Đã đặt lại mật khẩu Zeno Cloud cho @${customer.account} thành công!`);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in font-['Plus_Jakarta_Sans',sans-serif]">
      <div className={`w-full max-w-md rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl transition-colors duration-300 ${
        isDark ? 'bg-[#0b101e] border border-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-900 shadow-2xl'
      }`}>
        {/* Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
          isDark ? 'border-slate-800 bg-[#0d1424]' : 'border-slate-200 bg-slate-50/90'
        }`}>
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className={`font-extrabold text-sm sm:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Đặt Lại Mật Khẩu Zeno Cloud
              </h3>
              <p className={`text-[11px] sm:text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} truncate mt-0.5`}>
                Cấp lại cho: <strong className="text-cyan-400 font-mono">@{customer.account}</strong> ({customer.userName || customer.account})
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

        {/* Form Body */}
        <div className="p-4 sm:p-5 space-y-4">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
            <span className="leading-relaxed">
              Mật khẩu mới này dùng để khách hàng đăng nhập trực tiếp vào hệ thống <strong>Zeno Cloud</strong> khi quên mật khẩu.
            </span>
          </div>

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

          <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
            {/* Input Mật Khẩu Mới */}
            <div>
              <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1.5`}>
                Nhập Mật Khẩu Mới *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type={showPass ? "text" : "password"}
                  required
                  placeholder="Nhập tối thiểu 6 ký tự"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full pl-10 pr-10 py-2.5 ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-600' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 shadow-sm'
                  } border rounded-xl text-xs focus:outline-none focus:border-cyan-500 transition`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className={`absolute right-3.5 top-3 ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-700'} cursor-pointer`}
                  title="Ẩn / Hiện mật khẩu"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Input Nhập Lại Mật Khẩu Mới */}
            <div>
              <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1.5`}>
                Nhập Lại Mật Khẩu Mới *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type={showPass ? "text" : "password"}
                  required
                  placeholder="Xác nhận lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full pl-10 pr-10 py-2.5 ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-600' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 shadow-sm'
                  } border rounded-xl text-xs focus:outline-none focus:border-cyan-500 transition`}
                />
              </div>
            </div>

            {/* Actions */}
            <div className={`pt-3.5 flex items-center justify-end gap-2.5 sm:gap-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl font-black text-xs text-slate-950 shadow-lg bg-gradient-to-r from-cyan-400 to-blue-500 shadow-cyan-500/20 hover:from-cyan-300 hover:to-blue-400 transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {loading ? 'Đang cập nhật...' : 'Xác Nhận Đổi Mật Khẩu'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
