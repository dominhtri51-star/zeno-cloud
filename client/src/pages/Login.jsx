import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/api';
import { Capacitor } from '@capacitor/core';
import { 
  Sun, Lock, User, Shield, AlertCircle, ArrowRight, Zap, 
  CheckCircle2, Crown, Wrench, Home, Eye, EyeOff, Sparkles, 
  Mail, Phone, Cpu, Check, HelpCircle, ArrowLeft, MessageSquare, KeyRound,
  Info, Scan, ChevronDown, QrCode
} from 'lucide-react';

export default function Login({ onLoginSuccess, onNavigateToPrivacy }) {
  const { login, register, loading } = useAuth();
  const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform();

  // Đảm bảo nền của body & html luôn là màu tối đồng bộ trên cả mobile và desktop
  useEffect(() => {
    const origHtml = document.documentElement.style.backgroundColor;
    const origBody = document.body.style.backgroundColor;
    document.documentElement.style.backgroundColor = '#0d1117';
    document.body.style.backgroundColor = '#0d1117';
    return () => {
      document.documentElement.style.backgroundColor = origHtml;
      document.body.style.backgroundColor = origBody;
    };
  }, []);
  
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
  const [sunwiseCurrency, setSunwiseCurrency] = useState('VND');
  const [sunwiseCaptchaId, setSunwiseCaptchaId] = useState('');
  const [sunwiseOtpLoading, setSunwiseOtpLoading] = useState(false);
  const [sunwiseOtpCountdown, setSunwiseOtpCountdown] = useState(0);
  const [sunwiseError, setSunwiseError] = useState('');
  const [sunwiseSuccess, setSunwiseSuccess] = useState('');
  const [sunwiseSubmitting, setSunwiseSubmitting] = useState(false);

  // ================= FORGOT / RECOVERY FORM STATE (SUN WISE CLOUD OTP) =================
  const [recoveryChannel, setRecoveryChannel] = useState('email'); // 'email' | 'phone'
  const [recoveryAreaCode, setRecoveryAreaCode] = useState('+84');
  const [recoveryIdentity, setRecoveryIdentity] = useState('');
  const [recoveryOtp, setRecoveryOtp] = useState('');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState('');
  const [showRecoveryPassword, setShowRecoveryPassword] = useState(false);
  const [showRecoveryConfirmPassword, setShowRecoveryConfirmPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Input email/phone, 2: Input OTP + new pass
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');

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
  const handleSendRecoveryOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setRecoveryError('');
    setRecoverySuccess('');

    const cleanId = recoveryIdentity.trim();
    if (!cleanId) {
      return setRecoveryError(recoveryChannel === 'email' ? 'Vui lòng nhập địa chỉ Email!' : 'Vui lòng nhập Số điện thoại!');
    }

    if (recoveryChannel === 'email' && !cleanId.includes('@')) {
      return setRecoveryError('Địa chỉ email không hợp lệ!');
    }

    setOtpLoading(true);
    try {
      const res = await authService.sendRecoveryOtp({ 
        identity: cleanId,
        areaCode: recoveryAreaCode,
        channel: recoveryChannel 
      });
      if (res.success) {
        setForgotStep(2);
        setOtpCountdown(60);
        setRecoverySuccess(res.message || `Mã xác thực OTP đã được Server Hãng gửi về ${recoveryChannel === 'email' ? 'Email' : 'Số điện thoại'} [${cleanId}]!`);
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
        setRecoverySuccess(res.message || 'Đã ghi nhận mật khẩu mới trên Máy Chủ Hãng thành công! Đang đăng nhập...');
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
          try {
            localStorage.setItem(`sunwise_captcha_${cleanEmail}`, res.captchaId);
          } catch (e) {}
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

    const effectiveCaptchaId = sunwiseCaptchaId || localStorage.getItem(`sunwise_captcha_${cleanEmail}`);
    if (!effectiveCaptchaId) {
      return setSunwiseError('Vui lòng nhấn nút "Gửi" để nhận mã xác thực OTP từ Server Hãng trước khi bấm Đăng ký!');
    }

    setSunwiseSubmitting(true);
    try {
      const res = await authService.registerSunwise({
        account: cleanAcc,
        email: cleanEmail,
        verifyCode: cleanOtp,
        captchaId: effectiveCaptchaId,
        password: cleanPass,
        confirmPassword: cleanConfirm,
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
    <div className="min-h-[100dvh] w-full bg-[#0d1117] flex flex-col items-center justify-start sm:justify-center p-3 sm:p-4 relative overflow-y-auto overflow-x-hidden font-['Plus_Jakarta_Sans',sans-serif] py-6 sm:py-12">
      {/* Glow Backdrops */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Window Frame matching SUN WISE Image */}
      <div className="w-full max-w-[420px] bg-[#161922] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden my-auto">
        
        {/* Top Window Bar */}
        <div className="text-center px-5 pt-5 pb-2">
          {/* Header Title */}
          <div className="text-sm font-black text-slate-300 tracking-wider">
            ZENO CLOUD
          </div>
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
                    className="w-full px-4 py-3.5 bg-[#242936] rounded-xl text-base sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00d084] border-0"
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
                      className="w-full pl-4 pr-10 py-3.5 bg-[#242936] rounded-xl text-base sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00d084] border-0"
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
                    className="w-full px-4 py-3.5 bg-[#242936] rounded-xl text-base sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00d084] border-0"
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
                    className="w-full px-4 py-3.5 bg-[#242936] rounded-xl text-base sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00d084] border-0"
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
                    className="w-full pl-4 pr-16 py-3.5 bg-[#242936] rounded-xl text-base sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00d084] border-0"
                  />
                  <button
                    type="button"
                    onClick={handleSendSunwiseOtp}
                    disabled={sunwiseOtpLoading || sunwiseOtpCountdown > 0}
                    className="absolute right-4 top-3.5 text-sm font-bold text-[#00d084] hover:text-[#00b875] disabled:text-slate-500 cursor-pointer"
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
                    className="w-full px-4 py-3.5 bg-[#242936] rounded-xl text-base sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00d084] border-0"
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
                    className="w-full px-4 py-3.5 bg-[#242936] rounded-xl text-base sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00d084] border-0"
                  />
                </div>

                {/* 6. Chọn loại tiền tệ + Hint */}
                <div>
                  <div className="relative">
                    <select
                      value={sunwiseCurrency}
                      onChange={(e) => setSunwiseCurrency(e.target.value)}
                      className="w-full px-4 py-3.5 bg-[#242936] rounded-xl text-base sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#00d084] appearance-none cursor-pointer border-0"
                    >
                      <option value="VND" className="bg-[#242936] text-white">VND (₫) - Đồng Việt Nam</option>
                      <option value="USD" className="bg-[#242936] text-white">USD ($) - US Dollar</option>
                      <option value="EUR" className="bg-[#242936] text-white">EUR (€) - Euro</option>
                      <option value="CNY" className="bg-[#242936] text-white">CNY (¥) - Chinese Yuan</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-4 top-4 text-slate-400 pointer-events-none" />
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

          {/* ======================= TAB 3: KHÔI PHỤC MẬT KHẨU (SUN WISE CLOUD OTP) ======================= */}
          {authMode === 'forgot' && (
            <div>
              {/* Header Navigation */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/70">
                <button
                  type="button"
                  onClick={() => {
                    if (forgotStep === 2) {
                      setForgotStep(1);
                    } else {
                      setAuthMode('login');
                    }
                    setRecoveryError('');
                    setRecoverySuccess('');
                  }}
                  className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1.5 font-bold transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> {forgotStep === 2 ? 'Thay đổi Email/SĐT' : 'Quay Lại'}
                </button>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00d084]/10 text-[#00d084] border border-[#00d084]/30 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> MÁY CHỦ HÃNG OTP
                </span>
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

              {/* BƯỚC 1: NHẬP EMAIL HOẶC SỐ ĐIỆN THOẠI (SUN WISE APP GIAO DIỆN CHUẨN) */}
              {forgotStep === 1 && (
                <form onSubmit={handleSendRecoveryOtp} className="space-y-4">
                  <div className="mb-2">
                    <h3 className="text-xl font-extrabold text-slate-100 mb-1">
                      Khôi phục Mật khẩu
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span>Thay đổi phương thức</span>
                      <button
                        type="button"
                        onClick={() => {
                          setRecoveryChannel(recoveryChannel === 'email' ? 'phone' : 'email');
                          setRecoveryIdentity('');
                          setRecoveryError('');
                        }}
                        className="text-[#00d084] hover:underline font-bold cursor-pointer"
                      >
                        {recoveryChannel === 'email' ? 'Lấy lại bằng Số điện thoại' : 'Lấy lại bằng E-mail'}
                      </button>
                    </div>
                  </div>

                  {/* Input Email hoặc Phone */}
                  {recoveryChannel === 'email' ? (
                    <div>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          placeholder="E-mail"
                          value={recoveryIdentity}
                          onChange={(e) => setRecoveryIdentity(e.target.value)}
                          className="w-full px-4 py-3.5 bg-slate-900/90 border border-slate-800 rounded-xl text-base sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#00d084] transition"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex rounded-xl bg-slate-900/90 border border-slate-800 overflow-hidden focus-within:border-[#00d084] transition">
                        <select
                          value={recoveryAreaCode}
                          onChange={(e) => setRecoveryAreaCode(e.target.value)}
                          className="bg-transparent text-xs font-bold text-slate-200 px-3 py-3.5 border-r border-slate-800 focus:outline-none cursor-pointer"
                        >
                          <option value="+84" className="bg-slate-900 text-slate-200">+84 (VN)</option>
                          <option value="+86" className="bg-slate-900 text-slate-200">+86 (CN)</option>
                          <option value="+1" className="bg-slate-900 text-slate-200">+1 (US)</option>
                          <option value="+49" className="bg-slate-900 text-slate-200">+49 (DE)</option>
                          <option value="+33" className="bg-slate-900 text-slate-200">+33 (FR)</option>
                          <option value="+81" className="bg-slate-900 text-slate-200">+81 (JP)</option>
                        </select>
                        <input
                          type="tel"
                          required
                          placeholder="Số điện thoại"
                          value={recoveryIdentity}
                          onChange={(e) => setRecoveryIdentity(e.target.value)}
                          className="w-full px-3 py-3.5 bg-transparent text-base sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="w-full py-3.5 rounded-full bg-[#00d084] hover:bg-[#00b875] text-[#0d1117] font-black text-base shadow-xl shadow-[#00d084]/20 transition duration-200 mt-4 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {otpLoading ? 'Đang Gửi Yêu Cầu Hãng...' : 'Tiếp'}
                  </button>
                </form>
              )}

              {/* BƯỚC 2: NHẬP MÃ XÁC THỰC OTP VÀ MẬT KHẨU MỚI (SUN WISE APP GIAO DIỆN CHUẨN) */}
              {forgotStep === 2 && (
                <form onSubmit={handleVerifyOtpSubmit} className="space-y-3.5">
                  <div className="mb-2">
                    <h3 className="text-xl font-extrabold text-slate-100 mb-1">
                      Vui lòng nhập mã xác thực
                    </h3>
                    <p className="text-xs text-slate-400">
                      Mã xác thực đã được gửi đến <strong className="text-slate-200">{recoveryIdentity}</strong>
                    </p>
                  </div>

                  {/* Input OTP kèm Countdown Timer */}
                  <div>
                    <div className="flex rounded-xl bg-slate-900/90 border border-slate-800 overflow-hidden focus-within:border-[#00d084] transition">
                      <input
                        type="text"
                        maxLength={6}
                        required
                        placeholder="Vui lòng nhập mã xác thực..."
                        value={recoveryOtp}
                        onChange={(e) => setRecoveryOtp(e.target.value.trim())}
                        className="w-full px-3.5 py-3.5 bg-transparent text-base sm:text-sm font-mono tracking-widest text-[#00d084] placeholder-slate-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleSendRecoveryOtp}
                        disabled={otpLoading || otpCountdown > 0}
                        className="px-3 py-2 text-xs font-bold text-[#00d084] hover:text-emerald-300 disabled:text-slate-500 whitespace-nowrap transition cursor-pointer border-l border-slate-800"
                      >
                        {otpLoading ? '...' : (otpCountdown > 0 ? `${otpCountdown} s` : 'Gửi lại')}
                      </button>
                    </div>
                    <div className="text-right mt-1">
                      <button
                        type="button"
                        onClick={handleSendRecoveryOtp}
                        disabled={otpLoading || otpCountdown > 0}
                        className="text-[11px] text-cyan-400 hover:underline cursor-pointer disabled:text-slate-600"
                      >
                        Không nhận được mã xác minh?
                      </button>
                    </div>
                  </div>

                  {/* Nhập Mật Khẩu Mới */}
                  <div>
                    <div className="relative">
                      <input
                        type={showRecoveryPassword ? "text" : "password"}
                        required
                        placeholder="Nhập Mật khẩu"
                        value={recoveryNewPassword}
                        onChange={(e) => setRecoveryNewPassword(e.target.value)}
                        className="w-full px-3.5 pr-10 py-3.5 bg-slate-900/90 border border-slate-800 rounded-xl text-base sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#00d084] transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRecoveryPassword(!showRecoveryPassword)}
                        className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showRecoveryPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Nhập Lại Mật Khẩu */}
                  <div>
                    <div className="relative">
                      <input
                        type={showRecoveryConfirmPassword ? "text" : "password"}
                        required
                        placeholder="Vui lòng nhập lại mật khẩu."
                        value={recoveryConfirmPassword}
                        onChange={(e) => setRecoveryConfirmPassword(e.target.value)}
                        className="w-full px-3.5 pr-10 py-3.5 bg-slate-900/90 border border-slate-800 rounded-xl text-base sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#00d084] transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRecoveryConfirmPassword(!showRecoveryConfirmPassword)}
                        className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showRecoveryConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    ⓘ Vui lòng nhập mật khẩu dài 6-32 ký tự (phân biệt chữ hoa/thường).
                  </p>

                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="w-full py-3.5 rounded-full bg-[#00d084] hover:bg-[#00b875] text-[#0d1117] font-black text-base shadow-xl shadow-[#00d084]/20 transition duration-200 mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {otpLoading ? 'Đang Ghi Nhận Lên Máy Chủ Hãng...' : 'Hoàn thành'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Google Play Store Button (Chỉ hiển thị trên trình duyệt Web, TỰ ĐỘNG ẨN HOÀN TOÀN khi đang chạy trong App Native) */}
        {!isNative && (
          <div className="mt-4 px-5 sm:px-6 pb-2">
            <a
              href="https://play.google.com/store/apps/details?id=com.zenosolar.app"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-950 hover:from-slate-800 hover:to-slate-900 border border-slate-700/80 hover:border-emerald-500/60 text-slate-100 text-xs font-bold flex items-center justify-center gap-3 transition-all duration-200 shadow-xl cursor-pointer group"
            >
              {/* Google Play Color SVG Icon */}
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                <path d="M3.609 1.814L13.792 12 3.61 22.186A2.25 2.25 0 0 1 3 20.596V3.404c0-.62.228-1.206.609-1.59z" fill="#00C1A6"/>
                <path d="M17.186 8.608L13.792 12l3.394 3.392 3.847-2.185a1.408 1.408 0 0 0 0-2.414l-3.847-2.185z" fill="#FFD400"/>
                <path d="M3.609 1.814L13.792 12 17.186 8.608 5.617 2.036c-.636-.361-1.396-.342-2.008-.222z" fill="#00E676"/>
                <path d="M13.792 12L3.609 22.186c.612.12 1.372.139 2.008-.222l11.569-6.572L13.792 12z" fill="#FF3D00"/>
              </svg>
              <div className="text-left">
                <div className="text-[9.5px] text-slate-400 font-medium uppercase tracking-wider leading-none">TẢI VỀ TỪ</div>
                <div className="text-xs font-black text-white group-hover:text-emerald-400 transition leading-tight mt-0.5">Google Play (CH Play)</div>
              </div>
            </a>
          </div>
        )}

        {/* Footer Note */}
        <div className="text-center mt-3 text-[11px] text-slate-500 flex flex-col items-center justify-center gap-1">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-cyan-500" />
            <span>Bảo mật SSL 256-bit & Máy chủ Zeno Cloud Dedicated</span>
          </div>
          {onNavigateToPrivacy && (
            <button
              type="button"
              onClick={onNavigateToPrivacy}
              className="text-slate-400 hover:text-slate-300 underline cursor-pointer text-[10.5px] mt-0.5"
            >
              Chính sách quyền riêng tư
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

