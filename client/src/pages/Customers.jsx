import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Search, KeyRound, Trash2, Edit3, Shield, Mail, Phone, RefreshCw, UserCheck, Eye, EyeOff, Copy } from 'lucide-react';
import { customerService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import CreateCustomerModal from '../components/CreateCustomerModal';
import ResetPasswordModal from '../components/ResetPasswordModal';
import AssignTechnicianCodeModal from '../components/AssignTechnicianCodeModal';
import SafeDeleteModal from '../components/SafeDeleteModal';

export default function Customers() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [revealedPasswords, setRevealedPasswords] = useState({});

  const isMaster = user?.userType === 1 || user?.account === 'sungo.vn' || user?.account === 'sungo123';
  const isInstaller = user?.userType === 2 && !isMaster;

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTechForCode, setSelectedTechForCode] = useState(null);
  const [isAssignTechCodeOpen, setIsAssignTechCodeOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isResetPwdOpen, setIsResetPwdOpen] = useState(false);

  // 🔒 Modal Xóa Tài Khoản An Toàn (Master nhập mật khẩu sungo123)
  const [isSafeDeleteOpen, setIsSafeDeleteOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [syncingAccounts, setSyncingAccounts] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const togglePasswordVisibility = (key) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const copyPasswordText = (text, label) => {
    navigator.clipboard.writeText(text);
    alert(`Đã sao chép ${label}: ${text}`);
  };

  const handleSyncCloud = async (customer) => {
    const acc = customer.account;
    try {
      setSyncingAccounts((prev) => ({ ...prev, [acc]: true }));
      const res = await customerService.syncCloudCustomer(customer.userId || acc, { account: acc });
      alert(res.message || `Đã đồng bộ thành công trạm & thiết bị từ Cloud Hãng cho @${acc}!`);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Lỗi khi đồng bộ từ Cloud Hãng');
    } finally {
      setSyncingAccounts((prev) => ({ ...prev, [acc]: false }));
    }
  };

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

  const handleDeleteClick = (customer) => {
    if (!isMaster) {
      alert('Chỉ có Tổng Phân Phối (Master Admin) mới có quyền xóa tài khoản!');
      return;
    }
    setCustomerToDelete(customer);
    setIsSafeDeleteOpen(true);
  };

  const handleExecuteSafeDelete = async ({ adminPassword }) => {
    if (!customerToDelete) return;
    await customerService.deleteCustomer(customerToDelete.userId || customerToDelete.account, adminPassword);
    await loadData();
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
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isDark ? 'bg-[#0b101e] border-slate-800/90' : 'bg-white border-slate-200 shadow-sm'} border p-5 rounded-2xl shadow-xl transition-colors duration-300`}>
        <div>
          <h1 className={`text-xl sm:text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2.5`}>
            {isInstaller ? (
              <>
                <UserCheck className="w-6 h-6 text-cyan-500" />
                <span>Khách Hàng Phụ Trách</span>
              </>
            ) : (
              <>
                <Users className="w-6 h-6 text-cyan-500" />
                <span>Quản Lý Khách Hàng & Đại Lý Lắp Đặt</span>
              </>
            )}
          </h1>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
            {isInstaller
              ? 'Danh sách các khách hàng và trạm Inverter được phân bổ hoặc ủy quyền cho đại lý của bạn.'
              : 'Cấp tài khoản người dùng mới, gán quyền và quản lý toàn bộ danh sách khách hàng của hệ thống.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            title="Làm mới"
            className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'} border transition cursor-pointer`}
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
      <div className={`${isDark ? 'bg-[#0b101e] border-slate-800/90' : 'bg-white border-slate-200 shadow-sm'} border p-4 rounded-2xl flex flex-col md:flex-row items-center gap-3 justify-between shadow-md transition-colors duration-300`}>
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className={`w-4 h-4 absolute left-3 top-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder="Tìm theo tên, account, email, SĐT..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 ${isDark ? 'bg-slate-950/80 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-cyan-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-600'} border rounded-xl text-xs focus:outline-none transition`}
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className={`px-3.5 py-2 ${isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'} border rounded-xl text-xs font-bold focus:outline-none focus:border-cyan-500 cursor-pointer`}
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="DEALER">🏢 Cấp 2: Đại Lý (Dealer)</option>
            <option value="OWNER">🏠 Cấp 3: Người Tiêu Dùng Cuối (End-User)</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className={`${isDark ? 'bg-[#0b101e] border-slate-800/90' : 'bg-white border-slate-200 shadow-sm'} border rounded-2xl overflow-hidden shadow-xl transition-colors duration-300`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`${isDark ? 'bg-slate-900/90 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200'} uppercase text-[10px] font-bold tracking-wider border-b`}>
              <tr>
                <th className="p-4">Tài Khoản & Tên Đơn Vị</th>
                <th className="p-4">Thông Tin Liên Hệ</th>
                <th className="p-4">Cấp Vai Trò</th>
                <th className="p-4">Mật Khẩu Lưu Trữ (2 Lớp)</th>
                <th className="p-4">Số Trạm Phụ Trách</th>
                <th className="p-4">Ngày Tạo</th>
                <th className="p-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-200 text-slate-700'}`}>
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">
                    Đang tải danh sách tài khoản...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">
                    {isInstaller
                      ? 'Chưa có khách hàng nào được phân bổ cho đại lý của bạn. Khách hàng sẽ xuất hiện khi được gán thiết bị hoặc khi Người tiêu dùng cuối chia sẻ quyền quản trị trạm.'
                      : 'Không tìm thấy tài khoản nào phù hợp với bộ lọc.'}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.userId} className={`${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'} transition`}>
                    <td className="p-4">
                      <div className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'} text-sm`}>{c.userName || c.account}</div>
                      <div className="text-[11px] text-cyan-500 font-mono mt-0.5">@{c.account}</div>
                    </td>
                    <td className="p-4">
                      <div className={`flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <Mail className={`w-3.5 h-3.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                        {c.email || 'Chưa liên kết'}
                      </div>
                      <div className={`flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
                        <Phone className={`w-3.5 h-3.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                        {c.cellphone || 'Chưa liên kết'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1.5">
                        <span
                          className={`px-2.5 py-1 rounded-lg font-bold inline-flex items-center gap-1 text-[11px] ${
                            c.userType === 2
                              ? isDark ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-200'
                              : c.userType === 1
                              ? isDark ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                              : isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          {c.userType === 1 ? '👑 Tổng Phân Phối' : c.userType === 2 ? '🏢 Đại Lý' : '🏠 Người Tiêu Dùng Cuối'}
                        </span>

                        {/* Mã Kích Hoạt Của Đại Lý */}
                        {c.userType === 2 && (
                          <div className="flex items-center gap-1">
                            <span 
                              className={`text-[10px] font-mono font-bold ${isDark ? 'text-amber-400 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20' : 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100'} border px-1.5 py-0.5 rounded cursor-pointer transition flex items-center gap-1`}
                              title="Bấm để sao chép mã đại lý này"
                              onClick={() => {
                                navigator.clipboard.writeText(c.technicianCode || c.account);
                                alert(`Đã sao chép mã đại lý [${c.technicianCode || c.account}]!`);
                              }}
                            >
                              <KeyRound className="w-3 h-3 text-amber-500" />
                              <span>Mã: {c.technicianCode || c.account}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Cột Mật Khẩu Lưu Trữ 2 Lớp (Cloud Hãng & Zeno Cloud) */}
                    <td className="p-4">
                      <div className="space-y-1 text-[11px] font-mono">
                        {/* 1. Mật khẩu Máy Chủ Hãng */}
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] px-1.5 py-0.2 rounded ${isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'} font-bold`}>
                            🌐 Hãng:
                          </span>
                          <span className={`${isDark ? 'text-slate-300' : 'text-slate-700'} font-bold`}>
                            {revealedPasswords[`cloud_${c.userId}`] ? (c.cloudPassword || '123456') : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(`cloud_${c.userId}`)}
                            className="p-0.5 text-slate-400 hover:text-emerald-400 cursor-pointer"
                            title="Ẩn / Hiện Mật khẩu Hãng"
                          >
                            {revealedPasswords[`cloud_${c.userId}`] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyPasswordText(c.cloudPassword || '123456', 'Mật khẩu Hãng')}
                            className="p-0.5 text-slate-400 hover:text-emerald-400 cursor-pointer"
                            title="Sao chép"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>

                        {/* 2. Mật khẩu Zeno Cloud */}
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] px-1.5 py-0.2 rounded ${isDark ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'} font-bold`}>
                            ⚡ Zeno:
                          </span>
                          <span className={`${isDark ? 'text-slate-300' : 'text-slate-700'} font-bold`}>
                            {revealedPasswords[`zeno_${c.userId}`] ? (c.zenoPassword || 'sungo123') : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(`zeno_${c.userId}`)}
                            className="p-0.5 text-slate-400 hover:text-cyan-400 cursor-pointer"
                            title="Ẩn / Hiện Mật khẩu Zeno"
                          >
                            {revealedPasswords[`zeno_${c.userId}`] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyPasswordText(c.zenoPassword || 'sungo123', 'Mật khẩu Zeno')}
                            className="p-0.5 text-slate-400 hover:text-cyan-400 cursor-pointer"
                            title="Sao chép"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      {c.userType === 1 ? (
                        <div>
                          <span className="font-bold text-cyan-600 dark:text-cyan-400 font-mono text-xs flex items-center gap-1.5">
                            👑 Quản lý toàn bộ {c.deviceCount || 1} Inverter
                          </span>
                          <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>({c.stationCount || 1} trạm trên hệ thống)</span>
                        </div>
                      ) : c.devices && c.devices.length > 0 ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-md ${isDark ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-cyan-50 text-cyan-700 border-cyan-200'} border font-bold text-[10px]`}>
                              ⚡ {c.devices.length} Inverter
                            </span>
                            <span className={`text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'} font-medium`}>{c.devices[0].stationName}</span>
                          </div>
                          {c.devices.map((d, idx) => (
                            <div key={idx} className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} font-mono flex items-center gap-2`}>
                              <span>SN: <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{d.serialNumber || 'N/A'}</span></span>
                              {d.dtuCode && <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>| DTU: {d.dtuCode}</span>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">Chưa gắn thiết bị (0 Inverter)</span>
                      )}
                    </td>
                    <td className={`p-4 ${isDark ? 'text-slate-400' : 'text-slate-500'} font-mono text-[11px]`}>
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
                            className={`px-2 py-1 rounded-lg ${isDark ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'} border transition flex items-center gap-1 text-[11px] font-bold cursor-pointer`}
                          >
                            <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                            <span>Đổi Mã KTV</span>
                          </button>
                        )}

                        {isMaster && c.userType !== 1 && (
                          <button
                            onClick={() => handleSyncCloud(c)}
                            disabled={syncingAccounts[c.account]}
                            title={`Quét & Đồng bộ trạm, Inverter từ Cloud Hãng về cho @${c.account}`}
                            className={`px-2 py-1 rounded-lg ${isDark ? 'bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 border-slate-700' : 'bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 border-slate-200'} border transition cursor-pointer flex items-center gap-1 text-[11px] font-medium`}
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${syncingAccounts[c.account] ? 'animate-spin text-emerald-400' : 'text-emerald-500'}`} />
                            <span className="hidden xl:inline">{syncingAccounts[c.account] ? 'Đang quét...' : 'Đồng bộ Hãng'}</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedCustomer(c);
                            setIsResetPwdOpen(true);
                          }}
                          title="Đặt lại mật khẩu"
                          className={`p-1.5 rounded-lg ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-cyan-600 border-slate-200'} border transition cursor-pointer`}
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        {isMaster && c.userType !== 1 && (
                          <button
                            onClick={() => handleDeleteClick(c)}
                            title="Xóa tài khoản (yêu cầu mật khẩu sungo123)"
                            className={`p-1.5 rounded-lg ${isDark ? 'bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border-slate-700 hover:border-rose-500/30' : 'bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border-slate-200 hover:border-rose-200'} border transition cursor-pointer`}
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

      {/* 🔒 Modal Xóa Tài Khoản An Toàn (Yêu cầu mật khẩu sungo123) */}
      <SafeDeleteModal
        isOpen={isSafeDeleteOpen}
        onClose={() => setIsSafeDeleteOpen(false)}
        onConfirm={handleExecuteSafeDelete}
        title="Xác Nhận Xóa Tài Khoản"
        itemName={customerToDelete?.userName || customerToDelete?.account}
        itemId={customerToDelete?.userId || customerToDelete?.account}
        itemType="customer"
        isMaster={true}
        isDealer={false}
      />
    </div>
  );
}
