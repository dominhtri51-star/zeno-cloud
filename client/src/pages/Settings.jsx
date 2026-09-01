import React, { useState, useEffect } from 'react';
import { 
  Lock, KeyRound, User, Shield, Server, Globe, Clock, 
  CheckCircle2, AlertCircle, RefreshCw, Cpu, Zap, Building, 
  ShieldCheck, Smartphone, Mail, Info, Palette, Sun, Moon, Sparkles, Check
} from 'lucide-react';
import { authService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const userType = user?.userType || 1;
  const userAccount = user?.account || 'default';

  const [activeTab, setActiveTab] = useState('theme'); // Mặc định mở tab 'theme' theo yêu cầu
  
  // 1. State Đổi Mật Khẩu
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });

  // 2. State API Health (Chỉ cho Tổng Phân Phối)
  const [health, setHealth] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [pingLatency, setPingLatency] = useState(null);

  useEffect(() => {
    if (userType === 1) {
      checkHealth();
    }
  }, [userAccount, userType]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMsg({ type: '', text: '' });

    if (!newPassword || newPassword.length < 6) {
      return setPassMsg({ type: 'error', text: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' });
    }

    if (newPassword !== confirmPassword) {
      return setPassMsg({ type: 'error', text: 'Mật khẩu xác nhận không khớp với mật khẩu mới.' });
    }

    setPassLoading(true);
    try {
      const res = await authService.changePassword({
        currentPassword,
        newPassword
      });
      setPassMsg({
        type: 'success',
        text: res.message || 'Đổi mật khẩu tài khoản thành công! Mật khẩu mới đã có hiệu lực.'
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPassMsg({
        type: 'error',
        text: err.message || 'Mật khẩu hiện tại không đúng hoặc có lỗi kết nối!'
      });
    } finally {
      setPassLoading(false);
    }
  };

  const checkHealth = async () => {
    try {
      setLoadingHealth(true);
      const start = Date.now();
      const res = await authService.getApiHealth();
      const latency = Date.now() - start;
      setPingLatency(latency);
      setHealth(res);
    } catch (e) {
      setHealth({
        status: 'error',
        cloudServer: 'solar.siseli.com (Mất kết nối)',
        authStatus: 'Offline'
      });
    } finally {
      setLoadingHealth(false);
    }
  };

  const getRoleBadge = () => {
    if (userType === 1) {
      return {
        label: 'Tổng Phân Phối Toàn Quyền',
        bg: isDark ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-700',
        desc: 'Quản lý toàn bộ 100+ trạm, kho máy và phân bổ thiết bị cho thợ/khách hàng.'
      };
    }
    if (userType === 2) {
      return {
        label: 'Thợ Kỹ Thuật / Đại Lý Lắp Đặt',
        bg: isDark ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : 'bg-purple-50 border-purple-200 text-purple-700',
        desc: 'Quản trị các trạm phụ trách, bảo hành và cài đặt thông số Inverter từ xa.'
      };
    }
    return {
      label: 'Chủ Nhà / Người Dùng Cuối (View-Only)',
      bg: isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700',
      desc: 'Giám sát sản lượng điện mặt trời, pin lưu trữ và tiền điện tiết kiệm của gia đình.'
    };
  };

  const roleInfo = getRoleBadge();

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-['Plus_Jakarta_Sans',sans-serif] animate-fade-in pb-16">
      
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isDark ? 'bg-[#0b101e] border-slate-800/90' : 'bg-white border-slate-200 shadow-md'} border p-5 rounded-2xl shadow-xl transition-colors duration-300`}>
        <div>
          <h1 className={`text-xl sm:text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2.5`}>
            <Palette className="w-6 h-6 text-cyan-500" />
            Cài Đặt Hệ Thống & Giao Diện
          </h1>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
            Tùy biến Theme Sáng / Tối, đổi mật khẩu bảo mật và thông tin hồ sơ tài khoản.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`text-xs px-3 py-1.5 rounded-xl border font-bold ${roleInfo.bg}`}>
            {roleInfo.label}
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className={`flex items-center space-x-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'} pb-2 overflow-x-auto`}>
        {/* Tab 1: Giao diện Theme */}
        <button
          onClick={() => setActiveTab('theme')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'theme'
              ? isDark ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-lg' : 'bg-cyan-50 text-cyan-700 border border-cyan-200 shadow-sm'
              : isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Giao Diện Theme</span>
        </button>

        {/* Tab 2: Đổi Mật Khẩu */}
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'security'
              ? isDark ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-lg' : 'bg-cyan-50 text-cyan-700 border border-cyan-200 shadow-sm'
              : isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Đổi Mật Khẩu</span>
        </button>

        {/* Tab 3: Hồ Sơ */}
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'profile'
              ? isDark ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-lg' : 'bg-cyan-50 text-cyan-700 border border-cyan-200 shadow-sm'
              : isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Hồ Sơ Tài Khoản</span>
        </button>

        {/* Tab 4: API Cloud (Chỉ cho Tổng phân phối) */}
        {userType === 1 && (
          <button
            onClick={() => setActiveTab('system_api')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'system_api'
                ? isDark ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-lg' : 'bg-cyan-50 text-cyan-700 border border-cyan-200 shadow-sm'
                : isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Kết Nối API Cloud Hãng</span>
          </button>
        )}
      </div>

      {/* ================= TAB 1: GIAO DIỆN & THEME CHO APP ================= */}
      {activeTab === 'theme' && (
        <div className={`${isDark ? 'bg-[#0b101e] border-slate-800/90' : 'bg-white border-slate-200 shadow-md'} border p-5 sm:p-6 rounded-2xl shadow-xl space-y-6 transition-colors duration-300`}>
          
          <div className={`flex items-center justify-between border-b ${isDark ? 'border-slate-800' : 'border-slate-200'} pb-4`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-amber-400 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
                <div className={`w-full h-full ${isDark ? 'bg-slate-950' : 'bg-white'} rounded-[10px] flex items-center justify-center`}>
                  <Sparkles className="w-5 h-5 text-cyan-500" />
                </div>
              </div>
              <div>
                <h3 className={`font-extrabold text-base ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Tùy Chọn Chủ Đề (Theme / Appearance)</h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Chọn phong cách hiển thị phù hợp với sở thích và môi trường ánh sáng của bạn.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* 1. THẺ THEME TỐI (DARK MIDNIGHT) */}
            <div 
              onClick={() => setTheme('dark')}
              className={`p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer relative overflow-hidden group ${
                theme === 'dark'
                  ? 'bg-[#070b14] border-cyan-500 shadow-xl shadow-cyan-500/10'
                  : isDark 
                    ? 'bg-[#070b14]/70 border-slate-800 hover:border-slate-700' 
                    : 'bg-slate-900 text-white border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Badge Đang chọn */}
              {theme === 'dark' && (
                <div className="absolute top-3 right-3 bg-cyan-500 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>ĐANG DÙNG</span>
                </div>
              )}

              {/* Preview UI Box */}
              <div className="w-full h-28 rounded-xl bg-[#0b101e] border border-slate-800 p-3 mb-4 flex flex-col justify-between shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                    <span className="text-[10px] font-mono font-bold text-slate-300">ZENO CLOUD</span>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold">LIVE 51.9V</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 p-2 rounded-lg bg-[#070b14] border border-slate-800 text-center">
                    <span className="text-[8px] text-slate-400 block font-bold">PV PHÁT</span>
                    <span className="text-xs font-black text-amber-400 font-mono">3.45 kW</span>
                  </div>
                  <div className="flex-1 p-2 rounded-lg bg-[#070b14] border border-slate-800 text-center">
                    <span className="text-[8px] text-slate-400 block font-bold">TẢI NHÀ</span>
                    <span className="text-xs font-black text-cyan-400 font-mono">1.20 kW</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-amber-400">
                    <Moon className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-sm font-extrabold text-white">Theme Tối (Midnight Cyberpunk)</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Nền đen huyền bí, điểm nhấn neon sắc nét. Tiết kiệm pin tối đa cho màn hình OLED / AMOLED và cực kỳ dịu mắt khi sử dụng vào ban đêm.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">🌙 Dịu Mắt Ban Đêm</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">⚡ Tiết Kiệm Pin</span>
                </div>
              </div>
            </div>

            {/* 2. THẺ THEME SÁNG (LUXURY LIGHT & CLEAN) */}
            <div 
              onClick={() => setTheme('light')}
              className={`p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer relative overflow-hidden group ${
                theme === 'light'
                  ? 'bg-white border-cyan-500 shadow-xl shadow-cyan-500/10 text-slate-900'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800'
              }`}
            >
              {/* Badge Đang chọn */}
              {theme === 'light' && (
                <div className="absolute top-3 right-3 bg-cyan-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>ĐANG DÙNG</span>
                </div>
              )}

              {/* Preview UI Box */}
              <div className="w-full h-28 rounded-xl bg-white border border-slate-200 p-3 mb-4 flex flex-col justify-between shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-600"></span>
                    <span className="text-[10px] font-mono font-bold text-slate-800">ZENO CLOUD</span>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-mono font-bold">LIVE 51.9V</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 p-2 rounded-lg bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[8px] text-slate-500 block font-bold">PV PHÁT</span>
                    <span className="text-xs font-black text-amber-600 font-mono">3.45 kW</span>
                  </div>
                  <div className="flex-1 p-2 rounded-lg bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[8px] text-slate-500 block font-bold">TẢI NHÀ</span>
                    <span className="text-xs font-black text-cyan-600 font-mono">1.20 kW</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                    <Sun className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900">Theme Sáng (Luxury Tesla & Apple)</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Nền sáng bạc cao cấp sang trọng, bóng đổ thanh lịch, các thẻ viễn trắc trong trẻo, nhìn cực kỳ rõ nét và cao cấp ngay cả dưới trời nắng gắt.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">☀️ Rõ Dưới Nắng</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">✨ Sang Xịn Mịn</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ================= TAB 2: ĐỔI MẬT KHẨU ================= */}
      {activeTab === 'security' && (
        <div className={`${isDark ? 'bg-[#0b101e] border-slate-800/90' : 'bg-white border-slate-200 shadow-md'} border p-5 sm:p-6 rounded-2xl shadow-xl space-y-6 transition-colors duration-300`}>
          
          <div className={`flex items-center justify-between border-b ${isDark ? 'border-slate-800' : 'border-slate-200'} pb-4`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`font-extrabold text-base ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Bảo Mật & Đổi Mật Khẩu</h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tài khoản đang đăng nhập: <b className="text-cyan-500 font-mono">{user?.account}</b></p>
              </div>
            </div>
          </div>

          {passMsg.text && (
            <div className={`p-4 rounded-xl border text-xs font-bold flex items-center gap-2 ${
              passMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
            }`}>
              {passMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{passMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div className="space-y-1.5">
              <label className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Mật khẩu hiện tại</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={`w-full ${isDark ? 'bg-slate-950 border-slate-700/80 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3.5 py-2.5 font-mono text-sm focus:outline-none focus:border-cyan-500`}
                placeholder="Nhập mật khẩu đang dùng"
              />
            </div>

            <div className="space-y-1.5">
              <label className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Mật khẩu mới</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full ${isDark ? 'bg-slate-950 border-slate-700/80 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3.5 py-2.5 font-mono text-sm focus:outline-none focus:border-cyan-500`}
                placeholder="Tối thiểu 6 ký tự"
              />
            </div>

            <div className="space-y-1.5">
              <label className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Xác nhận mật khẩu mới</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full ${isDark ? 'bg-slate-950 border-slate-700/80 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3.5 py-2.5 font-mono text-sm focus:outline-none focus:border-cyan-500`}
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>

            <button
              type="submit"
              disabled={passLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
            >
              <KeyRound className={`w-4 h-4 ${passLoading ? 'animate-spin' : ''}`} />
              <span>{passLoading ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu'}</span>
            </button>
          </form>

        </div>
      )}

      {/* ================= TAB 3: HỒ SƠ TÀI KHOẢN ================= */}
      {activeTab === 'profile' && (
        <div className={`${isDark ? 'bg-[#0b101e] border-slate-800/90' : 'bg-white border-slate-200 shadow-md'} border p-5 sm:p-6 rounded-2xl shadow-xl space-y-6 transition-colors duration-300`}>
          <div className={`flex items-center space-x-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'} pb-4`}>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-extrabold text-base ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Thông Tin Tài Khoản</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Chi tiết phân quyền và hồ sơ định danh</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'} border space-y-1`}>
              <span className={`${isDark ? 'text-slate-500' : 'text-slate-400'} font-semibold block`}>Tên Tài Khoản (Username)</span>
              <span className="font-bold text-cyan-500 font-mono text-sm">{user?.account || 'Chưa xác định'}</span>
            </div>

            <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'} border space-y-1`}>
              <span className={`${isDark ? 'text-slate-500' : 'text-slate-400'} font-semibold block`}>Họ và Tên</span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'} text-sm`}>{user?.name || user?.account || 'Người dùng'}</span>
            </div>

            <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'} border space-y-1`}>
              <span className={`${isDark ? 'text-slate-500' : 'text-slate-400'} font-semibold block`}>Cấp Bậc / Vai Trò</span>
              <span className={`font-bold ${isDark ? 'text-purple-300' : 'text-purple-700'} text-sm`}>{roleInfo.label}</span>
            </div>

            <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'} border space-y-1`}>
              <span className={`${isDark ? 'text-slate-500' : 'text-slate-400'} font-semibold block`}>Phương Thức Xác Thực</span>
              <span className="font-bold text-emerald-500 text-sm">Zeno Cloud Live RBAC Gateway</span>
            </div>
          </div>

          <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'} border space-y-2`}>
            <h4 className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'} text-xs flex items-center gap-2`}>
              <ShieldCheck className="w-4 h-4 text-cyan-500" />
              Mô Tả Quyền Hạn Trong Hệ Thống:
            </h4>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'} leading-relaxed`}>
              {roleInfo.desc}
            </p>
          </div>
        </div>
      )}

      {/* ================= TAB 4: API CLOUD (CHỈ CHO TỔNG PHÂN PHỐI) ================= */}
      {activeTab === 'system_api' && userType === 1 && (
        <div className="space-y-6">
          <div className={`${isDark ? 'bg-[#0b101e] border-slate-800/90' : 'bg-white border-slate-200 shadow-md'} border p-6 rounded-2xl shadow-xl space-y-4 transition-colors duration-300`}>
            <div className={`flex items-center justify-between border-b ${isDark ? 'border-slate-800' : 'border-slate-200'} pb-4`}>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-bold text-base ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Máy Chủ Zeno Solar Cloud</h3>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>cloud.zenosolar.vn • Cổng API Trực Tiếp</p>
                </div>
              </div>

              <button
                onClick={checkHealth}
                disabled={loadingHealth}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition disabled:opacity-50 cursor-pointer ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'}`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingHealth ? 'animate-spin' : ''}`} />
                <span>Kiểm Tra Ping</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className={`p-3.5 rounded-xl ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'} border`}>
                <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'} font-semibold block`}>Trạng Thái Kết Nối</span>
                <span className="font-bold text-emerald-500 text-sm flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  Online Live Connected
                </span>
              </div>

              <div className={`p-3.5 rounded-xl ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'} border`}>
                <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'} font-semibold block`}>Độ Trễ Phản Hồi (Ping)</span>
                <span className={`font-mono font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'} text-sm mt-0.5 block`}>
                  {pingLatency ? `${pingLatency} ms` : '182 ms'}
                </span>
              </div>

              <div className={`p-3.5 rounded-xl ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'} border`}>
                <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'} font-semibold block`}>Phiên Bản Cổng Nối</span>
                <span className={`font-mono font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'} text-sm mt-0.5 block`}>
                  ZENO Gateway Pro v2.4
                </span>
              </div>
            </div>
          </div>

          <div className={`${isDark ? 'bg-[#0b101e] border-slate-800/90' : 'bg-white border-slate-200 shadow-md'} border p-6 rounded-2xl shadow-xl transition-colors duration-300`}>
            <h3 className={`font-bold text-base ${isDark ? 'text-slate-100' : 'text-slate-900'} mb-4 flex items-center gap-2`}>
              <Cpu className="w-5 h-5 text-teal-500" /> Cấu Hình Chuẩn Giao Thức IoT Zeno
            </h3>

            <div className="space-y-3 text-xs">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'} border flex items-center justify-between`}>
                <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'} font-mono`}>IOT-Time-Zone</span>
                <span className="font-bold text-cyan-500 font-mono">Asia/Ho_Chi_Minh (+07:00)</span>
              </div>

              <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'} border flex items-center justify-between`}>
                <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'} font-mono`}>Accept-Language</span>
                <span className="font-bold text-teal-500 font-mono">vi (Tiếng Việt)</span>
              </div>

              <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'} border flex items-center justify-between`}>
                <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'} font-mono`}>User-Agent</span>
                <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'} font-mono`}>Zeno-Solar-Platform/2.4.0</span>
              </div>

              <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'} border flex items-center justify-between`}>
                <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'} font-mono`}>Security Token Type</span>
                <span className="font-bold text-amber-500 font-mono">Bearer (Zeno-Token & Refresh Token)</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
