import React, { useState, useEffect, useRef } from 'react';
import { 
  X, PlusCircle, CheckCircle2, AlertCircle, ShieldCheck, Cpu,
  Wifi, RefreshCw, Radio, Server, Check, ArrowRight, ArrowLeft,
  Signal, ExternalLink, HelpCircle, Laptop, Smartphone, Home, Bluetooth,
  Search, ChevronRight, Activity, Wrench, MapPin, Zap, UserCheck, Link2,
  Battery, SlidersHorizontal, SignalHigh
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { bleService, classifyBleDevice } from '../services/bleService';

export default function ClaimDeviceModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const currentAccount = user?.account || user?.username || 'khach_hang';
  const isHomeowner = user?.role === 'homeowner' || user?.role === 'customer' || user?.userType === 3;

  // Tab 1: 'wifi' (Cài đặt Wi-Fi Datalogger) | Tab 2: 'claim' (Liên kết thiết bị vào tài khoản)
  const [activeTab, setActiveTab] = useState('wifi');

  // ================= TAB 1: WI-FI SETUP (REAL BLE & SOFTAP) =================
  const [bleStage, setBleStage] = useState('guide'); // 'guide' | 'connected' | 'done'
  const [connectedBleDevice, setConnectedBleDevice] = useState(null);
  const [discoveredBleDevices, setDiscoveredBleDevices] = useState([]);
  const [isScanningBle, setIsScanningBle] = useState(false);
  const [filterOnlySolar, setFilterOnlySolar] = useState(true);
  const scanHandleRef = useRef(null);

  const [detectedDtuCode, setDetectedDtuCode] = useState('');
  const [detectedSn, setDetectedSn] = useState('');
  const [bleError, setBleError] = useState('');
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [showWifiPassword, setShowWifiPassword] = useState(false);
  const [scannedWifis, setScannedWifis] = useState([]);
  const [isScanningWifi, setIsScanningWifi] = useState(false);
  const [wifiConfiguring, setWifiConfiguring] = useState(false);
  const [wifiSuccessData, setWifiSuccessData] = useState(null);

  // ================= TAB 2: LIÊN KẾT THIẾT BỊ (MÃ DTU / SN) =================
  const [dtuCode, setDtuCode] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [stationName, setStationName] = useState(`Trạm Năng Lượng Nhà ${user?.fullName || currentAccount}`);
  const [installer, setInstaller] = useState('tuan_solar');
  const [customer, setCustomer] = useState(currentAccount);
  
  // Trạng thái tra cứu DTU trên Cloud Hãng
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupError, setLookupError] = useState('');

  // Danh sách đại lý
  const [dealerList, setDealerList] = useState([
    { account: 'tuan_solar', name: 'Đại Lý Tuấn Solar Miền Nam' },
    { account: 'newtech.sg', name: 'Đại Lý Newtech Solar' },
    { account: 'thodien_mientay', name: 'Đại Lý Miền Tây' },
    { account: 'sungo.vn', name: '👑 Tổng Phân Phối (Trực Tiếp)' }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setActiveTab('wifi');
      setLookupResult(null);
      setLookupError('');
      setError('');
      setSuccessMsg('');
      setBleStage('guide');
      setConnectedBleDevice(null);
      setDiscoveredBleDevices([]);
      setIsScanningBle(false);
      setDetectedDtuCode('');
      setDetectedSn('');
      setBleError('');
      setCustomer(currentAccount);
      setStationName(`Trạm Năng Lượng Nhà ${user?.fullName || currentAccount}`);

      scanWifiNetworks();
    } else {
      handleStopBleScan();
    }
  }, [isOpen, user]);

  // Dọn dẹp BLE khi unmount
  useEffect(() => {
    return () => {
      handleStopBleScan();
    };
  }, []);

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

  // Bắt đầu quét Bluetooth BLE Native / Web
  const handleStartBleScan = async () => {
    setBleError('');
    setIsScanningBle(true);
    setDiscoveredBleDevices([]);

    const result = await bleService.startScan({
      onDeviceDiscovered: (device) => {
        setDiscoveredBleDevices((prev) => {
          const index = prev.findIndex((d) => d.id === device.id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = { ...updated[index], ...device };
            return updated;
          }
          return [...prev, device];
        });
      },
      onError: (errorMsg) => {
        setBleError(errorMsg);
        setIsScanningBle(false);
      },
      onScanComplete: () => {
        setIsScanningBle(false);
      }
    });

    if (result && result.stop) {
      scanHandleRef.current = result.stop;
    }
  };

  // Dừng quét Bluetooth
  const handleStopBleScan = async () => {
    if (scanHandleRef.current) {
      try {
        await scanHandleRef.current();
      } catch (e) {}
      scanHandleRef.current = null;
    }
    await bleService.stopScan();
    setIsScanningBle(false);
  };

  // Chọn và ghép nối thiết bị BLE được phát hiện
  const handleSelectBleDevice = (device) => {
    handleStopBleScan();
    setConnectedBleDevice(device);
    setBleStage('connected');

    if (device.extractedDtu) {
      const dtu = device.extractedDtu;
      const sn = dtu.length >= 10 ? `${dtu.slice(0, 10)}-1` : `${dtu}-1`;
      setDetectedDtuCode(dtu);
      setDetectedSn(sn);
      setDtuCode(dtu);
      setSerialNumber(sn);
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
        dtuSerial: dtuCode || detectedDtuCode || connectedBleDevice?.id || ''
      });

      setWifiSuccessData(res.data || {
        ssid,
        cloudConnected: true,
        allocatedIp: '192.168.1.150'
      });
      setBleStage('done');

      // Tự động chuyển DTU / SN sang tab liên kết tài khoản
      if (detectedDtuCode) {
        setDtuCode(detectedDtuCode);
        setSerialNumber(detectedSn || `${detectedDtuCode.slice(0, 10)}-1`);
      }
    } catch (err) {
      setBleError(err.response?.data?.message || err.message || 'Lỗi gửi cấu hình Wi-Fi');
    } finally {
      setWifiConfiguring(false);
    }
  };

  // Chuyển sang Tab 2 với mã DTU / SN đã được thu nạp sẵn
  const handleProceedToClaim = () => {
    setActiveTab('claim');
    if (dtuCode.trim() || detectedDtuCode) {
      handleLookupDtu(dtuCode.trim() || detectedDtuCode);
    }
  };

  // Tra cứu mã DTU trực tiếp từ máy chủ hãng
  const handleLookupDtu = async (overrideCode = null) => {
    const codeToQuery = (overrideCode || dtuCode).trim();
    if (!codeToQuery) {
      setLookupError('Vui lòng nhập Mã DTU (20 số) hoặc Serial Number để tra cứu!');
      return;
    }

    setIsLookingUp(true);
    setLookupError('');
    setLookupResult(null);

    try {
      const res = await api.post('/stations/lookup-dtu', { dtuCode: codeToQuery });
      if (res.found && res.data) {
        setLookupResult(res.data);
        if (res.data.stationName) {
          setStationName(res.data.stationName);
        }
        if (res.data.devices?.[0]?.serialNumber) {
          setSerialNumber(res.data.devices[0].serialNumber);
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

  // Xử lý nạp thiết bị vào hệ thống và liên kết cho tài khoản hiện tại
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
        customer: currentAccount // Luôn gắn chặt vào tài khoản người dùng cuối đang đăng nhập!
      });

      if (res.code === 0 || res.success) {
        setSuccessMsg(res.message || `⚡ Liên kết thiết bị thành công vào tài khoản @${currentAccount}!`);
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1200);
      } else {
        setError(res.message || 'Không thể liên kết thiết bị');
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 via-teal-500/20 to-emerald-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Wifi className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Cài Đặt Wi-Fi & Liên Kết Thiết Bị
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                  DÀNH CHO CHỦ TRẠM
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} truncate mt-0.5`}>
                Thiết lập kết nối mạng và liên kết Inverter vào tài khoản <strong className="text-emerald-500">@{currentAccount}</strong>
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

        {/* 2 Tabs Chuyển Đổi (Tab 1: Wi-Fi, Tab 2: Liên kết thiết bị) */}
        <div className={`flex border-b p-1.5 gap-1.5 ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-100'}`}>
          <button
            type="button"
            onClick={() => setActiveTab('wifi')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'wifi'
                ? isDark
                  ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/10 text-cyan-300 border border-cyan-500/30 shadow-lg'
                  : 'bg-white text-cyan-700 border border-cyan-300 shadow-sm'
                : isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Wifi className="w-4 h-4 text-cyan-500" />
            <span>1. Cài Đặt Wi-Fi Datalogger</span>
          </button>

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
            <Link2 className="w-4 h-4 text-emerald-500" />
            <span>2. Liên Kết Thiết Bị & Trạm</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-4 sm:p-5 flex-1 custom-scrollbar space-y-4">

          {/* ========================================================= */}
          {/* ========== TAB 1: CÀI ĐẶT WI-FI DATALOGGER ============== */}
          {/* ========================================================= */}
          {activeTab === 'wifi' && (
            <div className="space-y-4 animate-fade-in">
              
              {/* Card 1: Bluetooth Radar Scanner Thông Minh Cho Inverter & DTU */}
              <div className={`p-4 rounded-2xl border transition ${
                isDark ? 'bg-[#11192d] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isScanningBle 
                        ? 'bg-cyan-500/20 text-cyan-400 animate-pulse border border-cyan-500/40' 
                        : 'bg-cyan-500/15 text-cyan-500'
                    }`}>
                      <Bluetooth className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Cách 1: Radar Quét Bluetooth Inverter / DTU
                      </h3>
                      <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Tự động nhận diện Biến Tần & Pin Solar, lọc bỏ tai nghe/loa rác
                      </p>
                    </div>
                  </div>

                  {/* Nút bật/tắt bộ lọc Solar */}
                  <button
                    type="button"
                    onClick={() => setFilterOnlySolar(!filterOnlySolar)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                      filterOnlySolar
                        ? isDark
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : isDark
                          ? 'bg-slate-800 text-slate-400 border-slate-700'
                          : 'bg-slate-200 text-slate-600 border-slate-300'
                    }`}
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    <span>{filterOnlySolar ? '⚡ Chỉ hiện Inverter' : 'Hiện tất cả BLE'}</span>
                  </button>
                </div>

                {connectedBleDevice ? (
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Đã ghép nối: {connectedBleDevice.displayName || connectedBleDevice.name}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => {
                          setConnectedBleDevice(null);
                          setDetectedDtuCode('');
                          setDetectedSn('');
                        }}
                        className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                      >
                        Đổi thiết bị khác
                      </button>
                    </div>
                    {connectedBleDevice.deviceType && (
                      <div className="text-[10px] inline-block font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {connectedBleDevice.deviceType}
                      </div>
                    )}
                    {detectedDtuCode && (
                      <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-500/15 p-2 rounded-lg flex items-center justify-between">
                        <span>✓ Đã thu nạp Mã DTU: <strong>{detectedDtuCode}</strong></span>
                        <span className="text-[10px] font-sans opacity-80">(Tự điền sang Tab 2)</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Nút hành động Quét Bluetooth */}
                    <div className="flex gap-2">
                      {!isScanningBle ? (
                        <button
                          type="button"
                          onClick={handleStartBleScan}
                          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-cyan-500/20"
                        >
                          <Bluetooth className="w-4 h-4" />
                          <span>📡 Bật Bluetooth Quét Biến Tần & DTU</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleStopBleScan}
                          className="flex-1 py-2.5 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-md animate-pulse"
                        >
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Đang Quét Radar BLE... (Bấm để dừng)</span>
                        </button>
                      )}
                    </div>

                    {/* Danh sách thiết bị quét được */}
                    {isScanningBle && discoveredBleDevices.length === 0 && (
                      <div className="p-4 rounded-xl border border-dashed border-cyan-500/30 bg-cyan-500/5 text-center space-y-2">
                        <div className="inline-block p-2 rounded-full bg-cyan-500/10 text-cyan-400 animate-spin">
                          <Activity className="w-5 h-5" />
                        </div>
                        <p className={`text-xs font-bold ${isDark ? 'text-cyan-300' : 'text-cyan-800'}`}>
                          Đang tìm kiếm sóng Bluetooth từ Inverter / Datalogger...
                        </p>
                        <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Đảm bảo bạn đứng gần Inverter dưới 5 mét và máy đang mở nguồn.
                        </p>
                      </div>
                    )}

                    {discoveredBleDevices.length > 0 && (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {discoveredBleDevices
                          .filter(dev => filterOnlySolar ? (dev.isInverter || !dev.isBlacklisted) : true)
                          .map((device, idx) => (
                            <div
                              key={device.id || idx}
                              className={`p-2.5 rounded-xl border flex items-center justify-between transition ${
                                isDark 
                                  ? 'bg-slate-900/90 border-slate-700/80 hover:border-cyan-500/60' 
                                  : 'bg-white border-slate-200 hover:border-cyan-400 shadow-sm'
                              }`}
                            >
                              <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  device.deviceCategory === 'battery'
                                    ? 'bg-amber-500/20 text-amber-400'
                                    : device.deviceCategory === 'dtu'
                                    ? 'bg-cyan-500/20 text-cyan-400'
                                    : 'bg-emerald-500/20 text-emerald-400'
                                }`}>
                                  {device.deviceCategory === 'battery' ? (
                                    <Battery className="w-4 h-4" />
                                  ) : device.deviceCategory === 'dtu' ? (
                                    <Wifi className="w-4 h-4" />
                                  ) : (
                                    <Zap className="w-4 h-4" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                      {device.displayName || device.name || 'Inverter DTU'}
                                    </span>
                                    <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                                      device.deviceCategory === 'battery'
                                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                        : device.deviceCategory === 'dtu'
                                        ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                                        : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                    }`}>
                                      {device.deviceCategory === 'battery' ? 'PIN BMS' : device.deviceCategory === 'dtu' ? 'DTU WI-FI' : 'INVERTER'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                                    {device.extractedDtu && (
                                      <span className="font-mono text-cyan-500 dark:text-cyan-400 font-bold">
                                        DTU: {device.extractedDtu}
                                      </span>
                                    )}
                                    <span className="text-slate-400 flex items-center gap-0.5">
                                      <SignalHigh className="w-3 h-3 text-emerald-400" />
                                      {device.rssi} dBm
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleSelectBleDevice(device)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1 shadow"
                              >
                                <span>Ghép Nối</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {bleError && (
                  <div className="mt-2.5 p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{bleError}</span>
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
                    className="text-[10px] font-bold text-cyan-500 hover:underline flex items-center gap-1 cursor-pointer"
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
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                      isDark ? 'bg-slate-950 border border-slate-700 text-white' : 'bg-white border border-slate-300 text-slate-900'
                    }`}
                  />
                  <input
                    type={showWifiPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mật khẩu Wi-Fi nhà khách"
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                      isDark ? 'bg-slate-950 border border-slate-700 text-white' : 'bg-white border border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={wifiConfiguring || !ssid.trim()}
                  className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  <Wifi className="w-3.5 h-3.5" />
                  <span>{wifiConfiguring ? 'Đang gửi gói tin...' : 'Gửi Cấu Hình Wi-Fi Xuống Datalogger'}</span>
                </button>

                {wifiSuccessData && (
                  <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs rounded-xl space-y-2 animate-fade-in">
                    <div className="flex items-center gap-2 font-bold">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Đã truyền Wi-Fi [{wifiSuccessData.ssid}] xuống Datalogger thành công!</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleProceedToClaim}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-lg flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
                    >
                      <span>Tiếp Tục: Liên Kết Thiết Bị Này Vào Tài Khoản (@{currentAccount})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
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
                    Vào menu <strong>Wireless Setup</strong> → Chọn Wi-Fi nhà khách → Nhập mật khẩu → Nhấn <strong>Save & Reboot</strong>.
                  </li>
                  <li>
                    Đèn LED <strong className="text-emerald-500">NET</strong> trên Datalogger sáng xanh cố định = Thiết bị đã kết nối Cloud thành công.
                  </li>
                </ol>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* ========== TAB 2: LIÊN KẾT THIẾT BỊ VÀO TÀI KHOẢN ======= */}
          {/* ========================================================= */}
          {activeTab === 'claim' && (
            <form onSubmit={handleSubmitClaim} className="space-y-4 animate-fade-in">
              
              {/* Badge gắn chặt tài khoản người dùng cuối */}
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-500" />
                  <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Tài khoản liên kết:
                  </span>
                </div>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/25">
                  @{currentAccount}
                </span>
              </div>

              {/* Ô nhập mã DTU */}
              <div className="space-y-1.5">
                <label className={`text-xs font-bold flex items-center justify-between ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  <span>Mã DTU Datalogger:</span>
                  <span className="text-[10px] text-amber-500 font-semibold">* Tự điền từ Bluetooth hoặc tem máy</span>
                </label>
                <input
                  type="text"
                  value={dtuCode}
                  onChange={(e) => {
                    setDtuCode(e.target.value);
                    setError('');
                  }}
                  placeholder="VD: 96796956562056303625"
                  className={`w-full py-2.5 px-3.5 rounded-xl text-sm font-mono font-bold transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isDark 
                      ? 'bg-[#11192d] border border-slate-700 text-white placeholder-slate-500' 
                      : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              {/* Tên trạm hiển thị */}
              <div className="space-y-1.5">
                <label className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  Tên Trạm / Dự Án:
                </label>
                <input
                  type="text"
                  value={stationName}
                  onChange={(e) => setStationName(e.target.value)}
                  placeholder="VD: Trạm Năng Lượng Nhà Tôi"
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

              {/* Nút Submit: Đổi tên thành "🔗 Liên Kết Tài Khoản" */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  <Link2 className="w-4 h-4" />
                  <span>{loading ? 'Đang liên kết...' : '🔗 Liên Kết Tài Khoản'}</span>
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
