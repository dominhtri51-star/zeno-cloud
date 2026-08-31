import React, { useState, useEffect } from 'react';
import { 
  Sun, Zap, Battery, Shield, Gauge, Calendar,
  ChevronDown, ArrowLeft, RefreshCw, Activity, DollarSign, TrendingUp, Cpu, Settings
} from 'lucide-react';
import InteractiveTopology from '../components/InteractiveTopology';
import api, { monitoringService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import StationSettingsModal from '../components/StationSettingsModal';

export default function Dashboard({ initialStationId, initialDeviceId, onNavigate }) {
  const { user } = useAuth();
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false);
  
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
    gridPower: 0,
    batteryPower: 0,
    batterySoc: 100,
    backupPower: 0,
    loadPower: 0,
    gridVoltage: 229.0,
    batteryVoltage: 51.8,
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

  // Đồng bộ lại selectedStationId khi người dùng bấm chọn trạm/thiết bị khác từ ngoài vào
  useEffect(() => {
    if (initialStationId) {
      setSelectedStationId(initialStationId);
    }
  }, [initialStationId]);

  // 1. Polling viễn trắc tức thời 1s
  useEffect(() => {
    const targetId = selectedStationId || initialStationId;
    fetchLiveFlow(targetId);
    const interval = setInterval(() => {
      fetchLiveFlow(targetId);
      setLiveClock(new Date().toLocaleTimeString('vi-VN'));
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedStationId, initialStationId]);

  // 2. Tự động truy vấn Thống Kê Năng Lượng & Biểu Đồ từ Cloud khi đổi Ngày / Tháng / Năm / Trạm
  useEffect(() => {
    let targetTime = selectedDay;
    if (timeScope === 'MONTH') targetTime = selectedMonth;
    else if (timeScope === 'YEAR') targetTime = selectedYear;

    fetchEnergyStats(timeScope, targetTime, selectedStationId || initialStationId);
  }, [timeScope, selectedDay, selectedMonth, selectedYear, selectedStationId, initialStationId]);

  const fetchLiveFlow = async (stId) => {
    try {
      const url = stId ? `/stations/energy/flow?stationId=${stId}` : '/stations/energy/flow';
      const res = await api.get(url);
      const d = res?.data?.data || res?.data || res;
      if (d) {
        setFlowData({
          pvPower: d.pvPower !== undefined ? d.pvPower : 0,
          pv1Power: d.pv1Power !== undefined ? d.pv1Power : 0,
          pv2Power: d.pv2Power !== undefined ? d.pv2Power : 0,
          gridPower: d.gridPower !== undefined ? d.gridPower : 0,
          batteryPower: d.batteryPower !== undefined ? d.batteryPower : 0,
          batterySoc: d.batterySoc !== undefined ? d.batterySoc : 100,
          backupPower: d.backupPower !== undefined ? d.backupPower : 0,
          loadPower: d.loadPower !== undefined ? d.loadPower : 0,
          gridVoltage: d.gridVoltage || 229.0,
          batteryVoltage: d.batteryVoltage || 51.9,
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

  // Tính toán đỉnh công suất max cho trục Y
  const maxKw = Math.max(
    3.0,
    ...chartData.map(d => Math.max(d.pv || 0, d.load || 0, d.chg || 0, d.dis || 0, d.backup || 0, d.grid || 0))
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
  const estimatedSavings = Math.round((energyStats.pvEnergy || 0) * electricityPrice);

  return (
    <div className="max-w-7xl mx-auto space-y-5 font-['Plus_Jakarta_Sans',sans-serif] animate-fade-in pb-16 px-2 sm:px-4">
      
      {/* 0. THANH ĐIỀU HƯỚNG & TIÊU ĐỀ TRẠM (ẨN TRÊN MOBILE, BẮT ĐẦU TRỰC TIẾP TỪ SƠ ĐỒ) */}
      <div className="hidden md:flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 bg-[#0b101e] border border-slate-800/90 p-3 sm:p-4 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3">
          {onNavigate && (
            <button
              onClick={() => onNavigate('stations')}
              className="flex items-center space-x-1 sm:space-x-1.5 text-[11px] sm:text-xs font-bold text-slate-300 hover:text-cyan-300 transition py-1 sm:py-1.5 px-2 sm:px-3 rounded-xl bg-slate-800 border border-slate-700 shadow-sm cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Trạm & Pin</span>
            </button>
          )}

          <div className="flex items-center space-x-1.5">
            <span className="font-extrabold text-white text-sm sm:text-base tracking-wide font-mono truncate max-w-[140px] sm:max-w-none">
              {deviceInfo.stationId || 'STATION-01'}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-1.5 sm:gap-3 text-xs">
          {/* Nút Cài Đặt Dự Án Này */}
          <button
            onClick={() => setIsProjectSettingsOpen(true)}
            className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition flex items-center gap-1 font-bold text-[11px] sm:text-xs cursor-pointer"
            title="Cài đặt đơn giá tiền điện, công suất PV và pin lưu trữ riêng của dự án này"
          >
            <Settings className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cài Đặt Dự Án</span>
          </button>

          <span className="px-2 py-0.5 sm:py-1 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 font-mono font-semibold flex items-center gap-1 text-[10px] sm:text-xs max-w-[180px] sm:max-w-none truncate">
            <Cpu className="w-3 h-3 shrink-0" />
            <span className="truncate">{deviceInfo.deviceName} ({deviceInfo.serialNumber})</span>
          </span>

          <span className="text-slate-400 font-medium flex items-center gap-1 text-[10px] sm:text-xs">
            <span className="text-emerald-400 font-mono font-bold">🔴 {liveClock}</span>
          </span>
        </div>
      </div>

      {/* 1. KHUNG BỐ CỤC 2 CỘT HIỆN ĐẠI DÀNH CHO MÁY TÍNH & TABLET */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        
        {/* ================= CỘT TRÁI (COL-7): SƠ ĐỒ TOPOLOGY & CẢM BIẾN REALTIME ================= */}
        <div className="lg:col-span-7 space-y-3.5 sm:space-y-5">
          
          {/* SƠ ĐỒ NĂNG LƯỢNG VỚI INVERTER VÀ 5 THẺ KÍNH MỜ */}
          <InteractiveTopology
            pvPower={flowData.pvPower}
            pv1Power={flowData.pv1Power}
            pv2Power={flowData.pv2Power}
            gridPower={flowData.gridPower}
            batteryPower={flowData.batteryPower}
            batterySoc={flowData.batterySoc}
            backupPower={flowData.backupPower}
            loadPower={flowData.loadPower}
            gridVoltage={flowData.gridVoltage}
            batteryVoltage={flowData.batteryVoltage}
            temperature={flowData.temperature}
            tempF={flowData.tempF}
          />

          {/* 3 THẺ ĐO ĐẠC SENSOR THỜI GIAN THỰC */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3.5">
            <div className="bg-[#0b101e] border border-slate-800/90 py-2.5 sm:py-4 px-1.5 sm:px-3 rounded-2xl text-center shadow-lg transition-all hover:border-emerald-500/40">
              <span className="text-[9px] sm:text-[11px] text-slate-400 block font-bold uppercase tracking-wider truncate">ĐIỆN ÁP PIN</span>
              <span className="text-sm sm:text-2xl font-black text-emerald-400 font-mono mt-0.5 sm:mt-1 block">
                {flowData.batteryVoltage} V
              </span>
              <span className="text-[8px] sm:text-[10px] text-slate-500 font-mono block truncate whitespace-nowrap">Dung lượng: {flowData.batterySoc}%</span>
            </div>
            
            <div className="bg-[#0b101e] border border-slate-800/90 py-2.5 sm:py-4 px-1.5 sm:px-3 rounded-2xl text-center shadow-lg transition-all hover:border-cyan-500/40">
              <span className="text-[9px] sm:text-[11px] text-slate-400 block font-bold uppercase tracking-wider truncate">ĐIỆN ÁP LƯỚI</span>
              <span className="text-sm sm:text-2xl font-black text-cyan-400 font-mono mt-0.5 sm:mt-1 block">
                {flowData.gridVoltage} V
              </span>
              <span className="text-[8px] sm:text-[10px] text-slate-500 font-mono block truncate whitespace-nowrap">Tần số: 50.0 Hz</span>
            </div>

            <div className="bg-[#0b101e] border border-slate-800/90 py-2.5 sm:py-4 px-1.5 sm:px-3 rounded-2xl text-center shadow-lg transition-all hover:border-amber-500/40">
              <span className="text-[9px] sm:text-[11px] text-slate-400 block font-bold uppercase tracking-wider truncate">NHIỆT ĐỘ MÁY</span>
              <span className="text-sm sm:text-2xl font-black text-amber-400 font-mono mt-0.5 sm:mt-1 block">
                {flowData.temperature}°C
              </span>
              <span className="text-[8px] sm:text-[10px] text-slate-500 font-mono block truncate whitespace-nowrap">Tản nhiệt tối ưu</span>
            </div>
          </div>
        </div>

        {/* ================= CỘT PHẢI (COL-5): THỐNG KÊ, BIỂU ĐỒ 24H & BỘ LỌC ================= */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* BỘ CHỌN THỜI GIAN & LỊCH TƯƠNG TÁC */}
          <div className="flex items-center justify-between bg-[#0b101e] border border-slate-800/90 p-3 rounded-2xl shadow-lg">
            {/* Nút bấm chọn Scope NGÀY / THÁNG / NĂM */}
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
              {[
                { id: 'DAY', label: 'NGÀY' },
                { id: 'MONTH', label: 'THÁNG' },
                { id: 'YEAR', label: 'NĂM' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setTimeScope(item.id)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
                    timeScope === item.id
                      ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Bộ Chọn Lịch Tương Tác */}
            <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 shadow-sm">
              {timeScope === 'DAY' && (
                <input
                  type="date"
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="bg-transparent text-slate-200 text-xs font-bold font-mono focus:outline-none cursor-pointer"
                />
              )}

              {timeScope === 'MONTH' && (
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-slate-200 text-xs font-bold font-mono focus:outline-none cursor-pointer"
                />
              )}

              {timeScope === 'YEAR' && (
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-transparent text-slate-200 text-xs font-bold font-mono focus:outline-none cursor-pointer pr-2"
                >
                  {['2023', '2024', '2025', '2026', '2027'].map(yr => (
                    <option key={yr} value={yr} className="bg-slate-900 text-white">
                      {yr}
                    </option>
                  ))}
                </select>
              )}
              <Calendar className="w-3.5 h-3.5 text-slate-400 pointer-events-none ml-1.5" />
            </div>
          </div>

          {/* 6 CHỈ SỐ NĂNG LƯỢNG (PV, Tiêu thụ, Sạc pin, Xả pin, Bán điện, Mua điện) */}
          <div className="bg-[#0b101e] border border-slate-800/90 rounded-2xl p-5 shadow-xl relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Sản Lượng & Tiêu Thụ Năng Lượng
              </span>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                Tiết kiệm: ~{estimatedSavings.toLocaleString('vi-VN')} đ
              </span>
            </div>

            {loadingStats && (
              <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center space-x-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span className="text-slate-400 text-[11px] font-medium">PV Phát</span>
                </div>
                <span className="font-extrabold text-white font-mono text-sm block">
                  {energyStats.pvEnergy.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">kWh</span>
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center space-x-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                  <span className="text-slate-400 text-[11px] font-medium">Tiêu Thụ</span>
                </div>
                <span className="font-extrabold text-white font-mono text-sm block">
                  {energyStats.loadEnergy.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">kWh</span>
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center space-x-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-400 text-[11px] font-medium">Sạc Pin</span>
                </div>
                <span className="font-extrabold text-white font-mono text-sm block">
                  {energyStats.chargeEnergy.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">kWh</span>
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center space-x-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span className="text-slate-400 text-[11px] font-medium">Xả Pin</span>
                </div>
                <span className="font-extrabold text-white font-mono text-sm block">
                  {energyStats.dischargeEnergy.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">kWh</span>
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center space-x-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                  <span className="text-slate-400 text-[11px] font-medium">Bán Điện</span>
                </div>
                <span className="font-extrabold text-white font-mono text-sm block">
                  {energyStats.sellEnergy.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">kWh</span>
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center space-x-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span className="text-slate-400 text-[11px] font-medium">Mua Điện</span>
                </div>
                <span className="font-extrabold text-white font-mono text-sm block">
                  {energyStats.buyEnergy.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">kWh</span>
                </span>
              </div>
            </div>
          </div>

          {/* BIỂU ĐỒ NĂNG LƯỢNG 24H & COMBO CHART */}
          <div className="bg-[#0b101e] border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-3.5">
            
            {/* Header Đồ thị & Các nút Toggles */}
            {timeScope === 'DAY' ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-200 font-extrabold">Đồ thị công suất 24 Giờ (Line Chart)</span>
                  <span className="text-slate-400 font-mono text-[11px]">• Nhấn bật/tắt đường</span>
                </div>
                {/* Nút bật tắt từng đường */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'pv', label: 'PV', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
                    { id: 'load', label: 'Tải hòa lưới', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
                    { id: 'backup', label: 'Tải dự phòng', color: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
                    { id: 'chg', label: 'Sạc pin', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
                    { id: 'dis', label: 'Xả pin', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
                    { id: 'grid', label: 'Lưới điện', color: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
                    { id: 'soc', label: '% Pin (SOC)', color: 'bg-pink-500/20 text-pink-300 border-pink-500/40' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setLineToggles(prev => ({ ...prev, [t.id]: !prev[t.id] }))}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                        lineToggles[t.id] ? t.color : 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-60'
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
                    <span className="text-slate-300 font-medium">PV phát</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-sky-500"></span>
                    <span className="text-slate-300 font-medium">Tải nhà</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-1 rounded-sm bg-emerald-400"></span>
                    <span className="text-slate-300 font-medium">Sạc pin</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-1 rounded-sm bg-purple-400"></span>
                    <span className="text-slate-300 font-medium">Xả pin</span>
                  </div>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">
                  {timeScope === 'MONTH' ? `${chartData.length || 31} Ngày` : '12 Tháng'}
                </span>
              </div>
            )}

            {/* KHUNG VẼ ĐỒ THỊ */}
            {timeScope === 'DAY' ? (
              <div className="relative w-full h-[180px] pl-10 pr-10 pb-5 border-b border-slate-800/80 flex items-end">
                {/* Trục Y trái (kW) */}
                <div className="absolute left-0 top-0 bottom-5 flex flex-col justify-between text-[9px] text-slate-400 font-mono font-bold">
                  <span>{maxKw.toFixed(1)} kW</span>
                  <span>{(maxKw * 0.5).toFixed(1)} kW</span>
                  <span>0 kW</span>
                </div>

                {/* Trục Y phải (% SOC) */}
                <div className="absolute right-0 top-0 bottom-5 flex flex-col justify-between text-[9px] text-pink-400 font-mono font-bold text-right">
                  <span>100%</span>
                  <span>50%</span>
                  <span>0%</span>
                </div>

                {/* SVG Multi-Line Paths */}
                <svg viewBox="0 0 450 140" className="w-full h-full z-10 overflow-visible" preserveAspectRatio="none">
                  <line x1="0" y1="0" x2="450" y2="0" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="70" x2="450" y2="70" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="140" x2="450" y2="140" stroke="#334155" strokeWidth="1" />

                  {/* Đường PV (Vàng) */}
                  {lineToggles.pv && (
                    <polyline
                      points={getLinePoints(chartData, 'pv', maxKw, 140, 450)}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                    />
                  )}
                  {/* Đường Tải hòa lưới (Cyan) */}
                  {lineToggles.load && (
                    <polyline
                      points={getLinePoints(chartData, 'load', maxKw, 140, 450)}
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2"
                    />
                  )}
                  {/* Đường Tải dự phòng (Cam) */}
                  {lineToggles.backup && (
                    <polyline
                      points={getLinePoints(chartData, 'backup', maxKw, 140, 450)}
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="1.5"
                    />
                  )}
                  {/* Đường Sạc pin (Xanh lá) */}
                  {lineToggles.chg && (
                    <polyline
                      points={getLinePoints(chartData, 'chg', maxKw, 140, 450)}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                    />
                  )}
                  {/* Đường Xả pin (Tím) */}
                  {lineToggles.dis && (
                    <polyline
                      points={getLinePoints(chartData, 'dis', maxKw, 140, 450)}
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth="2"
                    />
                  )}
                  {/* Đường Lưới điện (Sky) */}
                  {lineToggles.grid && (
                    <polyline
                      points={getLinePoints(chartData, 'grid', maxKw, 140, 450)}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                    />
                  )}
                  {/* Đường SOC % Pin (Hồng nét đứt) */}
                  {lineToggles.soc && (
                    <polyline
                      points={getLinePoints(chartData, 'soc', 100, 140, 450)}
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
                  timeScope === 'YEAR' ? 100 : 20,
                  ...chartData.map(d => Math.max(d.pv || 0, d.load || 0))
                );

                return (
                  <div className="relative w-full h-[180px] pl-10 pb-5 border-b border-slate-800/80 flex items-end">
                    {/* Trục Y hiển thị kWh động */}
                    <div className="absolute left-0 top-0 bottom-5 flex flex-col justify-between text-[9px] text-slate-400 font-mono font-bold">
                      <span>{Math.round(maxComboVal)} kWh</span>
                      <span>{Math.round(maxComboVal / 2)} kWh</span>
                      <span>0 kWh</span>
                    </div>

                    <div className="w-full h-full flex items-end justify-between gap-0.5 sm:gap-1 px-1 relative">
                      {chartData.map((item, idx) => {
                        const pvH = Math.max(0, Math.min(100, (item.pv / maxComboVal) * 100));
                        const loadH = Math.max(0, Math.min(100, (item.load / maxComboVal) * 100));

                        return (
                          <div 
                            key={idx} 
                            className="flex-1 h-full flex items-end justify-center space-x-[1px] sm:space-x-[1.5px] group relative cursor-pointer"
                          >
                            {/* Hover Tooltip chi tiết */}
                            <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-slate-900/95 border border-slate-700 p-2 rounded-xl text-[10px] font-mono text-white shadow-2xl z-30 pointer-events-none whitespace-nowrap min-w-[110px]">
                              <span className="font-bold text-cyan-300 border-b border-slate-800 pb-1 mb-1">
                                {timeScope === 'MONTH' ? `Ngày ${item.label}` : `Tháng ${item.label}`}
                              </span>
                              <span className="text-amber-400">☀️ PV: {item.pv} kWh</span>
                              <span className="text-sky-400">⚡ Tải: {item.load} kWh</span>
                              {item.chg > 0 && <span className="text-emerald-400">🔋 Sạc: {item.chg} kWh</span>}
                              {item.dis > 0 && <span className="text-purple-400">⚡ Xả: {item.dis} kWh</span>}
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
                          points={getLinePoints(chartData, 'chg', maxComboVal, 140, 450)}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2"
                        />
                        <polyline
                          points={getLinePoints(chartData, 'dis', maxComboVal, 140, 450)}
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
            <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-1 px-4 font-bold">
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
                  <span className="text-sky-400 px-1 rounded bg-sky-500/20">07</span>
                  <span>14</span>
                  <span>21</span>
                  <span>28</span>
                  <span>{chartData.length || 31}</span>
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
        station={{ stationId: currentStationId, stationName: deviceInfo.stationName }}
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
