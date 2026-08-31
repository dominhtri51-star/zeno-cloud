import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/api';
import { 
  Sun, Lock, User, Shield, AlertCircle, ArrowRight, Zap, 
  CheckCircle2, Crown, Wrench, Home, Eye, EyeOff, Sparkles, 
  Mail, Phone, Cpu, Check, HelpCircle, ArrowLeft, MessageSquare, KeyRound,
  Info, Scan, ChevronDown, QrCode
} from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const { login, register, loading } = useAuth();
  
  // Tab Switcher: 'login' | 'register' | 'forgot'
  const [authMode, setAuthMode] = useState('login'); // Mặc định mở tab Đăng Nhập theo yêu cầu

  // ================= LOGIN FORM STATE =================
  const [loginAccount, setLoginAccount] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // ================= SUN WISE CLOUD REGISTER FORM STATE =================
  const [sunwiseAccount, setSunwiseAccount] = useState('');
  const [sunwiseEmail, setSunwiseEmail] = useState('');
  const [sunwiseOtp, setSunwiseOtp] = useState('');
  const [sunwisePassword, setSunwisePassword] = useState('');
  const [sunwiseConfirmPassword, setSunwiseConfirmPassword] = useState('');
  const [sunwiseDtuId, setSunwiseDtuId] = useState('');
  const [sunwiseCurrency, setSunwiseCurrency] = useState('VND');
  const [sunwiseCaptchaId, setSunwiseCaptchaId] = useState('');
  const [sunwiseOtpLoading, setSunwiseOtpLoading] = useState(false);
  const [sunwiseOtpCountdown, setSunwiseOtpCountdown] = useState(0);
  const [sunwiseError, setSunwiseError] = useState('');
  const [sunwiseSuccess, setSunwiseSuccess] = useState('');
  const [sunwiseSubmitting, setSunwiseSubmitting] = useState(false);

  // ================= FORGOT / RECOVERY FORM STATE =================
  const [recoveryMethod, setRecoveryMethod] = useState('otp'); // 'otp' | 'serial'
  const [recoveryIdentity, setRecoveryIdentity] = useState('');
  const [recoveryOtp, setRecoveryOtp] = useState('');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState('');
  const [recoverySerial, setRecoverySerial] = useState('');
  const [showRecoveryPassword, setShowRecoveryPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');
  const [demoOtpHint, setDemoOtpHint] = useState('');

  // Đếm ngược gửi lại OTP Sunwise
  useEffect(() => {
    let timer;
    if (sunwiseOtpCountdown > 0) {
      timer = setInterval(() => setSunwiseOtpCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [sunwiseOtpCountdown]);

  // Đếm ngược gửi lại OTP khôi phục
  useEffect(() => {
    let timer;
    if (otpCountdown > 0) {
      timer = setInterval(() => setOtpCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);

  // Gửi mã OTP khôi phục qua Phone / Email từ Server Hãng
  const handleSendRecoveryOtp = async () => {
    setRecoveryError('');
    setRecoverySuccess('');
    setDemoOtpHint('');

    const cleanId = recoveryIdentity.trim();
    if (!cleanId) {
      return setRecoveryError('Vui lòng nhập Số điện thoại hoặc Email hoặc Tên tài khoản!');
    }

    setOtpLoading(true);
    try {
      const res = await authService.sendRecoveryOtp({ identity: cleanId });
      if (res.success) {
        setOtpSent(true);
        setOtpCountdown(60);
        setRecoverySuccess(res.message || 'Mã xác thực OTP đã được Server Hãng gửi về Phone/Email của quý khách!');
      } else {
        setRecoveryError(res.message || 'Gửi mã OTP thất bại từ Server Hãng');
      }
    } catch (err) {
      setRecoveryError(err.message || 'Không tìm thấy tài khoản hoặc lỗi kết nối Máy Chủ Hãng');
    } finally {
      setOtpLoading(false);
    }
  };

  // Xác thực OTP và đặt mật khẩu mới với Server Hãng
  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    setRecoveryError('');
    setRecoverySuccess('');

    if (!recoveryOtp.trim()) {
      return setRecoveryError('Vui lòng nhập Mã xác thực OTP nhận được từ Server Hãng!');
    }
    if (recoveryNewPassword.length < 6 || recoveryNewPassword.length > 32) {
      return setRecoveryError('Mật khẩu mới phải từ 6–32 ký tự (phân biệt chữ hoa và chữ thường)!');
    }
    if (recoveryNewPassword !== recoveryConfirmPassword) {
      return setRecoveryError('Mật khẩu xác nhận không khớp!');
    }

    setOtpLoading(true);
    try {
      const res = await authService.verifyRecoveryOtp({
        identity: recoveryIdentity.trim(),
        otpCode: recoveryOtp.trim(),
        newPassword: recoveryNewPassword.trim()
      });

      if (res.success) {
        setRecoverySuccess(res.message || 'Đặt lại mật khẩu thành công trực tiếp với Server Hãng! Đang đăng nhập...');
        localStorage.setItem('zeno_user', JSON.stringify(res.user));
        localStorage.setItem('zeno_token', res.token);
        localStorage.setItem('zeno_mode', 'LIVE');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setRecoveryError(res.message || 'Xác thực OTP thất bại từ Server Hãng');
      }
    } catch (err) {
      setRecoveryError(err.message || 'Lỗi đặt lại mật khẩu');
    } finally {
      setOtpLoading(false);
    }
  };

  // Khôi phục bằng Serial Inverter (Zeno Cloud)
  const handleSerialRecoverySubmit = async (e) => {
    e.preventDefault();
    setRecoveryError('');
    setRecoverySuccess('');

    if (!recoveryIdentity.trim() || !recoverySerial.trim()) {
      return setRecoveryError('Vui lòng nhập Số điện thoại và Số Serial Inverter!');
    }
    if (recoveryNewPassword.length < 6) {
      return setRecoveryError('Mật khẩu mới phải từ 6 ký tự trở lên!');
    }
    if (recoveryNewPassword !== recoveryConfirmPassword) {
      return setRecoveryError('Mật khẩu xác nhận không khớp!');
    }

    setOtpLoading(true);
    try {
      const res = await authService.recoverBySerial({
        identity: recoveryIdentity.trim(),
        serialNumber: recoverySerial.trim(),
        newPassword: recoveryNewPassword.trim()
      });

      if (res.success) {
        setRecoverySuccess(res.message || 'Đổi mật khẩu thành công! Đang tự động đăng nhập...');
        localStorage.setItem('zeno_user', JSON.stringify(res.user));
        localStorage.setItem('zeno_token', res.token);
        localStorage.setItem('zeno_mode', 'LIVE');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setRecoveryError(res.message || 'Xác thực Inverter thất bại');
      }
    } catch (err) {
      setRecoveryError(err.message || 'Lỗi khôi phục qua Serial');
    } finally {
      setOtpLoading(false);
    }
  };

  // Xử lý submit Đăng Nhập
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    if (!loginAccount.trim() || !loginPassword.trim()) {
      return setLoginError('Vui lòng nhập tên tài khoản và mật khẩu!');
    }

    const res = await login({ account: loginAccount.trim(), password: loginPassword.trim() });
    if (res.success) {
      if (onLoginSuccess) onLoginSuccess();
    } else {
      setLoginError(res.message || 'Tài khoản hoặc mật khẩu không chính xác');
    }
  };

  // Đăng nhập nhanh tài khoản mẫu
  const handleRoleQuickLogin = async (acc, pass) => {
    setLoginError('');
    const res = await login({ account: acc, password: pass });
    if (res.success && onLoginSuccess) {
      onLoginSuccess();
    }
  };

  // Gửi mã OTP xác thực từ Server Hãng
  const handleSendSunwiseOtp = async () => {
    setSunwiseError('');
    setSunwiseSuccess('');
    const cleanEmail = sunwiseEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return setSunwiseError('Vui lòng nhập địa chỉ E-mail hợp lệ trước khi gửi mã xác thực!');
    }

    setSunwiseOtpLoading(true);
    try {
      const res = await authService.sendCloudOtp({ email: cleanEmail });
      if (res.success) {
        setSunwiseSuccess(res.message || 'Mã xác thực OTP đã được Server Hãng gửi về email của bạn!');
        if (res.captchaId) {
          setSunwiseCaptchaId(res.captchaId);
        }
        setSunwiseOtpCountdown(60);
      } else {
        setSunwiseError(res.message || 'Gửi mã OTP thất bại từ Server Hãng');
      }
    } catch (err) {
      setSunwiseError(err.message || 'Không thể kết nối đến Máy Chủ Hãng để gửi mã OTP');
    } finally {
      setSunwiseOtpLoading(false);
    }
  };

  // Xử lý submit Đăng Ký Sunwise Cloud
  const handleSunwiseRegisterSubmit = async (e) => {
    e.preventDefault();
    setSunwiseError('');
    setSunwiseSuccess('');

    const cleanAcc = sunwiseAccount.trim();
    const cleanEmail = sunwiseEmail.trim().toLowerCase();
    const cleanOtp = sunwiseOtp.trim();
    const cleanPass = sunwisePassword.trim();
    const cleanConfirm = sunwiseConfirmPassword.trim();

    if (!cleanAcc || cleanAcc.length < 3) {
      return setSunwiseError('Vui lòng nhập Tên đăng nhập (tối thiểu 3 ký tự)!');
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return setSunwiseError('Vui lòng nhập địa chỉ E-mail chính xác!');
    }
    if (!cleanOtp) {
      return setSunwiseError('Vui lòng nhập Mã xác thực OTP đã nhận qua Email!');
    }
    if (cleanPass.length < 6 || cleanPass.length > 32) {
      return setSunwiseError('Vui lòng nhập mật khẩu dài từ 6–32 ký tự (phân biệt chữ hoa và chữ thường)!');
    }
    if (cleanPass !== cleanConfirm) {
      return setSunwiseError('Mật khẩu nhập lại không khớp!');
    }

    setSunwiseSubmitting(true);
    try {
      const res = await authService.registerSunwise({
        account: cleanAcc,
        email: cleanEmail,
        verifyCode: cleanOtp,
        captchaId: sunwiseCaptchaId,
        password: cleanPass,
        confirmPassword: cleanConfirm,
        dtuId: sunwiseDtuId.trim(),
        currency: sunwiseCurrency
      });

      if (res.success) {
        setSunwiseSuccess(res.message || 'Đăng ký tài khoản thành công trên Server Hãng! Đang đăng nhập...');
        localStorage.setItem('zeno_user', JSON.stringify(res.user));
        localStorage.setItem('zeno_token', res.token);
        localStorage.setItem('zeno_mode', 'LIVE');
        setTimeout(() => {
          if (onLoginSuccess) onLoginSuccess();
          else window.location.reload();
        }, 1200);
      } else {
        setSunwiseError(res.message || 'Đăng ký thất bại từ Server Hãng');
      }
    } catch (err) {
      setSunwiseError(err.message || 'Lỗi kết nối Máy Chủ Hãng khi đăng ký');
    } finally {
      setSunwiseSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center p-3 sm:p-4 relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Glow Backdrops */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Window Frame matching SUN WISE Image */}
      <div className="w-full max-w-[420px] bg-[#161922] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Top Window Bar */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          {/* macOS Window Dots (Red, Yellow, Green) */}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
            <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
          </div>
          {/* Header Title */}
          <div className="text-sm font-black text-slate-300 tracking-wider">
            ZENO CLOUD
          </div>
          <div className="w-12"></div> {/* Spacer balance */}
        </div>

        {/* Card Content */}
        <div className="p-5 sm:p-6 pt-3">
          
          {/* Tab Switcher: Đăng nhập | Đăng ký */}
          <div className="flex items-center justify-around mb-6 pt-2">
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setLoginError(''); }}
              className={`text-base font-bold pb-2 relative transition cursor-pointer ${
                authMode === 'login'
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Đăng nhập</span>
              {authMode === 'login' && (
                <div className="w-8 h-0.5 bg-[#00d084] rounded-full mx-auto absolute bottom-0 left-1/2 -translate-x-1/2"></div>
              )}
            </button>

            <button
              type="button"
              onClick={() => { setAuthMode('register'); setSunwiseError(''); setSunwiseSuccess(''); }}
              className={`text-base font-bold pb-2 relative transition cursor-pointer ${
                authMode === 'register'
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Đăng ký</span>
              {authMode === 'register' && (
                <div className="w-8 h-0.5 bg-[#00d084] rounded-full mx-auto absolute bottom-0 left-1/2 -translate-x-1/2"></div>
              )}
            </button>
          </div>

          {/* ======================= TAB 1: ĐĂNG NHẬP ZENO CLOUD ======================= */}
          {authMode === 'login' && (
            <div className="space-y-4 animate-fade-in">
              {loginError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Tên đăng nhập / E-mail"
                    value={loginAccount}
                    onChange={(e) => setLoginAccount(e.target.value)}
                    className="w-full px-4 py-3 bg-[#242936] rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00d084] border-0"
                  />
                </div>

                <div>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      required
                      placeholder="Nhập Mật khẩu"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 bg-[#242936] rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00d084] border-0"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('forgot'); setRecoveryError(''); setRecoverySuccess(''); }}
                    className="text-xs text-slate-400 hover:text-[#00d084] cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-full bg-[#00d084] hover:bg-[#00b875] text-[#0d1117] font-black text-base shadow-lg shadow-[#00d084]/20 transition duration-200 mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Đang Đăng Nhập...' : 'Đăng nhập'}
                </button>
              </form>
            </div>
          )}

          {/* ======================= TAB 2: ĐĂNG KÝ SUN WISE CÓ MÃ OTP HÃNG (CHUẨN ẢNH) ======================= */}
          {authMode === 'register' && (
            <div className="space-y-3 animate-fade-in">
              {sunwiseError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{sunwiseError}</span>
                </div>
              )}

              {sunwiseSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{sunwiseSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSunwiseRegisterSubmit} className="space-y-3">
                {/* 1. Tên đăng nhập */}
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Tên đăng nhập"
                    value={sunwiseAccount}
                    onChange={(e) => setSunwiseAccount(e.target.value)}
                    className="w-full px-4 py-3 bg-[#242936] rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00d084] border-0"
                  />
                </div>

                {/* 2. E-mail */}
                <div>
                  <input
                    type="email"
                    required
                    placeholder="E-mail"
                    value={sunwiseEmail}
                    onChange={(e) => setSunwiseEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-[#242936] rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00d084] border-0"
                  />
                </div>

                {/* 3. Vui lòng nhập mã xác thực + Nút Gửi */}
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Vui lòng nhập mã xác thực"
                    value={sunwiseOtp}
                    onChange={(e) => setSunwiseOtp(e.target.value)}
                    className="w-full pl-4 pr-16 py-3 bg-[#242936] rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00d084] border-0"
                  />
                  <button
                    type="button"
                    onClick={handleSendSunwiseOtp}
                    disabled={sunwiseOtpLoading || sunwiseOtpCountdown > 0}
                    className="absolute right-4 top-3 text-sm font-bold text-[#00d084] hover:text-[#00b875] disabled:text-slate-500 cursor-pointer"
                  >
                    {sunwiseOtpLoading ? 'Đang gửi...' : (sunwiseOtpCountdown > 0 ? `${sunwiseOtpCountdown}s` : 'Gửi')}
                  </button>
                </div>

                {/* 4. Nhập Mật khẩu + Hint */}
                <div>
                  <input
                    type="password"
                    required
                    placeholder="Nhập Mật khẩu"
                    value={sunwisePassword}
                    onChange={(e) => setSunwisePassword(e.target.value)}
                    className="w-full px-4 py-3 bg-[#242936] rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00d084] border-0"
                  />
                  <div className="flex items-start gap-1.5 text-[11px] text-[#00d084] mt-1.5 px-1 font-medium leading-tight">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>Vui lòng nhập mật khẩu dài 6–32 ký tự (phân biệt chữ hoa và chữ thường)</span>
                  </div>
                </div>

                {/* 5. Vui lòng nhập lại mật khẩu. */}
                <div>
                  <input
                    type="password"
                    required
                    placeholder="Vui lòng nhập lại mật khẩu."
                    value={sunwiseConfirmPassword}
                    onChange={(e) => setSunwiseConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-[#242936] rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00d084] border-0"
                  />
                </div>

                {/* 6. Vui lòng nhập DtuID + Scan Icon */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Vui lòng nhập DtuID"
                    value={sunwiseDtuId}
                    onChange={(e) => setSunwiseDtuId(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 bg-[#242936] rounded-xl text-sm font-mono text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00d084] border-0"
                  />
                  <Scan className="w-5 h-5 absolute right-4 top-3.5 text-slate-400" />
                </div>

                {/* 7. Chọn loại tiền tệ + Hint */}
                <div>
                  <div className="relative">
                    <select
                      value={sunwiseCurrency}
                      onChange={(e) => setSunwiseCurrency(e.target.value)}
                      className="w-full px-4 py-3 bg-[#242936] rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#00d084] appearance-none cursor-pointer border-0"
                    >
                      <option value="VND" className="bg-[#242936] text-white">VND (₫) - Đồng Việt Nam</option>
                      <option value="USD" className="bg-[#242936] text-white">USD ($) - US Dollar</option>
                      <option value="EUR" className="bg-[#242936] text-white">EUR (€) - Euro</option>
                      <option value="CNY" className="bg-[#242936] text-white">CNY (¥) - Chinese Yuan</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-4 top-3.5 text-slate-400 pointer-events-none" />
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#00d084] mt-1.5 px-1 font-medium">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span>Vui lòng chọn loại tiền tệ</span>
                  </div>
                </div>

                {/* 8. Nút Đăng Ký Màu Xanh Mint Chuẩn */}
                <button
                  type="submit"
                  disabled={sunwiseSubmitting}
                  className="w-full py-3.5 rounded-full bg-[#00d084] hover:bg-[#00b875] text-[#0d1117] font-black text-base shadow-xl shadow-[#00d084]/20 transition duration-200 mt-3 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {sunwiseSubmitting ? 'Đang Đăng Ký Lên Server Hãng...' : 'Đăng ký'}
                </button>
              </form>
            </div>
          )}

          {/* ======================= TAB 3: KHÔI PHỤC MẬT KHẨU ======================= */}
          {authMode === 'forgot' && (
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/70">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setRecoveryError(''); setRecoverySuccess(''); }}
                  className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1.5 font-bold transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Quay Lại
                </button>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  TỰ ĐỘNG & MIỄN PHÍ
                </span>
              </div>

              <div className="text-center mb-4">
                <div className="w-10 h-10 mx-auto rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-2">
                  <KeyRound className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-100">
                  Lấy Lại Mật Khẩu Tự Động
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Chọn 1 trong 2 phương thức xác thực dưới đây để đặt lại mật khẩu mới
                </p>
              </div>

              {/* Method Switcher: OTP Phone/Email vs Serial Inverter (Zeno Cloud) */}
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 mb-3.5">
                <button
                  type="button"
                  onClick={() => { setRecoveryMethod('otp'); setRecoveryError(''); setRecoverySuccess(''); }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    recoveryMethod === 'otp'
                      ? 'bg-gradient-to-r from-[#00d084] to-teal-500 text-slate-950 shadow font-black'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Mã OTP Phone / Email
                </button>
                <button
                  type="button"
                  onClick={() => { setRecoveryMethod('serial'); setRecoveryError(''); setRecoverySuccess(''); }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    recoveryMethod === 'serial'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow font-black'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" /> Mã SN Biến Tần (Zeno Cloud)
                </button>
              </div>

              {recoveryError && (
                <div className="mb-3.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{recoveryError}</span>
                </div>
              )}

              {recoverySuccess && (
                <div className="mb-3.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{recoverySuccess}</span>
                </div>
              )}

              {/* ================= PHƯƠNG THỨC 1: OTP PHONE / EMAIL (SERVER HÃNG) ================= */}
              {recoveryMethod === 'otp' && (
                <form onSubmit={handleVerifyOtpSubmit} className="space-y-3">
                  <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-[11px] text-teal-300 flex items-start gap-2">
                    <Shield className="w-4 h-4 shrink-0 mt-0.5 text-teal-400" />
                    <span>Hệ thống sẽ gửi yêu cầu trực tiếp lên <strong>Máy Chủ Hãng</strong> để phát mã OTP về Số điện thoại / Email của bạn.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Số điện thoại hoặc Email tài khoản *
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <User className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                        <input
                          type="text"
                          required
                          placeholder="VD: 0912345678 hoặc email@gmail.com"
                          value={recoveryIdentity}
                          onChange={(e) => setRecoveryIdentity(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#00d084]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendRecoveryOtp}
                        disabled={otpLoading || otpCountdown > 0}
                        className="px-3 py-2 bg-[#00d084] hover:bg-[#00b875] disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow transition shrink-0 cursor-pointer flex items-center gap-1"
                      >
                        {otpLoading ? 'Đang gửi...' : (otpCountdown > 0 ? `${otpCountdown}s gửi lại` : 'Gửi OTP Hãng')}
                      </button>
                    </div>
                  </div>

                  {/* Nhập mã OTP từ Server Hãng */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Nhập mã OTP 6 số từ Server Hãng *
                      </label>
                      <span className="text-[10px] text-slate-400">SMS / Email Hãng</span>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="Nhập 6 chữ số OTP"
                      value={recoveryOtp}
                      onChange={(e) => setRecoveryOtp(e.target.value.trim())}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-center text-sm font-mono tracking-widest text-[#00d084] placeholder-slate-600 focus:outline-none focus:border-[#00d084]"
                    />
                  </div>

                  {/* Mật khẩu mới & Xác nhận */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Mật khẩu mới *
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                        <input
                          type={showRecoveryPassword ? "text" : "password"}
                          required
                          placeholder="6–32 ký tự"
                          value={recoveryNewPassword}
                          onChange={(e) => setRecoveryNewPassword(e.target.value)}
                          className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#00d084]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRecoveryPassword(!showRecoveryPassword)}
                          className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                        >
                          {showRecoveryPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Nhập lại mật khẩu *
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                        <input
                          type={showRecoveryPassword ? "text" : "password"}
                          required
                          placeholder="Xác nhận mật khẩu"
                          value={recoveryConfirmPassword}
                          onChange={(e) => setRecoveryConfirmPassword(e.target.value)}
                          className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#00d084]"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="w-full py-3 rounded-full bg-[#00d084] hover:bg-[#00b875] text-slate-950 font-black text-sm shadow-xl shadow-[#00d084]/20 transition duration-200 mt-2 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {otpLoading ? 'Đang Đặt Lại Mật Khẩu Lên Server Hãng...' : 'Xác Thực OTP & Đặt Lại Mật Khẩu (Server Hãng)'}
                    <Sparkles className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* ================= PHƯƠNG THỨC 2: KHÔI PHỤC BẰNG SERIAL BIẾN TẦN (ZENO CLOUD) ================= */}
              {recoveryMethod === 'serial' && (
                <form onSubmit={handleSerialRecoverySubmit} className="space-y-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-start gap-2">
                    <Shield className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                    <span>Hệ thống <strong>Zeno Cloud</strong> sẽ đối chiếu Số Serial Inverter và Số điện thoại đã liên kết trạm để mở khóa đổi mật khẩu ngay tức thì!</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Số điện thoại hoặc Tên tài khoản *
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                      <input
                        type="text"
                        required
                        placeholder="VD: 0912345678 hoặc anhthodienmayman"
                        value={recoveryIdentity}
                        onChange={(e) => setRecoveryIdentity(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Số Serial Biến Tần Inverter (SN in trên tem máy) *
                    </label>
                    <div className="relative">
                      <Cpu className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                      <input
                        type="text"
                        required
                        placeholder="VD: 5037108978-1"
                        value={recoverySerial}
                        onChange={(e) => setRecoverySerial(e.target.value.trim())}
                        className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm font-mono text-amber-300 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Mật khẩu mới *
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                        <input
                          type={showRecoveryPassword ? "text" : "password"}
                          required
                          placeholder="Tối thiểu 6 ký tự"
                          value={recoveryNewPassword}
                          onChange={(e) => setRecoveryNewPassword(e.target.value)}
                          className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRecoveryPassword(!showRecoveryPassword)}
                          className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                        >
                          {showRecoveryPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Nhập lại mật khẩu *
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                        <input
                          type={showRecoveryPassword ? "text" : "password"}
                          required
                          placeholder="Xác nhận mật khẩu"
                          value={recoveryConfirmPassword}
                          onChange={(e) => setRecoveryConfirmPassword(e.target.value)}
                          className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="w-full py-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition duration-200 mt-2 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {otpLoading ? 'Đang Xác Thực Zeno Cloud...' : 'Xác Thực Biến Tần & Đổi Mật Khẩu (Zeno Cloud)'}
                    <Sparkles className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="text-center mt-4 text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-cyan-500" />
          Bảo mật SSL 256-bit & Máy chủ Zeno Cloud Dedicated
        </div>
      </div>
    </div>
  );
}

