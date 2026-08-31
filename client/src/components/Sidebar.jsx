import React from 'react';
import { LayoutDashboard, Users, Layers, Zap, AlertTriangle, Settings, UserPlus, HelpCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar({ currentPage, onNavigate }) {
  const { user } = useAuth();
  const userType = Number(user?.userType || 3); // 1: Distributor, 2: Installer, 3: Homeowner

  // Menu tùy biến chính xác 100% theo từng vai trò
  let menuItems = [];
  let menuTitle = 'Menu Quản Trị Đại Lý';

  if (userType === 1) {
    // 👑 1. TỔNG PHÂN PHỐI (sungo.vn) - Full quyền
    menuTitle = '👑 TỔNG PHÂN PHỐI (sungo.vn)';
    menuItems = [
      { id: 'dashboard', label: 'Bảng Điều Khiển', icon: LayoutDashboard },
      { id: 'stations', label: 'Giám Sát Trạm & Kho Máy', icon: Zap },
      { id: 'customers', label: 'Quản Lý Đại Lý & Khách', icon: Users, badge: 'Full' },
      { id: 'alarms', label: 'Cảnh Báo & Sự Cố', icon: AlertTriangle },
      { id: 'public-register', label: 'Cổng Tự Đăng Ký', icon: UserPlus },
      { id: 'settings', label: 'Cài Đặt & Kết Nối API', icon: Settings },
    ];
  } else if (userType === 2) {
    // 🏢 2. ĐẠI LÝ (DEALER) - Quản lý trạm phụ trách & khách hàng của đại lý
    menuTitle = '🏢 MENU ĐẠI LÝ (DEALER)';
    menuItems = [
      { id: 'dashboard', label: 'Bảng Điều Khiển', icon: LayoutDashboard },
      { id: 'stations', label: 'Trạm Phụ Trách & Cấu Hình', icon: Zap },
      { id: 'customers', label: 'Khách Hàng Của Đại Lý', icon: Users },
      { id: 'alarms', label: 'Cảnh Báo & Sự Cố', icon: AlertTriangle },
      { id: 'settings', label: 'Cài Đặt & Đơn Giá', icon: Settings },
    ];
  } else {
    // 🏠 3. NGƯỜI TIÊU DÙNG CUỐI (END-USER) - Giám sát điện mặt trời & pin lưu trữ gia đình
    menuTitle = '🏠 NGƯỜI TIÊU DÙNG CUỐI';
    menuItems = [
      { id: 'dashboard', label: 'Bảng Điều Khiển Trạm', icon: LayoutDashboard },
      { id: 'stations', label: 'Trạm & Pin Lưu Trữ', icon: Zap },
      { id: 'alarms', label: 'Nhật Ký & Cảnh Báo', icon: AlertTriangle },
      { id: 'settings', label: 'Cài Đặt Cá Nhân & Dự Án', icon: Settings },
    ];
  }

  return (
    <aside className="hidden md:flex w-64 border-r border-slate-800/80 bg-slate-900/40 p-4 flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)] font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="space-y-1.5">
        <div className="px-3 py-2 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
          {menuTitle}
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/10 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/5'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* System Status Card */}
      <div className="mt-8 p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 relative overflow-hidden">
        <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-cyan-500/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          ZENO Cloud Gateway v2.4
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
          {userType === 3
            ? 'Giám sát năng lượng mặt trời & Pin lithium thời gian thực.'
            : 'Hệ thống quản trị năng lượng mặt trời & Pin lưu trữ thông minh.'}
        </p>
        <div className="text-[11px] text-emerald-400 font-mono font-bold">
          ● Live Connected
        </div>
      </div>
    </aside>
  );
}
