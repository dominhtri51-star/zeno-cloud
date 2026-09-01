import React, { useState } from 'react';
import { X, UserPlus, Shield, Mail, Phone, Lock, User, Layers, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { customerService } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

export default function CreateCustomerModal({ isOpen, onClose, onSuccess, groups = [] }) {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({
    account: '',
    userName: '',
    email: '',
    cellphone: '',
    password: '',
    confirmPassword: '',
    technicianCode: '',
    userType: '3', // 3: Owner, 2: Installer
    groupId: groups[0]?.groupId || ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formData.account || !formData.password) {
      return setError('Vui lòng điền Tên tài khoản và Mật khẩu');
    }

    if (formData.password.length < 8) {
      return setError('Mật khẩu phải từ 8 ký tự trở lên (gồm chữ và số)');
    }

    if (formData.password !== formData.confirmPassword) {
      return setError('Xác nhận mật khẩu không khớp');
    }

    setLoading(true);
    try {
      const res = await customerService.createCustomer(formData);
      if (res.success) {
        setSuccessMsg(res.message || 'Tạo tài khoản khách hàng thành công!');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      } else {
        setError(res.message || 'Không thể tạo tài khoản');
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi gửi yêu cầu tới máy chủ');
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
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-500 flex items-center justify-center shrink-0">
              <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className={`font-extrabold text-sm sm:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>Tạo Tài Khoản Khách Hàng Mới</h3>
              <p className={`text-[11px] sm:text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} truncate mt-0.5`}>Cấp tài khoản mới và gán quản lý cho đại lý</p>
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

        {/* Form */}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Account Username */}
            <div>
              <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                Tên đăng nhập (Account) *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="VD: KH_HOANGNAM"
                  value={formData.account}
                  onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                  className={`w-full pl-9 pr-3 py-2 ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-600' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 shadow-sm'
                  } border rounded-xl text-xs focus:outline-none focus:border-cyan-500 transition`}
                />
              </div>
            </div>

            {/* Customer Full Name */}
            <div>
              <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                Họ và tên khách hàng
              </label>
              <input
                type="text"
                placeholder="VD: Hoàng Văn Nam"
                value={formData.userName}
                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                className={`w-full px-3 py-2 ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-600' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 shadow-sm'
                } border rounded-xl text-xs focus:outline-none focus:border-cyan-500 transition`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Email */}
            <div>
              <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                Địa chỉ Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  placeholder="customer@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full pl-9 pr-3 py-2 ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-600' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 shadow-sm'
                  } border rounded-xl text-xs focus:outline-none focus:border-cyan-500 transition`}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                Số điện thoại
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="tel"
                  placeholder="0912345678"
                  value={formData.cellphone}
                  onChange={(e) => setFormData({ ...formData, cellphone: e.target.value })}
                  className={`w-full pl-9 pr-3 py-2 ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-600' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 shadow-sm'
                  } border rounded-xl text-xs focus:outline-none focus:border-cyan-500 transition`}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Password */}
            <div>
              <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                Mật khẩu khởi tạo *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="Tối thiểu 8 ký tự"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full pl-9 pr-3 py-2 ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-600' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 shadow-sm'
                  } border rounded-xl text-xs focus:outline-none focus:border-cyan-500 transition`}
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                Nhập lại mật khẩu *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="Nhập lại mật khẩu"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={`w-full pl-9 pr-3 py-2 ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-600' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 shadow-sm'
                  } border rounded-xl text-xs focus:outline-none focus:border-cyan-500 transition`}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 space-y-3">
            {/* User Type / Role */}
            <div>
              <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                Phân quyền tài khoản
              </label>
              <div className="relative">
                <Shield className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <select
                  value={formData.userType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setFormData({ 
                      ...formData, 
                      userType: newType,
                      technicianCode: newType === '2' && !formData.technicianCode ? `DL_${(formData.account || 'DAILY').toUpperCase()}` : formData.technicianCode
                    });
                  }}
                  className={`w-full pl-9 pr-3 py-2 ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-sm'
                  } border rounded-xl text-xs focus:outline-none focus:border-cyan-500 transition cursor-pointer`}
                >
                  <option value="3">🏠 Cấp 3: Người Tiêu Dùng Cuối (End-User)</option>
                  <option value="2">🏢 Cấp 2: Đại Lý (Dealer)</option>
                </select>
              </div>
            </div>

            {/* Mã Đại Lý */}
            {formData.userType === '2' && (
              <div className={`p-3 rounded-xl border space-y-1.5 animate-fade-in ${
                isDark ? 'bg-slate-950 border-amber-500/30' : 'bg-amber-50/80 border-amber-300'
              }`}>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                    Mã Đại Lý (Gán riêng cho đại lý này) *
                  </label>
                  <span className="text-[9px] text-amber-500 font-mono font-bold">Mã Kích Hoạt</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="VD: DL_NEWTECH, DL_MIENTAY..."
                  value={formData.technicianCode}
                  onChange={(e) => setFormData({ ...formData, technicianCode: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                  className={`w-full px-3 py-2 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-amber-400' : 'bg-white border-amber-300 text-amber-800'
                  } border rounded-lg text-xs font-mono font-bold placeholder-slate-400 focus:outline-none focus:border-amber-500 transition`}
                />
                <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Mã này cấp riêng cho Đại lý để nhận bàn giao trạm và cho phép Người tiêu dùng cuối chia sẻ quyền quản trị.
                </p>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className={`pt-3.5 sm:pt-4 flex items-center justify-end gap-2.5 sm:gap-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Đang khởi tạo...' : 'Xác Nhận Tạo Tài Khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
