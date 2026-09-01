import React, { useState } from 'react';
import { 
  Sun, 
  Zap, 
  Battery, 
  Shield, 
  Home, 
  X, 
  Activity, 
  CheckCircle2, 
  TrendingUp, 
  Layers, 
  Gauge, 
  Radio, 
  Info,
  Flame,
  ArrowRight,
  Cpu,
  Boxes
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import InverterUnit from './InverterUnit';

export default function InteractiveTopology({
  pvPower = 0,
  pv1Power = 0,
  pv2Power = 0,
  pv1Voltage = 0,
  pv1Current = 0,
  pv2Voltage = 0,
  pv2Current = 0,
  gridPower = 0,
  gridVoltage = 229.0,
  gridFreq = 50.0,
  gridCurrent = 0,
  batteryPower = 0,
  batteryVoltage = 51.9,
  batteryCurrent = 0,
  batterySoc = 100,
  batteryTemp = 35,
  backupPower = 0,
  backupVoltage = 228.5,
  backupCurrent = 0,
  loadPower = 0,
  loadCurrent = 0,
  temperature = 38.9,
  tempF = 102,
  todayPvEnergy = '0.00',
  fleetMode = 'AGGREGATED', // 'AGGREGATED' | 'INV_1' | 'INV_2' | 'INV_3'
  clusterType = '3PHASE',   // '3PHASE' | '1PHASE_PARALLEL'
  inverters = [],
  totalStorageCapacity = '30.0 kWh',
  className = ''
}) {
  const { isDark } = useTheme();
  const [activeModal, setActiveModal] = useState(null); // 'solar' | 'grid' | 'battery' | 'backup' | 'load' | null

  const isAggregated = fleetMode === 'AGGREGATED';

  // Trạng thái xả pin (Discharging): khi batteryPower > 0 hoặc đang cấp điện cho tải
  // Trạng thái sạc pin (Charging): khi batteryPower < 0 (nhận điện từ PV / Lưới)
  const isBatteryDischarging = batteryPower >= 0;

  // Hiệu chuẩn Tải Dự Phòng: Hiển thị = Tải thật - 34W (làm tròn, nếu < 3W thì = 0W)
  const adjustedBackup = Math.round(backupPower - (isAggregated ? 102 : 34));
  const displayBackupPower = adjustedBackup < 3 ? 0 : adjustedBackup;

  // Hiệu chuẩn Lưới Điện: Nếu giá trị tuyệt đối < 5W thì làm tròn về 0W (loại bỏ gợn nhiễu cảm biến)
  const displayGridPower = Math.abs(gridPower) < 5 ? 0 : Math.round(gridPower);

  // Tính toán thông số PV1 & PV2 chi tiết
  const effectivePv1 = pv1Power > 0 ? pv1Power : (pvPower > 0 ? Math.round(pvPower * 0.48) : 0);
  const effectivePv2 = pv2Power > 0 ? pv2Power : (pvPower > 0 ? Math.round(pvPower * 0.52) : 0);
  
  const calcPv1V = pv1Voltage > 0 ? pv1Voltage : (effectivePv1 > 0 ? Number((effectivePv1 / 6.2).toFixed(1)) : 0);
  const calcPv1A = pv1Current > 0 ? pv1Current : (effectivePv1 > 0 ? Number((effectivePv1 / (calcPv1V || 360)).toFixed(2)) : 0);

  const calcPv2V = pv2Voltage > 0 ? pv2Voltage : (effectivePv2 > 0 ? Number((effectivePv2 / 6.5).toFixed(1)) : 0);
  const calcPv2A = pv2Current > 0 ? pv2Current : (effectivePv2 > 0 ? Number((effectivePv2 / (calcPv2V || 360)).toFixed(2)) : 0);

  // Dòng điện lưới
  const calcGridA = gridCurrent > 0 ? gridCurrent : (Math.abs(displayGridPower) > 0 && gridVoltage > 0 ? Number((Math.abs(displayGridPower) / gridVoltage).toFixed(2)) : 0);

  // Dòng điện pin
  const calcBatA = batteryCurrent ? Math.abs(batteryCurrent) : (Math.abs(batteryPower) > 0 && batteryVoltage > 0 ? Number((Math.abs(batteryPower) / batteryVoltage).toFixed(1)) : 0);

  // Dòng tải tiêu thụ
  const calcLoadA = loadCurrent > 0 ? loadCurrent : (loadPower > 0 && gridVoltage > 0 ? Number((loadPower / gridVoltage).toFixed(2)) : 0);

  // Dòng tải dự phòng
  const calcBackupA = backupCurrent > 0 ? backupCurrent : (displayBackupPower > 0 ? Number((displayBackupPower / 228.5).toFixed(2)) : 0);

  // Phân bổ 3 Pha khi ở chế độ 3 Phase
  const phaseAPower = Math.round(loadPower * 0.36);
  const phaseBPower = Math.round(loadPower * 0.33);
  const phaseCPower = Math.round(loadPower * 0.31);

  const phaseAGrid = Math.round(displayGridPower * 0.36);
  const phaseBGrid = Math.round(displayGridPower * 0.33);
  const phaseCGrid = Math.round(displayGridPower * 0.31);

  return (
    <div className={`relative ${isDark ? 'bg-[#070b14] border-slate-800/80 text-white' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50 text-slate-800'} rounded-3xl p-3 sm:p-5 border shadow-2xl overflow-hidden select-none font-['Plus_Jakarta_Sans',sans-serif] ${className} transition-colors duration-300`}>
      
      {/* 1. Thanh chỉ báo chế độ và nhiệt độ máy ở đỉnh */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1 relative z-20">
        <div className="flex items-center gap-1.5">
          {isAggregated ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500/20 via-teal-500/20 to-emerald-500/20 border border-cyan-500/40 text-cyan-400 font-extrabold text-[10px] sm:text-xs shadow-sm">
              <Boxes className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>CỤM GỘP 3 BIẾN TẦN ({clusterType === '3PHASE' ? 'ĐIỆN 3 PHA' : '1 PHA SONG SONG'})</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] sm:text-xs">
              <Cpu className="w-3.5 h-3.5" />
              <span>{fleetMode === 'INV_1' ? 'BIẾN TẦN #1 (MASTER / PHA A)' : fleetMode === 'INV_2' ? 'BIẾN TẦN #2 (SLAVE 1 / PHA B)' : 'BIẾN TẦN #3 (SLAVE 2 / PHA C)'}</span>
            </span>
          )}
        </div>

        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full ${isDark ? 'bg-[#111827]/90 border-slate-700/80 text-slate-200' : 'bg-slate-100/95 border-slate-300 text-slate-800'} border text-[11px] sm:text-xs font-semibold shadow-md backdrop-blur-md`}>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
          <span className={`font-mono ${isDark ? 'text-amber-300' : 'text-amber-600'} font-bold`}>{temperature}°C ({tempF}°F)</span>
        </div>
      </div>

      {/* 2. KHUNG VẼ SƠ ĐỒ TRUNG TÂM */}
      <div className="relative w-full h-[370px] xs:h-[390px] sm:h-[420px] md:h-[440px] flex items-center justify-center my-1">
        
        {/* SVG CIRCUIT LINES LAYER */}
        <svg 
          viewBox="0 0 100 100" 
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
          preserveAspectRatio="none"
        >
          <defs>
            <filter id="glow-amber" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="0.6" floodColor="#f59e0b" floodOpacity="0.9" />
            </filter>
            <filter id="glow-blue" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="0.6" floodColor="#0284c7" floodOpacity="0.9" />
            </filter>
            <filter id="glow-emerald" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="0.6" floodColor="#10b981" floodOpacity="0.9" />
            </filter>
            <filter id="glow-cyan" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="0.6" floodColor="#06b6d4" floodOpacity="0.9" />
            </filter>

            <style>{`
              @keyframes flow-forward {
                from { stroke-dashoffset: 8; }
                to { stroke-dashoffset: 0; }
              }
              @keyframes flow-backward {
                from { stroke-dashoffset: 0; }
                to { stroke-dashoffset: 8; }
              }
              .flow-pv { animation: flow-forward 1.2s linear infinite; }
              .flow-grid { animation: flow-forward 1.4s linear infinite; }
              .flow-bat-discharge { animation: flow-forward 1.2s linear infinite; }
              .flow-bat-charge { animation: flow-backward 1.2s linear infinite; }
              .flow-load { animation: flow-forward 1.4s linear infinite; }
              .flow-backup { animation: flow-forward 1.4s linear infinite; }
            `}</style>
          </defs>

          {/* DÂY TĨNH NỐI TỪ TÂM CÁC THẺ (18%, 50%, 82%) VÀO CÁC CỔNG INVERTER (36%, 50%, 64%) */}
          <path d="M 18 10 L 18 38 L 36 38" fill="none" stroke={isDark ? "#1e293b" : "#cbd5e1"} strokeWidth="0.65" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 82 10 L 82 38 L 64 38" fill="none" stroke={isDark ? "#1e293b" : "#cbd5e1"} strokeWidth="0.65" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 18 90 L 18 62 L 36 62" fill="none" stroke={isDark ? "#1e293b" : "#cbd5e1"} strokeWidth="0.65" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 50 62 L 50 90" fill="none" stroke={isDark ? "#1e293b" : "#cbd5e1"} strokeWidth="0.65" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 64 62 L 82 62 L 82 90" fill="none" stroke={isDark ? "#1e293b" : "#cbd5e1"} strokeWidth="0.65" strokeLinecap="round" strokeLinejoin="round" />

          {/* CÁC NỐT ĐIỆN TỬ CỐ ĐỊNH TẠI CỔNG INVERTER */}
          <circle cx="36" cy="38" r="0.8" fill={isDark ? "#475569" : "#94a3b8"} />
          <circle cx="64" cy="38" r="0.8" fill={isDark ? "#475569" : "#94a3b8"} />
          <circle cx="36" cy="62" r="0.8" fill={isDark ? "#475569" : "#94a3b8"} />
          <circle cx="50" cy="62" r="0.8" fill={isDark ? "#475569" : "#94a3b8"} />
          <circle cx="64" cy="62" r="0.8" fill={isDark ? "#475569" : "#94a3b8"} />

          {/* DÒNG ĐIỆN PHÁT SÁNG ĐỘNG CHẠM THẲNG VÀO TRUNG TÂM CÁC Ô CHI TIẾT */}
          {pvPower > 0 && (
            <g>
              <path 
                d="M 18 10 L 18 38 L 36 38" 
                fill="none" 
                stroke="#f59e0b" 
                strokeWidth="0.85" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeDasharray="2 1.5"
                className="flow-pv"
                filter="url(#glow-amber)"
              />
              <circle cx="36" cy="38" r="1.1" fill="#f59e0b" filter="url(#glow-amber)" />
            </g>
          )}

          {displayGridPower !== 0 && (
            <g>
              <path 
                d="M 82 10 L 82 38 L 64 38" 
                fill="none" 
                stroke="#0ea5e9" 
                strokeWidth="0.85" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeDasharray="2 1.5"
                className="flow-grid"
                filter="url(#glow-blue)"
              />
              <circle cx="64" cy="38" r="1.1" fill="#0ea5e9" filter="url(#glow-blue)" />
            </g>
          )}
          
          {Math.abs(batteryPower) > 5 && (
            <g>
              <path 
                d="M 18 90 L 18 62 L 36 62" 
                fill="none" 
                stroke={isBatteryDischarging ? "#a855f7" : "#10b981"} 
                strokeWidth="0.85" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeDasharray="2 1.5"
                className={isBatteryDischarging ? "flow-bat-discharge" : "flow-bat-charge"}
                filter="url(#glow-emerald)"
              />
              <circle cx="36" cy="62" r="1.1" fill={isBatteryDischarging ? "#a855f7" : "#10b981"} filter="url(#glow-emerald)" />
            </g>
          )}

          {displayBackupPower > 0 && (
            <g>
              <path 
                d="M 50 62 L 50 90" 
                fill="none" 
                stroke="#f97316" 
                strokeWidth="0.85" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeDasharray="2 1.5"
                className="flow-backup"
                filter="url(#glow-amber)"
              />
              <circle cx="50" cy="62" r="1.1" fill="#f97316" filter="url(#glow-amber)" />
            </g>
          )}

          {loadPower > 0 && (
            <g>
              <path 
                d="M 64 62 L 82 62 L 82 90" 
                fill="none" 
                stroke="#06b6d4" 
                strokeWidth="0.85" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeDasharray="2 1.5"
                className="flow-load"
                filter="url(#glow-cyan)"
              />
              <circle cx="64" cy="62" r="1.1" fill="#06b6d4" filter="url(#glow-cyan)" />
            </g>
          )}
        </svg>

        {/* ================= INVERTER TRUNG TÂM (Căn giữa 50%, 50%) ================= */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center justify-center scale-90 xs:scale-95 sm:scale-100 md:scale-105">
          {isAggregated && (
            <div className="absolute -top-3 px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950 text-[9px] font-black tracking-wider uppercase shadow-lg shadow-cyan-500/30 z-30 whitespace-nowrap">
              3x PARALLEL CLUSTER
            </div>
          )}
          <InverterUnit
            batteryVoltage={batteryVoltage}
            gridVoltage={gridVoltage}
            state="RUNNING"
          />
        </div>

        {/* ================= 5 THẺ KÍNH MỜ ================= */}

        {/* 1. TOP LEFT: PIN MẶT TRỜI */}
        <div 
          onClick={() => setActiveModal('solar')}
          title="Nhấn để xem chi tiết chuỗi PV1, PV2, điện áp & dòng điện"
          className={`absolute left-[18%] -translate-x-1/2 top-[2%] z-20 w-[28%] max-w-[125px] min-w-[86px] ${isDark ? 'bg-[#0c1322]/90 hover:bg-[#111c33] border-slate-700/70 text-white' : 'bg-white/95 hover:bg-slate-50 border-slate-200 text-slate-800 shadow-md'} backdrop-blur-md rounded-2xl py-2 px-1.5 sm:py-2.5 sm:px-2 shadow-xl flex flex-col items-center text-center border hover:border-amber-400 hover:shadow-amber-500/20 cursor-pointer transition-all duration-200 active:scale-95 group`}
        >
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 mb-0.5 shadow-md shadow-amber-400/20 group-hover:scale-110 transition-transform">
            <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-[spin_10s_linear_infinite]" />
          </div>
          <span className={`text-[10px] sm:text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'} leading-tight`}>
            {isAggregated ? 'PV Tổng Cụm' : 'Pin mặt trời'}
          </span>
          <span className={`text-sm sm:text-base md:text-lg font-black ${isDark ? 'text-cyan-400' : 'text-cyan-600'} font-mono mt-0.5`}>
            {pvPower}W
          </span>
        </div>

        {/* 2. TOP RIGHT: LƯỚI ĐIỆN */}
        <div 
          onClick={() => setActiveModal('grid')}
          title="Nhấn để xem chi tiết điện áp, tần số và dòng điện lưới EVN"
          className={`absolute left-[82%] -translate-x-1/2 top-[2%] z-20 w-[28%] max-w-[125px] min-w-[86px] ${isDark ? 'bg-[#0c1322]/90 hover:bg-[#111c33] border-slate-700/70 text-white' : 'bg-white/95 hover:bg-slate-50 border-slate-200 text-slate-800 shadow-md'} backdrop-blur-md rounded-2xl py-2 px-1.5 sm:py-2.5 sm:px-2 shadow-xl flex flex-col items-center text-center border hover:border-sky-400 hover:shadow-sky-500/20 cursor-pointer transition-all duration-200 active:scale-95 group`}
        >
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 mb-0.5 shadow-md shadow-sky-500/20 group-hover:scale-110 transition-transform">
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400" />
          </div>
          <span className={`text-[10px] sm:text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'} leading-tight`}>
            {isAggregated && clusterType === '3PHASE' ? 'Lưới Điện 3 Pha' : 'Lưới điện'}
          </span>
          <span className={`text-sm sm:text-base md:text-lg font-black ${isDark ? 'text-cyan-400' : 'text-cyan-600'} font-mono mt-0.5`}>
            {displayGridPower}W
          </span>
        </div>

        {/* 3. BOTTOM LEFT: PIN LƯU TRỮ */}
        <div 
          onClick={() => setActiveModal('battery')}
          title="Nhấn để xem chi tiết cụm pin lưu trữ BMS, dung lượng SOC và nhiệt độ"
          className={`absolute left-[18%] -translate-x-1/2 bottom-[2%] z-20 w-[28%] max-w-[125px] min-w-[86px] ${isDark ? 'bg-[#0c1322]/90 hover:bg-[#111c33] border-slate-700/70 text-white' : 'bg-white/95 hover:bg-slate-50 border-slate-200 text-slate-800 shadow-md'} backdrop-blur-md rounded-2xl py-2 px-1.5 sm:py-2.5 sm:px-2 shadow-xl flex flex-col items-center text-center border hover:border-emerald-400 hover:shadow-emerald-500/20 cursor-pointer transition-all duration-200 active:scale-95 group`}
        >
          <div className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-500 text-[8px] sm:text-[9px] font-bold flex items-center gap-0.5 mb-0.5 shadow-sm group-hover:scale-105 transition-transform">
            <Battery className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span>{batterySoc}%</span>
          </div>
          <span className={`text-[10px] sm:text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'} leading-tight truncate w-full`}>
            {isAggregated ? 'Cụm Pin BMS (3 Pack)' : 'Pin lưu trữ'}
          </span>
          <span className={`text-sm sm:text-base md:text-lg font-black ${isDark ? 'text-cyan-400' : 'text-cyan-600'} font-mono mt-0.5`}>
            {Math.abs(batteryPower)}W
          </span>
        </div>

        {/* 4. BOTTOM MIDDLE: TẢI DỰ PHÒNG */}
        <div 
          onClick={() => setActiveModal('backup')}
          title="Nhấn để xem chi tiết tải ưu tiên EPS / UPS và điện áp đầu ra"
          className={`absolute left-1/2 -translate-x-1/2 bottom-[2%] z-20 w-[28%] max-w-[125px] min-w-[86px] ${isDark ? 'bg-[#0c1322]/90 hover:bg-[#111c33] border-slate-700/70 text-white' : 'bg-white/95 hover:bg-slate-50 border-slate-200 text-slate-800 shadow-md'} backdrop-blur-md rounded-2xl py-2 px-1.5 sm:py-2.5 sm:px-2 shadow-xl flex flex-col items-center text-center border hover:border-amber-400 hover:shadow-amber-500/20 cursor-pointer transition-all duration-200 active:scale-95 group`}
        >
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-500 mb-0.5 shadow-md shadow-amber-500/20 group-hover:scale-110 transition-transform">
            <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <span className={`text-[10px] sm:text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'} leading-tight truncate w-full`}>
            {isAggregated ? 'EPS Cụm Tổng' : 'Tải dự phòng'}
          </span>
          <span className={`text-sm sm:text-base md:text-lg font-black ${isDark ? 'text-cyan-400' : 'text-cyan-600'} font-mono mt-0.5`}>
            {displayBackupPower}W
          </span>
        </div>

        {/* 5. BOTTOM RIGHT: TẢI HÒA LƯỚI */}
        <div 
          onClick={() => setActiveModal('load')}
          title="Nhấn để xem chi tiết phân bổ nguồn cấp cho tải gia đình"
          className={`absolute left-[82%] -translate-x-1/2 bottom-[2%] z-20 w-[28%] max-w-[125px] min-w-[86px] ${isDark ? 'bg-[#0c1322]/90 hover:bg-[#111c33] border-slate-700/70 text-white' : 'bg-white/95 hover:bg-slate-50 border-slate-200 text-slate-800 shadow-md'} backdrop-blur-md rounded-2xl py-2 px-1.5 sm:py-2.5 sm:px-2 shadow-xl flex flex-col items-center text-center border hover:border-emerald-400 hover:shadow-emerald-500/20 cursor-pointer transition-all duration-200 active:scale-95 group`}
        >
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-500 mb-0.5 shadow-md shadow-emerald-500/20 group-hover:scale-110 transition-transform">
            <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
          </div>
          <span className={`text-[10px] sm:text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'} leading-tight truncate w-full`}>
            {isAggregated ? 'Tải Tiêu Thụ Tổng' : 'Tải hòa lưới'}
          </span>
          <span className={`text-sm sm:text-base md:text-lg font-black ${isDark ? 'text-cyan-400' : 'text-cyan-600'} font-mono mt-0.5`}>
            {loadPower}W
          </span>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* POPUP MODAL HỆ THỐNG CHI TIẾT THÔNG SỐ ĐIỆN HỌC THEO TỪNG THÀNH PHẦN     */}
      {/* ========================================================================= */}
      {activeModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setActiveModal(null)}
        >
          <div 
            className={`relative w-full max-w-lg ${isDark ? 'bg-[#0d1527] border-slate-700/80 text-white shadow-cyan-950/40' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'} rounded-3xl p-5 sm:p-6 border shadow-2xl transition-all duration-300 max-h-[90vh] overflow-y-auto`}
            onClick={e => e.stopPropagation()}
          >
            {/* Nút Đóng Modal (X) */}
            <button 
              onClick={() => setActiveModal(null)}
              className={`absolute top-4 right-4 p-2 rounded-full ${isDark ? 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200'} transition cursor-pointer`}
            >
              <X className="w-4 h-4" />
            </button>

            {/* ================= 1. POPUP: PIN MẶT TRỜI ================= */}
            {activeModal === 'solar' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 border-b pb-3 border-slate-700/40">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
                    <Sun className="w-5 h-5 animate-[spin_8s_linear_infinite]" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black tracking-tight">
                      {isAggregated ? 'Tổng Công Suất Năng Lượng Mặt Trời (Cụm 3 Máy)' : 'Chi Tiết Năng Lượng Mặt Trời'}
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isAggregated ? 'Tổng hợp 6 chuỗi MPPT từ 3 biến tần song song' : 'Thông số điện học chuỗi PV1, PV2 & Tổng công suất'}
                    </p>
                  </div>
                </div>

                {/* Banner Tổng công suất PV */}
                <div className={`p-4 rounded-2xl ${isDark ? 'bg-gradient-to-r from-amber-500/15 to-orange-500/10 border-amber-500/30' : 'bg-amber-50/90 border-amber-200'} border flex items-center justify-between`}>
                  <div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                      {isAggregated ? 'TỔNG PV CỤM SONG SONG' : 'TỔNG CÔNG SUẤT PV'}
                    </span>
                    <span className="text-2xl sm:text-3xl font-black font-mono text-amber-500 block mt-0.5">{pvPower} W</span>
                    <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'} font-mono`}>~ {(pvPower / 1000).toFixed(2)} kW tức thời</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>SẢN LƯỢNG HÔM NAY</span>
                    <span className={`text-xl font-black font-mono ${isDark ? 'text-cyan-400' : 'text-cyan-600'} block mt-0.5`}>{todayPvEnergy} kWh</span>
                    <span className="text-[10px] text-emerald-500 font-semibold">
                      {isAggregated ? '● 6 MPPT Hoạt động' : '● 2 MPPT Hoạt động'}
                    </span>
                  </div>
                </div>

                {/* Phân bổ theo từng Inverter trong cụm */}
                {isAggregated ? (
                  <div className="space-y-2.5">
                    <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'} uppercase tracking-wider block`}>
                      PHÂN BỔ PV THEO TỪNG BIẾN TẦN TRONG CỤM:
                    </span>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {/* Inv 1 */}
                      <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-1 text-center`}>
                        <span className="text-[10px] font-bold text-amber-500 block uppercase">MÁY #1 (MASTER)</span>
                        <strong className="text-sm font-mono font-black text-amber-400 block">{Math.round(pvPower * 0.38)} W</strong>
                        <span className="text-[10px] opacity-70 block font-mono">PV1: {Math.round(pvPower * 0.19)}W</span>
                        <span className="text-[10px] opacity-70 block font-mono">PV2: {Math.round(pvPower * 0.19)}W</span>
                      </div>

                      {/* Inv 2 */}
                      <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-1 text-center`}>
                        <span className="text-[10px] font-bold text-amber-500 block uppercase">MÁY #2 (SLAVE 1)</span>
                        <strong className="text-sm font-mono font-black text-amber-400 block">{Math.round(pvPower * 0.33)} W</strong>
                        <span className="text-[10px] opacity-70 block font-mono">PV1: {Math.round(pvPower * 0.16)}W</span>
                        <span className="text-[10px] opacity-70 block font-mono">PV2: {Math.round(pvPower * 0.17)}W</span>
                      </div>

                      {/* Inv 3 */}
                      <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-1 text-center`}>
                        <span className="text-[10px] font-bold text-amber-500 block uppercase">MÁY #3 (SLAVE 2)</span>
                        <strong className="text-sm font-mono font-black text-amber-400 block">{Math.round(pvPower * 0.29)} W</strong>
                        <span className="text-[10px] opacity-70 block font-mono">PV1: {Math.round(pvPower * 0.14)}W</span>
                        <span className="text-[10px] opacity-70 block font-mono">PV2: {Math.round(pvPower * 0.15)}W</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-3.5 rounded-2xl ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'} border space-y-2`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-amber-500 uppercase tracking-wide">CHUỖI PV 1</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${effectivePv1 > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300'}`}>
                          {effectivePv1 > 0 ? 'Active' : 'Standby'}
                        </span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Công suất:</span>
                          <span className="font-mono font-bold text-amber-400">{effectivePv1} W</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Điện áp (U1):</span>
                          <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{calcPv1V} V</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Dòng điện (I1):</span>
                          <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{calcPv1A} A</span>
                        </div>
                      </div>
                    </div>

                    <div className={`p-3.5 rounded-2xl ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'} border space-y-2`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-amber-500 uppercase tracking-wide">CHUỖI PV 2</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${effectivePv2 > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300'}`}>
                          {effectivePv2 > 0 ? 'Active' : 'Standby'}
                        </span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Công suất:</span>
                          <span className="font-mono font-bold text-amber-400">{effectivePv2} W</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Điện áp (U2):</span>
                          <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{calcPv2V} V</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Dòng điện (I2):</span>
                          <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{calcPv2A} A</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-900/50 text-slate-400' : 'bg-slate-100 text-slate-600'} text-[11px] flex items-center gap-2`}>
                  <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Hệ thống tự động đồng bộ điểm cực đại MPPT trên toàn bộ chuỗi PV của cụm biến tần.</span>
                </div>
              </div>
            )}

            {/* ================= 2. POPUP: LƯỚI ĐIỆN ================= */}
            {activeModal === 'grid' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 border-b pb-3 border-slate-700/40">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shadow-lg shadow-sky-500/20">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black tracking-tight">
                      {isAggregated && clusterType === '3PHASE' ? 'Chi Tiết Lưới Điện 3 Pha Quốc Gia (EVN)' : 'Chi Tiết Lưới Điện Quốc Gia (EVN)'}
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isAggregated && clusterType === '3PHASE' ? 'Điện áp, dòng điện và cân bằng 3 pha (L1 - L2 - L3)' : 'Điện áp, tần số, công suất mua/bán và dòng điện'}
                    </p>
                  </div>
                </div>

                {/* Banner Trạng thái Lưới */}
                <div className={`p-4 rounded-2xl ${isDark ? 'bg-gradient-to-r from-sky-500/15 to-blue-500/10 border-sky-500/30' : 'bg-sky-50/90 border-sky-200'} border flex items-center justify-between`}>
                  <div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-sky-400' : 'text-sky-700'}`}>
                      {displayGridPower > 0 ? 'TỔNG MUA ĐIỆN TỪ LƯỚI' : displayGridPower < 0 ? 'TỔNG PHÁT ĐIỆN LÊN LƯỚI' : 'CÂN BẰNG TỰ DÙNG 100%'}
                    </span>
                    <span className="text-2xl sm:text-3xl font-black font-mono text-sky-400 block mt-0.5">{Math.abs(displayGridPower)} W</span>
                    <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'} font-mono`}>
                      {displayGridPower > 0 ? 'Đang lấy điện từ EVN bù tải' : displayGridPower < 0 ? 'Đang phát ngược điện sạch lên lưới' : 'Không phụ thuộc lưới điện'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-500/15 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {isAggregated && clusterType === '3PHASE' ? 'Hòa Lưới 3 Pha' : 'Hòa Lưới ON'}
                    </span>
                  </div>
                </div>

                {/* Phân bổ 3 Pha nếu là hệ thống 3 pha */}
                {isAggregated && clusterType === '3PHASE' ? (
                  <div className="space-y-2">
                    <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'} uppercase tracking-wider block`}>
                      CHI TIẾT ĐO ĐẠC THEO TỪNG PHA (L1 - L2 - L3):
                    </span>
                    
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      {/* Pha A */}
                      <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-1`}>
                        <span className="text-[10px] font-bold text-sky-400 block uppercase">PHA A (L1)</span>
                        <strong className="text-sm font-mono block text-white">229.2 V</strong>
                        <span className="text-[10px] font-mono text-slate-400 block">Dòng: {(phaseAGrid / 229.2).toFixed(2)} A</span>
                        <span className="text-[10px] font-mono font-bold text-sky-400 block">P: {phaseAGrid} W</span>
                      </div>

                      {/* Pha B */}
                      <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-1`}>
                        <span className="text-[10px] font-bold text-sky-400 block uppercase">PHA B (L2)</span>
                        <strong className="text-sm font-mono block text-white">230.1 V</strong>
                        <span className="text-[10px] font-mono text-slate-400 block">Dòng: {(phaseBGrid / 230.1).toFixed(2)} A</span>
                        <span className="text-[10px] font-mono font-bold text-sky-400 block">P: {phaseBGrid} W</span>
                      </div>

                      {/* Pha C */}
                      <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-1`}>
                        <span className="text-[10px] font-bold text-sky-400 block uppercase">PHA C (L3)</span>
                        <strong className="text-sm font-mono block text-white">228.8 V</strong>
                        <span className="text-[10px] font-mono text-slate-400 block">Dòng: {(phaseCGrid / 228.8).toFixed(2)} A</span>
                        <span className="text-[10px] font-mono font-bold text-sky-400 block">P: {phaseCGrid} W</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div className={`p-3 rounded-2xl ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'} border`}>
                      <span className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} block uppercase`}>ĐIỆN ÁP</span>
                      <span className={`text-base sm:text-lg font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'} mt-0.5 block`}>{gridVoltage} V</span>
                    </div>
                    <div className={`p-3 rounded-2xl ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'} border`}>
                      <span className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} block uppercase`}>TẦN SỐ</span>
                      <span className={`text-base sm:text-lg font-black font-mono text-cyan-400 mt-0.5 block`}>{gridFreq || 50.0} Hz</span>
                    </div>
                    <div className={`p-3 rounded-2xl ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'} border`}>
                      <span className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} block uppercase`}>DÒNG ĐIỆN</span>
                      <span className={`text-base sm:text-lg font-black font-mono text-sky-400 mt-0.5 block`}>{calcGridA} A</span>
                    </div>
                  </div>
                )}

                <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-900/50 text-slate-400' : 'bg-slate-100 text-slate-600'} text-[11px] flex items-center gap-2`}>
                  <Info className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Hệ thống tự động chống lệch pha và bám tải Zero-Export chính xác theo tiêu chuẩn EVN.</span>
                </div>
              </div>
            )}

            {/* ================= 3. POPUP: PIN LƯU TRỮ ================= */}
            {activeModal === 'battery' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 border-b pb-3 border-slate-700/40">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
                    <Battery className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black tracking-tight">
                      {isAggregated ? 'Chi Tiết Cụm Khối Pin Lưu Trữ BMS (3 Pack)' : 'Chi Tiết Pin Lưu Trữ (Lithium BMS)'}
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isAggregated ? `Tổng dung lượng ${totalStorageCapacity} • Đồng bộ BMS CAN/RS485` : 'Dung lượng SOC, công suất sạc/xả, điện áp & nhiệt độ'}
                    </p>
                  </div>
                </div>

                {/* Banner Trạng thái Pin */}
                <div className={`p-4 rounded-2xl ${isDark ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/10 border-emerald-500/30' : 'bg-emerald-50/90 border-emerald-200'} border space-y-2`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                        {batteryPower > 0 ? '⚡ TỔNG ĐANG XẢ CHO TẢI' : batteryPower < 0 ? '🔌 TỔNG ĐANG SẠC VÀO CỤM PIN' : '💤 STANDBY / SẴN SÀNG'}
                      </span>
                      <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 block mt-0.5">{Math.abs(batteryPower)} W</span>
                      {isAggregated && (
                        <span className="text-[11px] text-slate-400 font-mono">Dung lượng tổng: <strong className="text-emerald-400">{totalStorageCapacity}</strong></span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-500">{batterySoc}%</span>
                      <span className={`text-[10px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>SOC Trung Bình Cụm</span>
                    </div>
                  </div>

                  {/* Thanh tiến trình SOC */}
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${batterySoc > 50 ? 'bg-emerald-400' : batterySoc > 20 ? 'bg-amber-400' : 'bg-rose-500'}`}
                      style={{ width: `${Math.min(100, Math.max(0, batterySoc))}%` }}
                    />
                  </div>
                </div>

                {/* 3 Pack Pin nếu Xem Gộp */}
                {isAggregated ? (
                  <div className="space-y-2">
                    <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'} uppercase tracking-wider block`}>
                      THÔNG SỐ TỪNG KHỐI PIN TRONG CỤM LƯU TRỮ:
                    </span>
                    
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      {/* Pack 1 */}
                      <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-1`}>
                        <span className="text-[10px] font-bold text-emerald-500 block uppercase">PACK #1 (MÁY 1)</span>
                        <strong className="text-base font-mono font-black text-emerald-400 block">100%</strong>
                        <span className="text-[10px] font-mono text-slate-400 block">51.8 V • 34°C</span>
                        <span className="text-[10px] font-mono text-emerald-300 block">Dung lượng: 10 kWh</span>
                      </div>

                      {/* Pack 2 */}
                      <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-1`}>
                        <span className="text-[10px] font-bold text-emerald-500 block uppercase">PACK #2 (MÁY 2)</span>
                        <strong className="text-base font-mono font-black text-emerald-400 block">98%</strong>
                        <span className="text-[10px] font-mono text-slate-400 block">51.6 V • 35°C</span>
                        <span className="text-[10px] font-mono text-emerald-300 block">Dung lượng: 10 kWh</span>
                      </div>

                      {/* Pack 3 */}
                      <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-1`}>
                        <span className="text-[10px] font-bold text-emerald-500 block uppercase">PACK #3 (MÁY 3)</span>
                        <strong className="text-base font-mono font-black text-emerald-400 block">99%</strong>
                        <span className="text-[10px] font-mono text-slate-400 block">51.7 V • 34°C</span>
                        <span className="text-[10px] font-mono text-emerald-300 block">Dung lượng: 10 kWh</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div className={`p-3 rounded-2xl ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'} border`}>
                      <span className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} block uppercase`}>ĐIỆN ÁP PIN</span>
                      <span className={`text-base sm:text-lg font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'} mt-0.5 block`}>{batteryVoltage} V</span>
                    </div>
                    <div className={`p-3 rounded-2xl ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'} border`}>
                      <span className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} block uppercase`}>DÒNG SẠC/XẢ</span>
                      <span className={`text-base sm:text-lg font-black font-mono text-emerald-400 mt-0.5 block`}>{calcBatA} A</span>
                    </div>
                    <div className={`p-3 rounded-2xl ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'} border`}>
                      <span className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} block uppercase`}>NHIỆT ĐỘ BMS</span>
                      <span className={`text-base sm:text-lg font-black font-mono text-amber-400 mt-0.5 block`}>{batteryTemp} °C</span>
                    </div>
                  </div>
                )}

                <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-900/50 text-slate-400' : 'bg-slate-100 text-slate-600'} text-[11px] flex items-center gap-2`}>
                  <Info className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Các khối pin BMS liên kết giao tiếp song song, tự động cân bằng dòng nạp xả và bảo vệ từng cell pin độc lập.</span>
                </div>
              </div>
            )}

            {/* ================= 4. POPUP: TẢI DỰ PHÒNG ================= */}
            {activeModal === 'backup' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 border-b pb-3 border-slate-700/40">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black tracking-tight">Chi Tiết Tải Dự Phòng (Backup / EPS)</h3>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Cổng cấp nguồn khẩn cấp liên tục không gián đoạn (UPS 0ms)</p>
                  </div>
                </div>

                <div className={`p-4 rounded-2xl ${isDark ? 'bg-gradient-to-r from-amber-500/15 to-orange-500/10 border-amber-500/30' : 'bg-amber-50/90 border-amber-200'} border flex items-center justify-between`}>
                  <div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>CÔNG SUẤT TẢI ƯU TIÊN</span>
                    <span className="text-2xl sm:text-3xl font-black font-mono text-amber-500 block mt-0.5">{displayBackupPower} W</span>
                    <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'} font-mono`}>
                      {displayBackupPower > 0 ? 'Đang nuôi thiết bị ưu tiên (Đèn, WiFi, Tủ lạnh)' : 'Chưa có tải cắm vào ngõ EPS'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-500/15 px-2 py-1 rounded-full">
                      🛡️ UPS Active
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className={`p-3 rounded-2xl ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'} border`}>
                    <span className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} block uppercase`}>ĐIỆN ÁP EPS</span>
                    <span className={`text-base sm:text-lg font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'} mt-0.5 block`}>{displayBackupPower > 0 ? (backupVoltage || 228.5) : (gridVoltage || 228.5)} V</span>
                  </div>
                  <div className={`p-3 rounded-2xl ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'} border`}>
                    <span className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} block uppercase`}>TẦN SỐ EPS</span>
                    <span className={`text-base sm:text-lg font-black font-mono text-amber-400 mt-0.5 block`}>50.0 Hz</span>
                  </div>
                  <div className={`p-3 rounded-2xl ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'} border`}>
                    <span className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} block uppercase`}>DÒNG TẢI</span>
                    <span className={`text-base sm:text-lg font-black font-mono text-amber-400 mt-0.5 block`}>{calcBackupA} A</span>
                  </div>
                </div>

                <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-900/50 text-slate-400' : 'bg-slate-100 text-slate-600'} text-[11px] flex items-center gap-2`}>
                  <Info className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Ngõ EPS dự phòng độc lập chuyển mạch tức thì khi mất lưới, bảo đảm các thiết bị nhạy cảm không bị khởi động lại.</span>
                </div>
              </div>
            )}

            {/* ================= 5. POPUP: TẢI HÒA LƯỚI / TIÊU THỤ GIA ĐÌNH ================= */}
            {activeModal === 'load' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 border-b pb-3 border-slate-700/40">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20">
                    <Home className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black tracking-tight">
                      {isAggregated ? 'Tổng Tiêu Thụ Điện Hộ Gia Đình (Cụm 3 Máy)' : 'Chi Tiết Tiêu Thụ Điện Hộ Gia Đình'}
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isAggregated && clusterType === '3PHASE' ? 'Tổng tải & phân bổ tiêu thụ trên từng pha A, B, C' : 'Tổng tải tiêu thụ & cơ cấu nguồn cấp điện tức thời'}
                    </p>
                  </div>
                </div>

                <div className={`p-4 rounded-2xl ${isDark ? 'bg-gradient-to-r from-cyan-500/15 to-emerald-500/10 border-cyan-500/30' : 'bg-cyan-50/90 border-cyan-200'} border flex items-center justify-between`}>
                  <div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>TỔNG CÔNG SUẤT TIÊU THỤ</span>
                    <span className="text-2xl sm:text-3xl font-black font-mono text-cyan-400 block mt-0.5">{loadPower} W</span>
                    <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'} font-mono`}>
                      Dòng điện tải tổng: {calcLoadA} A
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-500 bg-cyan-500/15 px-2.5 py-1 rounded-full">
                      🏠 Home Load Total
                    </span>
                  </div>
                </div>

                {/* Phân bổ 3 Pha nếu là hệ thống 3 pha */}
                {isAggregated && clusterType === '3PHASE' && (
                  <div className="space-y-2">
                    <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'} uppercase tracking-wider block`}>
                      PHÂN BỔ TẢI THEO TỪNG PHA:
                    </span>
                    
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-1`}>
                        <span className="text-[10px] font-bold text-cyan-400 block uppercase">PHA A (L1)</span>
                        <strong className="text-base font-mono font-black text-cyan-300 block">{phaseAPower} W</strong>
                        <span className="text-[10px] font-mono text-slate-400 block">{(phaseAPower / 229.2).toFixed(2)} A</span>
                      </div>

                      <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-1`}>
                        <span className="text-[10px] font-bold text-cyan-400 block uppercase">PHA B (L2)</span>
                        <strong className="text-base font-mono font-black text-cyan-300 block">{phaseBPower} W</strong>
                        <span className="text-[10px] font-mono text-slate-400 block">{(phaseBPower / 230.1).toFixed(2)} A</span>
                      </div>

                      <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-1`}>
                        <span className="text-[10px] font-bold text-cyan-400 block uppercase">PHA C (L3)</span>
                        <strong className="text-base font-mono font-black text-cyan-300 block">{phaseCPower} W</strong>
                        <span className="text-[10px] font-mono text-slate-400 block">{(phaseCPower / 228.8).toFixed(2)} A</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-900/50 text-slate-400' : 'bg-slate-100 text-slate-600'} text-[11px] flex items-center gap-2`}>
                  <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Hệ thống ưu tiên sử dụng tối đa nguồn điện xanh từ Pin mặt trời và Pin lưu trữ để giảm thiểu tiền điện hàng tháng.</span>
                </div>
              </div>
            )}

            {/* Nút Đóng Modal */}
            <div className="mt-5 pt-3 border-t border-slate-700/40 flex justify-end">
              <button 
                onClick={() => setActiveModal(null)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs hover:brightness-110 transition shadow-lg cursor-pointer text-center"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
