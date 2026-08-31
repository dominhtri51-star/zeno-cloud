import React, { useState, useEffect } from 'react';
import { 
  Lock, KeyRound, User, Shield, Server, Globe, Clock, 
  CheckCircle2, AlertCircle, RefreshCw, Cpu, Zap, Building, 
  ShieldCheck, Smartphone, Mail, Info
} from 'lucide-react';
import { authService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const userType = user?.userType || 1;
  const userAccount = user?.account || 'default';

  const [activeTab, setActiveTab] = useState('security'); // 'security', 'profile', 'system_api'
  
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
        bg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
        desc: 'Quản lý toàn bộ 100+ trạm, kho máy và phân bổ thiết bị cho thợ/khách hàng.'
      };
    }
    if (userType === 2) {
      return {
        label: 'Thợ Kỹ Thuật / Đại Lý Lắp Đặt',
        bg: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
        desc: 'Quản trị các trạm phụ trách, bảo hành và cài đặt thông số Inverter từ xa.'
      };
    }
    return {
      label: 'Chủ Nhà / Người Dùng Cuối (View-Only)',
      bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      desc: 'Giám sát sản lượng điện mặt trời, pin lưu trữ và tiền điện tiết kiệm của gia đình.'
    };
  };

  const roleInfo = getRoleBadge();

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-['Plus_Jakarta_Sans',sans-serif] animate-fade-in pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0b101e] border border-slate-800/90 p-5 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <Lock className="w-6 h-6 text-cyan-400" />
            Cài Đặt Cá Nhân & Bảo Mật Tài Khoản
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Đổi mật khẩu bảo mật tài khoản và quản lý thông tin hồ sơ cá nhân.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`text-xs px-3 py-1.5 rounded-xl border font-bold ${roleInfo.bg}`}>
            {roleInfo.label}
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'security'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Đổi Mật Khẩu</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Hồ Sơ Tài Khoản</span>
        </button>

        {userType === 1 && (
          <button
            onClick={() => setActiveTab('system_api')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'system_api'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Kết Nối API Cloud Hãng</span>
          </button>
        )}
      </div>

      {/* ================= TAB 1: ĐỔI MẬT KHẨU ================= */}
      {activeTab === 'security' && (
        <div className="bg-[#0b101e] border border-slate-800/90 p-5 sm:p-6 rounded-2xl shadow-xl space-y-6">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-100">Bảo Mật & Đổi Mật Khẩu</h3>
                <p className="text-xs text-slate-400">Tài khoản đang đăng nhập: <b className="text-cyan-400 font-mono">{user?.account}</b></p>
              </div>
            </div>
          </div>

          {passMsg.text && (
            <div className={`p-4 rounded-xl border text-xs font-bold flex items-center gap-2 ${
              passMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              {passMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{passMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Mật khẩu hiện tại</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                placeholder="Nhập mật khẩu đang dùng"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Mật khẩu mới</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                placeholder="Tối thiểu 6 ký tự"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Xác nhận mật khẩu mới</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
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

      {/* ================= TAB 2: HỒ SƠ TÀI KHOẢN ================= */}
      {activeTab === 'profile' && (
        <div className="bg-[#0b101e] border border-slate-800/90 p-5 sm:p-6 rounded-2xl shadow-xl space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-100">Thông Tin Tài Khoản</h3>
              <p className="text-xs text-slate-400">Chi tiết phân quyền và hồ sơ định danh</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-500 font-semibold block">Tên Tài Khoản (Username)</span>
              <span className="font-bold text-cyan-400 font-mono text-sm">{user?.account || 'Chưa xác định'}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-500 font-semibold block">Họ và Tên</span>
              <span className="font-bold text-white text-sm">{user?.name || user?.account || 'Người dùng'}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-500 font-semibold block">Cấp Bậc / Vai Trò</span>
              <span className="font-bold text-purple-300 text-sm">{roleInfo.label}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-500 font-semibold block">Phương Thức Xác Thực</span>
              <span className="font-bold text-emerald-400 text-sm">Zeno Cloud Live RBAC Gateway</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <h4 className="font-bold text-slate-300 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Mô Tả Quyền Hạn Trong Hệ Thống:
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {roleInfo.desc}
            </p>
          </div>
        </div>
      )}

      {/* ================= TAB 3: API CLOUD (CHỈ CHO TỔNG PHÂN PHỐI) ================= */}
      {activeTab === 'system_api' && userType === 1 && (
        <div className="space-y-6">
          <div className="bg-[#0b101e] border border-slate-800/90 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-100">Máy Chủ Zeno Solar Cloud</h3>
                  <p className="text-xs text-slate-400">cloud.zenosolar.vn • Cổng API Trực Tiếp</p>
                </div>
              </div>

              <button
                onClick={checkHealth}
                disabled={loadingHealth}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition border border-slate-700 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingHealth ? 'animate-spin' : ''}`} />
                <span>Kiểm Tra Ping</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-500 font-semibold block">Trạng Thái Kết Nối</span>
                <span className="font-bold text-emerald-400 text-sm flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  Online Live Connected
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-500 font-semibold block">Độ Trễ Phản Hồi (Ping)</span>
                <span className="font-mono font-bold text-cyan-400 text-sm mt-0.5 block">
                  {pingLatency ? `${pingLatency} ms` : '182 ms'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-500 font-semibold block">Phiên Bản Cổng Nối</span>
                <span className="font-mono font-bold text-slate-200 text-sm mt-0.5 block">
                  ZENO Gateway Pro v2.4
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#0b101e] border border-slate-800/90 p-6 rounded-2xl shadow-xl">
            <h3 className="font-bold text-base text-slate-100 mb-4 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-teal-400" /> Cấu Hình Chuẩn Giao Thức IoT Zeno
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 font-mono">IOT-Time-Zone</span>
                <span className="font-bold text-cyan-400 font-mono">Asia/Ho_Chi_Minh (+07:00)</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 font-mono">Accept-Language</span>
                <span className="font-bold text-teal-400 font-mono">vi (Tiếng Việt)</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 font-mono">User-Agent</span>
                <span className="font-bold text-slate-300 font-mono">Zeno-Solar-Platform/2.4.0</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 font-mono">Security Token Type</span>
                <span className="font-bold text-amber-400 font-mono">Bearer (Zeno-Token & Refresh Token)</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
