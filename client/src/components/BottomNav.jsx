import React from 'react';
import { LayoutDashboard, Users, Zap, AlertTriangle, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function BottomNav({ currentPage, onNavigate }) {
  const { user } = useAuth();
  const userType = user?.userType || 1;

  let navItems = [];
  if (userType === 1) {
    navItems = [
      { id: 'dashboard', label: 'Tổng Quan', icon: LayoutDashboard },
      { id: 'stations', label: 'Trạm & Pin', icon: Zap },
      { id: 'customers', label: 'Khách Hàng', icon: Users },
      { id: 'alarms', label: 'Cảnh Báo', icon: AlertTriangle },
      { id: 'settings', label: 'Cài Đặt', icon: Settings },
    ];
  } else if (userType === 2) {
    navItems = [
      { id: 'dashboard', label: 'Tổng Quan', icon: LayoutDashboard },
      { id: 'stations', label: 'Trạm Phụ Trách', icon: Zap },
      { id: 'customers', label: 'Khách Hàng', icon: Users },
      { id: 'alarms', label: 'Cảnh Báo', icon: AlertTriangle },
      { id: 'settings', label: 'Cài Đặt', icon: Settings },
    ];
  } else {
    // 🏠 Chủ nhà
    navItems = [
      { id: 'dashboard', label: 'Tổng Quan', icon: LayoutDashboard },
      { id: 'stations', label: 'Thiết Bị', icon: Zap },
      { id: 'alarms', label: 'Nhật Ký', icon: AlertTriangle },
      { id: 'settings', label: 'Cài Đặt', icon: Settings },
    ];
  }

  const gridColsClass = navItems.length === 3 
    ? 'grid-cols-3' 
    : navItems.length === 4 
    ? 'grid-cols-4' 
    : 'grid-cols-5';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 shadow-2xl safe-area-bottom font-['Plus_Jakarta_Sans',sans-serif]">
      <div className={`grid ${gridColsClass} gap-1`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-cyan-400 font-bold bg-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[10px] leading-tight truncate">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
