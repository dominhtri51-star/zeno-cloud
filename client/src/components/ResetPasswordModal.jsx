import React, { useState } from 'react';
import { X, KeyRound, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import { customerService } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

export default function ResetPasswordModal({ isOpen, onClose, customer, onSuccess }) {
  const { isDark } = useTheme();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen || !customer) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (newPassword.length < 8) {
      return setError('Mật khẩu mới phải từ 8 ký tự trở lên');
    }
    if (newPassword !== confirmPassword) {
      return setError('Mật khẩu nhập lại không khớp');
    }

    setLoading(true);
    try {
      const res = await customerService.resetPassword(customer.userId, newPassword);
      if (res.success) {
        setSuccessMsg(`Đã đổi mật khẩu cho ${customer.userName || customer.account} thành công!`);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      } else {
        setError(res.message || 'Lỗi đổi mật khẩu');
      }
    } catch (err) {
      setError(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in font-['Plus_Jakarta_Sans',sans-serif]">
      <div className={`w-full max-w-md rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl transition-colors duration-300 ${
        isDark ? 'bg-[#0b101e] border border-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-900 shadow-2xl'
      }`}>
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
          isDark ? 'border-slate-800 bg-[#0d1424]' : 'border-slate-200 bg-slate-50/90'
        }`}>
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0">
              <KeyRound className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className={`font-extrabold text-sm sm:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>Cấp lại Mật Khẩu</h3>
              <p className={`text-[11px] sm:text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} truncate mt-0.5`}>
                Khách hàng: <span className="text-cyan-500 font-semibold">{customer.userName || customer.account}</span>
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

        <form onSubmit={handleSubmit} className="p-3.5 sm:p-5 space-y-3.5 sm:space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>Mật khẩu mới *</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                required
                placeholder="Tối thiểu 8 ký tự"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                } border rounded-xl text-xs focus:outline-none focus:border-amber-500 transition`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>Nhập lại mật khẩu mới *</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                required
                placeholder="Xác nhận mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                } border rounded-xl text-xs focus:outline-none focus:border-amber-500 transition`}
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
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-cyan-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Đang cập nhật...' : 'Xác Nhận Đổi Mật Khẩu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
