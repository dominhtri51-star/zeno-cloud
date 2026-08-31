import React, { useState, useEffect } from 'react';
import { X, KeyRound, ShieldCheck, AlertCircle, Copy, Check, Sparkles, UserCheck } from 'lucide-react';
import { customerService } from '../services/api';

export default function AssignTechnicianCodeModal({ isOpen, customer, onClose, onSuccess }) {
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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-[#0b101e] border border-amber-500/40 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl shadow-amber-500/10 animate-in fade-in zoom-in duration-200 space-y-5 p-6 sm:p-7 relative">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-white">Cấp / Đổi Mã Kỹ Thuật Viên</h3>
              <p className="text-xs text-slate-400">Gán mã định danh riêng cho tài khoản thợ này</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Target Info */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Kỹ thuật viên:</span>
            <span className="font-bold text-white">{customer.userName || customer.account}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Tên tài khoản:</span>
            <span className="font-mono font-bold text-cyan-400">@{customer.account}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Số điện thoại:</span>
            <span className="font-mono text-slate-300">{customer.cellphone || 'Chưa liên kết'}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Mã Kỹ Thuật Viên (Technician Code) *
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
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
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono font-black text-amber-400 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              💡 Mã này thuộc sở hữu của tài khoản <strong className="text-white">@{customer.account}</strong>. Khi nhập mã này lúc cấu hình hoặc kết nối, hệ thống sẽ tự động gán trạm và thiết bị cho kỹ thuật viên này.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
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
