import React, { useState } from 'react';
import { Phone, Shield, ShieldCheck, CheckCircle2, AlertCircle, Sparkles, X, KeyRound, Cpu } from 'lucide-react';
import { authService } from '../services/api';

export default function SecurityPhoneModal({ user, isOpen, onClose, onPhoneUpdated }) {
  const [phone, setPhone] = useState(user?.cellphone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      return setError('Vui lòng nhập Số điện thoại hợp lệ (tối thiểu 9 chữ số)!');
    }

    setLoading(true);
    try {
      const res = await authService.updatePhone({
        account: user?.account,
        cellphone: cleanPhone
      });

      if (res.data?.success || res.success) {
        setSuccess('🎉 Liên kết Số điện thoại bảo mật thành công!');
        
        // Cập nhật thông tin user trong LocalStorage
        const updatedUser = {
          ...user,
          cellphone: cleanPhone,
          phoneLinked: true
        };
        localStorage.setItem('zeno_user', JSON.stringify(updatedUser));
        localStorage.setItem(`phone_prompt_done_${user?.account}`, 'true');

        setTimeout(() => {
          if (onPhoneUpdated) onPhoneUpdated(updatedUser);
          onClose();
        }, 1000);
      } else {
        setError(res.data?.message || res.message || 'Cập nhật thất bại. Vui lòng thử lại!');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi khi lưu số điện thoại');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(`phone_prompt_done_${user?.account}`, 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#161922] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
        
        {/* Top Window Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
            <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
          </div>
          <div className="text-xs font-black text-slate-300 tracking-wider">
            ZENO CLOUD SECURITY
          </div>
          <button 
            type="button"
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <div className="text-center mb-5">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#00d084]/15 border border-[#00d084]/30 flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6 text-[#00d084]" />
            </div>
            <h3 className="text-lg font-black text-white">
              Bảo Mật & Khôi Phục Mật Khẩu
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Vui lòng bổ sung <strong className="text-white">Số điện thoại</strong> để phòng ngừa trường hợp quên mật khẩu và giúp quý khách tự lấy lại mật khẩu nhanh chóng bất kỳ lúc nào.
            </p>
          </div>

          {/* 2 Lợi ích chính */}
          <div className="space-y-2 mb-4">
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2">
              <KeyRound className="w-4 h-4 text-[#00d084] shrink-0 mt-0.5" />
              <span>Nhận mã OTP khôi phục mật khẩu qua tin nhắn SMS / Điện thoại khi cần.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2">
              <Cpu className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>Đối chiếu quyền sở hữu Biến Tần (SN) để đổi mật khẩu miễn phí trên Zeno Cloud.</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Số điện thoại liên hệ của bạn *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="tel"
                  required
                  placeholder="VD: 0912345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#242936] border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00d084] font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full bg-[#00d084] hover:bg-[#00b875] text-[#0d1117] font-black text-sm shadow-xl shadow-[#00d084]/20 transition duration-200 mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Đang Lưu...' : 'Lưu Số Điện Thoại & Kích Hoạt Bảo Mật'}
              <Sparkles className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="w-full py-2 text-xs text-slate-500 hover:text-slate-300 font-semibold transition cursor-pointer text-center"
            >
              Để sau (Bỏ qua)
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
