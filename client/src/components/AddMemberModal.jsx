import React, { useState } from 'react';
import { X, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { groupService } from '../services/api';

export default function AddMemberModal({ isOpen, onClose, group, customers = [], onSuccess }) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen || !group) return null;

  // Filter customers who are not yet in this group
  const availableCustomers = customers.filter(c => c.groupId !== group.groupId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUserId) {
      return setError('Vui lòng chọn một khách hàng');
    }

    setLoading(true);
    setError('');
    try {
      const res = await groupService.addMember(group.groupId, selectedUserId);
      if (res.success) {
        setSuccessMsg(res.message || 'Đã thêm khách hàng vào nhóm thành công!');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1000);
      } else {
        setError(res.message || 'Lỗi thêm khách hàng vào nhóm');
      }
    } catch (err) {
      setError(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">Thêm Thành Viên Vào Nhóm</h3>
              <p className="text-xs text-slate-400">Nhóm: <span className="text-cyan-400 font-semibold">{group.groupName}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Chọn Khách hàng *</label>
            {availableCustomers.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 text-center">
                Tất cả khách hàng hiện đã có trong nhóm này.
              </div>
            ) : (
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="">-- Chọn khách hàng --</option>
                {availableCustomers.map((c) => (
                  <option key={c.userId} value={c.userId}>
                    {c.userName} ({c.account}) {c.cellphone ? `- ${c.cellphone}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || availableCustomers.length === 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              {loading ? 'Đang thêm...' : 'Gán Vào Nhóm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
