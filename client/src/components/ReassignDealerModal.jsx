import React, { useState, useEffect } from 'react';
import { 
  X, UserCheck, ShieldCheck, AlertCircle, CheckCircle2, 
  RefreshCw, Building, Zap, ArrowRight, UserX, Cpu, Check
} from 'lucide-react';
import { monitoringService } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

export default function ReassignDealerModal({ isOpen, station, device, onClose, onSuccess }) {
  const { isDark } = useTheme();
  const [dealers, setDealers] = useState([]);
  const [loadingDealers, setLoadingDealers] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState('');
  const [customDealer, setCustomDealer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const currentDealer = device?.installer || station?.sharedDealers?.[0]?.dealerAccount || '';

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccessMsg('');
      setSelectedDealer(currentDealer || 'none');
      setCustomDealer('');
      loadDealers();
    }
  }, [isOpen, station, device]);

  const loadDealers = async () => {
    try {
      setLoadingDealers(true);
      const res = await monitoringService.getDealersList();
      if (res?.dealers) {
        setDealers(res.dealers);
      }
    } catch (e) {
      console.warn('Lỗi tải danh sách đại lý:', e.message);
    } finally {
      setLoadingDealers(false);
    }
  };

  if (!isOpen || (!station && !device)) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    let finalDealer = selectedDealer;
    if (selectedDealer === 'custom') {
      if (!customDealer.trim()) {
        setError('Vui lòng nhập Mã Đại Lý hoặc Email của đại lý mới!');
        return;
      }
      finalDealer = customDealer.trim().toLowerCase();
    }

    try {
      setSubmitting(true);
      const res = await monitoringService.reassignDealer({
        stationId: station?.stationId,
        deviceId: device?.deviceId || device?.serialNumber,
        newDealerAccount: finalDealer
      });

      if (res.success) {
        setSuccessMsg(res.message || 'Cập nhật đại lý quản lý thành công!');
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1200);
      } else {
        setError(res.message || 'Lỗi khi thay đổi đại lý');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in font-['Plus_Jakarta_Sans',sans-serif]">
      <div className={`w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] relative transition-colors duration-300 ${
        isDark ? 'bg-[#0f172a] border border-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-900 shadow-2xl'
      }`}>
        
        {/* Header */}
        <div className={`p-4 sm:p-5 border-b flex items-start justify-between ${
          isDark ? 'border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-[#101827]' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0 pr-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-500 shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
                <span>Phân Bổ / Đổi Đại Lý Quản Lý</span>
              </h2>
              <p className={`text-[11px] sm:text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5 truncate`}>
                Chỉ định hoặc thay đổi Đại lý cấp 2 phụ trách giám sát & cấu hình Inverter.
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar flex-1">
          
          {/* Thông tin trạm / thiết bị đang chọn */}
          <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-[#0b101e] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Trạm / Thiết Bị:</span>
              <span className="font-mono font-bold text-cyan-500">ID: {station?.stationId || device?.deviceId}</span>
            </div>
            <div className="flex items-center gap-2">
              {device ? <Cpu className="w-4 h-4 text-amber-500" /> : <Zap className="w-4 h-4 text-amber-500" />}
              <span className={`font-extrabold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {device ? `Inverter SN: ${device.serialNumber || device.deviceId}` : station?.stationName}
              </span>
            </div>
            {station && device && (
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
                Thuộc trạm: <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>{station.stationName}</strong>
              </p>
            )}
          </div>

          {/* Đại lý hiện tại */}
          <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50/80 border-slate-200'
          }`}>
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Đại lý phụ trách hiện tại:</span>
            <span className={`font-bold font-mono px-2 py-0.5 rounded border ${
              currentDealer 
                ? isDark ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                : isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-300'
            }`}>
              {currentDealer ? `@${currentDealer}` : '👑 Tổng quản lý trực tiếp'}
            </span>
          </div>

          {/* Chọn Đại lý mới */}
          <div className="space-y-2">
            <label className={`block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Chọn Đại Lý Quản Lý Mới *
            </label>

            <select
              value={selectedDealer}
              onChange={(e) => setSelectedDealer(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none transition cursor-pointer ${
                isDark 
                  ? 'bg-slate-950 border-slate-800 text-white focus:border-cyan-500' 
                  : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
              }`}
            >
              <option value="none">-- 👑 Bỏ gán / Thu hồi về Tổng quản lý trực tiếp --</option>
              {dealers.map((d) => (
                <option key={d.account} value={d.account}>
                  🏢 {d.userName} (@{d.account}) {d.company ? `- ${d.company}` : ''}
                </option>
              ))}
              <option value="custom">+ 🔍 Nhập mã hoặc tài khoản đại lý khác...</option>
            </select>
          </div>

          {/* Ô nhập tùy chỉnh nếu chọn custom */}
          {selectedDealer === 'custom' && (
            <div className="space-y-1.5 animate-fade-in">
              <label className={`block text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Nhập chính xác Tài khoản / Email / Mã Đại Lý:
              </label>
              <input
                type="text"
                required
                value={customDealer}
                onChange={(e) => setCustomDealer(e.target.value)}
                placeholder="VD: newtech.sg, DL_TUANSOLAR, thodien_mientay..."
                className={`w-full px-3.5 py-2 rounded-xl border text-xs font-mono font-bold focus:outline-none transition ${
                  isDark 
                    ? 'bg-slate-950 border-slate-800 text-cyan-400 placeholder-slate-600 focus:border-cyan-500' 
                    : 'bg-white border-slate-300 text-cyan-700 placeholder-slate-400 focus:border-cyan-500'
                }`}
              />
            </div>
          )}

          {/* Thông báo lỗi / thành công */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
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
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-amber-400 hover:from-cyan-400 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang cập nhật...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Xác Nhận Chuyển Đại Lý</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
