import React, { useState, useEffect } from 'react';
import { 
  X, Share2, Users, ShieldCheck, Check, AlertCircle, CheckCircle2, 
  Trash2, UserCheck, Sliders, Eye, RefreshCw, Mail, User, Building,
  ArrowRight, Shield, Zap, Info, Lock
} from 'lucide-react';
import { monitoringService } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

export default function ShareStationModal({ isOpen, station, onClose, onShared }) {
  const { isDark } = useTheme();
  const [dealerIdentifier, setDealerIdentifier] = useState('');
  const [allowView, setAllowView] = useState(true);
  const [allowConfig, setAllowConfig] = useState(true);
  const [loading, setLoading] = useState(false);
  const [sharesLoading, setSharesLoading] = useState(false);
  const [shares, setShares] = useState([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [revokingAccount, setRevokingAccount] = useState('');

  useEffect(() => {
    if (isOpen && station) {
      setError('');
      setSuccessMsg('');
      setDealerIdentifier('');
      loadShares();
    }
  }, [isOpen, station]);

  const loadShares = async () => {
    if (!station?.stationId) return;
    try {
      setSharesLoading(true);
      const res = await monitoringService.getStationShares(station.stationId);
      const list = res?.shares || (res?.data?.shares) || [];
      setShares(list);
    } catch (e) {
      console.warn('Lỗi tải danh sách chia sẻ:', e.message);
    } finally {
      setSharesLoading(false);
    }
  };

  if (!isOpen || !station) return null;

  const handleShareSubmit = async (e) => {
    e.preventDefault();
    if (!dealerIdentifier.trim()) {
      setError('Vui lòng nhập chính xác Mã Đại Lý (Account ID), Mã Kích Hoạt hoặc Email của đại lý.');
      return;
    }

    const permissions = [];
    if (allowView) permissions.push('VIEW');
    if (allowConfig) permissions.push('CONFIG');

    try {
      setLoading(true);
      setError('');
      setSuccessMsg('');

      const res = await monitoringService.shareStation(station.stationId, {
        dealerIdentifier: dealerIdentifier.trim(),
        permissions
      });

      if (res.success) {
        setSuccessMsg(res.message || 'Chia sẻ quyền quản trị cho đại lý thành công!');
        setDealerIdentifier('');
        await loadShares();
        if (onShared) onShared();
      } else {
        setError(res.message || 'Lỗi khi chia sẻ trạm cho đại lý.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Lỗi khi gửi yêu cầu chia sẻ');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeShare = async (dealerAccount) => {
    if (!window.confirm(`Bạn có chắc chắn muốn thu hồi quyền truy cập trạm của đại lý [@${dealerAccount}] không?`)) {
      return;
    }

    try {
      setRevokingAccount(dealerAccount);
      setError('');
      setSuccessMsg('');

      const res = await monitoringService.revokeStationShare(station.stationId, dealerAccount);
      if (res.success) {
        setSuccessMsg(res.message || 'Đã thu hồi quyền quản trị của đại lý thành công!');
        await loadShares();
        if (onShared) onShared();
      } else {
        setError(res.message || 'Lỗi khi thu hồi quyền đại lý.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Lỗi khi thu hồi quyền');
    } finally {
      setRevokingAccount('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in font-['Plus_Jakarta_Sans',sans-serif]">
      <div className={`w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] relative transition-colors duration-300 ${
        isDark ? 'bg-[#0f172a] border border-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-900 shadow-2xl'
      }`}>
        
        {/* Header */}
        <div className={`p-4 sm:p-6 border-b flex items-start justify-between ${
          isDark ? 'border-slate-800/80 bg-gradient-to-r from-slate-900/90 via-slate-900 to-[#101827]' : 'border-slate-200 bg-slate-50/90'
        }`}>
          <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0 pr-2">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-teal-500/20 to-amber-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-500 shrink-0 shadow-lg shadow-cyan-500/10">
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
                <span>Chia Sẻ Trạm Cho Đại Lý</span>
              </h2>
              <p className={`text-[11px] sm:text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5 truncate`}>
                Ủy quyền cho Đại lý lắp đặt theo dõi sản lượng và cài đặt thông số biến tần từ xa.
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

        {/* Nội dung Scroll */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 custom-scrollbar flex-1">
          
          {/* Thông tin trạm đang chia sẻ */}
          <div className={`border rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isDark ? 'bg-[#0b101e] border-slate-800/90' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className={`font-extrabold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{station.stationName}</span>
                <span className={`text-[11px] font-mono font-bold border px-2 py-0.5 rounded-md ${
                  isDark ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' : 'text-cyan-700 bg-cyan-50 border-cyan-200'
                }`}>
                  ID: {station.stationId}
                </span>
              </div>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {station.address || 'Việt Nam'} • Công suất: <strong className="text-amber-500 font-mono">{station.installedCapacity || `${station.capacityKw || 12} kWp`}</strong>
              </p>
            </div>

            <div className="text-right">
              <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'} block`}>Số thiết bị Inverter</span>
              <span className="text-xs font-bold text-cyan-500 font-mono">
                {(station.devices && station.devices.length) || 1} Thiết bị
              </span>
            </div>
          </div>

          {/* Form Nhập Đại Lý (Tuyệt đối không có gợi ý) */}
          <form onSubmit={handleShareSubmit} className={`space-y-4 border rounded-2xl p-3.5 sm:p-5 ${
            isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-slate-50/80 border-slate-200'
          }`}>
            <div className="space-y-2">
              <label className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'} flex items-center justify-between`}>
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-cyan-500" />
                  Mã Đại Lý (Account ID), Mã Kích Hoạt hoặc Email Đại Lý: *
                </span>
              </label>

              <div className="relative">
                <input
                  type="text"
                  required
                  value={dealerIdentifier}
                  onChange={(e) => setDealerIdentifier(e.target.value)}
                  placeholder="Nhập chính xác Mã Đại Lý, Mã Kích Hoạt (VD: DL_...) hoặc Email của Đại Lý"
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-xs focus:outline-none transition font-mono font-medium ${
                    isDark 
                      ? 'bg-slate-950/90 border-slate-800 text-white placeholder-slate-600 focus:border-cyan-500' 
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-500'
                  }`}
                />
              </div>

              {/* Thông báo bảo mật kinh doanh */}
              <div className={`flex items-start gap-2 text-[11px] border p-2.5 rounded-xl ${
                isDark ? 'text-amber-300/90 bg-amber-500/10 border-amber-500/20' : 'text-amber-800 bg-amber-50 border-amber-200'
              }`}>
                <Lock className="w-3.5 h-3.5 shrink-0 text-amber-500 mt-0.5" />
                <span><strong>Bảo mật thông tin:</strong> Vui lòng nhập chính xác 100% Mã Đại Lý hoặc Email do đơn vị lắp đặt cung cấp để cấp quyền quản trị trạm.</span>
              </div>
            </div>

            {/* Lựa chọn phân quyền */}
            <div className={`space-y-2 pt-2 border-t ${isDark ? 'border-slate-800/60' : 'border-slate-200'}`}>
              <span className={`text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider block`}>
                Phân quyền cho Đại lý:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition ${
                  allowView 
                    ? isDark ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300' : 'bg-cyan-50 border-cyan-300 text-cyan-800' 
                    : isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
                }`}>
                  <input
                    type="checkbox"
                    checked={allowView}
                    onChange={(e) => setAllowView(e.target.checked)}
                    className="mt-0.5 accent-cyan-500 rounded cursor-pointer"
                  />
                  <div>
                    <div className={`font-bold text-xs flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      <Eye className="w-3.5 h-3.5 text-cyan-500" />
                      <span>Quyền Giám Sát Viễn Trắc</span>
                    </div>
                    <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
                      Xem sơ đồ luồng điện, sản lượng ngày/tháng và viễn trắc Pin Lithium.
                    </p>
                  </div>
                </label>

                <label className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition ${
                  allowConfig 
                    ? isDark ? 'bg-amber-500/10 border-amber-500/40 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-800' 
                    : isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
                }`}>
                  <input
                    type="checkbox"
                    checked={allowConfig}
                    onChange={(e) => setAllowConfig(e.target.checked)}
                    className="mt-0.5 accent-amber-500 rounded cursor-pointer"
                  />
                  <div>
                    <div className={`font-bold text-xs flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      <Sliders className="w-3.5 h-3.5 text-amber-500" />
                      <span>Quyền Cài Đặt & Cấu Hình</span>
                    </div>
                    <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
                      Cho phép Đại lý điều chỉnh tham số biến tần Inverter từ xa khi cần bảo hành.
                    </p>
                  </div>
                </label>
              </div>
            </div>

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

            {/* Nút Thực Thi */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading || !dealerIdentifier.trim()}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-amber-400 hover:from-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang cấp quyền...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Xác Nhận Chia Sẻ Quyền Cho Đại Lý</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Danh Sách Đại Lý Đang Được Cấp Quyền (Active Shared List) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'} uppercase tracking-wider flex items-center gap-2`}>
                <Users className="w-4 h-4 text-cyan-500" />
                <span>Đại Lý Đã Được Ủy Quyền ({shares.length})</span>
              </h3>
              <button
                type="button"
                onClick={loadShares}
                className={`text-[11px] ${isDark ? 'text-slate-400 hover:text-cyan-300' : 'text-slate-500 hover:text-cyan-600'} flex items-center gap-1 transition cursor-pointer`}
              >
                <RefreshCw className={`w-3 h-3 ${sharesLoading ? 'animate-spin' : ''}`} />
                <span>Làm mới</span>
              </button>
            </div>

            {sharesLoading ? (
              <div className="py-6 text-center text-xs text-slate-500">Đang tải danh sách...</div>
            ) : shares.length === 0 ? (
              <div className={`border rounded-2xl p-6 text-center space-y-2 ${
                isDark ? 'bg-[#0b101e] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <Shield className="w-8 h-8 text-slate-400 mx-auto" />
                <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Trạm này chưa được chia sẻ cho đại lý nào.</p>
                <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Nhập mã hoặc email đại lý ở trên để cấp quyền theo dõi và bảo hành biến tần.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {shares.map((sh) => (
                  <div
                    key={sh.shareId || sh.dealerAccount}
                    className={`border rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm transition ${
                      isDark ? 'bg-[#0b101e] border-slate-800/90 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-500 font-bold text-xs shrink-0">
                        {sh.dealerName ? sh.dealerName.charAt(0).toUpperCase() : 'D'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`font-extrabold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>{sh.dealerName || sh.dealerAccount}</h4>
                          <span className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded border ${
                            isDark ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                          }`}>
                            {sh.dealerAccount}
                          </span>
                        </div>
                        <div className={`flex flex-wrap items-center gap-2 mt-1 text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} font-medium`}>
                          {sh.dealerEmail && <span>📧 {sh.dealerEmail}</span>}
                          {sh.dealerCompany && <span>• 🏢 {sh.dealerCompany}</span>}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          {sh.permissions?.includes('VIEW') && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                              ✓ Xem viễn trắc
                            </span>
                          )}
                          {sh.permissions?.includes('CONFIG') && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                              ✓ Cài đặt Inverter
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => handleRevokeShare(sh.dealerAccount)}
                        disabled={revokingAccount === sh.dealerAccount}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 hover:border-rose-500/50 transition text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Thu hồi toàn bộ quyền truy cập của đại lý này"
                      >
                        {revokingAccount === sh.dealerAccount ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        <span>Thu Hồi Quyền</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className={`p-3.5 sm:p-4 border-t flex items-center justify-between text-xs ${
          isDark ? 'border-slate-800 bg-slate-950/80 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
        }`}>
          <div className="flex items-center gap-1.5 text-[11px]">
            <Info className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
            <span>Chủ nhà có thể thu hồi quyền bất kỳ lúc nào để ngắt kết nối cấu hình.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
            }`}
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}
