import React, { useState, useEffect } from 'react';
import { X, KeyRound, ShieldCheck, AlertCircle, Copy, Check, Sparkles, UserCheck } from 'lucide-react';
import { customerService } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

export default function AssignTechnicianCodeModal({ isOpen, customer, onClose, onSuccess }) {
  const { isDark } = useTheme();
  const [techCode, setTechCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (customer) {
      setTechCode(customer.technicianCode || `KT_${String(customer.account || '').toUpperCase()}`);
      setError('');
      setSuccessMsg('');
    }
  }, [customer, isOpen]);

  if (!isOpen || !customer) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!techCode.trim()) {
      return setError('Vui lòng nhập Mã Kỹ Thuật Viên!');
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await customerService.setTechnicianCode(customer.userId || customer.account, {
        code: techCode.trim().toUpperCase(),
        account: customer.account
      });

      if (res.success) {
        setSuccessMsg(res.message || `Đã cấp mã [${res.technicianCode}] thành công!`);
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1200);
      } else {
        setError(res.message || 'Lỗi khi cập nhật mã');
      }
    } catch (err) {
      setError(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(techCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-['Plus_Jakarta_Sans',sans-serif]">
      <div className={`border rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 space-y-5 p-6 sm:p-7 relative transition-colors duration-300 ${
        isDark ? 'bg-[#0b101e] border-amber-500/40 text-white shadow-amber-500/10' : 'bg-white border-amber-200 text-slate-900 shadow-2xl'
      }`}>
        
        {/* Header */}
        <div className={`flex items-start justify-between gap-4 pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-black text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>Cấp / Đổi Mã Kỹ Thuật Viên</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Gán mã định danh riêng cho tài khoản thợ này</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Target Info */}
        <div className={`p-3.5 rounded-2xl border space-y-1.5 text-xs ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex justify-between">
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Kỹ thuật viên:</span>
            <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{customer.userName || customer.account}</span>
          </div>
          <div className="flex justify-between">
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Tên tài khoản:</span>
            <span className="font-mono font-bold text-cyan-500">@{customer.account}</span>
          </div>
          <div className="flex justify-between">
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Số điện thoại:</span>
            <span className={`font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{customer.cellphone || 'Chưa liên kết'}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Mã Kỹ Thuật Viên (Technician Code) *
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] text-cyan-500 hover:text-cyan-600 flex items-center gap-1 font-semibold cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Đã Copy' : 'Copy'}</span>
              </button>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-3 text-amber-500" />
              <input
                type="text"
                required
                placeholder="VD: KT8888, KT_HANOI..."
                value={techCode}
                onChange={(e) => setTechCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-sm font-mono font-black focus:outline-none transition ${
                  isDark ? 'bg-slate-950 border border-slate-800 text-amber-400 placeholder-slate-600 focus:border-amber-500' : 'bg-white border border-amber-300 text-amber-800 placeholder-slate-400 focus:border-amber-500 shadow-sm'
                }`}
              />
            </div>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1.5 leading-relaxed`}>
              💡 Mã này thuộc sở hữu của tài khoản <strong className={isDark ? 'text-white' : 'text-slate-900'}>@{customer.account}</strong>. Khi nhập mã này lúc cấu hình hoặc kết nối, hệ thống sẽ tự động gán trạm và thiết bị cho kỹ thuật viên này.
            </p>
          </div>

          <div className={`pt-2 flex items-center justify-end gap-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading || !techCode.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <UserCheck className="w-4 h-4" />
              )}
              <span>Lưu & Cấp Mã Cho KTV Này</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
