import React, { useState, useEffect } from 'react';
import { 
  X, Share2, Users, ShieldCheck, Check, AlertCircle, CheckCircle2, 
  Trash2, UserCheck, Sliders, Eye, RefreshCw, Mail, User, Building,
  ArrowRight, Shield, Zap, Info, Lock
} from 'lucide-react';
import { monitoringService } from '../services/api';

export default function ShareStationModal({ isOpen, station, onClose, onShared }) {
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

      const res = await monitoringService.shareStation({
        stationId: station.stationId,
        dealerIdentifier: dealerIdentifier.trim(),
        permissions
      });

      if (res.success) {
        setSuccessMsg(res.message || 'Đã chia sẻ quyền quản trị trạm cho đại lý thành công!');
        setDealerIdentifier('');
        await loadShares();
        if (onShared) onShared();
      } else {
        setError(res.message || 'Không tìm thấy Đại Lý hoặc không thể chia sẻ quyền.');
      }
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi kết nối máy chủ.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeShare = async (dealerAccount) => {
    if (!window.confirm(`Bạn có chắc chắn muốn thu hồi quyền truy cập và cài đặt của đại lý [${dealerAccount}] đối với trạm này?`)) {
      return;
    }

    try {
      setRevokingAccount(dealerAccount);
      setError('');
      setSuccessMsg('');

      const res = await monitoringService.unshareStation({
        stationId: station.stationId,
        dealerAccount
      });

      if (res.success) {
        setSuccessMsg(res.message || 'Đã thu hồi quyền thành công!');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800/80 flex items-start justify-between bg-gradient-to-r from-slate-900/90 via-slate-900 to-[#101827]">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-teal-500/20 to-amber-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-lg shadow-cyan-500/10">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>Chia Sẻ Trạm Cho Đại Lý</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Ủy quyền cho Đại lý lắp đặt theo dõi sản lượng và cài đặt thông số biến tần từ xa.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung Scroll */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 custom-scrollbar flex-1">
          
          {/* Thông tin trạm đang chia sẻ */}
          <div className="bg-[#0b101e] border border-slate-800/90 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="font-extrabold text-white text-sm">{station.stationName}</span>
                <span className="text-[11px] font-mono font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md">
                  ID: {station.stationId}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {station.address || 'Việt Nam'} • Công suất: <strong className="text-amber-400 font-mono">{station.installedCapacity || `${station.capacityKw || 12} kWp`}</strong>
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-500 block">Số thiết bị Inverter</span>
              <span className="text-xs font-bold text-cyan-300 font-mono">
                {(station.devices && station.devices.length) || 1} Thiết bị
              </span>
            </div>
          </div>

          {/* Form Nhập Đại Lý (Tuyệt đối không có gợi ý) */}
          <form onSubmit={handleShareSubmit} className="space-y-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-cyan-400" />
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
                  className="w-full px-3.5 py-2.5 bg-slate-950/90 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none transition shadow-inner font-mono font-medium"
                />
              </div>

              {/* Thông báo bảo mật kinh doanh */}
              <div className="flex items-start gap-2 text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
                <Lock className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
                <span><strong>Bảo mật thông tin:</strong> Vui lòng nhập chính xác 100% Mã Đại Lý hoặc Email do đơn vị lắp đặt cung cấp để cấp quyền quản trị trạm.</span>
              </div>
            </div>

            {/* Lựa chọn phân quyền */}
            <div className="space-y-2 pt-2 border-t border-slate-800/60">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Phân quyền cho Đại lý:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition ${
                  allowView ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}>
                  <input
                    type="checkbox"
                    checked={allowView}
                    onChange={(e) => setAllowView(e.target.checked)}
                    className="mt-0.5 accent-cyan-500 rounded cursor-pointer"
                  />
                  <div>
                    <div className="font-bold text-xs flex items-center gap-1.5 text-white">
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Quyền Giám Sát Viễn Trắc</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Xem sơ đồ luồng điện, sản lượng ngày/tháng và viễn trắc Pin Lithium.
                    </p>
                  </div>
                </label>

                <label className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition ${
                  allowConfig ? 'bg-amber-500/10 border-amber-500/40 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}>
                  <input
                    type="checkbox"
                    checked={allowConfig}
                    onChange={(e) => setAllowConfig(e.target.checked)}
                    className="mt-0.5 accent-amber-500 rounded cursor-pointer"
                  />
                  <div>
                    <div className="font-bold text-xs flex items-center gap-1.5 text-white">
                      <Sliders className="w-3.5 h-3.5 text-amber-400" />
                      <span>Quyền Cài Đặt & Cấu Hình</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Cho phép Đại lý điều chỉnh tham số biến tần Inverter từ xa khi cần bảo hành.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Thông báo lỗi / thành công */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
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
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Đại Lý Đã Được Ủy Quyền ({shares.length})</span>
              </h3>
              <button
                type="button"
                onClick={loadShares}
                className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${sharesLoading ? 'animate-spin' : ''}`} />
                <span>Làm mới</span>
              </button>
            </div>

            {sharesLoading ? (
              <div className="py-6 text-center text-xs text-slate-500">Đang tải danh sách...</div>
            ) : shares.length === 0 ? (
              <div className="bg-[#0b101e] border border-slate-800 rounded-2xl p-6 text-center space-y-2">
                <Shield className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 font-medium">Trạm này chưa được chia sẻ cho đại lý nào.</p>
                <p className="text-[11px] text-slate-500">
                  Nhập mã hoặc email đại lý ở trên để cấp quyền theo dõi và bảo hành biến tần.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {shares.map((sh) => (
                  <div
                    key={sh.shareId || sh.dealerAccount}
                    className="bg-[#0b101e] border border-slate-800/90 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md hover:border-slate-700 transition"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xs shrink-0">
                        {sh.dealerName ? sh.dealerName.charAt(0).toUpperCase() : 'D'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-white text-xs">{sh.dealerName || sh.dealerAccount}</h4>
                          <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                            {sh.dealerAccount}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-slate-400 font-medium">
                          {sh.dealerEmail && <span>📧 {sh.dealerEmail}</span>}
                          {sh.dealerCompany && <span>• 🏢 {sh.dealerCompany}</span>}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          {sh.permissions?.includes('VIEW') && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              ✓ Xem viễn trắc
                            </span>
                          )}
                          {sh.permissions?.includes('CONFIG') && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
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
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:border-rose-500/50 transition text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Chủ nhà có thể thu hồi quyền bất kỳ lúc nào để ngắt kết nối cấu hình.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}
