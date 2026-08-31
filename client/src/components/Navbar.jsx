import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Sun, Shield, LogOut, Globe, UserCheck, Bell, Activity, Menu, X, 
  LayoutDashboard, Zap, Users, Layers, AlertTriangle, UserPlus, Settings 
} from 'lucide-react';

export default function Navbar({ onNavigate, currentPage }) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userType = Number(user?.userType || 3);

  const handleNavigate = (page) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  // Mobile menu filtered by role
  let mobileNavItems = [];
  if (userType === 1) {
    mobileNavItems = [
      { id: 'dashboard', label: 'Bảng Điều Khiển', icon: LayoutDashboard },
      { id: 'stations', label: 'Giám Sát Trạm & Kho Máy', icon: Zap },
      { id: 'customers', label: 'Quản Lý Đại Lý & Khách', icon: Users },
      { id: 'alarms', label: 'Cảnh Báo & Sự Cố', icon: AlertTriangle },
      { id: 'public-register', label: 'Cổng Tự Đăng Ký', icon: UserPlus },
      { id: 'settings', label: 'Cài Đặt & Kết Nối API', icon: Settings },
    ];
  } else if (userType === 2) {
    mobileNavItems = [
      { id: 'dashboard', label: 'Bảng Điều Khiển', icon: LayoutDashboard },
      { id: 'stations', label: 'Trạm Phụ Trách & Cấu Hình', icon: Zap },
      { id: 'customers', label: 'Khách Hàng Của Tôi', icon: Users },
      { id: 'alarms', label: 'Cảnh Báo & Sự Cố', icon: AlertTriangle },
    ];
  } else {
    mobileNavItems = [
      { id: 'dashboard', label: 'Bảng Điều Khiển Trạm', icon: LayoutDashboard },
      { id: 'stations', label: 'Trạm & Pin Lưu Trữ', icon: Zap },
      { id: 'alarms', label: 'Nhật Ký & Cảnh Báo', icon: AlertTriangle },
    ];
  }

  const subtitle = userType === 1 
    ? '👑 Nền tảng Quản Lý Tổng Phân Phối (sungo.vn)' 
    : userType === 2 
    ? '🏢 Cổng Quản Trị Đại Lý Phân Phối' 
    : '🏠 Người Tiêu Dùng Cuối (Điện Mặt Trời & Pin Lưu Trữ)';

  return (
    <>
      <header className="h-16 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-xl sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between font-['Plus_Jakarta_Sans',sans-serif]">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavigate('dashboard')}>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-amber-400 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sun className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-cyan-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
                ZENO
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                SOLAR
              </span>
            </div>
            <p className="hidden sm:block text-[10px] text-slate-400">{subtitle}</p>
          </div>
        </div>

        {/* Mode Tag & Status (Desktop) */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-emerald-400 font-medium">Zeno Cloud Live Connected</span>
          </div>

          {/* Cổng Đăng Ký chỉ dành cho Tổng phân phối */}
          {userType === 1 && (
            <button
              onClick={() => handleNavigate('public-register')}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 flex items-center gap-1.5 transition shadow"
            >
              <Globe className="w-3.5 h-3.5" /> Cổng Đăng Ký
            </button>
          )}
        </div>

        {/* User profile & Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-800">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-cyan-600 to-slate-800 flex items-center justify-center font-bold text-xs sm:text-sm text-cyan-200 border border-cyan-500/30">
              {user?.userName ? user.userName.charAt(0).toUpperCase() : 'Z'}
            </div>
            <div className="hidden sm:block text-right">
              <div className="text-xs sm:text-sm font-semibold text-slate-200 leading-tight">
                {user?.userName || 'Người dùng'}
              </div>
              <div className="text-[10px] text-cyan-400 flex items-center justify-end gap-1 font-medium">
                <UserCheck className="w-3 h-3" /> {user?.roleName || 'Chủ Nhà'}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-300 hover:bg-slate-800 transition"
            title="Mở menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-slate-950/80 backdrop-blur-md animate-fade-in font-['Plus_Jakarta_Sans',sans-serif]">
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="font-bold text-slate-200 text-sm">Danh Mục Chức Năng</div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              {mobileNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
