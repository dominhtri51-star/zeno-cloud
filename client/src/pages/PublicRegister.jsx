import React, { useState, useEffect } from 'react';
import { Sun, Mail, Phone, Lock, User, Send, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck, Zap } from 'lucide-react';
import { publicService } from '../services/api';

export default function PublicRegister({ onBackToDashboard }) {
  const [regType, setRegType] = useState('email'); // 'email' | 'sms'
  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    cellphone: '',
    areaCode: '+84',
    code: '',
    password: '',
    confirmPassword: '',
    dealerInviteCode: '',
    serialNumber: ''
  });

  const [captchaId, setCaptchaId] = useState('');
  const [areaCodes, setAreaCodes] = useState([]);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadAreaCodes();
  }, []);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const loadAreaCodes = async () => {
    try {
      const res = await publicService.getAreaCodes();
      setAreaCodes(res.codes || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendOtp = async () => {
    setError('');
    setSuccessMsg('');

    if (regType === 'email' && !formData.email) {
      return setError('Vui lòng nhập địa chỉ Email để nhận mã OTP!');
    }
    if (regType === 'sms' && !formData.cellphone) {
      return setError('Vui lòng nhập số điện thoại để nhận mã OTP!');
    }

    setSendingOtp(true);
    try {
      const res = await publicService.sendOtp({
        type: regType,
        email: formData.email,
        cellphone: formData.cellphone,
        areaCode: formData.areaCode
      });

      if (res.success) {
        if (res.captchaId) {
          setCaptchaId(res.captchaId);
        }
        setSuccessMsg(res.message || 'Mã xác thực OTP đã được Cloud Hãng gửi thành công!');
        setCountdown(60); // 60s cooldown
      } else {
        setError(res.message || 'Gửi mã OTP thất bại');
      }
    } catch (err) {
      setError(err.message || 'Lỗi kết nối máy chủ gửi OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (formData.password.length < 6) {
      return setError('Mật khẩu phải từ 6 ký tự trở lên');
    }
    if (formData.password !== formData.confirmPassword) {
      return setError('Nhập lại mật khẩu không khớp');
    }
    if (!formData.code) {
      return setError('Vui lòng nhập mã OTP xác nhận');
    }

    setLoading(true);
    try {
      const res = await publicService.register({
        userName: formData.userName,
        email: regType === 'email' ? formData.email : '',
        cellphone: regType === 'sms' ? formData.cellphone : '',
        areaCode: formData.areaCode,
        code: formData.code,
        captchaId: captchaId,
        password: formData.password,
        dealerInviteCode: formData.dealerInviteCode,
        serialNumber: formData.serialNumber
      });

      if (res.success) {
        setSuccessMsg(res.message || 'Đăng ký tài khoản và liên kết Cloud Hãng thành công! Đang vào hệ thống...');
        if (res.user && res.token) {
          localStorage.setItem('zeno_user', JSON.stringify(res.user));
          localStorage.setItem('zeno_token', res.token);
          localStorage.setItem('zeno_mode', 'LIVE');
          setTimeout(() => {
            window.location.href = '/';
          }, 1200);
        }
      } else {
        setError(res.message || 'Đăng ký thất bại');
      }
    } catch (err) {
      setError(err.message || 'Lỗi gửi yêu cầu đăng ký');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Back Link */}
        {onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            className="mb-4 text-xs font-semibold text-slate-400 hover:text-cyan-400 flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại Bảng Điều Khiển Đại Lý
          </button>
        )}

        <div className="glass-card rounded-3xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-amber-400 p-0.5 shadow-xl shadow-cyan-500/20 flex items-center justify-center mb-3">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Sun className="w-8 h-8 text-cyan-400" />
              </div>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">
              Đăng Ký Tài Khoản Chủ Nhà
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Cổng tự đăng ký dành cho Chủ Hộ Gia Đình sử dụng Biến Tần Zeno Solar
            </p>
          </div>

          {/* Notice Banner */}
          <div className="mb-5 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200">Cổng đăng ký dành riêng cho Chủ Nhà / Khách Hàng cá nhân.</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Tài khoản <strong>Thợ Lắp Đặt & Đại Lý Phân Phối</strong> do Tổng Công Ty Zeno Solar cấp chính thức qua hợp đồng phân phối.
              </p>
            </div>
          </div>

          {/* Registration Method Switcher */}
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => setRegType('email')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                regType === 'email'
                  ? 'bg-slate-800 text-cyan-400 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mail className="w-3.5 h-3.5" /> Đăng Ký Bằng Email
            </button>
            <button
              type="button"
              onClick={() => setRegType('sms')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                regType === 'sms'
                  ? 'bg-slate-800 text-cyan-400 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Phone className="w-3.5 h-3.5" /> Đăng Ký Bằng Số Điện Thoại
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Họ và tên của bạn *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={formData.userName}
                  onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Email or Phone with OTP Button */}
            {regType === 'email' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Địa chỉ Email nhận mã OTP *
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="ban@gmail.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={countdown > 0 || sendingOtp}
                    onClick={handleSendOtp}
                    className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold whitespace-nowrap transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {countdown > 0 ? `Gửi lại (${countdown}s)` : sendingOtp ? 'Đang gửi...' : 'Gửi Mã OTP'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Số điện thoại nhận mã SMS *
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.areaCode}
                    onChange={(e) => setFormData({ ...formData, areaCode: e.target.value })}
                    className="w-24 px-2 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    {areaCodes.map((c, idx) => (
                      <option key={idx} value={c.code}>
                        {c.code} ({c.name})
                      </option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="tel"
                      required
                      placeholder="0912345678"
                      value={formData.cellphone}
                      onChange={(e) => setFormData({ ...formData, cellphone: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={countdown > 0 || sendingOtp}
                    onClick={handleSendOtp}
                    className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold whitespace-nowrap transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {countdown > 0 ? `Gửi lại (${countdown}s)` : sendingOtp ? 'Đang gửi...' : 'Gửi Mã OTP'}
                  </button>
                </div>
              </div>
            )}

            {/* OTP Code input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Mã xác nhận OTP (6 chữ số) *
              </label>
              <input
                type="text"
                required
                maxLength="6"
                placeholder="Nhập mã OTP 6 số"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 font-mono tracking-widest text-center focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mật khẩu *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="Tối thiểu 8 ký tự"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nhập lại mật khẩu *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="Xác nhận mật khẩu"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Optional Serial Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Số Serial Máy Biến Tần Inverter (Tùy chọn)
              </label>
              <div className="relative">
                <Zap className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="VD: 3528214760-1 (để tự động kết nối trạm)"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            {/* Optional Dealer / Tech Invite Code */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Mã Kỹ Thuật Viên / Thợ Lắp Đặt (Nếu có)
              </label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Nhập mã kỹ thuật viên (được cấp bởi SUNGO)"
                  value={formData.dealerInviteCode}
                  onChange={(e) => setFormData({ ...formData, dealerInviteCode: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-amber-400 hover:from-cyan-400 hover:to-amber-300 text-slate-950 font-extrabold text-sm shadow-xl shadow-cyan-500/20 transition duration-200 mt-4 disabled:opacity-50"
            >
              {loading ? 'Đang kích hoạt tài khoản...' : 'Hoàn Tất Đăng Ký Tài Khoản'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
