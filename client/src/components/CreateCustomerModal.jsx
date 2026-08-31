import React, { useState } from 'react';
import { X, UserPlus, Shield, Mail, Phone, Lock, User, Layers, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { customerService } from '../services/api';

export default function CreateCustomerModal({ isOpen, onClose, onSuccess, groups = [] }) {
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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-100">Tạo Tài Khoản Khách Hàng Mới</h3>
              <p className="text-xs text-slate-400">Cấp tài khoản mới và gán quản lý cho đại lý</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Account Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tên đăng nhập (Account) *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="VD: KH_HOANGNAM"
                  value={formData.account}
                  onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
            </div>

            {/* Customer Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Họ và tên khách hàng
              </label>
              <input
                type="text"
                placeholder="VD: Hoàng Văn Nam"
                value={formData.userName}
                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Địa chỉ Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="email"
                  placeholder="customer@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Số điện thoại
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="tel"
                  placeholder="0912345678"
                  value={formData.cellphone}
                  onChange={(e) => setFormData({ ...formData, cellphone: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Mật khẩu khởi tạo *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="Tối thiểu 8 ký tự"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nhập lại mật khẩu *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="Nhập lại mật khẩu"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 space-y-3">
            {/* User Type / Role */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Phân quyền tài khoản
              </label>
              <div className="relative">
                <Shield className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
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
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition cursor-pointer"
                >
                  <option value="3">🏠 Cấp 3: Người Tiêu Dùng Cuối (End-User)</option>
                  <option value="2">🏢 Cấp 2: Đại Lý (Dealer)</option>
                </select>
              </div>
            </div>

            {/* Mã Đại Lý */}
            {formData.userType === '2' && (
              <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/30 space-y-1.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    Mã Đại Lý (Gán riêng cho đại lý này) *
                  </label>
                  <span className="text-[9px] text-amber-400 font-mono">Mã Kích Hoạt</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="VD: DL_NEWTECH, DL_MIENTAY..."
                  value={formData.technicianCode}
                  onChange={(e) => setFormData({ ...formData, technicianCode: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-bold text-amber-400 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
                />
                <p className="text-[10px] text-slate-400">
                  Mã này cấp riêng cho Đại lý để nhận bàn giao trạm và cho phép Người tiêu dùng cuối chia sẻ quyền quản trị.
                </p>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition disabled:opacity-50"
            >
              {loading ? 'Đang khởi tạo...' : 'Xác Nhận Tạo Tài Khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
