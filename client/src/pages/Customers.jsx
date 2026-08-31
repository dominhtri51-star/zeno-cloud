import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Search, KeyRound, Trash2, Edit3, Shield, Mail, Phone, RefreshCw, UserCheck } from 'lucide-react';
import { customerService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import CreateCustomerModal from '../components/CreateCustomerModal';
import ResetPasswordModal from '../components/ResetPasswordModal';
import AssignTechnicianCodeModal from '../components/AssignTechnicianCodeModal';

export default function Customers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const isMaster = user?.userType === 1;
  const isInstaller = user?.userType === 2;

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTechForCode, setSelectedTechForCode] = useState(null);
  const [isAssignTechCodeOpen, setIsAssignTechCodeOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isResetPwdOpen, setIsResetPwdOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const custRes = await customerService.getCustomers();
      setCustomers(custRes.customers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (customer) => {
    if (!isMaster) {
      alert('Chỉ có Tổng Phân Phối (Master Admin) mới có quyền xóa tài khoản!');
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn hủy / xóa tài khoản ${customer.userName || customer.account}?`)) {
      try {
        const res = await customerService.deleteCustomer(customer.userId);
        if (res.success) {
          alert('Đã xóa tài khoản thành công!');
          loadData();
        }
      } catch (e) {
        alert(e.message || 'Lỗi khi xóa tài khoản');
      }
    }
  };

  // Filter logic
  const filteredCustomers = customers.filter((c) => {
    const matchSearch =
      (c.userName && c.userName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.account && c.account.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.cellphone && c.cellphone.includes(searchQuery));

    const matchRole =
      roleFilter === 'ALL' ||
      (roleFilter === 'OWNER' && c.userType === 3) ||
      (roleFilter === 'DEALER' && c.userType === 2);

    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-['Plus_Jakarta_Sans',sans-serif] animate-fade-in pb-16">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0b101e] border border-slate-800/90 p-5 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            {isInstaller ? (
              <>
                <UserCheck className="w-6 h-6 text-cyan-400" />
                <span>Khách Hàng Phụ Trách</span>
              </>
            ) : (
              <>
                <Users className="w-6 h-6 text-cyan-400" />
                <span>Quản Lý Khách Hàng & Đại Lý Lắp Đặt</span>
              </>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isInstaller
              ? 'Danh sách các khách hàng và trạm Inverter được phân bổ hoặc ủy quyền cho đại lý của bạn.'
              : 'Cấp tài khoản người dùng mới, gán quyền và quản lý toàn bộ danh sách khách hàng của hệ thống.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            title="Làm mới"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {isMaster && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Thêm Tài Khoản Mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#0b101e] border border-slate-800/90 p-4 rounded-2xl flex flex-col md:flex-row items-center gap-3 justify-between shadow-md">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Tìm theo tên, account, email, SĐT..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="DEALER">🏢 Cấp 2: Đại Lý (Dealer)</option>
            <option value="OWNER">🏠 Cấp 3: Người Tiêu Dùng Cuối (End-User)</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-[#0b101e] border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4">Tài Khoản & Tên Đơn Vị</th>
                <th className="p-4">Thông Tin Liên Hệ</th>
                <th className="p-4">Cấp Vai Trò</th>
                <th className="p-4">Số Trạm Phụ Trách</th>
                <th className="p-4">Ngày Tạo</th>
                <th className="p-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    Đang tải danh sách tài khoản...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    {isInstaller
                      ? 'Chưa có khách hàng nào được phân bổ cho đại lý của bạn. Khách hàng sẽ xuất hiện khi được gán thiết bị hoặc khi Người tiêu dùng cuối chia sẻ quyền quản trị trạm.'
                      : 'Không tìm thấy tài khoản nào phù hợp với bộ lọc.'}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.userId} className="hover:bg-slate-850/50 transition">
                    <td className="p-4">
                      <div className="font-bold text-slate-200 text-sm">{c.userName || c.account}</div>
                      <div className="text-[11px] text-cyan-400 font-mono mt-0.5">@{c.account}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        {c.email || 'Chưa liên kết'}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 mt-1">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        {c.cellphone || 'Chưa liên kết'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1.5">
                        <span
                          className={`px-2.5 py-1 rounded-lg font-bold inline-flex items-center gap-1 text-[11px] ${
                            c.userType === 2
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : c.userType === 1
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          {c.userType === 1 ? '👑 Tổng Phân Phối' : c.userType === 2 ? '🏢 Đại Lý' : '🏠 Người Tiêu Dùng Cuối'}
                        </span>

                        {/* Mã Kích Hoạt Của Đại Lý */}
                        {c.userType === 2 && (
                          <div className="flex items-center gap-1">
                            <span 
                              className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded cursor-pointer hover:bg-amber-500/20 transition flex items-center gap-1"
                              title="Bấm để sao chép mã đại lý này"
                              onClick={() => {
                                navigator.clipboard.writeText(c.technicianCode || c.account);
                                alert(`Đã sao chép mã đại lý [${c.technicianCode || c.account}]!`);
                              }}
                            >
                              <KeyRound className="w-3 h-3 text-amber-400" />
                              <span>Mã: {c.technicianCode || c.account}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {c.userType === 1 ? (
                        <div>
                          <span className="font-bold text-cyan-400 font-mono text-xs flex items-center gap-1.5">
                            👑 Quản lý toàn bộ {c.deviceCount || 1} Inverter
                          </span>
                          <span className="text-[10px] text-slate-400">({c.stationCount || 1} trạm trên hệ thống)</span>
                        </div>
                      ) : c.devices && c.devices.length > 0 ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold text-[10px]">
                              ⚡ {c.devices.length} Inverter
                            </span>
                            <span className="text-[11px] text-slate-300 font-medium">{c.devices[0].stationName}</span>
                          </div>
                          {c.devices.map((d, idx) => (
                            <div key={idx} className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                              <span>SN: <span className="text-slate-200">{d.serialNumber || 'N/A'}</span></span>
                              {d.dtuCode && <span className="text-slate-500">| DTU: {d.dtuCode}</span>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">Chưa gắn thiết bị (0 Inverter)</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-400 font-mono text-[11px]">
                      {c.createdAt ? c.createdAt.slice(0, 10) : '2026-08-30'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Nút Cấp / Đổi Mã Kỹ Thuật Viên cho thợ này */}
                        {isMaster && c.userType === 2 && (
                          <button
                            onClick={() => {
                              setSelectedTechForCode(c);
                              setIsAssignTechCodeOpen(true);
                            }}
                            title={`Cấp / Đổi Mã Kỹ Thuật Viên cho @${c.account}`}
                            className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                            <span>Đổi Mã KTV</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedCustomer(c);
                            setIsResetPwdOpen(true);
                          }}
                          title="Đặt lại mật khẩu"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 border border-slate-700 transition cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                        {isMaster && c.userType !== 1 && (
                          <button
                            onClick={() => handleDelete(c)}
                            title="Xóa tài khoản"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cấp Tài Khoản */}
      <CreateCustomerModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={loadData}
      />

      {/* Modal Đặt Lại Mật Khẩu */}
      <ResetPasswordModal
        isOpen={isResetPwdOpen}
        customer={selectedCustomer}
        onClose={() => {
          setIsResetPwdOpen(false);
          setSelectedCustomer(null);
        }}
        onSuccess={loadData}
      />

      {/* Modal Cấp / Đổi Mã Kỹ Thuật Viên Cho Từng Tài Khoản Thợ */}
      <AssignTechnicianCodeModal
        isOpen={isAssignTechCodeOpen}
        customer={selectedTechForCode}
        onClose={() => {
          setIsAssignTechCodeOpen(false);
          setSelectedTechForCode(null);
        }}
        onSuccess={loadData}
      />
    </div>
  );
}
