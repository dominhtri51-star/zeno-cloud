import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import AvatarModal from './AvatarModal';
import { 
  Sun, Moon, Shield, LogOut, Globe, UserCheck, Bell, Activity, Menu, X, 
  LayoutDashboard, Zap, Users, Layers, AlertTriangle, UserPlus, Settings,
  Crown, BatteryCharging, Diamond, Feather, Rocket, Flame, Camera
} from 'lucide-react';

const PRESET_MAP = {
  'solar-king': { icon: Crown, bg: 'from-amber-500 to-yellow-300', text: 'text-amber-950', border: 'border-yellow-400' },
  'cyber-solar': { icon: Zap, bg: 'from-cyan-500 to-blue-600', text: 'text-slate-950', border: 'border-cyan-400' },
  'sun-god': { icon: Sun, bg: 'from-orange-500 to-amber-400', text: 'text-orange-950', border: 'border-orange-400' },
  'bms-master': { icon: BatteryCharging, bg: 'from-emerald-500 to-teal-400', text: 'text-emerald-950', border: 'border-emerald-400' },
  'diamond-vip': { icon: Diamond, bg: 'from-purple-600 to-pink-500', text: 'text-white', border: 'border-pink-400' },
  'falcon-eco': { icon: Feather, bg: 'from-sky-500 to-indigo-600', text: 'text-white', border: 'border-sky-400' },
  'solar-future': { icon: Rocket, bg: 'from-indigo-600 via-purple-500 to-rose-500', text: 'text-white', border: 'border-purple-400' },
  'fire-energy': { icon: Flame, bg: 'from-rose-600 to-amber-500', text: 'text-white', border: 'border-rose-400' }
};

export default function Navbar({ onNavigate, currentPage }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const userType = Number(user?.userType || 3);

  const handleNavigate = (page) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  // Helper render Avatar
  const renderAvatarContent = () => {
    if (user?.avatarType === 'image' && (user?.avatarUrl || user?.avatar)) {
      return (
        <img 
          src={user.avatarUrl || user.avatar} 
          alt="Avatar" 
          className="w-full h-full object-cover rounded-full" 
        />
      );
    }
    if (user?.avatarPreset && PRESET_MAP[user.avatarPreset]) {
      const preset = PRESET_MAP[user.avatarPreset];
      const Icon = preset.icon;
      return (
        <div className={`w-full h-full rounded-full bg-gradient-to-br ${preset.bg} flex items-center justify-center shadow-inner`}>
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${preset.text}`} />
        </div>
      );
    }
    return (
      <div className="w-full h-full rounded-full bg-gradient-to-br from-cyan-600 via-teal-600 to-slate-800 flex items-center justify-center font-bold text-xs sm:text-sm text-cyan-200">
        {user?.avatarInitial || (user?.userName ? user.userName.charAt(0).toUpperCase() : 'Z')}
      </div>
    );
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
      { id: 'settings', label: 'Cài Đặt Tài Khoản', icon: Settings },
    ];
  } else {
    mobileNavItems = [
      { id: 'dashboard', label: 'Bảng Điều Khiển Trạm', icon: LayoutDashboard },
      { id: 'stations', label: 'Trạm & Pin Lưu Trữ', icon: Zap },
      { id: 'alarms', label: 'Nhật Ký & Cảnh Báo', icon: AlertTriangle },
      { id: 'settings', label: 'Cài Đặt & Giao Diện', icon: Settings },
    ];
  }

  const subtitle = userType === 1 
    ? '👑 Nền tảng Quản Lý Tổng Phân Phối (sungo.vn)' 
    : userType === 2 
    ? '🏢 Cổng Quản Trị Đại Lý Phân Phối' 
    : '🏠 Người Tiêu Dùng Cuối (Điện Mặt Trời & Pin Lưu Trữ)';

  return (
    <>
      <header className={`h-16 border-b ${isDark ? 'bg-slate-900/90 border-slate-800/80 text-white' : 'bg-white/95 border-slate-200 text-slate-900 shadow-sm'} backdrop-blur-xl sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between font-['Plus_Jakarta_Sans',sans-serif] transition-colors duration-300`}>
        {/* Brand & Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavigate('dashboard')}>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-amber-400 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
            <div className={`w-full h-full ${isDark ? 'bg-slate-950' : 'bg-white'} rounded-[10px] flex items-center justify-center`}>
              <Sun className="w-5 h-5 text-cyan-500" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-cyan-500 via-teal-400 to-amber-400 bg-clip-text text-transparent">
                ZENO
              </span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isDark ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'}`}>
                SOLAR
              </span>
            </div>
            <p className={`hidden sm:block text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{subtitle}</p>
          </div>
        </div>

        {/* Mode Tag & Status (Desktop) */}
        <div className="hidden lg:flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'} border text-xs`}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-emerald-500 font-medium">Zeno Cloud Live Connected</span>
          </div>

          {/* Cổng Đăng Ký chỉ dành cho Tổng phân phối */}
          {userType === 1 && (
            <button
              onClick={() => handleNavigate('public-register')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-cyan-700 border-slate-200'} border flex items-center gap-1.5 transition shadow`}
            >
              <Globe className="w-3.5 h-3.5" /> Cổng Đăng Ký
            </button>
          )}
        </div>

        {/* User profile & Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Nút Đổi Theme Nhanh Sáng / Tối */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition flex items-center justify-center cursor-pointer shadow-sm ${
              isDark 
                ? 'bg-slate-800/90 border-slate-700 text-amber-300 hover:bg-slate-700 hover:text-amber-200' 
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-cyan-600'
            }`}
            title={isDark ? 'Chuyển sang Theme Sáng (Light Mode)' : 'Chuyển sang Theme Tối (Dark Mode)'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className={`flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <button
              type="button"
              onClick={() => setIsAvatarModalOpen(true)}
              className="relative group p-0.5 rounded-full transition cursor-pointer hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              title="Nhấp để đổi Avatar siêu ngầu"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 border-cyan-400/80 shadow-md shadow-cyan-500/20 group-hover:border-amber-400 transition duration-300">
                {renderAvatarContent()}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-cyan-500 group-hover:bg-amber-400 border border-slate-900 flex items-center justify-center text-[8px] text-slate-950 font-bold transition">
                <Camera className="w-2.5 h-2.5" />
              </span>
            </button>

            <div 
              className="hidden sm:block text-right cursor-pointer group"
              onClick={() => setIsAvatarModalOpen(true)}
              title="Nhấp để đổi Avatar siêu ngầu"
            >
              <div className={`text-xs sm:text-sm font-semibold ${isDark ? 'text-slate-200 group-hover:text-cyan-400' : 'text-slate-800 group-hover:text-cyan-600'} leading-tight transition`}>
                {user?.userName || 'Người dùng'}
              </div>
              <div className="text-[10px] text-cyan-500 flex items-center justify-end gap-1 font-medium">
                <UserCheck className="w-3 h-3" /> {user?.roleName || 'Chủ Nhà'}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden p-2 rounded-xl ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'} transition cursor-pointer`}
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

      {/* Modal Đổi Avatar Siêu Ngầu */}
      <AvatarModal 
        isOpen={isAvatarModalOpen} 
        onClose={() => setIsAvatarModalOpen(false)} 
      />
    </>
  );
}
