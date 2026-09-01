import React, { useState, useEffect } from 'react';
import { X, Trash2, AlertTriangle, ShieldAlert, Lock, Cpu, RefreshCw, KeyRound, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function SafeDeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Xác Nhận Xóa An Toàn', 
  itemName = '', 
  itemId = '', 
  itemType = 'station', // 'station' | 'customer' | 'device'
  serialNumber = '', 
  isMaster = true, 
  isDealer = false 
}) {
  const { isDark } = useTheme();
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmSn, setConfirmSn] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAdminPassword('');
      setConfirmSn('');
      setError('');
      setShowPassword(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const targetSn = String(serialNumber || '').trim();
  const isDealerMode = isDealer && !isMaster;

  // Validation logic
  const isFormValid = isMaster 
    ? adminPassword.trim().length > 0
    : confirmSn.trim().toLowerCase() === targetSn.toLowerCase();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isFormValid) {
      if (isMaster) {
        setError('Vui lòng nhập mật khẩu Quản Trị Viên (sungo123) để xác nhận!');
      } else {
        setError(`Mã máy nhập vào không khớp với Số Serial [${targetSn}] của thiết bị!`);
      }
      return;
    }

    try {
      setSubmitting(true);
      await onConfirm({
        adminPassword: adminPassword.trim(),
        confirmSn: confirmSn.trim()
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Lỗi khi xóa dữ liệu');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in font-['Plus_Jakarta_Sans',sans-serif]">
      <div className={`w-full max-w-md rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] relative transition-colors duration-300 ${
        isDark ? 'bg-[#0f172a] border border-rose-500/40 text-white shadow-rose-950/30' : 'bg-white border border-rose-200 text-slate-900 shadow-2xl'
      }`}>
        
        {/* Header */}
        <div className={`p-4 sm:p-5 border-b flex items-start justify-between ${
          isDark ? 'border-slate-800 bg-rose-950/20' : 'border-rose-100 bg-rose-50/70'
        }`}>
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0 pr-2">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-500 shrink-0 shadow-lg shadow-rose-500/10">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
                <span>{title}</span>
              </h2>
              <p className={`text-[11px] sm:text-xs ${isDark ? 'text-rose-300' : 'text-rose-600'} mt-0.5 truncate font-medium`}>
                Xác thực bảo vệ hai lớp chống xóa nhầm dữ liệu
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

        {/* Nội dung form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          
          {/* Đối tượng cần xóa */}
          <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-[#0b101e] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <span className={`text-[11px] font-semibold block ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-1`}>
              Mục chuẩn bị xóa:
            </span>
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
              <span className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-900'} break-all`}>
                {itemName || itemId}
              </span>
            </div>
            {itemId && itemName && itemId !== itemName && (
              <span className="text-[11px] font-mono text-cyan-500 block mt-1">ID: {itemId}</span>
            )}
            {targetSn && (
              <span className="text-[11px] font-mono text-amber-500 block mt-0.5">SN: {targetSn}</span>
            )}
          </div>

          {/* Cảnh báo tác vụ */}
          <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
            isDark ? 'bg-rose-950/20 border-rose-500/30 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <strong>Cảnh báo an toàn:</strong> {isMaster 
                  ? 'Thao tác này sẽ xóa vĩnh viễn dữ liệu khỏi hệ thống. Để đảm bảo an toàn tuyệt đối, vui lòng nhập mật khẩu Quản Trị Viên (sungo123):'
                  : 'Hành động này sẽ xóa thiết bị khỏi danh sách phụ trách của Đại lý. Vui lòng nhập chính xác Mã Máy (Serial Number) để xác nhận:'}
              </div>
            </div>
          </div>

          {/* Ô nhập xác nhận cho Master: Mật khẩu admin */}
          {isMaster && (
            <div className="space-y-1.5">
              <label className={`block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Mật Khẩu Quản Trị Viên (sungo123) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Nhập mật khẩu sungo123..."
                  className={`w-full pl-9 pr-10 py-2.5 rounded-xl border text-xs focus:outline-none transition font-medium ${
                    isDark 
                      ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-600 focus:border-rose-500' 
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-rose-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Ô nhập xác nhận cho Đại Lý: Serial Number */}
          {isDealerMode && (
            <div className="space-y-1.5">
              <label className={`block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Nhập chính xác Mã Máy (SN): <span className="font-mono text-cyan-500">{targetSn}</span> *
              </label>
              <div className="relative">
                <Cpu className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={confirmSn}
                  onChange={(e) => setConfirmSn(e.target.value)}
                  placeholder={`Nhập đúng "${targetSn}" để xóa...`}
                  className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs font-mono font-bold focus:outline-none transition ${
                    isDark 
                      ? 'bg-slate-950 border-slate-700 text-amber-400 placeholder-slate-600 focus:border-rose-500' 
                      : 'bg-white border-slate-300 text-amber-700 placeholder-slate-400 focus:border-rose-500'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Thông báo lỗi */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2 animate-fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer nút hành động */}
          <div className={`pt-3 flex items-center justify-end gap-2.5 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || !isFormValid}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Xác Nhận Xóa Vĩnh Viễn</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
