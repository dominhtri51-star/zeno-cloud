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

      {/* 2. Khung vẽ sơ đồ trung tâm gom gọn, thông thoáng và dòng điện chạm trực tiếp */}
      <div className="relative w-full min-h-[350px] xs:min-h-[370px] sm:min-h-[420px] md:min-h-[440px] flex items-center justify-center py-1">
        
        {/* SVG Circuit Lines Layer */}
        <svg 
          viewBox="0 0 800 480" 
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
                from { stroke-dashoffset: 36; }
                to { stroke-dashoffset: 0; }
              }
              @keyframes flow-backward {
                from { stroke-dashoffset: 0; }
                to { stroke-dashoffset: 36; }
              }
              .flow-pv { animation: flow-forward 1.2s linear infinite; }
              .flow-grid { animation: flow-forward 1.4s linear infinite; }
              .flow-bat-discharge { animation: flow-forward 1.2s linear infinite; }
              .flow-bat-charge { animation: flow-backward 1.2s linear infinite; }
              .flow-load { animation: flow-forward 1.4s linear infinite; }
              .flow-backup { animation: flow-forward 1.4s linear infinite; }
            `}</style>
          </defs>

          {/* DÂY TĨNH NỐI LIỀN TRỰC TIẾP TỪ THẺ VÀO CỔNG INVERTER */}
          <path d="M 170 120 L 170 185 L 330 185" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 630 120 L 630 185 L 470 185" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 150 355 L 150 275 L 330 275" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 400 310 L 400 355" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 470 275 L 650 275 L 650 355" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />

          {/* CÁC NỐT ĐIỆN TỬ CỐ ĐỊNH TẠI CỔNG THIẾT BỊ */}
          <circle cx="170" cy="120" r="3.5" fill="#334155" />
          <circle cx="630" cy="120" r="3.5" fill="#334155" />
          <circle cx="150" cy="355" r="3.5" fill="#334155" />
          <circle cx="400" cy="355" r="3.5" fill="#334155" />
          <circle cx="650" cy="355" r="3.5" fill="#334155" />
          <circle cx="330" cy="185" r="3" fill="#334155" />
          <circle cx="470" cy="185" r="3" fill="#334155" />
          <circle cx="330" cy="275" r="3" fill="#334155" />
          <circle cx="400" cy="310" r="3" fill="#334155" />
          <circle cx="470" cy="275" r="3" fill="#334155" />

          {/* DÒNG ĐIỆN PHÁT SÁNG ĐỘNG CHẠM THẲNG VÀO CÁC CHI TIẾT */}
          {pvPower > 0 && (
            <g>
              <path 
                d="M 170 120 L 170 185 L 330 185" 
                fill="none" 
                stroke="#f59e0b" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
                strokeDasharray="8 6"
                className="flow-pv"
                filter="url(#glow-amber)"
              />
              <circle cx="170" cy="120" r="4" fill="#f59e0b" filter="url(#glow-amber)" />
              <circle cx="330" cy="185" r="4" fill="#f59e0b" filter="url(#glow-amber)" />
            </g>
          )}

          {displayGridPower !== 0 && (
            <g>
              <path 
                d="M 630 120 L 630 185 L 470 185" 
                fill="none" 
                stroke="#0ea5e9" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
                strokeDasharray="8 6"
                className="flow-grid"
                filter="url(#glow-blue)"
              />
              <circle cx="630" cy="120" r="4" fill="#0ea5e9" filter="url(#glow-blue)" />
              <circle cx="470" cy="185" r="4" fill="#0ea5e9" filter="url(#glow-blue)" />
            </g>
          )}
          
          {Math.abs(batteryPower) > 5 && (
            <g>
              <path 
                d="M 150 355 L 150 275 L 330 275" 
                fill="none" 
                stroke={isBatteryDischarging ? "#a855f7" : "#10b981"} 
                strokeWidth="3.5" 
                strokeLinecap="round" 
                strokeDasharray="8 6"
                className={isBatteryDischarging ? "flow-bat-discharge" : "flow-bat-charge"}
                filter="url(#glow-emerald)"
              />
              <circle cx="150" cy="355" r="4" fill={isBatteryDischarging ? "#a855f7" : "#10b981"} filter="url(#glow-emerald)" />
              <circle cx="330" cy="275" r="4" fill={isBatteryDischarging ? "#a855f7" : "#10b981"} filter="url(#glow-emerald)" />
            </g>
          )}

          {displayBackupPower > 0 && (
            <g>
              <path 
                d="M 400 310 L 400 355" 
                fill="none" 
                stroke="#f97316" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
                strokeDasharray="8 6"
                className="flow-backup"
                filter="url(#glow-amber)"
              />
              <circle cx="400" cy="310" r="4" fill="#f97316" filter="url(#glow-amber)" />
              <circle cx="400" cy="355" r="4" fill="#f97316" filter="url(#glow-amber)" />
            </g>
          )}

          {loadPower > 0 && (
            <g>
              <path 
                d="M 470 275 L 650 275 L 650 355" 
                fill="none" 
                stroke="#06b6d4" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
                strokeDasharray="8 6"
                className="flow-load"
                filter="url(#glow-cyan)"
              />
              <circle cx="470" cy="275" r="4" fill="#06b6d4" filter="url(#glow-cyan)" />
              <circle cx="650" cy="355" r="4" fill="#06b6d4" filter="url(#glow-cyan)" />
            </g>
          )}
        </svg>

        {/* ================= INVERTER TRUNG TÂM GÔM GỌN ================= */}
        <div className="relative z-10 flex flex-col items-center justify-center -translate-y-1 sm:-translate-y-2 scale-90 xs:scale-95 sm:scale-105">
          <InverterUnit
            batteryVoltage={batteryVoltage}
            gridVoltage={gridVoltage}
            state="RUNNING"
          />
        </div>

        {/* ================= 5 THẺ KÍNH MỜ GÔM GỌN, CHẠM DÂY LIỀN MẠCH ================= */}

        {/* 1. TOP LEFT: PIN MẶT TRỜI */}
        <div className="absolute top-1 left-1.5 sm:top-2.5 sm:left-4 z-20 w-[31%] max-w-[125px] min-w-[90px] bg-[#0c1322]/85 hover:bg-[#0c1322]/95 backdrop-blur-md text-white rounded-2xl p-1.5 sm:p-2.5 shadow-xl flex flex-col items-center text-center border border-slate-700/60 hover:border-amber-400/50 transition-all duration-200">
          <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 mb-0.5 shadow-md shadow-amber-400/20">
            <Sun className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-300 leading-tight">Pin mặt trời</span>
          <span className="text-xs sm:text-base font-black text-cyan-400 font-mono mt-0.5">
            {pvPower}W
          </span>
          <div className="flex items-center justify-center gap-0.5 text-[7.5px] sm:text-[9px] font-mono font-bold text-slate-400 mt-0.5 bg-slate-950/80 px-1 py-0.5 rounded-full border border-slate-800 w-full overflow-hidden truncate">
            <span className="truncate">PV1:<b className="text-amber-400">{pv1Power || 0}</b></span>
            <span className="text-slate-600">|</span>
            <span className="truncate">PV2:<b className="text-amber-400">{pv2Power || 0}</b></span>
          </div>
        </div>

        {/* 2. TOP RIGHT: LƯỚI ĐIỆN */}
        <div className="absolute top-1 right-1.5 sm:top-2.5 sm:right-4 z-20 w-[31%] max-w-[125px] min-w-[90px] bg-[#0c1322]/85 hover:bg-[#0c1322]/95 backdrop-blur-md text-white rounded-2xl p-1.5 sm:p-2.5 shadow-xl flex flex-col items-center text-center border border-slate-700/60 hover:border-sky-400/50 transition-all duration-200">
          <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 mb-0.5 shadow-md shadow-sky-500/20">
            <svg 
              className="w-3 h-3 sm:w-4 sm:h-4 text-sky-400" 
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
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-300 leading-tight">Lưới điện</span>
          <span className="text-xs sm:text-base font-black text-cyan-400 font-mono mt-0.5">
            {displayGridPower}W
          </span>
        </div>

        {/* 3. BOTTOM LEFT: PIN LƯU TRỮ */}
        <div className="absolute bottom-1 left-1.5 sm:bottom-2 sm:left-4 z-20 w-[31%] max-w-[120px] min-w-[88px] bg-[#0c1322]/85 hover:bg-[#0c1322]/95 backdrop-blur-md text-white rounded-2xl p-1.5 sm:p-2.5 shadow-xl flex flex-col items-center text-center border border-slate-700/60 hover:border-emerald-400/50 transition-all duration-200">
          <div className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[7.5px] sm:text-[9px] font-bold flex items-center gap-0.5 mb-0.5 shadow-sm">
            <Battery className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span>{batterySoc}%</span>
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-300 leading-tight truncate w-full">Pin lưu trữ</span>
          <span className="text-xs sm:text-base font-black text-cyan-400 font-mono mt-0.5">
            {Math.abs(batteryPower)}W
          </span>
        </div>

        {/* 4. BOTTOM MIDDLE: TẢI DỰ PHÒNG */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 sm:bottom-2 z-20 w-[31%] max-w-[120px] min-w-[88px] bg-[#0c1322]/85 hover:bg-[#0c1322]/95 backdrop-blur-md text-white rounded-2xl p-1.5 sm:p-2.5 shadow-xl flex flex-col items-center text-center border border-slate-700/60 hover:border-amber-400/50 transition-all duration-200">
          <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 mb-0.5 shadow-md shadow-amber-500/20">
            <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-300 leading-tight truncate w-full">Tải dự phòng</span>
          <span className="text-xs sm:text-base font-black text-cyan-400 font-mono mt-0.5">
            {displayBackupPower}W
          </span>
        </div>

        {/* 5. BOTTOM RIGHT: TẢI HÒA LƯỚI */}
        <div className="absolute bottom-1 right-1.5 sm:bottom-2 sm:right-4 z-20 w-[31%] max-w-[120px] min-w-[88px] bg-[#0c1322]/85 hover:bg-[#0c1322]/95 backdrop-blur-md text-white rounded-2xl p-1.5 sm:p-2.5 shadow-xl flex flex-col items-center text-center border border-slate-700/60 hover:border-emerald-400/50 transition-all duration-200">
          <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 mb-0.5 shadow-md shadow-emerald-500/20">
            <Home className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-300 leading-tight truncate w-full">Tải hòa lưới</span>
          <span className="text-xs sm:text-base font-black text-cyan-400 font-mono mt-0.5">
            {loadPower}W
          </span>
        </div>

      </div>
    </div>
  );
}
