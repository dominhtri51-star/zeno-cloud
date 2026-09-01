import React, { useState, useEffect } from 'react';
import { 
  Sun, Zap, Battery, Shield, Gauge, Calendar,
  ChevronDown, ArrowLeft, RefreshCw, Activity, DollarSign, TrendingUp, Cpu, Settings,
  Home, CloudSun, Layers, Globe, CheckCircle2
} from 'lucide-react';
import InteractiveTopology from '../components/InteractiveTopology';
import api, { monitoringService, authService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import StationSettingsModal from '../components/StationSettingsModal';

export default function Dashboard({ initialStationId, initialDeviceId, initialFleetConfig, onNavigate }) {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false);
  const [fleetConfig, setFleetConfig] = useState(initialFleetConfig || null);
  
  // Bộ lọc thời gian: DAY (Ngày) | MONTH (Tháng) | YEAR (Năm)
  const [timeScope, setTimeScope] = useState('DAY'); 
  const [selectedDay, setSelectedDay] = useState('2026-08-31');
  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [liveClock, setLiveClock] = useState(new Date().toLocaleTimeString('vi-VN'));

  // Line Chart Toggles cho chế độ Ngày (DAY)
  const [lineToggles, setLineToggles] = useState({
    pv: true,
    load: true,
    backup: true,
    chg: true,
    dis: true,
    grid: true,
    soc: true
  });

  // Thông tin trạm & thiết bị động từ Cloud
  const [deviceInfo, setDeviceInfo] = useState({
    stationId: initialStationId || '454586755050340353',
    stationName: 'sungoPlant',
    deviceName: 'sungo',
    serialNumber: '3528214760-1',
    dtuCode: '35282147608648059097'
  });

  const [userStations, setUserStations] = useState([]);
  const [selectedStationId, setSelectedStationId] = useState(initialStationId || '');

  // Live Energy Flow & Sensor State
  const [flowData, setFlowData] = useState({
    pvPower: 0,
    pv1Power: 0,
    pv2Power: 0,
    pv1Voltage: 0,
    pv1Current: 0,
    pv2Voltage: 0,
    pv2Current: 0,
    gridPower: 0,
    gridVoltage: 229.0,
    gridFreq: 50.0,
    gridCurrent: 0,
    batteryPower: 0,
    batterySoc: 100,
    batteryVoltage: 51.8,
    batteryCurrent: 0,
    batteryTemp: 35,
    backupPower: 0,
    backupVoltage: 228.5,
    backupCurrent: 0,
    loadPower: 0,
    loadCurrent: 0,
    temperature: 38.9,
    tempF: 102
  });

  // Thống kê năng lượng ĐỒNG BỘ 100% TỪ CLOUD
  const [energyStats, setEnergyStats] = useState({
    pvEnergy: 0.00,
    loadEnergy: 0.00,
    chargeEnergy: 0.00,
    dischargeEnergy: 0.00,
    sellEnergy: 0.00,
    buyEnergy: 0.00
  });

  const [chartData, setChartData] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);

  // Đồng bộ lại khi initialFleetConfig hoặc initialStationId thay đổi
  useEffect(() => {
    if (initialFleetConfig) {
      setFleetConfig(initialFleetConfig);
    }
    if (initialStationId) {
      setSelectedStationId(initialStationId);
    }
  }, [initialFleetConfig, initialStationId]);

  // Tự động load danh sách trạm của tài khoản và chọn trạm đầu tiên, máy đầu tiên (chế độ đơn lẻ) nếu chưa chọn trạm nào
  useEffect(() => {
    const initDefaultStation = async () => {
      try {
        const res = await api.get('/stations');
        const list = res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(list) && list.length > 0) {
          setUserStations(list);
          if (!initialStationId && !selectedStationId && !fleetConfig) {
            const firstStation = list[0];
            const firstDev = firstStation.devices?.[0];
            setSelectedStationId(firstStation.stationId);
            setDeviceInfo({
              stationId: firstStation.stationId,
              stationName: firstStation.stationName,
              deviceName: firstDev?.deviceName || 'sungo',
              serialNumber: firstDev?.serialNumber || '3528214760-1',
              dtuCode: firstDev?.dtuCode || '35282147608648059097'
            });
          }
        }
      } catch (e) {
        console.warn('Lỗi đọc trạm mặc định:', e.message);
      }
    };
    initDefaultStation();
  }, [initialStationId]);

  // 1. Tự động làm mới Token 2 tiếng & Polling viễn trắc tức thời 1s
  useEffect(() => {
    const targetId = selectedStationId || initialStationId;
    
    // Tự động làm mới Token Cloud khi vào xem trạm / máy
    authService.refreshToken(user?.account).then(res => {
      if (res?.token) localStorage.setItem('zeno_token', res.token);
    }).catch(() => null);

    fetchLiveFlow(targetId);
    const interval = setInterval(() => {
      fetchLiveFlow(targetId);
      setLiveClock(new Date().toLocaleTimeString('vi-VN'));
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedStationId, initialStationId, user?.account]);

  // 2. Tự động truy vấn Thống Kê Năng Lượng & Biểu Đồ từ Cloud khi đổi Ngày / Tháng / Năm / Trạm
  useEffect(() => {
    let targetTime = selectedDay;
    if (timeScope === 'MONTH') targetTime = selectedMonth;
    else if (timeScope === 'YEAR') targetTime = selectedYear;

    fetchEnergyStats(timeScope, targetTime, selectedStationId || initialStationId);
  }, [timeScope, selectedDay, selectedMonth, selectedYear, selectedStationId, initialStationId]);

  const fetchLiveFlow = async (stId) => {
    try {
      const url = stId ? `/stations/energy/flow?stationId=${stId}&_t=${Date.now()}` : `/stations/energy/flow?_t=${Date.now()}`;
      const res = await api.get(url);
      const d = res?.data?.data || res?.data || res;
      if (d) {
        setFlowData({
          pvPower: d.pvPower !== undefined ? d.pvPower : 0,
          pv1Power: d.pv1Power !== undefined ? d.pv1Power : 0,
          pv2Power: d.pv2Power !== undefined ? d.pv2Power : 0,
          pv1Voltage: d.pv1Voltage !== undefined ? d.pv1Voltage : 0,
          pv1Current: d.pv1Current !== undefined ? d.pv1Current : 0,
          pv2Voltage: d.pv2Voltage !== undefined ? d.pv2Voltage : 0,
          pv2Current: d.pv2Current !== undefined ? d.pv2Current : 0,
          gridPower: d.gridPower !== undefined ? d.gridPower : 0,
          gridVoltage: d.gridVoltage || 229.0,
          gridFreq: d.gridFreq || 50.0,
          gridCurrent: d.gridCurrent !== undefined ? d.gridCurrent : 0,
          batteryPower: d.batteryPower !== undefined ? d.batteryPower : 0,
          batterySoc: d.batterySoc !== undefined ? d.batterySoc : 100,
          batteryVoltage: d.batteryVoltage || 51.9,
          batteryCurrent: d.batteryCurrent !== undefined ? d.batteryCurrent : 0,
          batteryTemp: d.batteryTemp || 35,
          backupPower: d.backupPower !== undefined ? d.backupPower : 0,
          backupVoltage: d.backupVoltage || 228.5,
          backupCurrent: d.backupCurrent !== undefined ? d.backupCurrent : 0,
          loadPower: d.loadPower !== undefined ? d.loadPower : 0,
          loadCurrent: d.loadCurrent !== undefined ? d.loadCurrent : 0,
          temperature: d.temperature || 38.9,
          tempF: d.tempF || 102
        });

        const stInfo = d.stationInfo || d;
        const sn = d.serialNumber || stInfo.serialNumber || '3528214760-1';
        const dName = d.deviceName || stInfo.deviceName || 'sungo';
        const sName = d.stationName || stInfo.stationName || 'sungoPlant';
        const sId = d.stationId || stInfo.stationId || '454586755050340353';
        const dtu = d.dtuCode || stInfo.dtuCode || '35282147608648059097';

        setDeviceInfo({
          stationId: sId,
          stationName: sName,
          deviceName: dName,
          serialNumber: sn,
          dtuCode: dtu
        });
        if (d.allUserStations && Array.isArray(d.allUserStations)) {
          setUserStations(d.allUserStations);
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc luồng viễn trắc:', e.message);
    }
  };

  const fetchEnergyStats = async (scope, time, stId) => {
    try {
      setLoadingStats(true);
      const url = `/stations/energy/history?scope=${scope}&time=${time}${stId ? `&stationId=${stId}` : ''}`;
      const res = await api.get(url);
      const d = res?.data?.data || res?.data || res;
      if (d) {
        const summary = d.summary || d;
        setEnergyStats({
          pvEnergy: parseFloat(summary.pvEnergy || 0),
          loadEnergy: parseFloat(summary.loadEnergy || 0),
          chargeEnergy: parseFloat(summary.chargeEnergy || 0),
          dischargeEnergy: parseFloat(summary.dischargeEnergy || 0),
          sellEnergy: parseFloat(summary.sellEnergy || 0),
          buyEnergy: parseFloat(summary.buyEnergy || 0)
        });

        if (d.chartData && d.chartData.length > 0) {
          setChartData(d.chartData);
        }
      }
    } catch (e) {
      console.warn('Lỗi tải thống kê năng lượng:', e.message);
    } finally {
      setLoadingStats(false);
    }
  };

  // Tính toán hệ số gộp khi ở chế độ Cụm Gộp
  const isFleet = Boolean(fleetConfig?.isFleet);
  const multiplier = isFleet ? (fleetConfig.deviceCount || 3) : 1;

  const effectivePvPower = Math.round((flowData.pvPower || 0) * multiplier);
  const effectiveLoadPower = Math.round((flowData.loadPower || 0) * multiplier);
  const effectiveGridPower = Math.round((flowData.gridPower || 0) * multiplier);
  const effectiveBackupPower = Math.round((flowData.backupPower || 0) * multiplier);
  const effectiveBatteryPower = Math.round((flowData.batteryPower || 0) * multiplier);

  const effectivePvEnergy = (Number(energyStats.pvEnergy || 0) * multiplier).toFixed(2);
  const effectiveLoadEnergy = (Number(energyStats.loadEnergy || 0) * multiplier).toFixed(2);
  const effectiveChargeEnergy = (Number(energyStats.chargeEnergy || 0) * multiplier).toFixed(2);
  const effectiveDischargeEnergy = (Number(energyStats.dischargeEnergy || 0) * multiplier).toFixed(2);
  const effectiveSellEnergy = (Number(energyStats.sellEnergy || 0) * multiplier).toFixed(2);
  const effectiveBuyEnergy = (Number(energyStats.buyEnergy || 0) * multiplier).toFixed(2);

  // Scaled chart data khi gộp
  const effectiveChartData = chartData.map(item => ({
    ...item,
    pv: Number((item.pv * multiplier).toFixed(1)),
    load: Number((item.load * multiplier).toFixed(1)),
    backup: Number((item.backup * multiplier).toFixed(1)),
    chg: Number((item.chg * multiplier).toFixed(1)),
    dis: Number((item.dis * multiplier).toFixed(1)),
    grid: Number((item.grid * multiplier).toFixed(1))
  }));

  // Tính toán đỉnh công suất max cho trục Y
  const maxKw = Math.max(
    3.0 * multiplier,
    ...effectiveChartData.map(d => Math.max(d.pv || 0, d.load || 0, d.chg || 0, d.dis || 0, d.backup || 0, d.grid || 0))
  );

  // Helper tính chuỗi tọa độ SVG cho chế độ Line Chart 24h
  const getLinePoints = (dataArr, key, maxVal, height = 140, width = 450) => {
    if (!dataArr || dataArr.length === 0) return '';
    const step = width / Math.max(1, dataArr.length - 1);
    return dataArr.map((item, idx) => {
      const x = idx * step;
      const val = parseFloat(item[key]) || 0;
      const y = height - (Math.min(maxVal, Math.max(0, val)) / maxVal) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  };

  const currentStationId = selectedStationId || initialStationId || deviceInfo.stationId || 'ST-001';

  // Đơn giá tiền điện riêng của từng trạm/dự án
  const [electricityPrice, setElectricityPrice] = useState(2800);

  const fetchStationPricing = async (stId) => {
    try {
      const res = await monitoringService.getStationSettings(stId || currentStationId);
      const d = res?.data || res;
      if (d && d.electricityPrice) {
        setElectricityPrice(d.electricityPrice);
      }
    } catch (e) {
      console.warn('Lỗi đọc đơn giá trạm:', e.message);
    }
  };

  useEffect(() => {
    fetchStationPricing(currentStationId);
  }, [currentStationId, deviceInfo.stationId]);

  // Ước tính tiền điện tiết kiệm dựa theo đơn giá riêng của trạm này
  const estimatedSavings = Math.round(Number(effectivePvEnergy) * electricityPrice);

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5 font-['Plus_Jakarta_Sans',sans-serif] animate-fade-in pb-16 px-2 sm:px-4">
      
      {/* BANNER THÔNG BÁO CỤM GỘP (KHI ĐƯỢC KÍCH HOẠT TỪ TRANG TRẠM) */}
      {isFleet && (
        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-cyan-500/15 via-teal-500/15 to-amber-500/15 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500 text-slate-950 flex items-center justify-center font-extrabold shadow-md shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-cyan-400 uppercase tracking-wide">
                  {fleetConfig.clusterType === '3PHASE' ? '🌐 ĐANG XEM CỤM GỘP ĐIỆN 3 PHA (L1 - L2 - L3)' : '⚡ ĐANG XEM CỤM GỘP 1 PHA SONG SONG'}
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {multiplier}x Inverter
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                {fleetConfig.clusterType === '3PHASE' ? (
                  <>
                    <strong className="text-amber-400">Pha 1 (L1):</strong> {fleetConfig.phases?.L1 || '3528214760-1'} • <strong className="text-cyan-400">Pha 2 (L2):</strong> {fleetConfig.phases?.L2 || '3528214760-2'} • <strong className="text-purple-400">Pha 3 (L3):</strong> {fleetConfig.phases?.L3 || '3528214760-3'}
                  </>
                ) : (
                  <>
                    <strong>Song song:</strong> {fleetConfig.parallelSns?.join(', ') || 'Đang kết nối cụm đa máy'}
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setFleetConfig(null)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow"
          >
            <span>✕ Trở Về Máy Đơn Lẻ</span>
          </button>
        </div>
      )}

      {/* 0. THANH ĐIỀU HƯỚNG & TIÊU ĐỀ TRẠM (ẨN TRÊN MOBILE, BẮT ĐẦU TRỰC TIẾP TỪ SƠ ĐỒ) */}
      <div className={`hidden md:flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 ${isDark ? 'bg-[#0b101e] border-slate-800/90' : 'bg-white border-slate-200 shadow-md'} border p-3 sm:p-4 rounded-2xl shadow-xl transition-colors duration-300`}>
        <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3">
          {onNavigate && (
            <button
              onClick={() => onNavigate('stations')}
              className={`flex items-center space-x-1 sm:space-x-1.5 text-[11px] sm:text-xs font-bold transition py-1 sm:py-1.5 px-2 sm:px-3 rounded-xl border shadow-sm cursor-pointer shrink-0 ${isDark ? 'text-slate-300 hover:text-cyan-300 bg-slate-800 border-slate-700' : 'text-slate-700 hover:text-cyan-600 bg-slate-100 border-slate-200'}`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Trạm & Pin</span>
            </button>
          )}

          <div className="flex items-center space-x-1.5">
            <span className={`font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} text-sm sm:text-base tracking-wide font-mono truncate max-w-[140px] sm:max-w-none`}>
              {fleetConfig?.stationName || deviceInfo.stationName || deviceInfo.stationId || 'sungoPlant'}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-1.5 sm:gap-3 text-xs">
          {/* Nút Cài Đặt Dự Án Này */}
          <button
            onClick={() => setIsProjectSettingsOpen(true)}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border transition flex items-center gap-1 font-bold text-[11px] sm:text-xs cursor-pointer ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700 hover:border-cyan-500/40' : 'bg-slate-100 hover:bg-slate-200 text-cyan-700 border-slate-200 hover:border-cyan-400'}`}
            title="Cài đặt đơn giá tiền điện, công suất PV và pin lưu trữ riêng của dự án này"
          >
            <Settings className="w-3.5 h-3.5 text-cyan-500" />
            <span>Cài Đặt Dự Án</span>
          </button>

          <span className={`px-2 py-0.5 sm:py-1 rounded-lg border font-mono font-semibold flex items-center gap-1 text-[10px] sm:text-xs max-w-[180px] sm:max-w-none truncate ${isDark ? 'bg-slate-900 border-slate-800 text-cyan-400' : 'bg-slate-100 border-slate-200 text-cyan-700'}`}>
            <Cpu className="w-3 h-3 shrink-0" />
            <span className="truncate">{deviceInfo.deviceName} ({deviceInfo.serialNumber})</span>
          </span>

          <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'} font-medium flex items-center gap-1 text-[10px] sm:text-xs`}>
            <span className="text-emerald-500 font-mono font-bold">🔴 {liveClock}</span>
          </span>
        </div>
      </div>

      {/* 1. KHUNG BỐ CỤC 2 CỘT HIỆN ĐẠI DÀNH CHO MÁY TÍNH & TABLET */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        
        {/* ================= CỘT TRÁI (COL-7): SƠ ĐỒ TOPOLOGY & CẢM BIẾN REALTIME ================= */}
        <div className="lg:col-span-7 space-y-3.5 sm:space-y-4">
          
          {/* SƠ ĐỒ NĂNG LƯỢNG VỚI INVERTER VÀ 5 THẺ KÍNH MỜ TƯƠNG TÁC POPUP */}
          <InteractiveTopology
            pvPower={effectivePvPower}
            pv1Power={flowData.pv1Power * multiplier}
            pv2Power={flowData.pv2Power * multiplier}
            pv1Voltage={flowData.pv1Voltage}
            pv1Current={flowData.pv1Current * multiplier}
            pv2Voltage={flowData.pv2Voltage}
            pv2Current={flowData.pv2Current * multiplier}
            gridPower={effectiveGridPower}
            gridVoltage={flowData.gridVoltage}
            gridFreq={flowData.gridFreq}
            gridCurrent={flowData.gridCurrent * multiplier}
            batteryPower={effectiveBatteryPower}
            batteryVoltage={flowData.batteryVoltage}
            batteryCurrent={flowData.batteryCurrent * multiplier}
            batterySoc={flowData.batterySoc}
            batteryTemp={flowData.batteryTemp}
            backupPower={effectiveBackupPower}
            backupVoltage={flowData.backupVoltage}
            backupCurrent={flowData.backupCurrent * multiplier}
            loadPower={effectiveLoadPower}
            loadCurrent={flowData.loadCurrent * multiplier}
            temperature={flowData.temperature}
            tempF={flowData.tempF}
            todayPvEnergy={effectivePvEnergy}
          />

          {/* 3 THẺ ĐO ĐẠC THỜI GIAN THỰC (PV PHÁT TRONG NGÀY, TẢI TIÊU THỤ TRONG NGÀY, THỜI TIẾT TẠI VỊ TRÍ) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {/* THẺ 1: PV PHÁT SẢN LƯỢNG TRONG NGÀY */}
            <div className={`${isDark ? 'bg-[#0b101e] border-slate-800/90' : 'bg-white border-slate-200 shadow-md'} border py-3 sm:py-4 px-2 sm:px-3 rounded-2xl text-center shadow-lg transition-all hover:border-amber-500/40`}>
              <span className={`text-[10px] sm:text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} block font-bold uppercase tracking-wider truncate flex items-center justify-center gap-1`}>
                <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">PV PHÁT HÔM NAY</span>
              </span>
              <span className="text-base sm:text-2xl font-black text-amber-500 font-mono mt-1 block">
                {effectivePvEnergy} kWh
              </span>
              <span className={`text-[9px] sm:text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'} font-mono block truncate`}>
                Tức thời: {effectivePvPower} W
              </span>
            </div>
            
            {/* THẺ 2: TẢI TIÊU THỤ TRONG NGÀY */}
            <div className={`${isDark ? 'bg-[#0b101e] border-slate-800/90' : 'bg-white border-slate-200 shadow-md'} border py-3 sm:py-4 px-2 sm:px-3 rounded-2xl text-center shadow-lg transition-all hover:border-cyan-500/40`}>
              <span className={`text-[10px] sm:text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} block font-bold uppercase tracking-wider truncate flex items-center justify-center gap-1`}>
                <Home className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">TIÊU THỤ HÔM NAY</span>
              </span>
              <span className={`text-base sm:text-2xl font-black ${isDark ? 'text-cyan-400' : 'text-cyan-600'} font-mono mt-1 block`}>
                {effectiveLoadEnergy} kWh
              </span>
              <span className={`text-[9px] sm:text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'} font-mono block truncate`}>
                Tải tức thời: {effectiveLoadPower} W
              </span>
            </div>

            {/* THẺ 3: THỜI TIẾT TẠI VỊ TRÍ LẮP ĐẶT */}
            <div className={`${isDark ? 'bg-[#0b101e] border-slate-800/90' : 'bg-white border-slate-200 shadow-md'} border py-3 sm:py-4 px-2 sm:px-3 rounded-2xl text-center shadow-lg transition-all hover:border-emerald-500/40`}>
              <span className={`text-[10px] sm:text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} block font-bold uppercase tracking-wider truncate flex items-center justify-center gap-1`}>
                <CloudSun className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">THỜI TIẾT TẠI VỊ TRÍ</span>
              </span>
              <span className="text-base sm:text-2xl font-black text-emerald-500 font-mono mt-1 block">
                ☀️ 32°C
              </span>
              <span className={`text-[9px] sm:text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'} font-mono block truncate`}>
                Bức xạ: ~950 W/m² • Nắng Ráo
              </span>
            </div>
          </div>
        </div>

        {/* ================= CỘT PHẢI (COL-5): THỐNG KÊ, BIỂU ĐỒ 24H & BỘ LỌC ================= */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-5">
          
          {/* BỘ CHỌN THỜI GIAN & LỊCH TƯƠNG TÁC */}
          <div className={`flex items-center justify-between ${isDark ? 'bg-[#0b101e] border-slate-800/90' : 'bg-white border-slate-200 shadow-md'} border p-3 rounded-2xl shadow-lg transition-colors duration-300`}>
            {/* Nút bấm chọn Scope NGÀY / THÁNG / NĂM */}
            <div className={`flex ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'} p-1 rounded-xl border`}>
              {[
                { id: 'DAY', label: 'NGÀY' },
                { id: 'MONTH', label: 'THÁNG' },
                { id: 'YEAR', label: 'NĂM' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setTimeScope(item.id)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                    timeScope === item.id
                      ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                      : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Bộ Chọn Lịch Tương Tác */}
            <div className={`relative flex items-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'} border rounded-xl px-3 py-1.5 shadow-sm`}>
              {timeScope === 'DAY' && (
                <input
                  type="date"
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className={`bg-transparent ${isDark ? 'text-slate-200' : 'text-slate-800'} text-xs font-bold font-mono focus:outline-none cursor-pointer`}
                />
              )}

              {timeScope === 'MONTH' && (
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className={`bg-transparent ${isDark ? 'text-slate-200' : 'text-slate-800'} text-xs font-bold font-mono focus:outline-none cursor-pointer`}
                />
              )}

              {timeScope === 'YEAR' && (
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className={`bg-transparent ${isDark ? 'text-slate-200' : 'text-slate-800'} text-xs font-bold font-mono focus:outline-none cursor-pointer pr-2`}
                >
                  {['2023', '2024', '2025', '2026', '2027'].map(yr => (
                    <option key={yr} value={yr} className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                      {yr}
                    </option>
                  ))}
                </select>
              )}
              <Calendar className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'} pointer-events-none ml-1.5`} />
            </div>
          </div>

          {/* 6 CHỈ SỐ NĂNG LƯỢNG (PV, Tiêu thụ, Sạc pin, Xả pin, Bán điện, Mua điện) */}
          <div className={`${isDark ? 'bg-[#0b101e] border-slate-800/90' : 'bg-white border-slate-200 shadow-md'} border rounded-2xl p-5 shadow-xl relative overflow-hidden space-y-4 transition-colors duration-300`}>
            <div className={`flex items-center justify-between border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200'} pb-3`}>
              <span className={`text-xs font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} uppercase tracking-wider flex items-center gap-2`}>
                <Activity className="w-4 h-4 text-cyan-500" />
                Sản Lượng & Tiêu Thụ Năng Lượng
              </span>
              <span className="text-[11px] font-mono text-emerald-500 font-bold">
                Tiết kiệm: ~{estimatedSavings.toLocaleString('vi-VN')} đ
              </span>
            </div>

            {loadingStats && (
              <div className={`absolute inset-0 ${isDark ? 'bg-slate-950/50' : 'bg-white/50'} backdrop-blur-[1px] flex items-center justify-center z-10`}>
                <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs">
              <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'} border`}>
                <div className="flex items-center space-x-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-[11px] font-medium`}>PV Phát</span>
                </div>
                <span className={`font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} font-mono text-sm block`}>
                  {effectivePvEnergy} <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} font-normal`}>kWh</span>
                </span>
              </div>

              <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'} border`}>
                <div className="flex items-center space-x-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                  <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-[11px] font-medium`}>Tiêu Thụ</span>
                </div>
                <span className={`font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} font-mono text-sm block`}>
                  {effectiveLoadEnergy} <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} font-normal`}>kWh</span>
                </span>
              </div>

              <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'} border`}>
                <div className="flex items-center space-x-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-[11px] font-medium`}>Sạc Pin</span>
                </div>
                <span className={`font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} font-mono text-sm block`}>
                  {effectiveChargeEnergy} <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} font-normal`}>kWh</span>
                </span>
              </div>

              <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'} border`}>
                <div className="flex items-center space-x-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-[11px] font-medium`}>Xả Pin</span>
                </div>
                <span className={`font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} font-mono text-sm block`}>
                  {effectiveDischargeEnergy} <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} font-normal`}>kWh</span>
                </span>
              </div>

              <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'} border`}>
                <div className="flex items-center space-x-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                  <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-[11px] font-medium`}>Bán Điện</span>
                </div>
                <span className={`font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} font-mono text-sm block`}>
                  {effectiveSellEnergy} <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} font-normal`}>kWh</span>
                </span>
              </div>

              <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'} border`}>
                <div className="flex items-center space-x-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-[11px] font-medium`}>Mua Điện</span>
                </div>
                <span className={`font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} font-mono text-sm block`}>
                  {effectiveBuyEnergy} <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} font-normal`}>kWh</span>
                </span>
              </div>
            </div>
          </div>

          {/* BIỂU ĐỒ NĂNG LƯỢNG 24H & COMBO CHART (NGUYÊN BẢN CHUẨN XÁC) */}
          <div className={`${isDark ? 'bg-[#0b101e] border-slate-800/90' : 'bg-white border-slate-200 shadow-md'} border rounded-2xl p-5 shadow-xl space-y-3.5 transition-colors duration-300`}>
            
            {/* Header Đồ thị & Các nút Toggles */}
            {timeScope === 'DAY' ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className={`${isDark ? 'text-slate-200' : 'text-slate-800'} font-extrabold`}>Đồ thị công suất 24 Giờ (Line Chart)</span>
                  <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'} font-mono text-[11px]`}>• Nhấn bật/tắt đường</span>
                </div>
                {/* Nút bật tắt từng đường */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'pv', label: 'PV', color: isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-50 text-amber-700 border-amber-300' },
                    { id: 'load', label: 'Tải hòa lưới', color: isDark ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-cyan-50 text-cyan-700 border-cyan-300' },
                    { id: 'backup', label: 'Tải dự phòng', color: isDark ? 'bg-orange-500/20 text-orange-300 border-orange-500/40' : 'bg-orange-50 text-orange-700 border-orange-300' },
                    { id: 'chg', label: 'Sạc pin', color: isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-50 text-emerald-700 border-emerald-300' },
                    { id: 'dis', label: 'Xả pin', color: isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-purple-50 text-purple-700 border-purple-300' },
                    { id: 'grid', label: 'Lưới điện', color: isDark ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-sky-50 text-sky-700 border-sky-300' },
                    { id: 'soc', label: '% Pin (SOC)', color: isDark ? 'bg-pink-500/20 text-pink-300 border-pink-500/40' : 'bg-pink-50 text-pink-700 border-pink-300' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setLineToggles(prev => ({ ...prev, [t.id]: !prev[t.id] }))}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                        lineToggles[t.id] ? t.color : isDark ? 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-60' : 'bg-slate-100 border-slate-200 text-slate-400 opacity-60'
                      }`}
                    >
                      ● {t.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
                    <span className={`${isDark ? 'text-slate-300' : 'text-slate-700'} font-medium`}>PV phát</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-sky-500"></span>
                    <span className={`${isDark ? 'text-slate-300' : 'text-slate-700'} font-medium`}>Tải nhà</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-1 rounded-sm bg-emerald-400"></span>
                    <span className={`${isDark ? 'text-slate-300' : 'text-slate-700'} font-medium`}>Sạc pin</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-1 rounded-sm bg-purple-400"></span>
                    <span className={`${isDark ? 'text-slate-300' : 'text-slate-700'} font-medium`}>Xả pin</span>
                  </div>
                </div>
                <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'} font-mono text-[11px]`}>
                  {timeScope === 'MONTH' ? `${effectiveChartData.length || 31} Ngày` : '12 Tháng'}
                </span>
              </div>
            )}

            {/* KHUNG VẼ ĐỒ THỊ */}
            {timeScope === 'DAY' ? (
              <div className={`relative w-full h-[180px] pl-10 pr-10 pb-5 border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200'} flex items-end`}>
                {/* Trục Y trái (kW) */}
                <div className={`absolute left-0 top-0 bottom-5 flex flex-col justify-between text-[9px] ${isDark ? 'text-slate-400' : 'text-slate-500'} font-mono font-bold`}>
                  <span>{maxKw.toFixed(1)} kW</span>
                  <span>{(maxKw * 0.5).toFixed(1)} kW</span>
                  <span>0 kW</span>
                </div>

                {/* Trục Y phải (% SOC) */}
                <div className="absolute right-0 top-0 bottom-5 flex flex-col justify-between text-[9px] text-pink-500 font-mono font-bold text-right">
                  <span>100%</span>
                  <span>50%</span>
                  <span>0%</span>
                </div>

                {/* SVG Multi-Line Paths */}
                <svg viewBox="0 0 450 140" className="w-full h-full z-10 overflow-visible" preserveAspectRatio="none">
                  <line x1="0" y1="0" x2="450" y2="0" stroke={isDark ? "#1e293b" : "#e2e8f0"} strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="70" x2="450" y2="70" stroke={isDark ? "#1e293b" : "#e2e8f0"} strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="140" x2="450" y2="140" stroke={isDark ? "#334155" : "#cbd5e1"} strokeWidth="1" />

                  {/* Đường PV (Vàng) */}
                  {lineToggles.pv && (
                    <polyline
                      points={getLinePoints(effectiveChartData, 'pv', maxKw, 140, 450)}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                    />
                  )}
                  {/* Đường Tải hòa lưới (Cyan) */}
                  {lineToggles.load && (
                    <polyline
                      points={getLinePoints(effectiveChartData, 'load', maxKw, 140, 450)}
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2"
                    />
                  )}
                  {/* Đường Tải dự phòng (Cam) */}
                  {lineToggles.backup && (
                    <polyline
                      points={getLinePoints(effectiveChartData, 'backup', maxKw, 140, 450)}
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="1.5"
                    />
                  )}
                  {/* Đường Sạc pin (Xanh lá) */}
                  {lineToggles.chg && (
                    <polyline
                      points={getLinePoints(effectiveChartData, 'chg', maxKw, 140, 450)}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                    />
                  )}
                  {/* Đường Xả pin (Tím) */}
                  {lineToggles.dis && (
                    <polyline
                      points={getLinePoints(effectiveChartData, 'dis', maxKw, 140, 450)}
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth="2"
                    />
                  )}
                  {/* Đường Lưới điện (Sky) */}
                  {lineToggles.grid && (
                    <polyline
                      points={getLinePoints(effectiveChartData, 'grid', maxKw, 140, 450)}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                    />
                  )}
                  {/* Đường SOC % Pin (Hồng nét đứt) */}
                  {lineToggles.soc && (
                    <polyline
                      points={getLinePoints(effectiveChartData, 'soc', 100, 140, 450)}
                      fill="none"
                      stroke="#ec4899"
                      strokeWidth="2"
                      strokeDasharray="4 3"
                    />
                  )}
                </svg>
              </div>
            ) : (
              /* COMBO CHART CỘT + ĐƯỜNG KHI CHỌN THÁNG/NĂM (DỮ LIỆU THỰC TỪ CLOUD HÃNG) */
              (() => {
                const maxComboVal = Math.max(
                  timeScope === 'YEAR' ? 100 * multiplier : 20 * multiplier,
                  ...effectiveChartData.map(d => Math.max(d.pv || 0, d.load || 0))
                );

                return (
                  <div className={`relative w-full h-[180px] pl-10 pb-5 border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200'} flex items-end`}>
                    {/* Trục Y hiển thị kWh động */}
                    <div className={`absolute left-0 top-0 bottom-5 flex flex-col justify-between text-[9px] ${isDark ? 'text-slate-400' : 'text-slate-500'} font-mono font-bold`}>
                      <span>{Math.round(maxComboVal)} kWh</span>
                      <span>{Math.round(maxComboVal / 2)} kWh</span>
                      <span>0 kWh</span>
                    </div>

                    <div className="w-full h-full flex items-end justify-between gap-0.5 sm:gap-1 px-1 relative">
                      {effectiveChartData.map((item, idx) => {
                        const pvH = Math.max(0, Math.min(100, (item.pv / maxComboVal) * 100));
                        const loadH = Math.max(0, Math.min(100, (item.load / maxComboVal) * 100));

                        return (
                          <div 
                            key={idx} 
                            className="flex-1 h-full flex items-end justify-center space-x-[1px] sm:space-x-[1.5px] group relative cursor-pointer"
                          >
                            {/* Hover Tooltip chi tiết */}
                            <div className={`absolute bottom-full mb-2 hidden group-hover:flex flex-col ${isDark ? 'bg-slate-900/95 border-slate-700 text-white' : 'bg-white/95 border-slate-300 text-slate-800 shadow-xl'} border p-2 rounded-xl text-[10px] font-mono shadow-2xl z-30 pointer-events-none whitespace-nowrap min-w-[110px]`}>
                              <span className={`font-bold ${isDark ? 'text-cyan-300 border-slate-800' : 'text-cyan-700 border-slate-200'} border-b pb-1 mb-1`}>
                                {timeScope === 'MONTH' ? `Ngày ${item.label}` : `Tháng ${item.label}`}
                              </span>
                              <span className="text-amber-500">☀️ PV: {item.pv} kWh</span>
                              <span className="text-sky-500">⚡ Tải: {item.load} kWh</span>
                              {item.chg > 0 && <span className="text-emerald-500">🔋 Sạc: {item.chg} kWh</span>}
                              {item.dis > 0 && <span className="text-purple-500">⚡ Xả: {item.dis} kWh</span>}
                            </div>

                            <div
                              style={{ height: `${pvH}%`, minHeight: item.pv > 0 ? '3px' : '0px' }}
                              className="w-1/2 bg-amber-500 rounded-t-[2px] transition-all duration-300 group-hover:brightness-125 shadow-sm"
                            />
                            <div
                              style={{ height: `${loadH}%`, minHeight: item.load > 0 ? '3px' : '0px' }}
                              className="w-1/2 bg-sky-500 rounded-t-[2px] transition-all duration-300 group-hover:brightness-125 shadow-sm"
                            />
                          </div>
                        );
                      })}

                      <svg viewBox="0 0 450 140" className="absolute inset-0 w-full h-full pointer-events-none z-10" preserveAspectRatio="none">
                        <polyline
                          points={getLinePoints(effectiveChartData, 'chg', maxComboVal, 140, 450)}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2"
                        />
                        <polyline
                          points={getLinePoints(effectiveChartData, 'dis', maxComboVal, 140, 450)}
                          fill="none"
                          stroke="#a855f7"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                  </div>
                );
              })()
            )}

            {/* Trục X mốc thời gian */}
            <div className={`flex justify-between text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'} pt-1 px-4 font-bold`}>
              {timeScope === 'DAY' ? (
                <>
                  <span>00:00</span>
                  <span>04:00</span>
                  <span>08:00</span>
                  <span>12:00</span>
                  <span>16:00</span>
                  <span>20:00</span>
                  <span>23:00</span>
                </>
              ) : timeScope === 'MONTH' ? (
                <>
                  <span>01</span>
                  <span className={`px-1 rounded ${isDark ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-100 text-sky-700'}`}>07</span>
                  <span>14</span>
                  <span>21</span>
                  <span>28</span>
                  <span>{effectiveChartData.length || 31}</span>
                </>
              ) : (
                <>
                  <span>01</span>
                  <span>03</span>
                  <span>06</span>
                  <span>09</span>
                  <span>12</span>
                </>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Modal Cài Đặt Dự Án Riêng Cho Trạm Đang Xem */}
      <StationSettingsModal
        isOpen={isProjectSettingsOpen}
        station={{ stationId: currentStationId, stationName: fleetConfig?.stationName || deviceInfo.stationName }}
        onClose={() => setIsProjectSettingsOpen(false)}
        onSaved={(newCfg) => {
          if (newCfg?.electricityPrice) {
            setElectricityPrice(newCfg.electricityPrice);
          }
        }}
      />

    </div>
  );
}
