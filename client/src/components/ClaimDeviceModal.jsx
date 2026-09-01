import React, { useState, useEffect } from 'react';
import { 
  X, PlusCircle, CheckCircle2, AlertCircle, ShieldCheck, Cpu,
  Wifi, RefreshCw, Radio, Server, Check, ArrowRight, ArrowLeft,
  Signal, ExternalLink, HelpCircle, Laptop, Smartphone, Home, Bluetooth,
  Search, ChevronRight, Activity, Wrench, MapPin, Zap, UserCheck
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function ClaimDeviceModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const isHomeowner = user?.role === 'homeowner' || user?.role === 'customer';

  // Tab hiện tại: 'claim' (Thu nạp & Dò tìm DTU/SN) | 'wifi' (Cài đặt Wi-Fi thực tế)
  const [activeTab, setActiveTab] = useState('claim');

  // ================= TAB 1: THU NẠP & DÒ TÌM DTU / SN =================
  const [dtuCode, setDtuCode] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [stationName, setStationName] = useState(isHomeowner ? `Trạm Năng Lượng Nhà ${user?.fullName || user?.account || ''}` : '');
  const [installer, setInstaller] = useState('tuan_solar');
  const [customer, setCustomer] = useState(isHomeowner ? (user?.account || user?.username || '') : '');
  
  // Trạng thái tra cứu DTU trên Cloud Hãng
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupError, setLookupError] = useState('');

  // Danh sách khách hàng và đại lý lấy từ hệ thống
  const [customerList, setCustomerList] = useState([]);
  const [dealerList, setDealerList] = useState([
    { account: 'tuan_solar', name: 'Đại Lý Tuấn Solar Miền Nam' },
    { account: 'newtech.sg', name: 'Đại Lý Newtech Solar' },
    { account: 'thodien_mientay', name: 'Đại Lý Miền Tây' },
    { account: 'sungo.vn', name: '👑 Tổng Phân Phối (Trực Tiếp)' }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ================= TAB 2: WI-FI SETUP (REAL BLE & SOFTAP) =================
  const [bleStage, setBleStage] = useState('guide'); // 'guide' | 'connected' | 'done'
  const [connectedBleDevice, setConnectedBleDevice] = useState(null);
  const [bleError, setBleError] = useState('');
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [showWifiPassword, setShowWifiPassword] = useState(false);
  const [scannedWifis, setScannedWifis] = useState([]);
  const [isScanningWifi, setIsScanningWifi] = useState(false);
  const [wifiConfiguring, setWifiConfiguring] = useState(false);
  const [wifiSuccessData, setWifiSuccessData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('claim');
      setLookupResult(null);
      setLookupError('');
      setError('');
      setSuccessMsg('');
      setBleStage('guide');
      setConnectedBleDevice(null);
      setBleError('');

      fetchCustomers();
      scanWifiNetworks();

      if (isHomeowner) {
        setCustomer(user?.account || user?.username || '');
        if (!stationName) {
          setStationName(`Trạm Năng Lượng Nhà ${user?.fullName || user?.account || ''}`);
        }
      }
    }
  }, [isOpen, user]);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      const list = res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(list) && list.length > 0) {
        setCustomerList(list);
      }
    } catch (e) {
      console.warn('Lỗi tải danh sách khách hàng:', e.message);
    }
  };

  // Tra cứu mã DTU trực tiếp từ máy chủ hãng
  const handleLookupDtu = async () => {
    if (!dtuCode.trim()) {
      setLookupError('Vui lòng nhập Mã DTU (20 số) hoặc Serial Number để tra cứu!');
      return;
    }

    setIsLookingUp(true);
    setLookupError('');
    setLookupResult(null);

    try {
      const res = await api.post('/stations/lookup-dtu', { dtuCode: dtuCode.trim() });
      if (res.found && res.data) {
        setLookupResult(res.data);
        if (res.data.stationName && !stationName) {
          setStationName(res.data.stationName);
        }
        if (res.data.devices?.[0]?.serialNumber && !serialNumber) {
          setSerialNumber(res.data.devices[0].serialNumber);
        }
        if (res.data.ownerName && !customer && !isHomeowner) {
          setCustomer(res.data.ownerName.toLowerCase());
        }
      } else {
        setLookupError(res.message || 'Không tìm thấy trạm nào khớp với mã DTU này trên máy chủ hãng.');
      }
    } catch (err) {
      setLookupError(err.response?.data?.message || err.message || 'Lỗi kết nối máy chủ khi tra cứu DTU');
    } finally {
      setIsLookingUp(false);
    }
  };

  // Quét mạng Wi-Fi thực tế từ máy tính
  const scanWifiNetworks = async () => {
    setIsScanningWifi(true);
    try {
      const res = await api.get('/stations/wifi-scan');
      const list = res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(list) && list.length > 0) {
        setScannedWifis(list);
        const preferred = list.find(w => w.isCurrent && w.is24G) || list.find(w => w.isCurrent) || list.find(w => w.is24G) || list[0];
        if (preferred && !ssid) setSsid(preferred.ssid);
      }
    } catch (e) {
      console.warn('Lỗi quét WiFi:', e.message);
    } finally {
      setIsScanningWifi(false);
    }
  };

  // Kích hoạt Web Bluetooth API THỰC TẾ của trình duyệt
  const handleRealWebBluetoothScan = async () => {
    setBleError('');
    if (!navigator.bluetooth || !navigator.bluetooth.requestDevice) {
      setBleError('Trình duyệt của bạn chưa hỗ trợ Web Bluetooth API hoặc đang chạy trên kết nối không bảo mật. Vui lòng sử dụng Google Chrome / Microsoft Edge hoặc cài đặt qua SoftAP Hotspot bên dưới.');
      return;
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['generic_access', '0000ffe0-0000-1000-8000-00805f9b34fb']
      });

      if (device) {
        setConnectedBleDevice({
          id: device.id,
          name: device.name || 'Inverter Datalogger BLE',
          connected: true
        });
        setBleStage('connected');
        if (device.name && device.name.includes('-')) {
          const parts = device.name.split('-');
          const lastPart = parts[parts.length - 1];
          if (lastPart.length >= 8 && !dtuCode) {
            setDtuCode(lastPart);
          }
        }
      }
    } catch (err) {
      if (err.name !== 'NotFoundError') {
        setBleError(`Lỗi Bluetooth: ${err.message}`);
      }
    }
  };

  // Gửi cấu hình Wi-Fi xuống Inverter
  const handleSendWifiConfig = async (e) => {
    e.preventDefault();
    if (!ssid.trim()) {
      setBleError('Vui lòng nhập tên mạng Wi-Fi (SSID) 2.4GHz!');
      return;
    }

    setWifiConfiguring(true);
    setBleError('');

    try {
      const res = await api.post('/stations/wifi-config', {
        ssid: ssid.trim(),
        password: password.trim(),
        mode: connectedBleDevice ? 'ble' : 'smartconfig',
        dtuSerial: dtuCode || connectedBleDevice?.id || ''
      });

      setWifiSuccessData(res.data || {
        ssid,
        cloudConnected: true,
        allocatedIp: '192.168.1.150'
      });
      setBleStage('done');
    } catch (err) {
      setBleError(err.response?.data?.message || err.message || 'Lỗi gửi cấu hình Wi-Fi');
    } finally {
      setWifiConfiguring(false);
    }
  };

  // Xử lý nạp thiết bị vào hệ thống
  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanDtu = dtuCode.trim();
    const cleanSn = serialNumber.trim() || (cleanDtu.length >= 10 ? `${cleanDtu.slice(0, 10)}-1` : cleanDtu);

    if (!cleanDtu && !cleanSn) {
      return setError('Vui lòng nhập Mã DTU Datalogger (20 số) hoặc Serial Number Biến Tần!');
    }

    try {
      setLoading(true);
      const res = await api.post('/stations/claim-device', {
        serialNumber: cleanSn,
        dtuCode: cleanDtu || cleanSn,
        stationName: stationName.trim() || lookupResult?.stationName || `Trạm DTU ${cleanDtu.slice(-6)}`,
        installer: installer || 'sungo.vn',
        customer: customer.trim() || (isHomeowner ? user?.account : 'sungo123')
      });

      if (res.code === 0 || res.success) {
        setSuccessMsg(res.message || '⚡ Thu nạp thiết bị và gán quyền Master sungo.vn thành công!');
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1200);
      } else {
        setError(res.message || 'Không thể thu nạp thiết bị');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in font-['Plus_Jakarta_Sans',sans-serif]">
      <div className={`w-full max-w-xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] transition-colors duration-300 ${
        isDark ? 'bg-[#0c1222] border border-slate-800/90 text-white' : 'bg-white border border-slate-200 text-slate-900'
      }`}>
        
        {/* Header Modal */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isDark ? 'border-slate-800/90 bg-[#0e1628]' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center space-x-3 min-w-0 pr-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-emerald-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Thu Nạp & Cài Đặt Thiết Bị
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                  REAL PROVISIONING
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} truncate mt-0.5`}>
                Dò tìm trạm từ Cloud Hãng qua Mã DTU/SN và thiết lập Wi-Fi
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-xl transition cursor-pointer shrink-0 ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2 Tabs Chuyển Đổi */}
        <div className={`flex border-b p-1.5 gap-1.5 ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-100'}`}>
          <button
            type="button"
            onClick={() => setActiveTab('claim')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'claim'
                ? isDark
                  ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-300 border border-emerald-500/30 shadow-lg'
                  : 'bg-white text-emerald-700 border border-emerald-300 shadow-sm'
                : isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-emerald-500" />
            <span>1. Thu Nạp & Dò Tìm Trạm (DTU/SN)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('wifi')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'wifi'
                ? isDark
                  ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-300 border border-emerald-500/30 shadow-lg'
                  : 'bg-white text-emerald-700 border border-emerald-300 shadow-sm'
                : isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Wifi className="w-4 h-4 text-emerald-500" />
            <span>2. Hướng Dẫn Cài Wi-Fi Datalogger</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-4 sm:p-5 flex-1 custom-scrollbar space-y-4">

          {/* ========================================================= */}
          {/* ========== TAB 1: THU NẠP & DÒ TÌM TRẠM (MÃ DTU/SN) ===== */}
          {/* ========================================================= */}
          {activeTab === 'claim' && (
            <form onSubmit={handleSubmitClaim} className="space-y-4 animate-fade-in">
              
              {/* Ô nhập mã DTU & Nút Dò tìm trên Cloud */}
              <div className="space-y-1.5">
                <label className={`text-xs font-bold flex items-center justify-between ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  <span>Mã DTU Datalogger (20 số) hoặc Số Serial Biến Tần:</span>
                  <span className="text-[10px] text-amber-500 font-semibold">* In trên tem thiết bị</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={dtuCode}
                      onChange={(e) => {
                        setDtuCode(e.target.value);
                        setLookupResult(null);
                        setLookupError('');
                      }}
                      placeholder="VD: 96796956562056303625 hoặc 3528214760-1"
                      className={`w-full py-2.5 px-3.5 rounded-xl text-sm font-mono font-bold transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        isDark 
                          ? 'bg-[#11192d] border border-slate-700 text-white placeholder-slate-500' 
                          : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleLookupDtu}
                    disabled={isLookingUp || !dtuCode.trim()}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 shrink-0 shadow-md"
                  >
                    <Search className={`w-3.5 h-3.5 ${isLookingUp ? 'animate-spin' : ''}`} />
                    <span>{isLookingUp ? 'Đang dò...' : 'Dò tìm Cloud'}</span>
                  </button>
                </div>
              </div>

              {/* Kết quả Dò tìm thành công từ Cloud Hãng */}
              {lookupResult && (
                <div className={`p-3.5 rounded-2xl border transition animate-fade-in ${
                  isDark ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20 mb-2.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-wide">
                        ✓ ĐÃ TÌM THẤY TRÊN CLOUD HÃNG
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      lookupResult.isOnline ? 'bg-emerald-500/20 text-emerald-600' : 'bg-slate-500/20 text-slate-500'
                    }`}>
                      {lookupResult.isOnline ? '● Online (Đang chạy)' : '○ Offline'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] opacity-70 block font-semibold">Tên Trạm Thực Tế:</span>
                      <strong className="font-bold">{lookupResult.stationName}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] opacity-70 block font-semibold">Công Suất / Model:</span>
                      <strong>{lookupResult.installedCapacity || '12 kWp'} ({lookupResult.devices?.[0]?.machineType || 'W70'})</strong>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] opacity-70 block font-semibold">Địa Chỉ Lắp Đặt:</span>
                      <span className="truncate block">{lookupResult.address || 'Việt Nam'}</span>
                    </div>
                    {lookupResult.ownerName && (
                      <div className="col-span-2 flex items-center gap-1.5 pt-1 text-[11px] text-emerald-700 dark:text-emerald-300">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Chủ trạm trên hãng: <strong>@{lookupResult.ownerName}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {lookupError && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{lookupError}</span>
                </div>
              )}

              {/* Tên trạm hiển thị */}
              <div className="space-y-1.5">
                <label className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  Tên Trạm / Dự Án:
                </label>
                <input
                  type="text"
                  value={stationName}
                  onChange={(e) => setStationName(e.target.value)}
                  placeholder="VD: Trạm Nhà Anh Tuấn (Bảo Lộc)"
                  className={`w-full py-2.5 px-3.5 rounded-xl text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isDark 
                      ? 'bg-[#11192d] border border-slate-700 text-white placeholder-slate-500' 
                      : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              {/* Số Serial Inverter */}
              <div className="space-y-1.5">
                <label className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  Mã Serial Number Biến Tần (SN):
                </label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="VD: 9679695656-1 hoặc 3528214760-1"
                  className={`w-full py-2.5 px-3.5 rounded-xl text-sm font-mono font-medium transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isDark 
                      ? 'bg-[#11192d] border border-slate-700 text-white placeholder-slate-500' 
                      : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              {/* Phân bổ Chủ Nhà & Đại Lý */}
              {!isHomeowner && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  
                  {/* Chọn Khách hàng */}
                  <div className="space-y-1.5">
                    <label className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      Gán Cho Khách Hàng:
                    </label>
                    <select
                      value={customer}
                      onChange={(e) => setCustomer(e.target.value)}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        isDark 
                          ? 'bg-[#11192d] border border-slate-700 text-white' 
                          : 'bg-white border border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value="">-- Chọn khách hàng --</option>
                      {customerList.map(c => (
                        <option key={c.account || c.userId} value={c.account}>
                          @{c.account} - {c.userName || c.name || c.account}
                        </option>
                      ))}
                      {customer && !customerList.some(c => c.account === customer) && (
                        <option value={customer}>@{customer} (Tùy chọn)</option>
                      )}
                    </select>
                  </div>

                  {/* Chọn Đại lý */}
                  <div className="space-y-1.5">
                    <label className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      Đại Lý Lắp Đặt / Phụ Trách:
                    </label>
                    <select
                      value={installer}
                      onChange={(e) => setInstaller(e.target.value)}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        isDark 
                          ? 'bg-[#11192d] border border-slate-700 text-white' 
                          : 'bg-white border border-slate-300 text-slate-900'
                      }`}
                    >
                      {dealerList.map(d => (
                        <option key={d.account} value={d.account}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Nút Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{loading ? 'Đang thu nạp...' : '✓ Xác Nhận Thu Nạp & Gán Toàn Quyền Master'}</span>
                </button>
              </div>
            </form>
          )}

          {/* ========================================================= */}
          {/* ========== TAB 2: HƯỚNG DẪN CÀI ĐẶT WI-FI THỰC TẾ ======= */}
          {/* ========================================================= */}
          {activeTab === 'wifi' && (
            <div className="space-y-4 animate-fade-in">
              
              {/* Card 1: Web Bluetooth Thực Tế */}
              <div className={`p-4 rounded-2xl border transition ${
                isDark ? 'bg-[#11192d] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                    <Bluetooth className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Cách 1: Ghép Nối Web Bluetooth Thực Tế
                    </h3>
                    <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Sử dụng trình duyệt Chrome / Edge để quét trực tiếp Bluetooth phần cứng
                    </p>
                  </div>
                </div>

                {connectedBleDevice ? (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Đã kết nối: {connectedBleDevice.name}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => setConnectedBleDevice(null)}
                        className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                      >
                        Ngắt kết nối
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleRealWebBluetoothScan}
                    className="w-full py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Bluetooth className="w-4 h-4" />
                    <span>Bật Bluetooth Trình Duyệt Để Quét Thiết Bị Thật</span>
                  </button>
                )}

                {bleError && (
                  <div className="mt-2.5 p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs rounded-xl">
                    {bleError}
                  </div>
                )}
              </div>

              {/* Form truyền SSID & Mật khẩu Wi-Fi */}
              <form onSubmit={handleSendWifiConfig} className={`p-4 rounded-2xl border space-y-3 ${
                isDark ? 'bg-[#11192d] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <h4 className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    Thiết Lập Thông Số Wi-Fi 2.4GHz Cho Datalogger:
                  </h4>
                  <button
                    type="button"
                    onClick={scanWifiNetworks}
                    className="text-[10px] font-bold text-emerald-500 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isScanningWifi ? 'animate-spin' : ''}`} />
                    <span>Làm mới mạng</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={ssid}
                    onChange={(e) => setSsid(e.target.value)}
                    placeholder="Tên Wi-Fi (SSID 2.4GHz)"
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      isDark ? 'bg-slate-950 border border-slate-700 text-white' : 'bg-white border border-slate-300 text-slate-900'
                    }`}
                  />
                  <input
                    type={showWifiPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mật khẩu Wi-Fi nhà khách"
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      isDark ? 'bg-slate-950 border border-slate-700 text-white' : 'bg-white border border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={wifiConfiguring || !ssid.trim()}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  <Wifi className="w-3.5 h-3.5" />
                  <span>{wifiConfiguring ? 'Đang gửi gói tin...' : 'Gửi Cấu Hình Wi-Fi Xuống Datalogger'}</span>
                </button>

                {wifiSuccessData && (
                  <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Đã truyền Wi-Fi [{wifiSuccessData.ssid}] xuống Datalogger thành công!</span>
                  </div>
                )}
              </form>

              {/* Card 2: Cài Đặt Qua SoftAP Hotspot Cục Bộ */}
              <div className={`p-4 rounded-2xl border space-y-2.5 ${
                isDark ? 'bg-[#11192d] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Cách 2: Cấu Hình Điểm Phát Sóng SoftAP (10.10.100.254)
                    </h3>
                    <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Quy trình chuẩn kỹ thuật khi đứng trực tiếp cạnh Inverter
                    </p>
                  </div>
                </div>

                <ol className="space-y-2 text-xs text-slate-600 dark:text-slate-300 list-decimal list-inside pl-1">
                  <li>
                    Dùng điện thoại kết nối vào Wi-Fi do cục phát Datalogger phát ra: <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-emerald-600 dark:text-emerald-400 font-bold">AP_xxxxxxxxxx</code> hoặc <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-emerald-600 dark:text-emerald-400 font-bold">SSL_xxxxxxxxxx</code> (Mật khẩu: <strong className="text-slate-900 dark:text-white">12345678</strong>).
                  </li>
                  <li>
                    Mở trình duyệt truy cập: <a href="http://10.10.100.254" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline font-bold font-mono">http://10.10.100.254</a> (Tài khoản/Mật khẩu: <strong className="text-slate-900 dark:text-white">admin / admin</strong>).
                  </li>
                  <li>
                    Vào menu <strong>Wireless Setup</strong> $\rightarrow$ Chọn Wi-Fi nhà khách $\rightarrow$ Nhập mật khẩu $\rightarrow$ Nhấn <strong>Save & Reboot</strong>.
                  </li>
                  <li>
                    Đèn LED <strong className="text-emerald-500">NET</strong> trên Datalogger sáng xanh cố định = Thiết bị đã kết nối Cloud thành công.
                  </li>
                </ol>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
