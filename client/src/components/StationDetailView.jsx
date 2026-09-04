import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, Settings, Sun, Battery, BatteryCharging, 
  Home, Zap, Monitor, Cpu, Radio, Activity, TrendingUp, 
  Sliders, Shield, RefreshCw, CheckCircle2, AlertTriangle, 
  Calendar, FileText, Server, Power, Gauge, Smartphone, Monitor as DesktopIcon
} from 'lucide-react';
import InverterUnit from './InverterUnit';
import InteractiveTopology from './InteractiveTopology';
import api from '../services/api';

export default function StationDetailView({ station, onBack }) {
  const [activeTab, setActiveTab] = useState('realtime'); // realtime | yield | state | control | info | logs
  const [timeScope, setTimeScope] = useState('MONTH'); // DAY | MONTH | YEAR
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [viewMode, setViewMode] = useState('auto'); // auto | phone | desktop
  const [activeFilters, setActiveFilters] = useState({
    pv: true,
    load: true,
    charge: false,
    discharge: false,
    sell: false,
    buy: false
  });

  // Remote Control Form States
  const [workMode, setWorkMode] = useState('SELF_CONSUMPTION');
  const [chargeCurrent, setChargeCurrent] = useState(60);
  const [dischargeCurrent, setDischargeCurrent] = useState(80);
  const [cutoffSoc, setCutoffSoc] = useState(15);
  const [configLoading, setConfigLoading] = useState(false);
  const [configSuccess, setConfigSuccess] = useState('');

  // Live Energy Flow State
  const [flowData, setFlowData] = useState({
    pvPower: 0,
    batteryPower: 0,
    batterySoc: 61,
    loadPower: 0,
    backupPower: 0,
    gridPower: 0,
    temperature: 39.4,
    tempF: 103,
    gridVoltage: 228.6,
    batteryVoltage: 51.9
  });

  const [deviceInfo, setDeviceInfo] = useState({
    deviceName: 'sungo',
    serialNumber: '3528214760-1',
    dtuCode: '35282147608648059097',
    stationName: 'sungoPlant',
    stationId: '454586755050340353'
  });

  // 31-Day Bar Chart Data matching Screenshot 2
  const monthDays = [
    { day: '01', pv: 14.2, load: 2.1 },
    { day: '02', pv: 11.5, load: 3.4 },
    { day: '03', pv: 9.8, load: 2.8 },
    { day: '04', pv: 15.6, load: 18.2 },
    { day: '05', pv: 19.8, load: 31.5 },
    { day: '06', pv: 20.4, load: 32.8 },
    { day: '07', pv: 17.2, load: 25.4 },
    { day: '08', pv: 16.5, load: 27.2 },
    { day: '09', pv: 16.8, load: 25.1 },
    { day: '10', pv: 12.4, load: 4.2 },
    { day: '11', pv: 14.9, load: 15.8 },
    { day: '12', pv: 17.5, load: 22.4 },
    { day: '13', pv: 18.2, load: 20.8 },
    { day: '14', pv: 17.9, load: 30.6 },
    { day: '15', pv: 16.4, load: 24.5 },
    { day: '16', pv: 11.2, load: 4.5 },
    { day: '17', pv: 13.8, load: 17.9 },
    { day: '18', pv: 12.9, load: 23.4 },
    { day: '19', pv: 14.5, load: 14.2 },
    { day: '20', pv: 15.8, load: 19.5 },
    { day: '21', pv: 19.5, load: 22.8 },
    { day: '22', pv: 18.2, load: 21.4 },
    { day: '23', pv: 6.8, load: 7.2 },
    { day: '24', pv: 12.4, load: 13.5 },
    { day: '25', pv: 0.0, load: 0.8 },
    { day: '26', pv: 0.0, load: 0.0 },
    { day: '27', pv: 0.0, load: 0.0 },
    { day: '28', pv: 0.0, load: 0.0 },
    { day: '29', pv: 11.8, load: 0.0 },
    { day: '30', pv: 6.2, load: 7.5 },
    { day: '31', pv: 0.0, load: 0.0 },
  ];

  useEffect(() => {
    fetchLiveFlow();
    const interval = setInterval(fetchLiveFlow, 1000);
    return () => clearInterval(interval);
  }, [station]);

  const fetchLiveFlow = async () => {
    try {
      const res = await api.get(`/stations/energy/flow?stationId=${station?.stationId || station?.id || '454586755050340353'}`);
      const d = res?.data || res;
      if (d) {
        if (d.deviceName) {
          setDeviceInfo(prev => ({
            ...prev,
            deviceName: d.deviceName || prev.deviceName,
            serialNumber: d.serialNumber || prev.serialNumber,
            dtuCode: d.dtuCode || prev.dtuCode,
            stationName: d.stationName || prev.stationName,
            stationId: d.stationId || prev.stationId
          }));
        }

        setFlowData(prev => ({
          ...prev,
          pvPower: d.pvPower !== undefined ? d.pvPower : prev.pvPower,
          batteryPower: d.batteryPower !== undefined ? d.batteryPower : prev.batteryPower,
          batterySoc: d.batterySoc !== undefined ? d.batterySoc : prev.batterySoc,
          loadPower: d.loadPower !== undefined ? d.loadPower : prev.loadPower,
          backupPower: d.backupPower !== undefined ? d.backupPower : prev.backupPower,
          gridPower: d.gridPower !== undefined ? d.gridPower : prev.gridPower,
          gridVoltage: d.gridVoltage || prev.gridVoltage,
          batteryVoltage: d.batteryVoltage || prev.batteryVoltage,
          temperature: d.temperature || prev.temperature
        }));
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSaveRemoteConfig = async (e) => {
    e.preventDefault();
    setConfigLoading(true);
    setConfigSuccess('');
    try {
      await api.post('/stations/config/write', {
        deviceId: station?.stationId || 'P250820063',
        key: 'inverter_work_mode',
        value: workMode
      });
      await api.post('/stations/config/write', {
        deviceId: station?.stationId || 'P250820063',
        key: 'max_charge_current',
        value: chargeCurrent
      });
      setConfigSuccess('Đã gửi lệnh điều khiển thành công tới Inverter!');
      setTimeout(() => setConfigSuccess(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setConfigLoading(false);
    }
  };

  const toggleFilter = (key) => {
    setActiveFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const deviceSN = station?.raw?.serialNumber || station?.stationId || 'P250820063';

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Top Breadcrumb & Responsive Mode Bar */}
      <div className="flex items-center justify-between px-2">
        <button
          onClick={onBack}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center space-x-2 text-xs font-bold transition shadow"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Quay Lại Danh Sách</span>
        </button>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-mono hidden sm:inline-block">SN: {deviceSN}</span>
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('phone')}
              className={`px-2.5 py-1 rounded-lg flex items-center space-x-1.5 transition ${viewMode === 'phone' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'}`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Giao Diện Điện Thoại</span>
            </button>
            <button
              onClick={() => setViewMode('desktop')}
              className={`px-2.5 py-1 rounded-lg flex items-center space-x-1.5 transition ${viewMode === 'desktop' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'}`}
            >
              <DesktopIcon className="w-3.5 h-3.5" />
              <span>Giao Diện Máy Tính</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className={`${viewMode === 'desktop' ? 'grid grid-cols-1 lg:grid-cols-12 gap-6' : 'max-w-xl mx-auto'} bg-[#0e131f] text-slate-100 shadow-2xl rounded-3xl overflow-hidden border border-slate-800 animate-fade-in relative font-['Plus_Jakarta_Sans',sans-serif]`}>
        
        {/* ================= LEFT SECTION / TOPOLOGY ================= */}
        <div className={`${viewMode === 'desktop' ? 'lg:col-span-6 p-6 border-b lg:border-b-0 lg:border-r border-slate-800' : 'p-4 sm:p-6'} space-y-4`}>
          
          {/* Top Bar inside Shell */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 text-xs">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <h2 className="text-sm sm:text-base font-black text-slate-100 font-mono tracking-wide">
                SN: {deviceInfo.serialNumber}
              </h2>
            </div>

            <div className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 font-mono">
              <span>DTU: {deviceInfo.dtuCode}</span>
            </div>
          </div>

          {/* Sơ đồ năng lượng đa chiều (Interactive Circuit Topology Canvas) */}
          <InteractiveTopology
            pvPower={flowData.pvPower}
            batteryPower={flowData.batteryPower}
            batterySoc={flowData.batterySoc}
            loadPower={flowData.loadPower}
            backupPower={flowData.backupPower}
            gridPower={flowData.gridPower}
            batteryVoltage={flowData.batteryVoltage}
            gridVoltage={flowData.gridVoltage}
            temperature={flowData.temperature}
            tempF={flowData.tempF}
          />

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl text-center">
              <span className="text-[9px] text-slate-400 block font-semibold uppercase">Điện Áp Pin</span>
              <span className="text-sm sm:text-base font-black text-emerald-400 font-mono">{flowData.batteryVoltage} V</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl text-center">
              <span className="text-[9px] text-slate-400 block font-semibold uppercase">Điện Áp Lưới</span>
              <span className="text-sm sm:text-base font-black text-cyan-400 font-mono">{flowData.gridVoltage} V</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl text-center">
              <span className="text-[9px] text-slate-400 block font-semibold uppercase">Nhiệt Độ Máy</span>
              <span className="text-sm sm:text-base font-black text-amber-400 font-mono">{flowData.temperature}°C</span>
            </div>
          </div>
        </div>

        {/* ================= RIGHT SECTION / 6 TABS & ANALYTICS ================= */}
        <div className={`${viewMode === 'desktop' ? 'lg:col-span-6 p-6' : 'p-4 sm:p-5'} space-y-4`}>
          
          {/* THÔNG SỐ KỸ THUẬT THIẾT BỊ (EXACT MATCHING SCREENSHOT) */}
          <div className="bg-[#131929] border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2.5">
            <div className="text-xs sm:text-sm font-extrabold text-amber-400 tracking-wide flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>Thông số kỹ thuật thiết bị</span>
            </div>
            <div className="space-y-2 text-xs divide-y divide-slate-800/60 pt-1">
              <div className="flex justify-between items-center text-slate-300 pt-1">
                <span className="text-slate-400">Tên thiết bị:</span>
                <span className="font-bold text-slate-100">{deviceInfo.deviceName}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300 pt-1.5">
                <span className="text-slate-400">Số Serial:</span>
                <span className="font-black text-white font-mono text-sm tracking-wider">{deviceInfo.serialNumber}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300 pt-1.5">
                <span className="text-slate-400">Mã số DTU:</span>
                <span className="font-mono text-slate-200 text-xs">{deviceInfo.dtuCode}</span>
              </div>
            </div>
          </div>
          
          {/* Scope & Tab Selector */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
              {['NGÀY', 'THÁNG', 'NĂM'].map(scope => (
                <button
                  key={scope}
                  onClick={() => setTimeScope(scope)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    timeScope === scope
                      ? 'bg-[#eab308] text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {scope}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200">
              <span>August 2026</span>
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          {/* 6-KPI Energy Matrix */}
          <div className="bg-[#131929] border border-slate-800 rounded-2xl p-4 shadow-lg">
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs font-medium">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span>
                  <span className="text-slate-300">PV</span>
                </div>
                <span className="font-bold text-slate-100 font-mono text-sm">304.90kWh</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]"></span>
                  <span className="text-slate-300">Tiêu thụ</span>
                </div>
                <span className="font-bold text-slate-100 font-mono text-sm">436.10kWh</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span>
                  <span className="text-slate-300">Bán điện</span>
                </div>
                <span className="font-bold text-slate-100 font-mono text-sm">2.40kWh</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span>
                  <span className="text-slate-300">Mua điện</span>
                </div>
                <span className="font-bold text-slate-100 font-mono text-sm">219.40kWh</span>
              </div>
            </div>
          </div>

          {/* 31-Day Dual Bar Chart */}
          <div className="bg-[#131929] border border-slate-800 rounded-2xl p-4 pt-5">
            <div className="flex items-center justify-between mb-3 text-xs">
              <div className="flex items-center space-x-4 text-slate-400">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span> PV phát</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]"></span> Tải nhà</span>
              </div>
            </div>

            <div className="h-44 flex items-end justify-between relative pl-8 pb-5 border-b border-slate-800/80">
              <div className="absolute left-0 top-0 bottom-5 flex flex-col justify-between text-[9px] text-slate-400 font-mono font-bold">
                <span>40k</span>
                <span>20k</span>
                <span>0k</span>
              </div>

              <div className="w-full h-full flex items-end justify-between gap-1 z-10">
                {monthDays.map((item, idx) => {
                  const pvH = Math.max(item.pv > 0 ? (item.pv / 35) * 100 : 0, 0);
                  const loadH = Math.max(item.load > 0 ? (item.load / 35) * 100 : 0, 0);

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative" title={`Ngày ${item.day}: PV=${item.pv}kWh, Tải=${item.load}kWh`}>
                      <div className="flex items-end space-x-0.5 w-full justify-center h-full">
                        {item.pv > 0 && (
                          <div 
                            style={{ height: `${pvH}%` }} 
                            className="w-1.5 bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-xs transition-all duration-300 group-hover:brightness-125"
                          ></div>
                        )}
                        {item.load > 0 && (
                          <div 
                            style={{ height: `${loadH}%` }} 
                            className="w-1.5 bg-gradient-to-t from-sky-600 to-sky-400 rounded-t-xs transition-all duration-300 group-hover:brightness-125"
                          ></div>
                        )}
                      </div>
                      {['01', '07', '14', '21', '28'].includes(item.day) ? (
                        <span className="absolute -bottom-4 text-[8px] font-mono text-slate-400 font-bold">
                          {item.day}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Remote Inverter Control Widget */}
          <div className="bg-[#131929] border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Điều Khiển Từ Xa</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">12kW Hybrid</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'SELF_CONSUMPTION', label: 'Tự Dùng (self)' },
                { id: 'BATTERY_FIRST', label: 'Ưu Tiên Sạc Pin' },
                { id: 'FEED_IN_GRID', label: 'Bán Điện Lưới' },
                { id: 'BACKUP_UPS', label: 'Dự Phòng UPS' }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setWorkMode(m.id)}
                  className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold text-left transition ${
                    workMode === m.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleSaveRemoteConfig}
              disabled={configLoading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition"
            >
              {configLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              <span>Áp Dụng Cấu Hình Xuống Máy</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
