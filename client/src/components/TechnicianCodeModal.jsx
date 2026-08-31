import React, { useState, useEffect } from 'react';
import { 
  KeyRound, Plus, Trash2, Copy, Check, ShieldCheck, 
  Wrench, Users, Sparkles, X, AlertCircle, RefreshCw 
} from 'lucide-react';
import { authService } from '../services/api';

export default function TechnicianCodeModal({ isOpen, onClose }) {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedCode, setCopiedCode] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadCodes();
    }
  }, [isOpen]);

  const loadCodes = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await authService.getTechnicianCodes();
      if (res.success) {
        setCodes(res.codes || []);
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi tải danh sách mã kỹ thuật viên');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCode = async (e) => {
    e.preventDefault();
    if (!newCode.trim()) return;

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      const res = await authService.createTechnicianCode({
        code: newCode.trim().toUpperCase(),
        name: newName.trim() || `Mã Kỹ Thuật Viên ${newCode.trim().toUpperCase()}`
      });

      if (res.success) {
        setSuccess(`Đã tạo thành công mã [${res.data.code}]!`);
        setNewCode('');
        setNewName('');
        await loadCodes();
      } else {
        setError(res.message || 'Không thể tạo mã');
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi tạo mã kỹ thuật viên');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCode = async (code) => {
    if (window.confirm(`Bạn có chắc chắn muốn hủy / xóa mã [${code}] không?`)) {
      try {
        setError('');
        const res = await authService.deleteTechnicianCode(code);
        if (res.success) {
          await loadCodes();
        } else {
          setError(res.message || 'Xóa mã thất bại');
        }
      } catch (err) {
        setError(err.message || 'Lỗi khi xóa mã');
      }
    }
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-[#0b101e] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl shadow-cyan-500/10 space-y-6 relative max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-amber-500/20 border border-cyan-500/40 text-cyan-400">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">Quản Lý Mã Kỹ Thuật Viên / Thợ</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Master
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Cấp phát mã kích hoạt để Kỹ thuật viên / Thợ tự động đăng ký quyền Kỹ Thuật (Installer).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Form Tạo Mã Mới */}
        <form onSubmit={handleCreateCode} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Tạo Thêm Mã Kỹ Thuật Viên Mới</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Mã kích hoạt (Code) *
              </label>
              <input
                type="text"
                required
                placeholder="VD: KT_HANOI, THODIEN_SG..."
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-amber-400 placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Tên đội ngũ / Ghi chú
              </label>
              <input
                type="text"
                placeholder="VD: Đội Kỹ Thuật Lắp Đặt Miền Trung"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={submitting || !newCode.trim()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>Tạo & Kích Hoạt Mã</span>
            </button>
          </div>
        </form>

        {/* Danh Sách Mã Đang Hoạt Động */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Danh Sách Mã Kỹ Thuật Viên Đang Hoạt Động ({codes.length})</span>
            <button
              type="button"
              onClick={loadCodes}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Làm mới</span>
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-500 text-xs">Đang tải danh sách mã...</div>
          ) : codes.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">Chưa có mã kỹ thuật viên nào được tạo.</div>
          ) : (
            <div className="space-y-2.5">
              {codes.map((item) => (
                <div
                  key={item.code}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-black text-sm text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2.5 py-0.5 rounded-lg">
                        {item.code}
                      </span>
                      <span className="text-xs font-bold text-slate-200">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-cyan-400" />
                        Đã dùng: <strong className="text-white">{item.usageCount || 0}</strong> lần
                      </span>
                      {item.createdAt && (
                        <span>• Ngày tạo: {new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(item.code)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 hover:border-cyan-500/40 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                      title="Copy mã để gửi cho Thợ qua Zalo"
                    >
                      {copiedCode === item.code ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Đã Copy</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Mã</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteCode(item.code)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition cursor-pointer"
                      title="Xóa mã này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span>💡 Khi Thợ / Kỹ thuật viên nhập mã này lúc đăng ký, hệ thống tự động cấp quyền <strong>Kỹ Thuật Viên (userType: 2)</strong>.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
