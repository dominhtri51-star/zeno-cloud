import React from 'react';
import { Sun, Zap, Battery, Shield, Gauge, Activity, Home } from 'lucide-react';
import InverterUnit from './InverterUnit';

export default function InteractiveTopology({
  pvPower = 0,
  pv1Power = 0,
  pv2Power = 0,
  gridPower = 0,
  batteryPower = 0,
  batterySoc = 100,
  backupPower = 0,
  loadPower = 0,
  gridVoltage = 229.0,
  batteryVoltage = 51.9,
  temperature = 38.9,
  tempF = 102,
  className = ''
}) {
  // Trạng thái xả pin (Discharging): khi batteryPower > 0 hoặc đang cấp điện cho tải
  // Trạng thái sạc pin (Charging): khi batteryPower < 0 (nhận điện từ PV / Lưới)
  const isBatteryDischarging = batteryPower >= 0;

  // Hiệu chuẩn Tải Dự Phòng: Hiển thị = Thực tế - 34W (nếu < 5W thì làm tròn là 0W)
  const displayBackupPower = backupPower < 5 ? 0 : Math.round(backupPower);

  // Hiệu chuẩn Lưới Điện: Nếu giá trị tuyệt đối < 5W thì làm tròn về 0W (nịnh người dùng, loại bỏ gợn nhiễu cảm biến)
  const displayGridPower = Math.abs(gridPower) < 5 ? 0 : Math.round(gridPower);

  return (
    <div className={`relative bg-[#070b14] rounded-3xl p-2.5 sm:p-5 border border-slate-800/80 shadow-2xl overflow-hidden select-none font-['Plus_Jakarta_Sans',sans-serif] ${className}`}>
      
      {/* 1. Nhiệt độ máy dạng viên thuốc phát sáng ở đỉnh */}
      <div className="flex justify-center mb-1 relative z-20">
        <div className="inline-flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full bg-[#111827]/90 border border-slate-700/80 text-[10px] sm:text-xs font-semibold text-slate-200 shadow-md backdrop-blur-md">
          <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
          <span className="font-mono text-amber-300 font-bold">{temperature}°C ({tempF}°F)</span>
        </div>
      </div>

      {/* 2. Khung vẽ sơ đồ trung tâm với Inverter và 5 thẻ trắng bo góc sạch đẹp */}
      <div className="relative w-full min-h-[360px] xs:min-h-[390px] sm:min-h-[460px] md:min-h-[500px] flex items-center justify-center">
        
        {/* SVG Circuit Lines Layer */}
        <svg 
          viewBox="0 0 800 520" 
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <filter id="glow-amber" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#f59e0b" floodOpacity="0.9" />
            </filter>
            <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#0284c7" floodOpacity="0.9" />
            </filter>
            <filter id="glow-emerald" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#10b981" floodOpacity="0.9" />
            </filter>
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#06b6d4" floodOpacity="0.9" />
            </filter>

            <style>{`
              @keyframes flow-forward {
                from { stroke-dashoffset: 40; }
                to { stroke-dashoffset: 0; }
              }
              @keyframes flow-backward {
                from { stroke-dashoffset: 0; }
                to { stroke-dashoffset: 40; }
              }
              .flow-pv { animation: flow-forward 1.2s linear infinite; }
              .flow-grid { animation: flow-forward 1.4s linear infinite; }
              .flow-bat-discharge { animation: flow-forward 1.2s linear infinite; }
              .flow-bat-charge { animation: flow-backward 1.2s linear infinite; }
              .flow-load { animation: flow-forward 1.4s linear infinite; }
              .flow-backup { animation: flow-forward 1.4s linear infinite; }
            `}</style>
          </defs>

          {/* DÂY TĨNH */}
          <path d="M 180 80 L 290 80 L 290 190 L 330 190" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 620 80 L 510 80 L 510 190 L 470 190" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 150 400 L 150 280 L 330 280" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 400 310 L 400 400" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 470 280 L 650 280 L 650 400" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />

          {/* DÒNG ĐIỆN PHÁT SÁNG ĐỘNG */}
          {pvPower > 0 && (
            <path 
              d="M 180 80 L 290 80 L 290 190 L 330 190" 
              fill="none" 
              stroke="#f59e0b" 
              strokeWidth="3.5" 
              strokeLinecap="round" 
              strokeDasharray="8 6"
              className="flow-pv"
              filter="url(#glow-amber)"
            />
          )}

          {displayGridPower !== 0 && (
            <path 
              d="M 620 80 L 510 80 L 510 190 L 470 190" 
              fill="none" 
              stroke="#0ea5e9" 
              strokeWidth="3.5" 
              strokeLinecap="round" 
              strokeDasharray="8 6"
              className="flow-grid"
              filter="url(#glow-blue)"
            />
          )}
          
          {Math.abs(batteryPower) > 5 && (
            <path 
              d="M 150 400 L 150 280 L 330 280" 
              fill="none" 
              stroke={isBatteryDischarging ? "#a855f7" : "#10b981"} 
              strokeWidth="3.5" 
              strokeLinecap="round" 
              strokeDasharray="8 6"
              className={isBatteryDischarging ? "flow-bat-discharge" : "flow-bat-charge"}
              filter="url(#glow-emerald)"
            />
          )}

          {displayBackupPower > 0 && (
            <path 
              d="M 400 310 L 400 400" 
              fill="none" 
              stroke="#f97316" 
              strokeWidth="3.5" 
              strokeLinecap="round" 
              strokeDasharray="8 6"
              className="flow-backup"
              filter="url(#glow-amber)"
            />
          )}

          {loadPower > 0 && (
            <path 
              d="M 470 280 L 650 280 L 650 400" 
              fill="none" 
              stroke="#06b6d4" 
              strokeWidth="3.5" 
              strokeLinecap="round" 
              strokeDasharray="8 6"
              className="flow-load"
              filter="url(#glow-cyan)"
            />
          )}
        </svg>

        {/* ================= INVERTER TRUNG TÂM ================= */}
        <div className="relative z-10 flex flex-col items-center justify-center -translate-y-4 sm:-translate-y-8 scale-90 sm:scale-100">
          <InverterUnit
            batteryVoltage={batteryVoltage}
            gridVoltage={gridVoltage}
            state="RUNNING"
          />
        </div>

        {/* ================= 5 THẺ TRẮNG BO GÓC ================= */}

        {/* 1. TOP LEFT: PIN MẶT TRỜI */}
        <div className="absolute top-1 left-1 sm:top-3 sm:left-3 md:top-4 md:left-4 z-20 w-[30%] max-w-[130px] min-w-[92px] bg-white text-slate-900 rounded-xl sm:rounded-2xl p-1.5 sm:p-3 shadow-xl flex flex-col items-center text-center border border-slate-100/90">
          <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-amber-400 flex items-center justify-center text-white mb-0.5 sm:mb-1 shadow-md shadow-amber-400/30">
            <Sun className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </div>
          <span className="text-[9px] sm:text-[11px] font-bold text-slate-700 leading-tight">Pin mặt trời</span>
          <span className="text-xs sm:text-lg font-black text-sky-600 font-mono mt-0.5">
            {pvPower}W
          </span>
          <div className="flex items-center justify-center gap-0.5 sm:gap-1 text-[8px] sm:text-[10px] font-mono font-bold text-slate-600 mt-0.5 sm:mt-1 bg-slate-100 px-1.5 py-0.5 rounded-full border border-slate-200/80 w-full overflow-hidden truncate">
            <span className="truncate">PV1: <b className="text-amber-600 font-extrabold">{pv1Power || 0}</b></span>
            <span className="text-slate-300">|</span>
            <span className="truncate">PV2: <b className="text-amber-600 font-extrabold">{pv2Power || 0}</b></span>
          </div>
        </div>

        {/* 2. TOP RIGHT: LƯỚI ĐIỆN */}
        <div className="absolute top-1 right-1 sm:top-3 sm:right-3 md:top-4 md:right-4 z-20 w-[30%] max-w-[130px] min-w-[92px] bg-white text-slate-900 rounded-xl sm:rounded-2xl p-1.5 sm:p-3 shadow-xl flex flex-col items-center text-center border border-slate-100/90">
          <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-sky-500 flex items-center justify-center text-white mb-0.5 sm:mb-1 shadow-md shadow-sky-500/30">
            <svg 
              className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M6 22 L11 2 M18 22 L13 2" />
              <path d="M3 7 L21 7" />
              <path d="M2 13 L22 13" />
              <path d="M7 17.5 L17 17.5" />
              <path d="M8.5 7 L15.5 13 M15.5 7 L8.5 13" />
            </svg>
          </div>
          <span className="text-[9px] sm:text-[11px] font-bold text-slate-700 leading-tight">Lưới điện</span>
          <span className="text-xs sm:text-lg font-black text-sky-600 font-mono mt-0.5">
            {displayGridPower}W
          </span>
        </div>

        {/* 3. BOTTOM LEFT: PIN LƯU TRỮ */}
        <div className="absolute bottom-1 left-1 sm:bottom-3 sm:left-3 md:bottom-4 md:left-4 z-20 w-[31%] max-w-[125px] min-w-[92px] bg-white text-slate-900 rounded-xl sm:rounded-2xl p-1.5 sm:p-3 shadow-xl flex flex-col items-center text-center border border-slate-100/90">
          <div className="px-1.5 sm:px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] sm:text-[10px] font-bold flex items-center gap-0.5 sm:gap-1 mb-0.5 sm:mb-1 shadow-sm">
            <Battery className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>{batterySoc}%</span>
          </div>
          <span className="text-[9px] sm:text-[11px] font-bold text-slate-700 leading-tight">Pin lưu trữ</span>
          <span className="text-xs sm:text-lg font-black text-sky-600 font-mono mt-0.5">
            {Math.abs(batteryPower)}W
          </span>
        </div>

        {/* 4. BOTTOM MIDDLE: TẢI DỰ PHÒNG */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 sm:bottom-3 z-20 w-[31%] max-w-[125px] min-w-[92px] bg-white text-slate-900 rounded-xl sm:rounded-2xl p-1.5 sm:p-3 shadow-xl flex flex-col items-center text-center border border-slate-100/90">
          <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-amber-500 flex items-center justify-center text-white mb-0.5 sm:mb-1 shadow-md shadow-amber-500/30">
            <Shield className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </div>
          <span className="text-[9px] sm:text-[11px] font-bold text-slate-700 leading-tight truncate w-full">Tải dự phòng</span>
          <span className="text-xs sm:text-lg font-black text-sky-600 font-mono mt-0.5">
            {displayBackupPower}W
          </span>
        </div>

        {/* 5. BOTTOM RIGHT: TẢI HÒA LƯỚI */}
        <div className="absolute bottom-1 right-1 sm:bottom-3 sm:right-3 md:bottom-4 md:right-4 z-20 w-[31%] max-w-[125px] min-w-[92px] bg-white text-slate-900 rounded-xl sm:rounded-2xl p-1.5 sm:p-3 shadow-xl flex flex-col items-center text-center border border-slate-100/90">
          <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white mb-0.5 sm:mb-1 shadow-md shadow-emerald-500/30">
            <Home className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
          </div>
          <span className="text-[9px] sm:text-[11px] font-bold text-slate-700 leading-tight truncate w-full">Tải hòa lưới</span>
          <span className="text-xs sm:text-lg font-black text-sky-600 font-mono mt-0.5">
            {loadPower}W
          </span>
        </div>

      </div>
    </div>
  );
}
